const express = require('express');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const router = express.Router();

// Redirect ke Discord Login
router.get('/discord', (req, res) => {
    const discordAuthUrl = `https://discord.com/api/oauth2/authorize?client_id=${process.env.CLIENT_ID}&redirect_uri=${encodeURIComponent(process.env.REDIRECT_URI)}&response_type=code&scope=identify%20email%20guilds.join`;
    res.redirect(discordAuthUrl);
});

// Callback dari Discord
router.get('/discord/callback', async (req, res) => {
    const { code } = req.query;
    if (!code) return res.status(400).send('Code not provided');

    try {
        // 1. Exchange Code dengan Access Token
        const tokenResponse = await axios.post('https://discord.com/api/oauth2/token', new URLSearchParams({
            client_id: process.env.CLIENT_ID,
            client_secret: process.env.CLIENT_SECRET,
            grant_type: 'authorization_code',
            code,
            redirect_uri: process.env.REDIRECT_URI,
        }), {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });

        const accessToken = tokenResponse.data.access_token;

        // 2. Fetch Data User dari Discord
        const userResponse = await axios.get('https://discord.com/api/users/@me', {
            headers: { Authorization: `Bearer ${accessToken}` }
        });

        const { id, username, avatar, email } = userResponse.data;

        // 3. AUTO-JOIN SERVER DISCORD
        try {
            await axios.put(
                `https://discord.com/api/v10/guilds/${process.env.DISCORD_GUILD_ID}/members/${id}`,
                { access_token: accessToken },
                {
                    headers: {
                        Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            console.log(`[AUTO-JOIN] User ${username} (${id}) berhasil dimasukkan ke server Discord.`);
        } catch (joinErr) {
            console.error('[AUTO-JOIN] Gagal memasukkan user ke server:', joinErr.response?.data || joinErr.message);
        }

        // 4. Upsert User ke Database MySQL
        await db.query(
            `INSERT INTO users (id, username, avatar, email) 
             VALUES (?, ?, ?, ?) 
             ON DUPLICATE KEY UPDATE username=?, avatar=?, email=?`,
            [id, username, avatar, email, username, avatar, email]
        );

        // 5. Cek Role Admin di Server Discord
        let isAdmin = false;
        try {
            const guildMemberResponse = await axios.get(
                `https://discord.com/api/v10/guilds/${process.env.DISCORD_GUILD_ID}/members/${id}`,
                {
                    headers: { Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}` }
                }
            );

            const userRoles = guildMemberResponse.data.roles || [];
            if (userRoles.includes(process.env.ROLE_ADMIN_ID)) {
                isAdmin = true;
            }
        } catch (botErr) {
            console.error('[AUTH] Gagal membaca role member:', botErr.response?.data || botErr.message);
            isAdmin = false;
        }

        // 6. Buat JWT Token
        const token = jwt.sign(
            { id, username, avatar, isAdmin }, 
            process.env.JWT_SECRET || 'secretkey', 
            { expiresIn: '7d' }
        );

        // 7. Redirect ke Frontend
        res.redirect(`${process.env.FRONTEND_URL}/login-success?token=${token}`);
    } catch (error) {
        console.error('Authentication Error:', error.response?.data || error.message);
        res.status(500).send('Authentication Failed');
    }
});

module.exports = router;