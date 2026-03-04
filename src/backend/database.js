const Database = require('better-sqlite3');
const path = require('path');
const { app } = require('electron');

let db = null;

function getDbPath() {
  // In production, use userData folder; in development, use current directory
  const userDataPath = app ? app.getPath('userData') : __dirname;
  return path.join(userDataPath, 'stock.db');
}

function initDatabase(dbPath = null) {
  const finalPath = dbPath || getDbPath();
  db = new Database(finalPath);
  
  // Create tables if they don't exist
  db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      sku TEXT UNIQUE,
      category_id INTEGER,
      quantity INTEGER DEFAULT 0,
      min_quantity INTEGER DEFAULT 0,
      price REAL DEFAULT 0,
      cost_price REAL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES categories(id)
    );

    CREATE TABLE IF NOT EXISTS suppliers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      contact_person TEXT,
      email TEXT,
      phone TEXT,
      address TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS stock_movements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('in', 'out', 'adjustment')),
      quantity INTEGER NOT NULL,
      reason TEXT,
      reference TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (product_id) REFERENCES products(id)
    );

    CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
    CREATE INDEX IF NOT EXISTS idx_movements_product ON stock_movements(product_id);
    CREATE INDEX IF NOT EXISTS idx_movements_date ON stock_movements(created_at);
  `);

  // Insert sample data if tables are empty
  const categoryCount = db.prepare('SELECT COUNT(*) as count FROM categories').get();
  if (categoryCount.count === 0) {
    insertSampleData();
  }

  return db;
}

function insertSampleData() {
  const insertCategory = db.prepare('INSERT INTO categories (name, description) VALUES (?, ?)');
  const insertProduct = db.prepare('INSERT INTO products (name, description, sku, category_id, quantity, min_quantity, price, cost_price) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
  const insertSupplier = db.prepare('INSERT INTO suppliers (name, contact_person, email, phone, address) VALUES (?, ?, ?, ?, ?)');

  // Sample categories
  insertCategory.run('Electronics', 'Electronic devices and accessories');
  insertCategory.run('Office Supplies', 'Office and stationery items');
  insertCategory.run('Furniture', 'Office and home furniture');

  // Sample products
  insertProduct.run('Laptop', 'Business laptop 15 inch', 'ELEC-001', 1, 25, 5, 899.99, 650.00);
  insertProduct.run('Mouse', 'Wireless optical mouse', 'ELEC-002', 1, 150, 20, 29.99, 12.00);
  insertProduct.run('Keyboard', 'Mechanical keyboard', 'ELEC-003', 1, 75, 10, 79.99, 35.00);
  insertProduct.run('Notepad', 'A4 notepad 100 pages', 'OFF-001', 2, 500, 50, 4.99, 1.50);
  insertProduct.run('Pen Set', 'Blue ink pen set of 10', 'OFF-002', 2, 200, 30, 9.99, 3.00);
  insertProduct.run('Office Chair', 'Ergonomic office chair', 'FURN-001', 3, 30, 5, 249.99, 120.00);
  insertProduct.run('Desk', 'Standing desk adjustable', 'FURN-002', 3, 15, 3, 449.99, 200.00);

  // Sample suppliers
  insertSupplier.run('Tech Distributors Inc', 'John Smith', 'john@techdist.com', '+1-555-0100', '123 Tech Street, Silicon Valley, CA');
  insertSupplier.run('Office World', 'Jane Doe', 'jane@officeworld.com', '+1-555-0200', '456 Office Blvd, New York, NY');
  insertSupplier.run('Furniture Direct', 'Bob Wilson', 'bob@furnituredirect.com', '+1-555-0300', '789 Furniture Ave, Chicago, IL');
}

function getDatabase() {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
}

function closeDatabase() {
  if (db) {
    db.close();
    db = null;
  }
}

module.exports = {
  initDatabase,
  getDatabase,
  closeDatabase
};
