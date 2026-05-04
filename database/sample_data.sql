-- Optional sample data import
-- NOTE: For fully working login credentials with valid bcrypt hashes,
-- run backend/seed.py instead of this file.

INSERT INTO users (name, email, password, role, status) VALUES
('Platform Admin', 'admin@example.com', 'bcrypt_hash_placeholder', 'admin', 'active'),
('Tech Seller', 'seller1@example.com', 'bcrypt_hash_placeholder', 'seller', 'active'),
('Fashion Seller', 'seller2@example.com', 'bcrypt_hash_placeholder', 'seller', 'pending'),
('Alice Customer', 'alice@example.com', 'bcrypt_hash_placeholder', 'customer', 'active');

INSERT INTO cart (user_id) VALUES (1), (2), (3), (4);

INSERT INTO products (seller_id, name, description, price, stock, category_id, image_url) VALUES
(2, 'Wireless Noise Cancelling Headphones', 'Bluetooth headphones with ANC and 40-hour battery life.', 8999.00, 32, 1, 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1200'),
(2, 'Mechanical RGB Keyboard', 'Compact mechanical keyboard with hot-swappable switches.', 4599.00, 20, 1, 'https://images.unsplash.com/photo-1517336714739-489689fd1ca8?w=1200'),
(3, 'Classic Denim Jacket', 'Slim-fit unisex denim jacket with premium stitching.', 1999.00, 15, 2, 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=1200');

INSERT INTO orders (user_id, total_amount, status) VALUES
(4, 13598.00, 'delivered');

INSERT INTO order_items (order_id, product_id, quantity, price) VALUES
(1, 1, 1, 8999.00),
(1, 2, 1, 4599.00);

INSERT INTO reviews (user_id, product_id, rating, comment) VALUES
(4, 1, 5, 'Excellent sound quality and battery life.');

INSERT INTO wishlist (user_id, product_id) VALUES
(4, 2);
