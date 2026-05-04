from datetime import datetime, timedelta

from app import create_app
from extensions import bcrypt, db
from models import Cart, Category, Order, OrderItem, Product, Review, User, Wishlist


app = create_app()


def seed():
    with app.app_context():
        db.drop_all()
        db.create_all()

        admin = User(
            name="Platform Admin",
            email="admin@example.com",
            password=bcrypt.generate_password_hash("Admin@123").decode("utf-8"),
            role="admin",
            status="active",
        )

        seller_1 = User(
            name="Tech Seller",
            email="seller1@example.com",
            password=bcrypt.generate_password_hash("Seller@123").decode("utf-8"),
            role="seller",
            status="active",
            company_name="TechNova Gadgets Pvt. Ltd.",
            company_phone="+91 98765 43210",
            company_address="12 Innovation Park, Bengaluru, Karnataka",
            company_website="https://technova.example.com",
            business_description="Consumer electronics seller focused on accessories, audio devices, and smart gadgets.",
        )
        seller_2 = User(
            name="Fashion Seller",
            email="seller2@example.com",
            password=bcrypt.generate_password_hash("Seller@123").decode("utf-8"),
            role="seller",
            status="pending",
            company_name="Urban Loom Fashions",
            company_phone="+91 91234 56789",
            company_address="55 Market Road, Jaipur, Rajasthan",
            company_website="https://urbanloom.example.com",
            business_description="Independent apparel label selling premium casualwear and seasonal fashion collections.",
        )

        customer_1 = User(
            name="Alice Customer",
            email="alice@example.com",
            password=bcrypt.generate_password_hash("Customer@123").decode("utf-8"),
            role="customer",
            status="active",
        )
        customer_2 = User(
            name="Bob Customer",
            email="bob@example.com",
            password=bcrypt.generate_password_hash("Customer@123").decode("utf-8"),
            role="customer",
            status="active",
        )

        db.session.add_all([admin, seller_1, seller_2, customer_1, customer_2])
        db.session.flush()

        carts = [Cart(user_id=customer_1.id), Cart(user_id=customer_2.id), Cart(user_id=seller_1.id), Cart(user_id=seller_2.id)]
        db.session.add_all(carts)

        categories = [
            Category(name="Electronics"),
            Category(name="Fashion"),
            Category(name="Books"),
            Category(name="Home & Kitchen"),
        ]
        db.session.add_all(categories)
        db.session.flush()

        products = [
            Product(
                seller_id=seller_1.id,
                name="Wireless Noise Cancelling Headphones",
                description="Bluetooth headphones with ANC and 40-hour battery life.",
                price=8999,
                stock=32,
                category_id=categories[0].id,
                image_url="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1200",
            ),
            Product(
                seller_id=seller_1.id,
                name="Mechanical RGB Keyboard",
                description="Compact mechanical keyboard with hot-swappable switches.",
                price=4599,
                stock=20,
                category_id=categories[0].id,
                image_url="https://images.unsplash.com/photo-1517336714739-489689fd1ca8?w=1200",
            ),
            Product(
                seller_id=seller_1.id,
                name="Smart Fitness Band",
                description="Fitness tracker with heart-rate and sleep monitoring.",
                price=2999,
                stock=50,
                category_id=categories[0].id,
                image_url="https://images.unsplash.com/photo-1575311373937-040b8e1fd6b6?w=1200",
            ),
            Product(
                seller_id=seller_1.id,
                name="Portable Bluetooth Speaker",
                description="Water-resistant speaker with deep bass and clear vocals.",
                price=2499,
                stock=40,
                category_id=categories[0].id,
                image_url="https://images.unsplash.com/photo-1589492477829-5e65395b66cc?w=1200",
            ),
            Product(
                seller_id=seller_2.id,
                name="Classic Denim Jacket",
                description="Slim-fit unisex denim jacket with premium stitching.",
                price=1999,
                stock=15,
                category_id=categories[1].id,
                image_url="https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=1200",
            ),
            Product(
                seller_id=seller_2.id,
                name="Cotton Graphic T-Shirt",
                description="Breathable cotton t-shirt with premium print quality.",
                price=799,
                stock=80,
                category_id=categories[1].id,
                image_url="https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=1200",
            ),
        ]
        db.session.add_all(products)
        db.session.flush()

        order_1 = Order(
            user_id=customer_1.id,
            total_amount=13598,
            status="delivered",
            created_at=datetime.utcnow() - timedelta(days=8),
        )
        db.session.add(order_1)
        db.session.flush()

        order_items = [
            OrderItem(order_id=order_1.id, product_id=products[0].id, quantity=1, price=8999),
            OrderItem(order_id=order_1.id, product_id=products[1].id, quantity=1, price=4599),
        ]
        db.session.add_all(order_items)

        review_1 = Review(
            user_id=customer_1.id,
            product_id=products[0].id,
            rating=5,
            comment="Excellent sound quality and battery life.",
        )
        review_2 = Review(
            user_id=customer_2.id,
            product_id=products[1].id,
            rating=4,
            comment="Great typing feel for coding.",
        )
        db.session.add_all([review_1, review_2])

        wishlists = [
            Wishlist(user_id=customer_1.id, product_id=products[2].id),
            Wishlist(user_id=customer_1.id, product_id=products[3].id),
            Wishlist(user_id=customer_2.id, product_id=products[0].id),
        ]
        db.session.add_all(wishlists)

        db.session.commit()

        print("Seed complete.")
        print("Admin: admin@example.com / Admin@123")
        print("Seller(active): seller1@example.com / Seller@123")
        print("Seller(pending): seller2@example.com / Seller@123")
        print("Customer: alice@example.com / Customer@123")


if __name__ == "__main__":
    seed()

