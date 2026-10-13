const express = require('express');
const router = express.Router();
const axios = require('axios');
const db = require('../config/db');

// GET /api/donators - Ambil Daftar Top Donatur + Data Profil Discord
router.get('/', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM top_donators ORDER BY amount DESC');
    const rows = result.rows;

    const enrichedDonators = await Promise.all(
      rows.map(async (donator) => {
        try {
          const discordRes = await axios.get(
            `https://discord.com/api/v10/users/${donator.discord_id}`,
            {
              headers: { Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}` }
            }
          );

          const user = discordRes.data;
          const avatarUrl = user.avatar
            ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=256`
            : `https://cdn.discordapp.com/embed/avatars/${(parseInt(user.id) >> 22) % 5}.png`;

          const avatarDecorationUrl = user.avatar_decoration_data
            ? `https://cdn.discordapp.com/avatar-decoration-presets/${user.avatar_decoration_data.asset}.png`
            : null;

          return {
            id: donator.id,
            discord_id: donator.discord_id,
            amount: Number(donator.amount),
            username: user.global_name || user.username,
            avatar: avatarUrl,
            avatarDecoration: avatarDecorationUrl,
          };
        } catch (discordErr) {
          return {
            id: donator.id,
            discord_id: donator.discord_id,
            amount: Number(donator.amount),
            username: `User (${donator.discord_id})`,
            avatar: 'https://cdn.discordapp.com/embed/avatars/0.png',
            avatarDecoration: null,
          };
        }
      })
    );

    res.json({ success: true, data: enrichedDonators });
  } catch (err) {
    console.error('Error Top Donators:', err);
    res.status(500).json({ success: false, message: 'Database Error' });
  }
});

// POST /api/donators - Tambah Donatur Baru
router.post('/', async (req, res) => {
  const { discord_id, amount } = req.body;

  if (!discord_id || amount === undefined) {
    return res.status(400).json({ success: false, message: 'Discord ID dan Jumlah Nominal wajib diisi' });
  }

  try {
    await db.query(
      `INSERT INTO top_donators (discord_id, amount) 
       VALUES ($1, $2) 
       ON CONFLICT (discord_id) 
       DO UPDATE SET amount = EXCLUDED.amount`,
      [discord_id, amount]
    );

    res.json({ success: true, message: 'Data donatur berhasil ditambahkan!' });
  } catch (err) {
    console.error('Gagal menyimpan donatur:', err);
    res.status(500).json({ success: false, message: 'Gagal menyimpan data donatur' });
  }
});

// PUT /api/donators/:id - Edit Nominal Donatur
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { discord_id, amount } = req.body;

  try {
    await db.query(
      'UPDATE top_donators SET discord_id = $1, amount = $2 WHERE id = $3',
      [discord_id, amount, id]
    );

    res.json({ success: true, message: 'Data donatur berhasil diperbarui!' });
  } catch (err) {
    console.error('Gagal update donatur:', err);
    res.status(500).json({ success: false, message: 'Gagal memperbarui data donatur' });
  }
});

// DELETE /api/donators/:id - Hapus Donatur
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    await db.query('DELETE FROM top_donators WHERE id = $1', [id]);
    res.json({ success: true, message: 'Data donatur berhasil dihapus!' });
  } catch (err) {
    console.error('Gagal menghapus donatur:', err);
    res.status(500).json({ success: false, message: 'Gagal menghapus data donatur' });
  }
});

module.exports = router;