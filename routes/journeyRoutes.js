const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const db = require('../config/db');

// GET All Journeys
router.get('/', async (req, res) => {
  try {
    // Perbaikan: PostgreSQL menggunakan .rows untuk mengambil data
    const result = await db.query('SELECT * FROM journeys ORDER BY event_date DESC');
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('DATABASE ERROR (GET /journeys):', err);
    res.status(500).json({ success: false, message: 'Gagal mengambil data dari database', error: err.message });
  }
});

// POST Create Journey
router.post('/', upload.single('mediaFile'), async (req, res) => {
  try {
    const { title, description, eventDate, mediaType, externalUrl } = req.body;
    let mediaUrl = externalUrl || '';

    if (req.file) {
      mediaUrl = `/uploads/${req.file.filename}`;
    }

    // Perbaikan: Menggunakan placeholder $1, $2, dst. dan RETURNING id untuk mendapatkan ID baru
    const query = `
      INSERT INTO journeys (title, description, event_date, media_type, media_url)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id
    `;
    const result = await db.query(query, [
      title, 
      description, 
      eventDate, 
      mediaType || 'image', 
      mediaUrl
    ]);

    const newId = result.rows[0]?.id;

    res.json({
      success: true,
      message: 'Journey log berhasil ditambahkan!',
      data: { id: newId, title, description, eventDate, mediaType, mediaUrl }
    });
  } catch (err) {
    console.error('MULTER/DATABASE ERROR (POST /journeys):', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE Journey
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    // Perbaikan: Menggunakan placeholder $1 untuk PostgreSQL
    await db.query('DELETE FROM journeys WHERE id = $1', [id]);
    res.json({ success: true, message: 'Journey log berhasil dihapus!' });
  } catch (err) {
    console.error('DATABASE ERROR (DELETE /journeys):', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;