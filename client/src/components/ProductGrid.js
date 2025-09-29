import React from 'react';
import './ProductGrid.css';

const ProductGrid = ({ 
  products, 
  categories, 
  selectedCategory, 
  onCategoryChange, 
  onAddToCart, 
  loading 
}) => {
  const generateProductImage = (productName) => {
    // Create a simple SVG placeholder for each product
    const colors = ['#852FEE', '#4caf50', '#2196f3', '#f44336', '#9c27b0'];
    const colorIndex = productName.length % colors.length;
    const color = colors[colorIndex];
    
    return `data:image/svg+xml,${encodeURIComponent(`
      <svg width="120" height="120" xmlns="http://www.w3.org/2000/svg">
        <rect width="120" height="120" fill="${color}" rx="8"/>
        <text x="60" y="60" text-anchor="middle" dy="0.3em" fill="white" font-family="Arial" font-size="12" font-weight="bold">
          ${productName.split(' ').map(word => word[0]).join('').substring(0, 3)}
        </text>
      </svg>
    `)}`;
  };

  if (loading) {
    return (
      <div className="product-grid-container">
        <div className="category-filters">
          {categories.map((category) => (
          <button
            key={category}
            className={`category-btn ${selectedCategory === category ? 'active' : ''}`}
            onClick={() => onCategoryChange(category)}
            data-category={category}
          >
            {category}
          </button>
        ))}
        </div>
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="product-grid-container">
      <div className="category-filters">
        {categories.map((category) => (
          <button
            key={category}
            className={`category-btn ${selectedCategory === category ? 'active' : ''}`}
            onClick={() => onCategoryChange(category)}
            data-category={category}
          >
            {category}
          </button>
        ))}
      </div>
      
      <div className="product-grid">
        {products.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📦</div>
            <p>No products found</p>
            <button 
              className="retry-btn" 
              onClick={() => window.location.reload()}
            >
              Refresh Products
            </button>
          </div>
        ) : (
          products.map((product) => (
            <div key={product.id} className="product-card" onClick={() => onAddToCart(product)}>
              <div className="product-image">
                <img 
                  src={product.image_url || generateProductImage(product.name)} 
                  alt={product.name}
                  onError={(e) => {
                    e.target.src = generateProductImage(product.name);
                  }}
                />
                {product.category_name === 'Fresh Basil Salad' && (
                  <div className="product-badge">🔥</div>
                )}
              </div>
              <div className="product-info">
                <h3 className="product-name">{product.name}</h3>
                <p className="product-price">${product.price.toFixed(2)}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ProductGrid;