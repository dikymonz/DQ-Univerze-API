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
    const [rows] = await db.query('SELECT * FROM tournaments ORDER BY start_date ASC');
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('Error fetching tournaments:', err);
    res.status(500).json({ success: false, message: 'Gagal mengambil data turnamen' });
  }
});

// GET /api/tournaments/:id - Ambil Detail Turnamen Berdasarkan ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query('SELECT * FROM tournaments WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Turnamen tidak ditemukan' });
    }
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error('Error fetching tournament by ID:', err);
    res.status(500).json({ success: false, message: 'Gagal mengambil detail turnamen' });
  }
});

// POST /api/tournaments - Tambah Turnamen Baru (Multiple Images Support)
router.post('/', upload.array('images', 5), async (req, res) => {
  const { title, game_name, prize_pool, start_date, rules, status, externalUrl } = req.body;

  try {
    // Path gambar baru dari upload file Multer
    const newImages = req.files ? req.files.map((file) => `/uploads/${file.filename}`) : [];
    
    // Jika user menginputkan link external (YouTube/TikTok)
    const videoUrl = externalUrl || (newImages.length > 0 ? newImages[0] : null);

    const query = `
      INSERT INTO tournaments (title, game_name, prize_pool, start_date, rules, status, video_url, images)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
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
    // Ambil data lama untuk pengecekan gambar
    const [existingRows] = await db.query('SELECT images, video_url FROM tournaments WHERE id = ?', [id]);
    if (existingRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Turnamen tidak ditemukan' });
    }

    let finalImages = [];
    
    // Jika ada file gambar baru yang diunggah
    if (req.files && req.files.length > 0) {
      finalImages = req.files.map((file) => `/uploads/${file.filename}`);

      // Hapus file gambar lama jika diganti baru
      if (existingRows[0].images) {
        const oldImages = typeof existingRows[0].images === 'string' 
          ? JSON.parse(existingRows[0].images) 
          : existingRows[0].images;

        oldImages.forEach((imgRelPath) => {
          const fullPath = path.join(__dirname, '..', imgRelPath);
          if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
        });
      }
    } else {
      // Pertahankan gambar lama
      finalImages = existingRows[0].images 
        ? (typeof existingRows[0].images === 'string' ? JSON.parse(existingRows[0].images) : existingRows[0].images)
        : [];
    }

    const finalVideoUrl = externalUrl || (finalImages.length > 0 ? finalImages[0] : existingVideoUrl);

    const query = `
      UPDATE tournaments 
      SET title = ?, game_name = ?, prize_pool = ?, start_date = ?, rules = ?, status = ?, video_url = ?, images = ?
      WHERE id = ?
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
    const [rows] = await db.query('SELECT images, video_url FROM tournaments WHERE id = ?', [id]);
    if (rows.length > 0) {
      // 1. Hapus file-file gambar carousel
      if (rows[0].images) {
        const images = typeof rows[0].images === 'string' ? JSON.parse(rows[0].images) : rows[0].images;
        images.forEach((imgRelPath) => {
          const fullPath = path.join(__dirname, '..', imgRelPath);
          if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
        });
      }

      // 2. Hapus video_url jika berupa file lokal di /uploads/
      if (rows[0].video_url && rows[0].video_url.startsWith('/uploads/')) {
        const videoPath = path.join(__dirname, '..', rows[0].video_url);
        if (fs.existsSync(videoPath)) fs.unlinkSync(videoPath);
      }
    }

    await db.query('DELETE FROM tournaments WHERE id = ?', [id]);
    res.json({ success: true, message: 'Turnamen dan media berhasil dihapus!' });
  } catch (err) {
    console.error('Error delete tournament:', err);
    res.status(500).json({ success: false, message: 'Gagal menghapus turnamen' });
  }
});

module.exports = router;