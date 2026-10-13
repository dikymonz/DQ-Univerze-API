const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../config/db');

// Konfigurasi Multer Storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'tournament-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

// GET /api/tournaments - Ambil Semua Turnamen
router.get('/', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM tournaments ORDER BY start_date ASC');
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('Error fetching tournaments:', err);
    res.status(500).json({ success: false, message: 'Gagal mengambil data turnamen' });
  }
});

// GET /api/tournaments/:id - Ambil Detail Turnamen Berdasarkan ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.query('SELECT * FROM tournaments WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Turnamen tidak ditemukan' });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('Error fetching tournament by ID:', err);
    res.status(500).json({ success: false, message: 'Gagal mengambil detail turnamen' });
  }
});

// POST /api/tournaments - Tambah Turnamen Baru (Multiple Images Support)
router.post('/', upload.array('images', 5), async (req, res) => {
  const { title, game_name, prize_pool, start_date, rules, status, externalUrl } = req.body;

  try {
    const newImages = req.files ? req.files.map((file) => `/uploads/${file.filename}`) : [];
    const videoUrl = externalUrl || (newImages.length > 0 ? newImages[0] : null);

    const query = `
      INSERT INTO tournaments (title, game_name, prize_pool, start_date, rules, status, video_url, images)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `;

    await db.query(query, [
      title,
      game_name,
      prize_pool,
      start_date,
      rules,
      status || 'Upcoming',
      videoUrl,
      JSON.stringify(newImages)
    ]);

    res.json({ success: true, message: 'Turnamen berhasil ditambahkan!' });
  } catch (err) {
    console.error('Error insert tournament:', err);
    res.status(500).json({ success: false, message: 'Gagal menambahkan turnamen' });
  }
});

// PUT /api/tournaments/:id - Update Turnamen
router.put('/:id', upload.array('images', 5), async (req, res) => {
  const { id } = req.params;
  const { title, game_name, prize_pool, start_date, rules, status, externalUrl, existingVideoUrl } = req.body;

  try {
    const existingResult = await db.query('SELECT images, video_url FROM tournaments WHERE id = $1', [id]);
    if (existingResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Turnamen tidak ditemukan' });
    }

    const existingTournament = existingResult.rows[0];
    let finalImages = [];
    
    if (req.files && req.files.length > 0) {
      finalImages = req.files.map((file) => `/uploads/${file.filename}`);

      if (existingTournament.images) {
        const oldImages = typeof existingTournament.images === 'string' 
          ? JSON.parse(existingTournament.images) 
          : existingTournament.images;

        oldImages.forEach((imgRelPath) => {
          const fullPath = path.join(__dirname, '..', imgRelPath);
          if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
        });
      }
    } else {
      finalImages = existingTournament.images 
        ? (typeof existingTournament.images === 'string' ? JSON.parse(existingTournament.images) : existingTournament.images)
        : [];
    }

    const finalVideoUrl = externalUrl || (finalImages.length > 0 ? finalImages[0] : existingVideoUrl);

    const query = `
      UPDATE tournaments 
      SET title = $1, game_name = $2, prize_pool = $3, start_date = $4, rules = $5, status = $6, video_url = $7, images = $8
      WHERE id = $9
    `;

    await db.query(query, [
      title,
      game_name,
      prize_pool,
      start_date,
      rules,
      status,
      finalVideoUrl,
      JSON.stringify(finalImages),
      id
    ]);

    res.json({ success: true, message: 'Turnamen berhasil diperbarui!' });
  } catch (err) {
    console.error('Error update tournament:', err);
    res.status(500).json({ success: false, message: 'Gagal memperbarui turnamen' });
  }
});

// DELETE /api/tournaments/:id - Hapus Turnamen + File Gambar
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const existingResult = await db.query('SELECT images, video_url FROM tournaments WHERE id = $1', [id]);
    if (existingResult.rows.length > 0) {
      const tournament = existingResult.rows[0];
      if (tournament.images) {
        const images = typeof tournament.images === 'string' ? JSON.parse(tournament.images) : tournament.images;
        images.forEach((imgRelPath) => {
          const fullPath = path.join(__dirname, '..', imgRelPath);
          if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
        });
      }

      if (tournament.video_url && tournament.video_url.startsWith('/uploads/')) {
        const videoPath = path.join(__dirname, '..', tournament.video_url);
        if (fs.existsSync(videoPath)) fs.unlinkSync(videoPath);
      }
    }

    await db.query('DELETE FROM tournaments WHERE id = $1', [id]);
    res.json({ success: true, message: 'Turnamen dan media berhasil dihapus!' });
  } catch (err) {
    console.error('Error delete tournament:', err);
    res.status(500).json({ success: false, message: 'Gagal menghapus turnamen' });
  }
});

module.exports = router;