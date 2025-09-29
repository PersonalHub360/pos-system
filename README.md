# RestroBit POS System

A modern Point of Sale system with separate client and server components.

## Project Structure

```
pos-system/
├── client/           # React frontend application
├── server/           # Node.js/Express API server
└── README.md         # This file
```

## Features

- Product management with categories (Rice, Beverages, Salads, Soup, Pizza)
- Order management and cart functionality
- Real-time order tracking
- Modern responsive UI matching RestroBit design
- RESTful API architecture
- Order calculations with discounts

## Setup Instructions

### Server Setup
1. Navigate to the server directory: `cd server`
2. Install dependencies: `npm install`
3. Start the server: `npm run dev`
4. Server will run on http://localhost:5000

### Client Setup
1. Navigate to the client directory: `cd client`
2. Install dependencies: `npm install`
3. Start the development server: `npm start`
4. Application will run on http://localhost:3000

## Technology Stack

### Server
- Node.js
- Express.js
- SQLite (for simplicity)
- CORS enabled for client communication

### Client
- React 18
- Modern CSS with Flexbox/Grid
- Responsive design
- Component-based architecture

## API Endpoints

- `GET /api/products` - Get all products
- `GET /api/categories` - Get all categories
- `POST /api/orders` - Create new order
- `GET /api/orders` - Get all orders
- `PUT /api/orders/:id` - Update order status