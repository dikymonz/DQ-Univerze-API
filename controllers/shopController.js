const db = require('../config/db');

// --- SHOP CONTROLLERS ---

exports.createShopItem = async (req, res) => {
  try {
    const { name, category, price, description, item_url } = req.body;
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

    const query = `INSERT INTO shop_items (name, category, price, description, image_url, item_url) VALUES (?, ?, ?, ?, ?, ?)`;
    await db.query(query, [
      name, 
      category, 
      price, 
      description || null, 
      imageUrl, 
      item_url || '#'
    ]);

    res.json({ success: true, message: 'Produk berhasil ditambahkan!' });
  } catch (err) {
    console.error('Create Shop Item Error:', err);
    res.status(500).json({ success: false, message: 'Gagal menambahkan produk' });
  }
};

exports.updateShopItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, category, price, description, item_url } = req.body;

    let updateQuery = `UPDATE shop_items SET name = ?, category = ?, price = ?, description = ?, item_url = ?`;
    let queryParams = [name, category, price, description, item_url || '#'];

    if (req.file) {
      const imageUrl = `/uploads/${req.file.filename}`;
      updateQuery += `, image_url = ?`;
      queryParams.push(imageUrl);
    }

    updateQuery += ` WHERE id = ?`;
    queryParams.push(id);

    await db.query(updateQuery, queryParams);
    res.json({ success: true, message: 'Produk berhasil diperbarui!' });
  } catch (err) {
    console.error('Update Shop Item Error:', err);
    res.status(500).json({ success: false, message: 'Gagal memperbarui produk' });
  }
};

exports.deleteShopItem = async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM shop_items WHERE id = ?', [id]);
    res.json({ success: true, message: 'Produk berhasil dihapus!' });
  } catch (err) {
    console.error('Delete Shop Item Error:', err);
    res.status(500).json({ success: false, message: 'Gagal menghapus produk' });
  }
};


// --- TOURNAMENT CONTROLLERS ---

exports.createTournament = async (req, res) => {
  try {
    const { title, game, prize, description, date } = req.body;
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

    const query = `INSERT INTO tournaments (title, game, prize, description, date, image_url) VALUES (?, ?, ?, ?, ?, ?)`;
    await db.query(query, [title, game, prize, description || null, date || null, imageUrl]);

    res.json({ success: true, message: 'Turnamen berhasil ditambahkan!' });
  } catch (err) {
    console.error('Create Tournament Error:', err);
    res.status(500).json({ success: false, message: 'Gagal menambahkan turnamen' });
  }
};

exports.deleteTournament = async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM tournaments WHERE id = ?', [id]);
    res.json({ success: true, message: 'Turnamen berhasil dihapus!' });
  } catch (err) {
    console.error('Delete Tournament Error:', err);
    res.status(500).json({ success: false, message: 'Gagal menghapus turnamen' });
  }
};


// --- JOURNEY CONTROLLERS ---

exports.createJourney = async (req, res) => {
  try {
    const { title, description, date } = req.body;
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

    const query = `INSERT INTO journeys (title, description, date, image_url) VALUES (?, ?, ?, ?)`;
    await db.query(query, [title, description || null, date || null, imageUrl]);

    res.json({ success: true, message: 'Journey berhasil ditambahkan!' });
  } catch (err) {
    console.error('Create Journey Error:', err);
    res.status(500).json({ success: false, message: 'Gagal menambahkan journey' });
  }
};

exports.deleteJourney = async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM journeys WHERE id = ?', [id]);
    res.json({ success: true, message: 'Journey berhasil dihapus!' });
  } catch (err) {
    console.error('Delete Journey Error:', err);
    res.status(500).json({ success: false, message: 'Gagal menghapus journey' });
  }
};