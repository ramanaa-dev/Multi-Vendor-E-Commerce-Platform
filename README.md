# Multi-Vendor E-Commerce Platform

Production-style full-stack web application with role-based dashboards for **Admin**, **Seller**, and **Customer**.

## Tech Stack

### Frontend
- React.js (Vite)
- React Router DOM
- Axios
- Tailwind CSS
- Recharts
- React Hot Toast

### Backend
- Python Flask
- Flask SQLAlchemy (ORM)
- Flask JWT Extended (Authentication)
- Flask Bcrypt (Password Hashing)
- Flask CORS

### Database
- MySQL

## Features

### Authentication
- Register (Customer and Seller)
- Login with JWT tokens
- Password hashing with bcrypt
- Role-based authorization
- Logout endpoint

### Customer
- Browse products
- Search, sort, and filter
- Product details page
- Add/update/remove cart items
- Checkout and place order
- Order history with status tracking
- Wishlist management
- Profile management
- Product reviews and ratings

### Seller
- Seller dashboard stats
- Add/edit/delete products
- Product image upload (URL or file upload)
- Inventory management
- View seller-specific orders
- Update order status
- Sales analytics and monthly revenue chart

### Admin
- Admin dashboard stats
- Approve sellers
- Manage users (block/unblock)
- Manage products
- Manage categories
- View all orders
- Revenue analytics
- CSV report export (users/products/orders)

## Project Structure

```text
backend/
  app.py
  config.py
  extensions.py
  requirements.txt
  seed.py
  .env.example
  models/
  routes/
  services/
  utils/
  uploads/

frontend/
  package.json
  vite.config.js
  postcss.config.js
  tailwind.config.js
  .env.example
  src/
    App.jsx
    main.jsx
    components/
    context/
    pages/
    services/

database/
  schema.sql
  sample_data.sql
```

## Quick Run (From Main Folder)

Run everything directly from the project root (no need to go inside `backend/` or `frontend/`):

```bash
setup.bat
run-project.bat
```

Useful shortcuts:

```bash
run-backend.bat
seed-data.bat
python backend_main.py
```

If MySQL is not configured yet, you can run locally with SQLite by setting:

```bash
DATABASE_URL=sqlite:///local.db
```

## Setup Instructions

## 1) Clone / Open Project

Use the existing project folder:

```bash
c:\FINAL YEAR MCA PROJECT\DEMO 1
```

## 2) MySQL Database Setup

1. Create a MySQL database named `multivendor_db`.
2. Run schema:

```bash
mysql -u root -p multivendor_db < database/schema.sql
```

Optional sample SQL (non-login placeholders):

```bash
mysql -u root -p multivendor_db < database/sample_data.sql
```

Recommended sample data with valid bcrypt hashes:

```bash
cd backend
python seed.py
```

## 3) Backend Setup

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
```

Edit `.env` and update `DATABASE_URL` as needed.

Start backend:

```bash
python app.py
```

Backend runs at: `http://localhost:5000`

## 4) Frontend Setup

```bash
cd frontend
npm install
copy .env.example .env
npm run dev
```

Frontend runs at: `http://localhost:5173`

## 5) Production Build (Frontend)

```bash
cd frontend
npm run build
npm run preview
```

## API Base URL

Frontend uses:

- `VITE_API_URL=http://localhost:5000/api`

## Default Seed Credentials (from `backend/seed.py`)

- Admin: `admin@example.com` / `Admin@123`
- Seller (approved): `seller1@example.com` / `Seller@123`
- Seller (pending): `seller2@example.com` / `Seller@123`
- Customer: `alice@example.com` / `Customer@123`

## API Route Map (Main)

### Auth
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/auth/logout`

### Products + Categories
- `GET /api/products`
- `GET /api/products/:id`
- `GET /api/products/:id/reviews`
- `GET /api/categories`

### Cart
- `GET /api/cart`
- `POST /api/cart/add`
- `POST /api/cart/remove`
- `PUT /api/cart/item/:item_id`
- `DELETE /api/cart/item/:item_id`
- `DELETE /api/cart/clear`

### Orders
- `POST /api/orders/create`
- `GET /api/orders/history`
- `GET /api/orders/:order_id`

### Customer
- `GET /api/customer/dashboard`
- `GET /api/customer/profile`
- `PUT /api/customer/profile`
- `GET /api/customer/wishlist`
- `POST /api/customer/wishlist/add`
- `DELETE /api/customer/wishlist/:product_id`
- `POST /api/customer/reviews`
- `DELETE /api/customer/reviews/:review_id`

### Seller
- `GET /api/seller/dashboard`
- `GET /api/seller/analytics`
- `GET /api/seller/products`
- `POST /api/seller/products`
- `PUT /api/seller/products/:id`
- `DELETE /api/seller/products/:id`
- `GET /api/seller/orders`
- `PUT /api/seller/orders/:order_id/status`

### Admin
- `GET /api/admin/dashboard`
- `GET /api/admin/users`
- `PUT /api/admin/users/:id/status`
- `PUT /api/admin/sellers/:id/approve`
- `GET /api/admin/products`
- `DELETE /api/admin/products/:id`
- `GET /api/admin/orders`
- `GET /api/admin/categories`
- `POST /api/admin/categories`
- `PUT /api/admin/categories/:id`
- `DELETE /api/admin/categories/:id`
- `GET /api/admin/reports/export?type=users|products|orders`

## Notes

- JWT token is stored in browser `localStorage` as `access_token`.
- Uploaded images are served by backend from `/api/uploads/<filename>`.
- Seller accounts must be approved by admin before seller login is allowed.
- Frontend has responsive UI, protected routes, role-based navigation, dashboard sidebars, charts, toasts, and dark/light mode.

## Suggested Improvements (Optional)

- Add refresh tokens + token revocation list.
- Add item-level order status for multi-seller orders.
- Add server-side request validation with marshmallow/pydantic.
- Add unit/integration tests with pytest + React Testing Library.
- Add Docker Compose for one-command deployment.
