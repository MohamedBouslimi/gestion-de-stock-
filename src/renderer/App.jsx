import React, { useState, useEffect } from 'react';
import './App.css';

// Use relative path for production, full URL for development
const API_BASE = import.meta.env.DEV ? 'http://localhost:3001/api' : '/api';

// Fonctions d'aide API
const api = {
  get: async (endpoint) => {
    const res = await fetch(`${API_BASE}${endpoint}`);
    return res.json();
  },
  post: async (endpoint, data) => {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },
  put: async (endpoint, data) => {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },
  delete: async (endpoint) => {
    const res = await fetch(`${API_BASE}${endpoint}`, { method: 'DELETE' });
    return res.json();
  }
};

// Fonction pour traduire les types de mouvement
const translateType = (type) => {
  switch(type) {
    case 'in': return 'Entrée';
    case 'out': return 'Sortie';
    case 'adjustment': return 'Ajustement';
    default: return type;
  }
};

// Composant Login
function Login({ onLogin, onSwitchToRegister }) {
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const result = await api.post('/auth/login', formData);
      if (result.error) {
        setError(result.error);
      } else {
        localStorage.setItem('user', JSON.stringify(result.user));
        onLogin(result.user);
      }
    } catch (err) {
      setError('Erreur de connexion au serveur');
    }
    setLoading(false);
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h2>📦 Gestion de Stock</h2>
        <h3>Connexion</h3>
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Nom d'utilisateur</label>
            <input 
              type="text" 
              value={formData.username} 
              onChange={e => setFormData({...formData, username: e.target.value})} 
              required 
            />
          </div>
          <div className="form-group">
            <label>Mot de passe</label>
            <input 
              type="password" 
              value={formData.password} 
              onChange={e => setFormData({...formData, password: e.target.value})} 
              required 
            />
          </div>
          <button type="submit" className="btn-primary full-width" disabled={loading}>
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>
        <p className="auth-switch">
          Pas de compte ? <span onClick={onSwitchToRegister}>S'inscrire</span>
        </p>
      </div>
    </div>
  );
}

// Composant Register
function Register({ onRegister, onSwitchToLogin }) {
  const [formData, setFormData] = useState({ username: '', email: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (formData.password !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }
    
    setLoading(true);
    
    try {
      const result = await api.post('/auth/register', {
        username: formData.username,
        email: formData.email,
        password: formData.password
      });
      if (result.error) {
        setError(result.error);
      } else {
        onSwitchToLogin();
      }
    } catch (err) {
      setError('Erreur de connexion au serveur');
    }
    setLoading(false);
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h2>📦 Gestion de Stock</h2>
        <h3>Inscription</h3>
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Nom d'utilisateur</label>
            <input 
              type="text" 
              value={formData.username} 
              onChange={e => setFormData({...formData, username: e.target.value})} 
              required 
            />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input 
              type="email" 
              value={formData.email} 
              onChange={e => setFormData({...formData, email: e.target.value})} 
              required 
            />
          </div>
          <div className="form-group">
            <label>Mot de passe</label>
            <input 
              type="password" 
              value={formData.password} 
              onChange={e => setFormData({...formData, password: e.target.value})} 
              required 
            />
          </div>
          <div className="form-group">
            <label>Confirmer le mot de passe</label>
            <input 
              type="password" 
              value={formData.confirmPassword} 
              onChange={e => setFormData({...formData, confirmPassword: e.target.value})} 
              required 
            />
          </div>
          <button type="submit" className="btn-primary full-width" disabled={loading}>
            {loading ? 'Inscription...' : 'S\'inscrire'}
          </button>
        </form>
        <p className="auth-switch">
          Déjà un compte ? <span onClick={onSwitchToLogin}>Se connecter</span>
        </p>
      </div>
    </div>
  );
}

// Composant Tableau de Bord
function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async (search = '') => {
    try {
      const url = search ? `/dashboard/stats?search=${encodeURIComponent(search)}` : '/dashboard/stats';
      const data = await api.get(url);
      setStats(data);
    } catch (error) {
      console.error('Échec du chargement des statistiques:', error);
    }
    setLoading(false);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    loadStats(searchTerm);
  };

  if (loading) return <div className="loading">Chargement...</div>;
  if (!stats) return <div className="error">Échec du chargement du tableau de bord</div>;

  return (
    <div className="dashboard">
      <h2>Tableau de Bord</h2>
      <div className="stats-grid">
        <div className="stat-card">
          <h3>{stats.totalProducts}</h3>
          <p>Total Produits</p>
        </div>
        <div className="stat-card">
          <h3>{stats.totalCategories}</h3>
          <p>Catégories</p>
        </div>
        <div className="stat-card">
          <h3>{stats.totalSuppliers}</h3>
          <p>Fournisseurs</p>
        </div>
        <div className="stat-card warning">
          <h3>{stats.lowStockCount}</h3>
          <p>Stock Faible</p>
        </div>
        <div className="stat-card success">
          <h3>{stats.totalValue.toFixed(2)} DT</h3>
          <p>Valeur Totale du Stock</p>
        </div>
      </div>

      <div className="dashboard-sections">
        <div className="section">
          <div className="section-header">
            <h3>Mouvements Récents</h3>
            <form onSubmit={handleSearch} className="search-form-inline">
              <input 
                type="text" 
                placeholder="Rechercher mouvements..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
              <button type="submit" className="btn-search">🔍</button>
            </form>
          </div>
          <table>
            <thead>
              <tr>
                <th>Produit</th>
                <th>Type</th>
                <th>Quantité</th>
                <th>Date Mouvement</th>
                <th>Créé le</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentMovements.map(m => (
                <tr key={m.id}>
                  <td>{m.product_name}</td>
                  <td><span className={`badge ${m.type}`}>{translateType(m.type)}</span></td>
                  <td>{m.quantity}</td>
                  <td>{m.date_mouvement ? new Date(m.date_mouvement).toLocaleDateString('fr-FR') : '-'}</td>
                  <td>{new Date(m.created_at).toLocaleDateString('fr-FR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="section">
          <h3>Alerte Stock Faible</h3>
          <table>
            <thead>
              <tr>
                <th>Produit</th>
                <th>Actuel</th>
                <th>Minimum</th>
              </tr>
            </thead>
            <tbody>
              {stats.lowStockProducts.map(p => (
                <tr key={p.id} className="low-stock">
                  <td>{p.name}</td>
                  <td>{p.quantity}</td>
                  <td>{p.min_quantity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// Composant Produits
function Products() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: '', description: '', sku: '', category_id: '', 
    quantity: 0, min_quantity: 0, price: 0, cost_price: 0, date_achat: ''
  });

  useEffect(() => {
    loadProducts();
    loadCategories();
  }, []);

  const loadProducts = async (search = '') => {
    const url = search ? `/products?search=${encodeURIComponent(search)}` : '/products';
    const data = await api.get(url);
    setProducts(data);
  };

  const loadCategories = async () => {
    const data = await api.get('/categories');
    setCategories(data);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    loadProducts(searchTerm);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editingProduct) {
      await api.put(`/products/${editingProduct.id}`, formData);
    } else {
      await api.post('/products', formData);
    }
    setShowForm(false);
    setEditingProduct(null);
    setFormData({ name: '', description: '', sku: '', category_id: '', quantity: 0, min_quantity: 0, price: 0, cost_price: 0, date_achat: '' });
    loadProducts(searchTerm);
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      ...product,
      date_achat: product.date_achat || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) {
      await api.delete(`/products/${id}`);
      loadProducts(searchTerm);
    }
  };

  return (
    <div className="products">
      <div className="page-header">
        <h2>Produits</h2>
        <div className="header-actions">
          <form onSubmit={handleSearch} className="search-form">
            <input 
              type="text" 
              placeholder="Rechercher produits..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
            <button type="submit" className="btn-search">🔍</button>
          </form>
          <button className="btn-primary" onClick={() => { setShowForm(true); setEditingProduct(null); setFormData({ name: '', description: '', sku: '', category_id: '', quantity: 0, min_quantity: 0, price: 0, cost_price: 0, date_achat: '' }); }}>
            + Ajouter un Produit
          </button>
        </div>
      </div>

      {showForm && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>{editingProduct ? 'Modifier le Produit' : 'Ajouter un Produit'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Nom</label>
                  <input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label>Référence (SKU)</label>
                  <input value={formData.sku} onChange={e => setFormData({...formData, sku: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Catégorie</label>
                  <select value={formData.category_id} onChange={e => setFormData({...formData, category_id: e.target.value})}>
                    <option value="">Sélectionner une Catégorie</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Quantité</label>
                  <input type="number" value={formData.quantity} onChange={e => setFormData({...formData, quantity: parseInt(e.target.value) || 0})} />
                </div>
                <div className="form-group">
                  <label>Quantité Minimum</label>
                  <input type="number" value={formData.min_quantity} onChange={e => setFormData({...formData, min_quantity: parseInt(e.target.value) || 0})} />
                </div>
                <div className="form-group">
                  <label>Prix de Vente</label>
                  <input type="number" step="0.01" value={formData.price} onChange={e => setFormData({...formData, price: parseFloat(e.target.value) || 0})} />
                </div>
                <div className="form-group">
                  <label>Prix d'Achat</label>
                  <input type="number" step="0.01" value={formData.cost_price} onChange={e => setFormData({...formData, cost_price: parseFloat(e.target.value) || 0})} />
                </div>
                <div className="form-group">
                  <label>Date d'Achat</label>
                  <input type="date" value={formData.date_achat} onChange={e => setFormData({...formData, date_achat: e.target.value})} />
                </div>
                <div className="form-group full-width">
                  <label>Description</label>
                  <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                </div>
              </div>
              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Annuler</button>
                <button type="submit" className="btn-primary">{editingProduct ? 'Mettre à Jour' : 'Créer'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <table className="data-table">
        <thead>
          <tr>
            <th>Nom</th>
            <th>Référence</th>
            <th>Catégorie</th>
            <th>Quantité</th>
            <th>Prix</th>
            <th>Date d'Achat</th>
            <th>Valeur</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {products.map(product => (
            <tr key={product.id} className={product.quantity <= product.min_quantity ? 'low-stock' : ''}>
              <td>{product.name}</td>
              <td>{product.sku}</td>
              <td>{product.category_name}</td>
              <td>{product.quantity}</td>
              <td>{product.price.toFixed(2)} DT</td>
              <td>{product.date_achat ? new Date(product.date_achat).toLocaleDateString('fr-FR') : '-'}</td>
              <td>{(product.quantity * product.price).toFixed(2)} DT</td>
              <td>
                <button className="btn-icon" onClick={() => handleEdit(product)}>✏️</button>
                <button className="btn-icon" onClick={() => handleDelete(product.id)}>🗑️</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Composant Catégories
function Categories() {
  const [categories, setCategories] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '' });

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    const data = await api.get('/categories');
    setCategories(data);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editingCategory) {
      await api.put(`/categories/${editingCategory.id}`, formData);
    } else {
      await api.post('/categories', formData);
    }
    setShowForm(false);
    setEditingCategory(null);
    setFormData({ name: '', description: '' });
    loadCategories();
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setFormData(category);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette catégorie ?')) {
      await api.delete(`/categories/${id}`);
      loadCategories();
    }
  };

  return (
    <div className="categories">
      <div className="page-header">
        <h2>Catégories</h2>
        <button className="btn-primary" onClick={() => { setShowForm(true); setEditingCategory(null); setFormData({ name: '', description: '' }); }}>
          + Ajouter une Catégorie
        </button>
      </div>

      {showForm && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>{editingCategory ? 'Modifier la Catégorie' : 'Ajouter une Catégorie'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Nom</label>
                <input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
              </div>
              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Annuler</button>
                <button type="submit" className="btn-primary">{editingCategory ? 'Mettre à Jour' : 'Créer'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <table className="data-table">
        <thead>
          <tr>
            <th>Nom</th>
            <th>Description</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {categories.map(category => (
            <tr key={category.id}>
              <td>{category.name}</td>
              <td>{category.description}</td>
              <td>
                <button className="btn-icon" onClick={() => handleEdit(category)}>✏️</button>
                <button className="btn-icon" onClick={() => handleDelete(category.id)}>🗑️</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Composant Fournisseurs
function Suppliers() {
  const [suppliers, setSuppliers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [formData, setFormData] = useState({ name: '', contact_person: '', email: '', phone: '', address: '' });

  useEffect(() => {
    loadSuppliers();
  }, []);

  const loadSuppliers = async () => {
    const data = await api.get('/suppliers');
    setSuppliers(data);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editingSupplier) {
      await api.put(`/suppliers/${editingSupplier.id}`, formData);
    } else {
      await api.post('/suppliers', formData);
    }
    setShowForm(false);
    setEditingSupplier(null);
    setFormData({ name: '', contact_person: '', email: '', phone: '', address: '' });
    loadSuppliers();
  };

  const handleEdit = (supplier) => {
    setEditingSupplier(supplier);
    setFormData(supplier);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce fournisseur ?')) {
      await api.delete(`/suppliers/${id}`);
      loadSuppliers();
    }
  };

  return (
    <div className="suppliers">
      <div className="page-header">
        <h2>Fournisseurs</h2>
        <button className="btn-primary" onClick={() => { setShowForm(true); setEditingSupplier(null); setFormData({ name: '', contact_person: '', email: '', phone: '', address: '' }); }}>
          + Ajouter un Fournisseur
        </button>
      </div>

      {showForm && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>{editingSupplier ? 'Modifier le Fournisseur' : 'Ajouter un Fournisseur'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Nom</label>
                  <input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label>Personne de Contact</label>
                  <input value={formData.contact_person} onChange={e => setFormData({...formData, contact_person: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Téléphone</label>
                  <input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                </div>
                <div className="form-group full-width">
                  <label>Adresse</label>
                  <textarea value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
                </div>
              </div>
              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Annuler</button>
                <button type="submit" className="btn-primary">{editingSupplier ? 'Mettre à Jour' : 'Créer'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <table className="data-table">
        <thead>
          <tr>
            <th>Nom</th>
            <th>Contact</th>
            <th>Email</th>
            <th>Téléphone</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {suppliers.map(supplier => (
            <tr key={supplier.id}>
              <td>{supplier.name}</td>
              <td>{supplier.contact_person}</td>
              <td>{supplier.email}</td>
              <td>{supplier.phone}</td>
              <td>
                <button className="btn-icon" onClick={() => handleEdit(supplier)}>✏️</button>
                <button className="btn-icon" onClick={() => handleDelete(supplier.id)}>🗑️</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Composant Mouvements de Stock
function StockMovements() {
  const [movements, setMovements] = useState([]);
  const [products, setProducts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingMovement, setEditingMovement] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({ product_id: '', type: 'in', quantity: 0, reason: '', reference: '', date_mouvement: '' });

  useEffect(() => {
    loadMovements();
    loadProducts();
  }, []);

  const loadMovements = async (search = '') => {
    const url = search ? `/movements?search=${encodeURIComponent(search)}` : '/movements';
    const data = await api.get(url);
    setMovements(data);
  };

  const loadProducts = async () => {
    const data = await api.get('/products');
    setProducts(data);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    loadMovements(searchTerm);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editingMovement) {
      await api.put(`/movements/${editingMovement.id}`, formData);
    } else {
      await api.post('/movements', formData);
    }
    setShowForm(false);
    setEditingMovement(null);
    setFormData({ product_id: '', type: 'in', quantity: 0, reason: '', reference: '', date_mouvement: '' });
    loadMovements(searchTerm);
    loadProducts();
  };

  const handleEdit = (movement) => {
    setEditingMovement(movement);
    setFormData({
      product_id: movement.product_id,
      type: movement.type,
      quantity: movement.quantity,
      reason: movement.reason || '',
      reference: movement.reference || '',
      date_mouvement: movement.date_mouvement || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce mouvement ? La quantité du produit sera restaurée.')) {
      await api.delete(`/movements/${id}`);
      loadMovements(searchTerm);
      loadProducts();
    }
  };

  return (
    <div className="movements">
      <div className="page-header">
        <h2>Mouvements de Stock</h2>
        <div className="header-actions">
          <form onSubmit={handleSearch} className="search-form">
            <input 
              type="text" 
              placeholder="Rechercher mouvements..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
            <button type="submit" className="btn-search">🔍</button>
          </form>
          <button className="btn-primary" onClick={() => { setShowForm(true); setEditingMovement(null); setFormData({ product_id: '', type: 'in', quantity: 0, reason: '', reference: '', date_mouvement: '' }); }}>
            + Enregistrer un Mouvement
          </button>
        </div>
      </div>

      {showForm && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>{editingMovement ? 'Modifier le Mouvement' : 'Enregistrer un Mouvement de Stock'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Produit</label>
                  <select value={formData.product_id} onChange={e => setFormData({...formData, product_id: e.target.value})} required>
                    <option value="">Sélectionner un Produit</option>
                    {products.map(p => <option key={p.id} value={p.id}>{p.name} (Stock: {p.quantity})</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Type</label>
                  <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
                    <option value="in">Entrée de Stock</option>
                    <option value="out">Sortie de Stock</option>
                    <option value="adjustment">Ajustement</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Quantité</label>
                  <input type="number" min="1" value={formData.quantity} onChange={e => setFormData({...formData, quantity: parseInt(e.target.value) || 0})} required />
                </div>
                <div className="form-group">
                  <label>Référence</label>
                  <input value={formData.reference} onChange={e => setFormData({...formData, reference: e.target.value})} placeholder="N° BC, N° Facture, etc." />
                </div>
                <div className="form-group">
                  <label>Date du Mouvement</label>
                  <input type="date" value={formData.date_mouvement} onChange={e => setFormData({...formData, date_mouvement: e.target.value})} />
                </div>
                <div className="form-group full-width">
                  <label>Motif</label>
                  <textarea value={formData.reason} onChange={e => setFormData({...formData, reason: e.target.value})} />
                </div>
              </div>
              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Annuler</button>
                <button type="submit" className="btn-primary">{editingMovement ? 'Mettre à Jour' : 'Enregistrer'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <table className="data-table">
        <thead>
          <tr>
            <th>Date Mouvement</th>
            <th>Créé le</th>
            <th>Produit</th>
            <th>Type</th>
            <th>Quantité</th>
            <th>Référence</th>
            <th>Motif</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {movements.map(movement => (
            <tr key={movement.id}>
              <td>{movement.date_mouvement ? new Date(movement.date_mouvement).toLocaleDateString('fr-FR') : '-'}</td>
              <td>{new Date(movement.created_at).toLocaleString('fr-FR')}</td>
              <td>{movement.product_name}</td>
              <td><span className={`badge ${movement.type}`}>{translateType(movement.type)}</span></td>
              <td>{movement.quantity}</td>
              <td>{movement.reference}</td>
              <td>{movement.reason}</td>
              <td>
                <button className="btn-icon" onClick={() => handleEdit(movement)} title="Modifier">✏️</button>
                <button className="btn-icon" onClick={() => handleDelete(movement.id)} title="Supprimer">🗑️</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Composant Principal
function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [user, setUser] = useState(null);
  const [authMode, setAuthMode] = useState('login');

  useEffect(() => {
    // Check if user is logged in
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
    setCurrentPage('dashboard');
  };

  // If not logged in, show login/register
  if (!user) {
    if (authMode === 'register') {
      return <Register onRegister={handleLogin} onSwitchToLogin={() => setAuthMode('login')} />;
    }
    return <Login onLogin={handleLogin} onSwitchToRegister={() => setAuthMode('register')} />;
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard': return <Dashboard />;
      case 'products': return <Products />;
      case 'categories': return <Categories />;
      case 'suppliers': return <Suppliers />;
      case 'movements': return <StockMovements />;
      default: return <Dashboard />;
    }
  };

  return (
    <div className="app">
      <nav className="sidebar">
        <div className="logo">
          <h1>📦 Gestion de Stock</h1>
        </div>
        <div className="user-info">
          <span>👤 {user.username}</span>
        </div>
        <ul className="nav-menu">
          <li className={currentPage === 'dashboard' ? 'active' : ''} onClick={() => setCurrentPage('dashboard')}>
            📊 Tableau de Bord
          </li>
          <li className={currentPage === 'products' ? 'active' : ''} onClick={() => setCurrentPage('products')}>
            📦 Produits
          </li>
          <li className={currentPage === 'categories' ? 'active' : ''} onClick={() => setCurrentPage('categories')}>
            🏷️ Catégories
          </li>
          <li className={currentPage === 'suppliers' ? 'active' : ''} onClick={() => setCurrentPage('suppliers')}>
            🏭 Fournisseurs
          </li>
          <li className={currentPage === 'movements' ? 'active' : ''} onClick={() => setCurrentPage('movements')}>
            🔄 Mouvements
          </li>
        </ul>
        <div className="logout-section">
          <button className="btn-logout" onClick={handleLogout}>
            🚪 Déconnexion
          </button>
        </div>
      </nav>
      <main className="main-content">
        {renderPage()}
      </main>
    </div>
  );
}

export default App;