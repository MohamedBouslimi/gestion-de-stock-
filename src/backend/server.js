const express = require('express');
const cors = require('cors');
const path = require('path');
const { getPool, hashPassword } = require('./database');

const app = express();

app.use(cors());
app.use(express.json());

// Health check / root route
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Stock Management API is running' });
});

// ============== AUTHENTICATION ==============
app.post('/api/auth/register', async (req, res) => {
  try {
    const pool = getPool();
    const { username, email, password } = req.body;
    
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Tous les champs sont requis' });
    }
    
    const hashedPassword = hashPassword(password);
    const result = await pool.query(
      'INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING id',
      [username, email, hashedPassword]
    );
    res.status(201).json({ id: result.rows[0].id, username, email });
  } catch (error) {
    if (error.message.includes('duplicate key') || error.message.includes('unique constraint')) {
      res.status(400).json({ error: 'Nom d\'utilisateur ou email déjà utilisé' });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const pool = getPool();
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Nom d\'utilisateur et mot de passe requis' });
    }
    
    const hashedPassword = hashPassword(password);
    const result = await pool.query(
      'SELECT id, username, email, role FROM users WHERE username = $1 AND password = $2',
      [username, hashedPassword]
    );
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Identifiants incorrects' });
    }
    
    res.json({ user: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============== CATEGORIES ==============
app.get('/api/categories', async (req, res) => {
  try {
    const pool = getPool();
    const result = await pool.query('SELECT * FROM categories ORDER BY name');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/categories/:id', async (req, res) => {
  try {
    const pool = getPool();
    const result = await pool.query('SELECT * FROM categories WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Category not found' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/categories', async (req, res) => {
  try {
    const pool = getPool();
    const { name, description } = req.body;
    const result = await pool.query(
      'INSERT INTO categories (name, description) VALUES ($1, $2) RETURNING id',
      [name, description]
    );
    res.status(201).json({ id: result.rows[0].id, name, description });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/categories/:id', async (req, res) => {
  try {
    const pool = getPool();
    const { name, description } = req.body;
    await pool.query(
      'UPDATE categories SET name = $1, description = $2 WHERE id = $3',
      [name, description, req.params.id]
    );
    res.json({ id: parseInt(req.params.id), name, description });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/categories/:id', async (req, res) => {
  try {
    const pool = getPool();
    await pool.query('DELETE FROM categories WHERE id = $1', [req.params.id]);
    res.json({ message: 'Category deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============== PRODUCTS ==============
app.get('/api/products', async (req, res) => {
  try {
    const pool = getPool();
    const { search } = req.query;
    
    let query = `
      SELECT p.*, c.name as category_name 
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id 
    `;
    let params = [];
    
    if (search) {
      query += ` WHERE p.name ILIKE $1 OR p.sku ILIKE $2 OR p.description ILIKE $3`;
      params = [`%${search}%`, `%${search}%`, `%${search}%`];
    }
    
    query += ` ORDER BY p.name`;
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/products/:id', async (req, res) => {
  try {
    const pool = getPool();
    const result = await pool.query(`
      SELECT p.*, c.name as category_name 
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id 
      WHERE p.id = $1
    `, [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Product not found' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/products', async (req, res) => {
  try {
    const pool = getPool();
    const { name, description, sku, category_id, quantity, min_quantity, price, cost_price, date_achat } = req.body;
    const result = await pool.query(`
      INSERT INTO products (name, description, sku, category_id, quantity, min_quantity, price, cost_price, date_achat) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id
    `, [name, description, sku, category_id, quantity || 0, min_quantity || 0, price || 0, cost_price || 0, date_achat || null]);
    res.status(201).json({ id: result.rows[0].id, ...req.body });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/products/:id', async (req, res) => {
  try {
    const pool = getPool();
    const { name, description, sku, category_id, quantity, min_quantity, price, cost_price, date_achat } = req.body;
    await pool.query(`
      UPDATE products 
      SET name = $1, description = $2, sku = $3, category_id = $4, quantity = $5, 
          min_quantity = $6, price = $7, cost_price = $8, date_achat = $9, updated_at = CURRENT_TIMESTAMP 
      WHERE id = $10
    `, [name, description, sku, category_id, quantity, min_quantity, price, cost_price, date_achat || null, req.params.id]);
    res.json({ id: parseInt(req.params.id), ...req.body });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/products/:id', async (req, res) => {
  try {
    const pool = getPool();
    await pool.query('DELETE FROM products WHERE id = $1', [req.params.id]);
    res.json({ message: 'Product deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============== SUPPLIERS ==============
app.get('/api/suppliers', async (req, res) => {
  try {
    const pool = getPool();
    const result = await pool.query('SELECT * FROM suppliers ORDER BY name');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/suppliers/:id', async (req, res) => {
  try {
    const pool = getPool();
    const result = await pool.query('SELECT * FROM suppliers WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Supplier not found' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/suppliers', async (req, res) => {
  try {
    const pool = getPool();
    const { name, contact_person, email, phone, address } = req.body;
    const result = await pool.query(`
      INSERT INTO suppliers (name, contact_person, email, phone, address) 
      VALUES ($1, $2, $3, $4, $5) RETURNING id
    `, [name, contact_person, email, phone, address]);
    res.status(201).json({ id: result.rows[0].id, ...req.body });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/suppliers/:id', async (req, res) => {
  try {
    const pool = getPool();
    const { name, contact_person, email, phone, address } = req.body;
    await pool.query(`
      UPDATE suppliers SET name = $1, contact_person = $2, email = $3, phone = $4, address = $5 WHERE id = $6
    `, [name, contact_person, email, phone, address, req.params.id]);
    res.json({ id: parseInt(req.params.id), ...req.body });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/suppliers/:id', async (req, res) => {
  try {
    const pool = getPool();
    await pool.query('DELETE FROM suppliers WHERE id = $1', [req.params.id]);
    res.json({ message: 'Supplier deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============== STOCK MOVEMENTS ==============
app.get('/api/movements', async (req, res) => {
  try {
    const pool = getPool();
    const { search } = req.query;
    
    let query = `
      SELECT m.*, p.name as product_name 
      FROM stock_movements m 
      LEFT JOIN products p ON m.product_id = p.id 
    `;
    let params = [];
    
    if (search) {
      query += ` WHERE p.name ILIKE $1 OR m.reference ILIKE $2 OR m.reason ILIKE $3`;
      params = [`%${search}%`, `%${search}%`, `%${search}%`];
    }
    
    query += ` ORDER BY m.created_at DESC LIMIT 100`;
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/movements', async (req, res) => {
  try {
    const pool = getPool();
    const { product_id, type, quantity, reason, reference, date_mouvement } = req.body;
    
    // Insert movement
    const result = await pool.query(`
      INSERT INTO stock_movements (product_id, type, quantity, reason, reference, date_mouvement) 
      VALUES ($1, $2, $3, $4, $5, $6) RETURNING id
    `, [product_id, type, quantity, reason, reference, date_mouvement || null]);
    
    // Update product quantity
    const quantityChange = type === 'out' ? -quantity : quantity;
    await pool.query(
      'UPDATE products SET quantity = quantity + $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [quantityChange, product_id]
    );
    
    res.status(201).json({ id: result.rows[0].id, ...req.body });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/movements/:id', async (req, res) => {
  try {
    const pool = getPool();
    const { product_id, type, quantity, reason, reference, date_mouvement } = req.body;
    
    // Get the old movement to calculate quantity difference
    const oldMovementResult = await pool.query('SELECT * FROM stock_movements WHERE id = $1', [req.params.id]);
    if (oldMovementResult.rows.length === 0) {
      return res.status(404).json({ error: 'Mouvement non trouvé' });
    }
    const oldMovement = oldMovementResult.rows[0];
    
    // Reverse the old quantity change
    const oldQuantityChange = oldMovement.type === 'out' ? oldMovement.quantity : -oldMovement.quantity;
    await pool.query(
      'UPDATE products SET quantity = quantity + $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [oldQuantityChange, oldMovement.product_id]
    );
    
    // Update the movement
    await pool.query(`
      UPDATE stock_movements 
      SET product_id = $1, type = $2, quantity = $3, reason = $4, reference = $5, date_mouvement = $6
      WHERE id = $7
    `, [product_id, type, quantity, reason, reference, date_mouvement || null, req.params.id]);
    
    // Apply the new quantity change
    const newQuantityChange = type === 'out' ? -quantity : quantity;
    await pool.query(
      'UPDATE products SET quantity = quantity + $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [newQuantityChange, product_id]
    );
    
    res.json({ id: parseInt(req.params.id), ...req.body });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/movements/:id', async (req, res) => {
  try {
    const pool = getPool();
    
    // Get the movement to reverse the quantity
    const movementResult = await pool.query('SELECT * FROM stock_movements WHERE id = $1', [req.params.id]);
    if (movementResult.rows.length === 0) {
      return res.status(404).json({ error: 'Mouvement non trouvé' });
    }
    const movement = movementResult.rows[0];
    
    // Reverse the quantity change
    const quantityChange = movement.type === 'out' ? movement.quantity : -movement.quantity;
    await pool.query(
      'UPDATE products SET quantity = quantity + $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [quantityChange, movement.product_id]
    );
    
    // Delete the movement
    await pool.query('DELETE FROM stock_movements WHERE id = $1', [req.params.id]);
    
    res.json({ message: 'Mouvement supprimé' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============== DASHBOARD STATS ==============
app.get('/api/dashboard/stats', async (req, res) => {
  try {
    const pool = getPool();
    const { search } = req.query;
    
    const totalProducts = (await pool.query('SELECT COUNT(*) as count FROM products')).rows[0].count;
    const totalCategories = (await pool.query('SELECT COUNT(*) as count FROM categories')).rows[0].count;
    const totalSuppliers = (await pool.query('SELECT COUNT(*) as count FROM suppliers')).rows[0].count;
    const lowStockCount = (await pool.query('SELECT COUNT(*) as count FROM products WHERE quantity <= min_quantity')).rows[0].count;
    const totalValue = (await pool.query('SELECT COALESCE(SUM(quantity * price), 0) as total FROM products')).rows[0].total;
    
    let movementsQuery = `
      SELECT m.*, p.name as product_name 
      FROM stock_movements m 
      LEFT JOIN products p ON m.product_id = p.id 
    `;
    let params = [];
    
    if (search) {
      movementsQuery += ` WHERE p.name ILIKE $1 OR m.reference ILIKE $2 OR m.reason ILIKE $3`;
      params = [`%${search}%`, `%${search}%`, `%${search}%`];
    }
    
    movementsQuery += ` ORDER BY m.created_at DESC LIMIT 10`;
    
    const recentMovements = (await pool.query(movementsQuery, params)).rows;
    
    const lowStockProducts = (await pool.query(`
      SELECT * FROM products WHERE quantity <= min_quantity ORDER BY quantity ASC LIMIT 5
    `)).rows;

    res.json({
      totalProducts: parseInt(totalProducts),
      totalCategories: parseInt(totalCategories),
      totalSuppliers: parseInt(totalSuppliers),
      lowStockCount: parseInt(lowStockCount),
      totalValue: parseFloat(totalValue),
      recentMovements,
      lowStockProducts
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = app;
