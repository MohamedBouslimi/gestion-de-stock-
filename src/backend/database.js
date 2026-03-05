const { Pool } = require('pg');
const crypto = require('crypto');

// Supabase PostgreSQL connection
const pool = new Pool({
  connectionString: 'postgresql://postgres.ejovoupzmgzsklzwrjqr:JTBS7HGP0Qivv1jO@aws-1-eu-west-1.pooler.supabase.com:6543/postgres',
  ssl: { rejectUnauthorized: false }
});

// Helper function to hash passwords
function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

async function initDatabase() {
  const client = await pool.connect();
  
  try {
    // Create tables if they don't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        role TEXT DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        sku TEXT UNIQUE,
        category_id INTEGER REFERENCES categories(id),
        quantity INTEGER DEFAULT 0,
        min_quantity INTEGER DEFAULT 0,
        price NUMERIC DEFAULT 0,
        cost_price NUMERIC DEFAULT 0,
        date_achat DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS suppliers (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        contact_person TEXT,
        email TEXT,
        phone TEXT,
        address TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS stock_movements (
        id SERIAL PRIMARY KEY,
        product_id INTEGER NOT NULL REFERENCES products(id),
        type TEXT NOT NULL CHECK(type IN ('in', 'out', 'adjustment')),
        quantity INTEGER NOT NULL,
        reason TEXT,
        reference TEXT,
        date_mouvement DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
      CREATE INDEX IF NOT EXISTS idx_movements_product ON stock_movements(product_id);
      CREATE INDEX IF NOT EXISTS idx_movements_date ON stock_movements(created_at);
    `);

    // Insert sample data if tables are empty
    const categoryCount = await client.query('SELECT COUNT(*) as count FROM categories');
    if (parseInt(categoryCount.rows[0].count) === 0) {
      await insertSampleData(client);
    }

    // Create default admin user if no users exist
    const userCount = await client.query('SELECT COUNT(*) as count FROM users');
    if (parseInt(userCount.rows[0].count) === 0) {
      const hashedPassword = hashPassword('admin123');
      await client.query(
        'INSERT INTO users (username, email, password, role) VALUES ($1, $2, $3, $4)',
        ['admin', 'admin@example.com', hashedPassword, 'admin']
      );
    }

    console.log('Database initialized successfully with Supabase');
    return pool;
  } finally {
    client.release();
  }
}

async function insertSampleData(client) {
  // Sample categories
  await client.query('INSERT INTO categories (name, description) VALUES ($1, $2)', ['Electronics', 'Electronic devices and accessories']);
  await client.query('INSERT INTO categories (name, description) VALUES ($1, $2)', ['Office Supplies', 'Office and stationery items']);
  await client.query('INSERT INTO categories (name, description) VALUES ($1, $2)', ['Furniture', 'Office and home furniture']);

  // Sample products
  await client.query(
    'INSERT INTO products (name, description, sku, category_id, quantity, min_quantity, price, cost_price) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
    ['Laptop', 'Business laptop 15 inch', 'ELEC-001', 1, 25, 5, 899.99, 650.00]
  );
  await client.query(
    'INSERT INTO products (name, description, sku, category_id, quantity, min_quantity, price, cost_price) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
    ['Mouse', 'Wireless optical mouse', 'ELEC-002', 1, 150, 20, 29.99, 12.00]
  );
  await client.query(
    'INSERT INTO products (name, description, sku, category_id, quantity, min_quantity, price, cost_price) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
    ['Keyboard', 'Mechanical keyboard', 'ELEC-003', 1, 75, 10, 79.99, 35.00]
  );
  await client.query(
    'INSERT INTO products (name, description, sku, category_id, quantity, min_quantity, price, cost_price) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
    ['Notepad', 'A4 notepad 100 pages', 'OFF-001', 2, 500, 50, 4.99, 1.50]
  );
  await client.query(
    'INSERT INTO products (name, description, sku, category_id, quantity, min_quantity, price, cost_price) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
    ['Pen Set', 'Blue ink pen set of 10', 'OFF-002', 2, 200, 30, 9.99, 3.00]
  );
  await client.query(
    'INSERT INTO products (name, description, sku, category_id, quantity, min_quantity, price, cost_price) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
    ['Office Chair', 'Ergonomic office chair', 'FURN-001', 3, 30, 5, 249.99, 120.00]
  );
  await client.query(
    'INSERT INTO products (name, description, sku, category_id, quantity, min_quantity, price, cost_price) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
    ['Desk', 'Standing desk adjustable', 'FURN-002', 3, 15, 3, 449.99, 200.00]
  );

  // Sample suppliers
  await client.query(
    'INSERT INTO suppliers (name, contact_person, email, phone, address) VALUES ($1, $2, $3, $4, $5)',
    ['Tech Distributors Inc', 'John Smith', 'john@techdist.com', '+1-555-0100', '123 Tech Street, Silicon Valley, CA']
  );
  await client.query(
    'INSERT INTO suppliers (name, contact_person, email, phone, address) VALUES ($1, $2, $3, $4, $5)',
    ['Office World', 'Jane Doe', 'jane@officeworld.com', '+1-555-0200', '456 Office Blvd, New York, NY']
  );
  await client.query(
    'INSERT INTO suppliers (name, contact_person, email, phone, address) VALUES ($1, $2, $3, $4, $5)',
    ['Furniture Direct', 'Bob Wilson', 'bob@furnituredirect.com', '+1-555-0300', '789 Furniture Ave, Chicago, IL']
  );
}

function getPool() {
  return pool;
}

async function closeDatabase() {
  await pool.end();
}

module.exports = {
  initDatabase,
  getPool,
  closeDatabase,
  hashPassword
};
