const express = require('express');
const cors = require('cors');
const { getDatabase } = require('./database');

const app = express();

app.use(cors());
app.use(express.json());

// ============== CATEGORIES ==============
app.get('/api/categories', (req, res) => {
  try {
    const db = getDatabase();
    const categories = db.prepare('SELECT * FROM categories ORDER BY name').all();
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/categories/:id', (req, res) => {
  try {
    const db = getDatabase();
    const category = db.prepare('SELECT * FROM categories WHERE id = ?').get(req.params.id);
    if (!category) return res.status(404).json({ error: 'Category not found' });
    res.json(category);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/categories', (req, res) => {
  try {
    const db = getDatabase();
    const { name, description } = req.body;
    const result = db.prepare('INSERT INTO categories (name, description) VALUES (?, ?)').run(name, description);
    res.status(201).json({ id: result.lastInsertRowid, name, description });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/categories/:id', (req, res) => {
  try {
    const db = getDatabase();
    const { name, description } = req.body;
    db.prepare('UPDATE categories SET name = ?, description = ? WHERE id = ?').run(name, description, req.params.id);
    res.json({ id: parseInt(req.params.id), name, description });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/categories/:id', (req, res) => {
  try {
    const db = getDatabase();
    db.prepare('DELETE FROM categories WHERE id = ?').run(req.params.id);
    res.json({ message: 'Category deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============== PRODUCTS ==============
app.get('/api/products', (req, res) => {
  try {
    const db = getDatabase();
    const products = db.prepare(`
      SELECT p.*, c.name as category_name 
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id 
      ORDER BY p.name
    `).all();
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/products/:id', (req, res) => {
  try {
    const db = getDatabase();
    const product = db.prepare(`
      SELECT p.*, c.name as category_name 
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id 
      WHERE p.id = ?
    `).get(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/products', (req, res) => {
  try {
    const db = getDatabase();
    const { name, description, sku, category_id, quantity, min_quantity, price, cost_price } = req.body;
    const result = db.prepare(`
      INSERT INTO products (name, description, sku, category_id, quantity, min_quantity, price, cost_price) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(name, description, sku, category_id, quantity || 0, min_quantity || 0, price || 0, cost_price || 0);
    res.status(201).json({ id: result.lastInsertRowid, ...req.body });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/products/:id', (req, res) => {
  try {
    const db = getDatabase();
    const { name, description, sku, category_id, quantity, min_quantity, price, cost_price } = req.body;
    db.prepare(`
      UPDATE products 
      SET name = ?, description = ?, sku = ?, category_id = ?, quantity = ?, 
          min_quantity = ?, price = ?, cost_price = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `).run(name, description, sku, category_id, quantity, min_quantity, price, cost_price, req.params.id);
    res.json({ id: parseInt(req.params.id), ...req.body });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/products/:id', (req, res) => {
  try {
    const db = getDatabase();
    db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id);
    res.json({ message: 'Product deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============== SUPPLIERS ==============
app.get('/api/suppliers', (req, res) => {
  try {
    const db = getDatabase();
    const suppliers = db.prepare('SELECT * FROM suppliers ORDER BY name').all();
    res.json(suppliers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/suppliers/:id', (req, res) => {
  try {
    const db = getDatabase();
    const supplier = db.prepare('SELECT * FROM suppliers WHERE id = ?').get(req.params.id);
    if (!supplier) return res.status(404).json({ error: 'Supplier not found' });
    res.json(supplier);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/suppliers', (req, res) => {
  try {
    const db = getDatabase();
    const { name, contact_person, email, phone, address } = req.body;
    const result = db.prepare(`
      INSERT INTO suppliers (name, contact_person, email, phone, address) 
      VALUES (?, ?, ?, ?, ?)
    `).run(name, contact_person, email, phone, address);
    res.status(201).json({ id: result.lastInsertRowid, ...req.body });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/suppliers/:id', (req, res) => {
  try {
    const db = getDatabase();
    const { name, contact_person, email, phone, address } = req.body;
    db.prepare(`
      UPDATE suppliers SET name = ?, contact_person = ?, email = ?, phone = ?, address = ? WHERE id = ?
    `).run(name, contact_person, email, phone, address, req.params.id);
    res.json({ id: parseInt(req.params.id), ...req.body });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/suppliers/:id', (req, res) => {
  try {
    const db = getDatabase();
    db.prepare('DELETE FROM suppliers WHERE id = ?').run(req.params.id);
    res.json({ message: 'Supplier deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============== STOCK MOVEMENTS ==============
app.get('/api/movements', (req, res) => {
  try {
    const db = getDatabase();
    const movements = db.prepare(`
      SELECT m.*, p.name as product_name 
      FROM stock_movements m 
      LEFT JOIN products p ON m.product_id = p.id 
      ORDER BY m.created_at DESC
      LIMIT 100
    `).all();
    res.json(movements);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/movements', (req, res) => {
  try {
    const db = getDatabase();
    const { product_id, type, quantity, reason, reference } = req.body;
    
    // Insert movement
    const result = db.prepare(`
      INSERT INTO stock_movements (product_id, type, quantity, reason, reference) 
      VALUES (?, ?, ?, ?, ?)
    `).run(product_id, type, quantity, reason, reference);
    
    // Update product quantity
    const quantityChange = type === 'out' ? -quantity : quantity;
    db.prepare('UPDATE products SET quantity = quantity + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(quantityChange, product_id);
    
    res.status(201).json({ id: result.lastInsertRowid, ...req.body });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============== DASHBOARD STATS ==============
app.get('/api/dashboard/stats', (req, res) => {
  try {
    const db = getDatabase();
    
    const totalProducts = db.prepare('SELECT COUNT(*) as count FROM products').get().count;
    const totalCategories = db.prepare('SELECT COUNT(*) as count FROM categories').get().count;
    const totalSuppliers = db.prepare('SELECT COUNT(*) as count FROM suppliers').get().count;
    const lowStockCount = db.prepare('SELECT COUNT(*) as count FROM products WHERE quantity <= min_quantity').get().count;
    const totalValue = db.prepare('SELECT COALESCE(SUM(quantity * price), 0) as total FROM products').get().total;
    
    const recentMovements = db.prepare(`
      SELECT m.*, p.name as product_name 
      FROM stock_movements m 
      LEFT JOIN products p ON m.product_id = p.id 
      ORDER BY m.created_at DESC 
      LIMIT 5
    `).all();
    
    const lowStockProducts = db.prepare(`
      SELECT * FROM products WHERE quantity <= min_quantity ORDER BY quantity ASC LIMIT 5
    `).all();

    res.json({
      totalProducts,
      totalCategories,
      totalSuppliers,
      lowStockCount,
      totalValue,
      recentMovements,
      lowStockProducts
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = app;
