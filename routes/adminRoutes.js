const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const adminController = require('../controllers/adminController');
const upload = require('../middleware/upload'); // 1. Import middleware upload multer

// Middleware Authentication JWT
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: 'Akses ditolak, token tidak ditemukan' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'secretkey', (err, user) => {
    if (err) {
      return res.status(403).json({ success: false, message: 'Token tidak valid' });
    }
    req.user = user;
    next();
  });
};

// Middleware Khusus Validasi Admin
const verifyAdmin = (req, res, next) => {
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({ success: false, message: 'Akses ditolak! Khusus administrator.' });
  }
  next();
};

// --- Shop Admin Routes ---
// 2. Tambahkan upload.single('image') di sini agar req.body tidak undefined
router.post('/shop', authenticateToken, verifyAdmin, upload.single('image'), adminController.createShopItem);
router.delete('/shop/:id', authenticateToken, verifyAdmin, adminController.deleteShopItem);

// --- Tournament Admin Routes ---
router.post('/tournaments', authenticateToken, verifyAdmin, adminController.createTournament);
router.delete('/tournaments/:id', authenticateToken, verifyAdmin, adminController.deleteTournament);

// --- Journey Admin Routes ---
router.post('/journey', authenticateToken, verifyAdmin, adminController.createJourney);
router.delete('/journey/:id', authenticateToken, verifyAdmin, adminController.deleteJourney);

module.exports = router;