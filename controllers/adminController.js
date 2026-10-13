const db = require('../config/db');

// ==================== ADMIN SHOP ==================== //
exports.createShopItem = async (req, res) => {
  const { name, title, description, price, category, item_url } = req.body;
  const productName = name || title;
  const imageUrl = req.file ? `/uploads/${req.file.filename}` : (req.body.image_url || null);

  try {
    await db.query(
      'INSERT INTO shop_items (name, description, price, category, image_url, item_url) VALUES (?, ?, ?, ?, ?, ?)',
      [productName, description, price, category, imageUrl, item_url || '#']
    );
    res.json({ success: true, message: 'Item shop berhasil ditambahkan!' });
  } catch (err) {
    console.error('Error insert shop item:', err);
    res.status(500).json({ success: false, message: 'Gagal menambah item shop: ' + err.message });
  }
};

exports.updateShopItem = async (req, res) => {
  const { id } = req.params;
  const { name, title, description, price, category, item_url } = req.body;
  const productName = name || title;

  try {
    let updateQuery = 'UPDATE shop_items SET name = ?, description = ?, price = ?, category = ?, item_url = ?';
    let queryParams = [productName, description, price, category, item_url || '#'];

    if (req.file) {
      const imageUrl = `/uploads/${req.file.filename}`;
      updateQuery += ', image_url = ?';
      queryParams.push(imageUrl);
    }

    updateQuery += ' WHERE id = ?';
    queryParams.push(id);

    await db.query(updateQuery, queryParams);
    res.json({ success: true, message: 'Item shop berhasil diperbarui!' });
  } catch (err) {
    console.error('Error update shop item:', err);
    res.status(500).json({ success: false, message: 'Gagal memperbarui item shop: ' + err.message });
  }
};

exports.deleteShopItem = async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM shop_items WHERE id = ?', [id]);
    res.json({ success: true, message: 'Item shop berhasil dihapus!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Gagal menghapus item shop' });
  }
};

// ==================== ADMIN TOURNAMENTS ==================== //
exports.createTournament = async (req, res) => {
  const { title, game_title, game_name, description, rules, prize_pool, start_date, status, video_url } = req.body;
  const imageUrl = req.file ? `/uploads/${req.file.filename}` : (req.body.image_url || null);

  const finalGameName = game_name || game_title || 'Roblox';
  const finalRules = rules || description || '';

  try {
    await db.query(
      'INSERT INTO tournaments (title, game_name, prize_pool, status, start_date, rules, video_url, image_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [title, finalGameName, prize_pool, status || 'Upcoming', start_date, finalRules, video_url || null, imageUrl]
    );

    res.json({ success: true, message: 'Turnamen berhasil ditambahkan!' });
  } catch (err) {
    console.error('Error insert tournament:', err.message);
    res.status(500).json({ success: false, message: 'Gagal menambah turnamen: ' + err.message });
  }
};

exports.deleteTournament = async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM tournaments WHERE id = ?', [id]);
    res.json({ success: true, message: 'Turnamen berhasil dihapus!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Gagal menghapus turnamen' });
  }
};

// ==================== ADMIN JOURNEYS ==================== //
exports.createJourney = async (req, res) => {
  const { title, description, event_date, video_url } = req.body;
  const imageUrl = req.file ? `/uploads/${req.file.filename}` : (req.body.image_url || null);

  try {
    await db.query(
      'INSERT INTO journeys (title, description, event_date, image_url, video_url) VALUES (?, ?, ?, ?, ?)',
      [title, description, event_date, imageUrl, video_url || null]
    );
    res.json({ success: true, message: 'Log perjalanan berhasil ditambahkan!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Gagal menambah log perjalanan: ' + err.message });
  }
};

exports.deleteJourney = async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM journeys WHERE id = ?', [id]);
    res.json({ success: true, message: 'Log perjalanan berhasil dihapus!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Gagal menghapus log perjalanan' });
  }
};