import React, { useState, useEffect } from 'react';
import './App.css';
import './theme.css';
import { ThemeProvider } from './contexts/ThemeContext';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import ProductGrid from './components/ProductGrid';
import OrderPanel from './components/OrderPanel';
import Dashboard from './components/Dashboard';
import ItemManagement from './components/ItemManagement';
import axios from 'axios';

function App() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('Show All');
  const [cart, setCart] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [draftState, setDraftState] = useState(null); // For restoring draft state
  const [currentView, setCurrentView] = useState('pos'); // Navigation state

  useEffect(() => {
    fetchCategories();
    fetchProducts();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await axios.get('/api/categories');
      setCategories(['Show All', ...response.data.map(cat => cat.name)]);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchProducts = async (category = null) => {
    try {
      setLoading(true);
      const params = category && category !== 'Show All' ? { category } : {};
      const response = await axios.get('/api/products', { params });
      setProducts(response.data);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    fetchProducts(category);
  };

  const addToCart = (product) => {
    const existingItem = cart.find(item => item.id === product.id);
    if (existingItem) {
      setCart(cart.map(item =>
        item.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  };

  const updateCartItem = (productId, quantity) => {
    if (quantity <= 0) {
      setCart(cart.filter(item => item.id !== productId));
    } else {
      setCart(cart.map(item =>
        item.id === productId
          ? { ...item, quantity }
          : item
      ));
    }
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
  };

  const handleRestoreDraft = (draft) => {
    // Restore cart items
    if (draft.cart && Array.isArray(draft.cart)) {
      setCart(draft.cart);
    }
    
    // Store draft state for OrderPanel to restore dining/table selections
    setDraftState({
      dining: draft.dining || '',
      table: draft.table || '',
      extraDiscount: draft.extraDiscount || 0,
      couponDiscount: draft.couponDiscount || 0,
      orderNotes: draft.orderNotes || {}
    });
  };

  const handleNavigation = (view) => {
    setCurrentView(view);
  };

  const renderMainContent = () => {
    if (currentView === 'dashboard') {
      return <Dashboard initialSection="overview" />;
    }
    
    if (currentView === 'item management') {
      return <ItemManagement initialSection="overview" onNavigate={handleNavigation} />;
    }
    
    // Default POS view
    return (
      <div className="content-area">
        <div className="products-section">
          <ProductGrid
            products={filteredProducts}
            categories={categories}
            selectedCategory={selectedCategory}
            onCategoryChange={handleCategoryChange}
            onAddToCart={addToCart}
            loading={loading}
          />
        </div>
        <div className="order-section">
          <OrderPanel
            cart={cart}
            onUpdateItem={updateCartItem}
            onRemoveItem={removeFromCart}
            onClearCart={clearCart}
            draftState={draftState}
            onDraftStateUsed={() => setDraftState(null)}
          />
        </div>
      </div>
    );
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <ThemeProvider>
      <div className="app">
        <Sidebar onNavigate={handleNavigation} />
        <div className="main-content">
          <Header 
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            onRestoreDraft={handleRestoreDraft}
          />
          {renderMainContent()}
        </div>
      </div>
    </ThemeProvider>
  );
}

export default App;