# Stock Management System

A desktop stock management application built with:
- **Backend**: Node.js + Express
- **Frontend**: React
- **Desktop**: Electron
- **Database**: SQLite (better-sqlite3)

## Features

- 📊 **Dashboard**: Overview of inventory stats, low stock alerts, recent movements
- 📦 **Products**: CRUD operations for products with categories
- 🏷️ **Categories**: Organize products by category
- 🏭 **Suppliers**: Manage supplier information
- 🔄 **Stock Movements**: Track stock in/out and adjustments

## Development

### Prerequisites
- Node.js 18+ 
- npm

### Install Dependencies
```bash
npm install
```

### Run in Development Mode
```bash
npm run dev
```
This starts both the Vite dev server and Electron in development mode.

### Build for Production
```bash
npm run build
```

### Create Windows Executable
```bash
npm run dist:win
```
The installer will be created in the `release` folder.

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development mode |
| `npm run build` | Build the React frontend |
| `npm run start` | Run the built app in Electron |
| `npm run dist` | Build distributable package |
| `npm run dist:win` | Build Windows installer (.exe) |

## Project Structure

```
├── src/
│   ├── main/           # Electron main process
│   │   └── main.js
│   ├── backend/        # Express API server
│   │   ├── database.js
│   │   └── server.js
│   └── renderer/       # React frontend
│       ├── App.jsx
│       ├── App.css
│       └── main.jsx
├── assets/             # App icons
├── dist/               # Built frontend
├── release/            # Built executables
├── index.html          # Entry HTML
├── vite.config.js      # Vite configuration
└── package.json
```

## Database

The SQLite database (`stock.db`) is stored in the user data folder:
- Windows: `%APPDATA%/gestion-de-stock/`

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard/stats` | Get dashboard statistics |
| GET | `/api/products` | List all products |
| POST | `/api/products` | Create product |
| PUT | `/api/products/:id` | Update product |
| DELETE | `/api/products/:id` | Delete product |
| GET | `/api/categories` | List all categories |
| POST | `/api/categories` | Create category |
| PUT | `/api/categories/:id` | Update category |
| DELETE | `/api/categories/:id` | Delete category |
| GET | `/api/suppliers` | List all suppliers |
| POST | `/api/suppliers` | Create supplier |
| PUT | `/api/suppliers/:id` | Update supplier |
| DELETE | `/api/suppliers/:id` | Delete supplier |
| GET | `/api/movements` | List stock movements |
| POST | `/api/movements` | Record stock movement |

## License

ISC
