const db = require('../config/db');

// --- SHOP CONTROLLERS ---

exports.createShopItem = async (req, res) => {
  try {
    const { name, category, price, description, item_url, image_url } = req.body;
    
    // Prioritaskan file upload jika ada (untuk development lokal), jika tidak gunakan image_url dari link
    let finalImageUrl = image_url || null;
    if (req.file) {
      finalImageUrl = `/uploads/${req.file.filename}`;
    }

    const query = `INSERT INTO shop_items (name, category, price, description, image_url, item_url) VALUES ($1, $2, $3, $4, $5, $6)`;
    await db.query(query, [
      name, 
      category, 
      price, 
      description || null, 
      finalImageUrl, 
      item_url || '#'
    ]);

    res.json({ success: true, message: 'Produk berhasil ditambahkan!' });
  } catch (err) {
    console.error('Create Shop Item Error:', err);
    res.status(500).json({ success: false, message: 'Gagal menambahkan produk: ' + err.message });
  }
};

exports.updateShopItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, category, price, description, item_url, image_url } = req.body;

    let updateQuery = `UPDATE shop_items SET name = $1, category = $2, price = $3, description = $4, item_url = $5`;
    let queryParams = [name, category, price, description, item_url || '#'];

    if (req.file) {
      const imageUrl = `/uploads/${req.file.filename}`;
      queryParams.push(imageUrl);
      updateQuery += `, image_url = $${queryParams.length}`;
    } else if (image_url) {
      queryParams.push(image_url);
      updateQuery += `, image_url = $${queryParams.length}`;
    }

    queryParams.push(id);
    updateQuery += ` WHERE id = $${queryParams.length}`;

    await db.query(updateQuery, queryParams);
    res.json({ success: true, message: 'Produk berhasil diperbarui!' });
  } catch (err) {
    console.error('Update Shop Item Error:', err);
    res.status(500).json({ success: false, message: 'Gagal memperbarui produk: ' + err.message });
  }
};

exports.deleteShopItem = async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM shop_items WHERE id = $1', [id]);
    res.json({ success: true, message: 'Produk berhasil dihapus!' });
  } catch (err) {
    console.error('Delete Shop Item Error:', err);
    res.status(500).json({ success: false, message: 'Gagal menghapus produk' });
  }
};


// --- TOURNAMENT CONTROLLERS ---

exports.createTournament = async (req, res) => {
  try {
    const { title, game, prize, description, date, image_url } = req.body;
    let finalImageUrl = image_url || null;
    if (req.file) {
      finalImageUrl = `/uploads/${req.file.filename}`;
    }

    const query = `INSERT INTO tournaments (title, game, prize, description, date, image_url) VALUES ($1, $2, $3, $4, $5, $6)`;
    await db.query(query, [title, game, prize, description || null, date || null, finalImageUrl]);

    res.json({ success: true, message: 'Turnamen berhasil ditambahkan!' });
  } catch (err) {
    console.error('Create Tournament Error:', err);
    res.status(500).json({ success: false, message: 'Gagal menambahkan turnamen' });
  }
};

exports.deleteTournament = async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM tournaments WHERE id = $1', [id]);
    res.json({ success: true, message: 'Turnamen berhasil dihapus!' });
  } catch (err) {
    console.error('Delete Tournament Error:', err);
    res.status(500).json({ success: false, message: 'Gagal menghapus turnamen' });
  }
};


// --- JOURNEY CONTROLLERS ---

exports.createJourney = async (req, res) => {
  try {
    const { title, description, date, image_url } = req.body;
    let finalImageUrl = image_url || null;
    if (req.file) {
      finalImageUrl = `/uploads/${req.file.filename}`;
    }

    const query = `INSERT INTO journeys (title, description, date, image_url) VALUES ($1, $2, $3, $4)`;
    await db.query(query, [title, description || null, date || null, finalImageUrl]);

    res.json({ success: true, message: 'Journey berhasil ditambahkan!' });
  } catch (err) {
    console.error('Create Journey Error:', err);
    res.status(500).json({ success: false, message: 'Gagal menambahkan journey' });
  }
};

exports.deleteJourney = async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM journeys WHERE id = $1', [id]);
    res.json({ success: true, message: 'Journey berhasil dihapus!' });
  } catch (err) {
    console.error('Delete Journey Error:', err);
    res.status(500).json({ success: false, message: 'Gagal menghapus journey' });
  }
};