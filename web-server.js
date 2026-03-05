// Standalone web server for the stock management app
const { initDatabase, closeDatabase } = require('./src/backend/database');
const expressApp = require('./src/backend/server');

const PORT = process.env.PORT || 3001;

// Initialize database and start server
async function startServer() {
  try {
    await initDatabase();
    
    const server = expressApp.listen(PORT, () => {
      console.log(`\n🚀 Server running on http://localhost:${PORT}`);
      console.log(`📦 Stock Management App is ready!`);
      console.log(`🔗 Connected to Supabase PostgreSQL`);
      console.log(`\nDefault login: admin / admin123`);
      console.log(`\nPress Ctrl+C to stop the server.\n`);
    });

    // Handle shutdown
    process.on('SIGINT', async () => {
      console.log('\nShutting down server...');
      await closeDatabase();
      server.close(() => {
        console.log('Server stopped.');
        process.exit(0);
      });
    });

    process.on('SIGTERM', async () => {
      console.log('\nShutting down server...');
      await closeDatabase();
      server.close(() => {
        console.log('Server stopped.');
        process.exit(0);
      });
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
