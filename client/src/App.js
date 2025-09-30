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
import StoreManagement from './components/StoreManagement';
import SalesManagement from './components/SalesManagement';
import TableManagement from './components/TableManagement';
import InventoryManage from './components/InventoryManage';
import Pos from './components/Pos';
import Reports from './components/Reports';
import Items from './components/Items';
import Settings from './components/Settings';
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
  const [draftOrders, setDraftOrders] = useState([]); // Draft orders list
  const [showReceipt, setShowReceipt] = useState(false); // Receipt modal state
  const [currentReceipt, setCurrentReceipt] = useState(null); // Current receipt data

  // Invoice Settings State - shared between Settings and OrderPanel
  const [invoiceSettings, setInvoiceSettings] = useState({
    invoicePrefix: 'INV',
    invoiceNumberStart: 1000,
    showTax: true,
    showDiscount: true,
    footerText: 'Thank you for your business!',
    termsAndConditions: 'All sales are final. No returns without receipt.',
    logoPosition: 'top-left',
    multiCurrency: {
      enabled: false,
      primaryCurrency: 'USD',
      secondaryCurrency: 'KHR',
      tertiaryCurrency: '',
      exchangeRates: {
        'USD_TO_KHR': 4100,
        'USD_TO_EUR': 0.85,
        'USD_TO_BDT': 110,
        'USD_TO_INR': 83
      },
      showCurrencyCount: 1
    }
  });

  useEffect(() => {
    // Load invoice settings from localStorage
    const savedInvoiceSettings = localStorage.getItem('invoiceSettings');
    console.log('Loading invoice settings from localStorage:', savedInvoiceSettings);
    if (savedInvoiceSettings) {
      try {
        const parsedSettings = JSON.parse(savedInvoiceSettings);
        console.log('Parsed invoice settings:', parsedSettings);
        setInvoiceSettings(parsedSettings);
      } catch (error) {
        console.error('Error parsing saved invoice settings:', error);
      }
    } else {
      console.log('No saved invoice settings found, using defaults');
    }

    // Load draft orders from localStorage
    const savedDrafts = JSON.parse(localStorage.getItem('orderDrafts') || '[]');
    setDraftOrders(savedDrafts);

    // Initialize data fetching with proper error handling
    const initializeData = async () => {
      try {
        await fetchCategories();
        await fetchProducts();
      } catch (error) {
        console.error('Error during initialization:', error);
      }
    };
    
    initializeData();
  }, []);

  // Save draft orders to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('orderDrafts', JSON.stringify(draftOrders));
  }, [draftOrders]);

  // Save invoice settings to localStorage whenever they change
  useEffect(() => {
    console.log('Saving invoice settings to localStorage:', invoiceSettings);
    localStorage.setItem('invoiceSettings', JSON.stringify(invoiceSettings));
  }, [invoiceSettings]);

  const fetchCategories = async (retryCount = 0) => {
    const maxRetries = 3;
    const retryDelay = 1000; // 1 second
    
    try {
      const response = await axios.get('/api/categories', {
        timeout: 10000 // 10 seconds timeout
      });
      
      if (response.data && Array.isArray(response.data)) {
        setCategories(['Show All', ...response.data.map(cat => cat.name)]);
      } else {
        throw new Error('Invalid categories response format');
      }
    } catch (error) {
      console.error(`Error fetching categories (attempt ${retryCount + 1}):`, error);
      
      // Retry logic for network errors or timeouts
      if (retryCount < maxRetries && 
          (error.code === 'ECONNABORTED' || 
           error.code === 'NETWORK_ERROR' || 
           error.response?.status >= 500)) {
        
        console.log(`Retrying categories in ${retryDelay}ms... (${retryCount + 1}/${maxRetries})`);
        setTimeout(() => {
          fetchCategories(retryCount + 1);
        }, retryDelay * (retryCount + 1)); // Exponential backoff
        return;
      }
      
      // If all retries failed, set default categories
      if (categories.length <= 1) { // Only 'Show All' or empty
        setCategories(['Show All']);
        console.error('Failed to fetch categories after all retries, using defaults');
      }
    }
  };

  const fetchProducts = async (category = null, retryCount = 0) => {
    const maxRetries = 3;
    const retryDelay = 1000; // 1 second
    
    try {
      setLoading(true);
      const params = category && category !== 'Show All' ? { category } : {};
      
      // Add timeout to prevent hanging requests
      const response = await axios.get('/api/products', { 
        params,
        timeout: 10000 // 10 seconds timeout
      });
      
      if (response.data && Array.isArray(response.data)) {
        setProducts(response.data);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error(`Error fetching products (attempt ${retryCount + 1}):`, error);
      
      // Retry logic for network errors or timeouts
      if (retryCount < maxRetries && 
          (error.code === 'ECONNABORTED' || 
           error.code === 'NETWORK_ERROR' || 
           error.response?.status >= 500)) {
        
        console.log(`Retrying in ${retryDelay}ms... (${retryCount + 1}/${maxRetries})`);
        setTimeout(() => {
          fetchProducts(category, retryCount + 1);
        }, retryDelay * (retryCount + 1)); // Exponential backoff
        return;
      }
      
      // If all retries failed or it's a client error, keep existing products if any
      if (products.length === 0) {
        // Only show error if we have no products to display
        console.error('Failed to fetch products after all retries');
      }
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
    if (currentView === 'pos') {
      return <Pos 
        products={products}
        categories={categories}
        onAddToCart={addToCart}
        cart={cart}
        onUpdateItem={updateCartItem}
        onRemoveItem={removeFromCart}
        onClearCart={clearCart}
        invoiceSettings={invoiceSettings}
        draftOrders={draftOrders}
        setDraftOrders={setDraftOrders}
        showReceipt={showReceipt}
        setShowReceipt={setShowReceipt}
        currentReceipt={currentReceipt}
        setCurrentReceipt={setCurrentReceipt}
      />;
    }
    
    if (currentView === 'dashboard') {
      return <Dashboard initialSection="overview" />;
    }
    
    if (currentView === 'item management') {
      return <ItemManagement 
        initialSection="overview" 
        onNavigate={handleNavigation}
        products={products}
        setProducts={setProducts}
        categories={categories.filter(cat => cat !== 'Show All')}
        setCategories={(newCategories) => setCategories(['Show All', ...newCategories])}
      />;
    }
    
    if (currentView === 'inventory manage') {
      return <InventoryManage />;
    }
    
    if (currentView === 'store management') {
      return <StoreManagement />;
    }
    
    if (currentView === 'sales management') {
      return <SalesManagement />;
    }
    
    if (currentView === 'reports') {
      return <Reports />;
    }
    
    if (currentView === 'items') {
      return <Items />;
    }
    
    if (currentView === 'table management') {
      return <TableManagement />;
    }
    
    if (currentView === 'settings') {
      return <Settings 
        invoiceSettings={invoiceSettings}
        setInvoiceSettings={setInvoiceSettings}
      />;
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
            invoiceSettings={invoiceSettings}
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
        <Sidebar onNavigate={handleNavigation} currentView={currentView} />
        <div className="main-content">
          <Header 
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            onRestoreDraft={handleRestoreDraft}
            draftOrders={draftOrders}
            setDraftOrders={setDraftOrders}
          />
          {renderMainContent()}
        </div>
      </div>
    </ThemeProvider>
  );
}

export default App;