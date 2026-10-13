const express = require('express');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const router = express.Router();

// ==========================================
// 1. REDIRECT KE DISCORD LOGIN OAUTH2
// ==========================================
router.get('/discord', (req, res) => {
    const discordAuthUrl = `https://discord.com/api/oauth2/authorize?client_id=${process.env.CLIENT_ID}&redirect_uri=${encodeURIComponent(process.env.REDIRECT_URI)}&response_type=code&scope=identify%20email%20guilds.join`;
    res.redirect(discordAuthUrl);
});

// ==========================================
// 2. CALLBACK DARI DISCORD OAUTH2
// ==========================================
router.get('/discord/callback', async (req, res) => {
    const { code } = req.query;
    if (!code) return res.status(400).send('Code not provided');

    try {
        // Exchange Code dengan Access Token
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

        // Fetch Data User dari Discord
        const userResponse = await axios.get('https://discord.com/api/users/@me', {
            headers: { Authorization: `Bearer ${accessToken}` }
        });

        const { id, username, avatar, email } = userResponse.data;

        // AUTO-JOIN SERVER DISCORD
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

        // Upsert User ke Database Supabase (PostgreSQL)
        await db.query(
            `INSERT INTO users (id, username, avatar, email, role) 
             VALUES ($1, $2, $3, $4, 'member') 
             ON CONFLICT (id) 
             DO UPDATE SET username = EXCLUDED.username, avatar = EXCLUDED.avatar, email = EXCLUDED.email`,
            [id, username, avatar, email]
        );

        // Cek Role Admin di Server Discord
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

        // Buat JWT Token
        const token = jwt.sign(
            { id, username, avatar, isAdmin }, 
            process.env.JWT_SECRET || 'secretkey', 
            { expiresIn: '7d' }
        );

        // Redirect ke Frontend
        res.redirect(`${process.env.FRONTEND_URL}/login-success?token=${token}`);
    } catch (error) {
        console.error('Authentication Error:', error.response?.data || error.message);
        res.status(500).send('Authentication Failed');
    }
});

// ==========================================
// 3. ENDPOINT LIVE CHAT: AMBIL PESAN CHANNEL DISCORD
// ==========================================
router.get('/channel/:channelId/messages', async (req, res) => {
    try {
        const { channelId } = req.params;

        // Ambil history pesan dari Discord API menggunakan Bot Token
        const response = await axios.get(
            `https://discord.com/api/v10/channels/${channelId}/messages?limit=10`,
            {
                headers: {
                    Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`
                }
            }
        );

        // Format data pesan agar siap dibaca oleh komponen frontend
        const messages = response.data.map(msg => {
            let attachmentUrl = null;
            if (msg.attachments && msg.attachments.length > 0) {
                attachmentUrl = msg.attachments[0].url;
            }

            const timeFormatted = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            let avatarUrl = 'https://cdn.discordapp.com/embed/avatars/0.png';
            if (msg.author.avatar) {
                avatarUrl = `https://cdn.discordapp.com/avatars/${msg.author.id}/${msg.author.avatar}.png`;
            }

            return {
                id: msg.id,
                user: msg.author.global_name || msg.author.username,
                avatar: avatarUrl,
                content: msg.content,
                time: timeFormatted,
                attachment: attachmentUrl
            };
        });

        res.json(messages);
    } catch (err) {
        console.error('Gagal mengambil pesan channel Discord:', err.response?.data || err.message);
        res.status(500).json({ success: false, message: 'Gagal mengambil pesan dari channel Discord' });
    }
});

module.exports = router;