const express = require('express');
const cors = require('cors');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const db = require('./config/db');
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/adminRoutes');
const journeyRoutes = require('./routes/journeyRoutes');
const tournamentRoutes = require('./routes/tournamentRoutes');
const donatorRoutes = require('./routes/donatorRoutes');
const shopRoutes = require('./routes/shopRoutes'); // Rute Shop (Publik & Admin CRUD)

const app = express();

// Memastikan folder uploads ada secara otomatis
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Konfigurasi CORS yang menggabungkan localhost dan Vercel secara aman
const allowedOrigins = [
  'http://localhost:5173',
  'https://dq-universe-api.vercel.app',
  'https://dq-universe-api-git-main-dikymonzs-projects.vercel.app/p',
   // Dihapus garis miring (slash) di akhir agar pencocokan string akurat
  /\.vercel\.app$/
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.some(o => typeof o === 'string' ? o === origin : o.test(origin))) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serving Static File Uploads
app.use('/uploads', express.static(uploadsDir));

// Endpoint Tes Kesehatan API
app.get('/', (req, res) => {
  res.json({ success: true, message: 'Gaming Corner API Service is Online 🚀' });
});

// Register Routes API
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/shop', shopRoutes);         // Endpoint utama Shop (GET, POST, PUT, DELETE)
app.use('/api/journeys', journeyRoutes);
app.use('/api/tournaments', tournamentRoutes);
app.use('/api/donators', donatorRoutes);

// Endpoint Discord Channels (Widget & Member)
app.get('/api/discord/channels', async (req, res) => {
  const guildId = process.env.DISCORD_GUILD_ID;
  if (!guildId) {
    return res.status(400).json({ success: false, message: 'DISCORD_GUILD_ID belum dikonfigurasi di .env' });
  }

  try {
    const response = await axios.get(`https://discord.com/api/guilds/${guildId}/widget.json`);
    const channels = response.data?.channels || [];
    const members = response.data?.members || [];

    const channelsWithCount = channels.map((ch) => {
      const activeMembers = members.filter((m) => m.channel_id === ch.id);
      return {
        id: ch.id,
        name: ch.name,
        n_members: activeMembers.length
      };
    });

    res.json(channelsWithCount);
  } catch (error) {
    console.error('Discord Widget API Error:', error.response?.data || error.message);
    res.status(500).json({ success: false, message: 'Gagal mengambil data dari server Discord' });
  }
});

// Endpoint untuk mengambil pesan dari Channel Discord tertentu
app.get('/api/discord/channel/:channelId/messages', async (req, res) => {
  const { channelId } = req.params;
  const botToken = process.env.DISCORD_BOT_TOKEN;

  if (!botToken) {
    return res.status(500).json({ success: false, message: 'DISCORD_BOT_TOKEN belum dikonfigurasi' });
  }

  try {
    const response = await axios.get(`https://discord.com/api/v10/channels/${channelId}/messages?limit=10`, {
      headers: { Authorization: `Bot ${botToken}` }
    });

    const messages = response.data.map((msg) => {
      let attachmentUrl = null;
      if (msg.attachments && msg.attachments.length > 0) {
        attachmentUrl = msg.attachments[0].url;
      }

      let content = msg.content;
      if (!content && msg.embeds && msg.embeds.length > 0) {
        content = msg.embeds[0].description || msg.embeds[0].title || '[Pesan Embed]';
      } else if (!content && attachmentUrl) {
        content = '[Mengirim Lampiran Gambar]';
      } else if (!content) {
        content = '[Pesan Kosong / Sistem]';
      }

      let username = msg.author.global_name || msg.author.username;
      if (msg.webhook_id && msg.author.username) {
        username = msg.author.username;
      }

      let avatarUrl = msg.author.avatar 
        ? `https://cdn.discordapp.com/avatars/${msg.author.id}/${msg.author.avatar}.png` 
        : null;

      return {
        id: msg.id,
        user: username,
        avatar: avatarUrl,
        content: content,
        attachment: attachmentUrl,
        time: new Date(msg.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
      };
    });

    res.json(messages);
  } catch (error) {
    console.error('Discord Channel Messages Error:', error.response?.data || error.message);
    res.status(500).json({ success: false, message: 'Gagal mengambil pesan dari channel Discord' });
  }
});

// Endpoint untuk mengambil pesan Embed dari Channel Rules Discord
app.get('/api/discord/channel/:channelId/rules', async (req, res) => {
  const { channelId } = req.params;
  const botToken = process.env.DISCORD_BOT_TOKEN;

  if (!botToken) {
    return res.status(500).json({ success: false, message: 'DISCORD_BOT_TOKEN belum dikonfigurasi' });
  }

  try {
    const response = await axios.get(`https://discord.com/api/v10/channels/${channelId}/messages?limit=5`, {
      headers: { Authorization: `Bot ${botToken}` }
    });

    const ruleMessages = response.data
      .filter((msg) => msg.embeds && msg.embeds.length > 0)
      .map((msg) => ({
        id: msg.id,
        embeds: msg.embeds
      }));

    res.json(ruleMessages);
  } catch (error) {
    console.error('Discord Rules API Error:', error.response?.data || error.message);
    res.status(500).json({ success: false, message: 'Gagal mengambil rules dari Discord' });
  }
});

// Middleware Authentication JWT
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ success: false, message: 'Token tidak ditemukan' });

  jwt.verify(token, process.env.JWT_SECRET || 'secretkey', (err, user) => {
    if (err) return res.status(403).json({ success: false, message: 'Token tidak valid' });
    req.user = user;
    next();
  });
};

// Role Mapping dari .env
const ROLE_MAP = {
  web_member: process.env.ROLE_WEB_MEMBER,
  loyalis: process.env.ROLE_LOYALIS_ID,
  topup: process.env.ROLE_TOPUP_ID,
  tournament: process.env.ROLE_TOURNAMENT_ID
};

// Endpoint Claim Role Discord
app.post('/api/claim-role', authenticateToken, async (req, res) => {
  const { roleKey } = req.body;
  const userId = req.user.id;
  const roleId = ROLE_MAP[roleKey] || ROLE_MAP['web_member'];

  if (!roleId) return res.status(400).json({ success: false, message: 'Jenis role tidak dikonfigurasi' });

  try {
    await axios.put(
      `https://discord.com/api/v10/guilds/${process.env.DISCORD_GUILD_ID}/members/${userId}/roles/${roleId}`,
      {},
      { headers: { Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`, 'Content-Type': 'application/json' } }
    );
    res.json({ success: true, message: 'Role berhasil diklaim!' });
  } catch (error) {
    if (error.response?.status === 404) {
      return res.status(404).json({ success: false, message: 'Kamu belum bergabung di Server Discord Gaming Corner!' });
    }
    console.error('Discord Role Claim Error:', error.response?.data || error.message);
    res.status(500).json({ success: false, message: 'Gagal mengklaim role.' });
  }
});

// Global Error Handler Middleware
app.use((err, req, res, next) => {
  console.error('Internal Server Error:', err.stack);
  res.status(500).json({ success: false, message: err.message || 'Terjadi kesalahan pada server' });
});

// Jalankan server lokal (tidak mengganggu serverless Vercel)
const PORT = process.env.PORT || 5000;
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => console.log(`🚀 Gaming Corner API running on port ${PORT}`));
}

// WAJIB: Export app untuk Vercel Serverless
module.exports = app;