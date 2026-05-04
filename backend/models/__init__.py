from datetime import datetime

from extensions import db


PAYMENT_METHOD_LABELS = {
    "debit_card": "Debit Card",
    "credit_card": "Credit Card",
    "vavi_pay": "Vavi Pay",
    "qr_payment": "QR Payment",
}


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(190), nullable=False, unique=True, index=True)
    password = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), nullable=False, default="customer")
    status = db.Column(db.String(20), nullable=False, default="active")
    company_name = db.Column(db.String(160), nullable=True)
    company_phone = db.Column(db.String(40), nullable=True)
    company_address = db.Column(db.Text, nullable=True)
    company_website = db.Column(db.String(255), nullable=True)
    business_description = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

    products = db.relationship("Product", backref="seller", lazy=True, cascade="all, delete-orphan")
    orders = db.relationship("Order", backref="customer", lazy=True, cascade="all, delete-orphan")
    reviews = db.relationship("Review", backref="user", lazy=True, cascade="all, delete-orphan")
    wishlist_items = db.relationship("Wishlist", backref="user", lazy=True, cascade="all, delete-orphan")
    cart = db.relationship("Cart", backref="user", uselist=False, cascade="all, delete-orphan")

    def to_dict(self):
        data = {
            "id": self.id,
            "name": self.name,
            "email": self.email,
            "role": self.role,
            "status": self.status,
            "created_at": self.created_at.isoformat(),
        }
        if self.role == "seller" or any(
            [self.company_name, self.company_phone, self.company_address, self.company_website, self.business_description]
        ):
            data["seller_profile"] = {
                "company_name": self.company_name,
                "company_phone": self.company_phone,
                "company_address": self.company_address,
                "company_website": self.company_website,
                "business_description": self.business_description,
            }
        return data


class Category(db.Model):
    __tablename__ = "categories"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False, unique=True)

    products = db.relationship("Product", backref="category", lazy=True)

    def to_dict(self):
        return {"id": self.id, "name": self.name}


class Product(db.Model):
    __tablename__ = "products"

    id = db.Column(db.Integer, primary_key=True)
    seller_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    name = db.Column(db.String(180), nullable=False, index=True)
    description = db.Column(db.Text, nullable=False)
    price = db.Column(db.Numeric(10, 2), nullable=False)
    stock = db.Column(db.Integer, nullable=False, default=0)
    category_id = db.Column(db.Integer, db.ForeignKey("categories.id"), nullable=False, index=True)
    image_url = db.Column(db.String(500), nullable=True)
    is_deleted = db.Column(db.Boolean, nullable=False, default=False)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

    reviews = db.relationship("Review", backref="product", lazy=True, cascade="all, delete-orphan")
    wishlist_entries = db.relationship("Wishlist", backref="product", lazy=True, cascade="all, delete-orphan")

    def to_dict(self, include_seller=False, include_category=True):
        data = {
            "id": self.id,
            "seller_id": self.seller_id,
            "name": self.name,
            "description": self.description,
            "price": float(self.price),
            "stock": self.stock,
            "category_id": self.category_id,
            "image_url": self.image_url,
            "is_deleted": self.is_deleted,
            "created_at": self.created_at.isoformat(),
            "rating": self.average_rating,
            "reviews_count": len(self.reviews),
        }
        if include_seller:
            data["seller"] = {
                "id": self.seller.id,
                "name": self.seller.name,
                "status": self.seller.status,
            }
        if include_category and self.category:
            data["category"] = self.category.to_dict()
        return data

    @property
    def average_rating(self):
        if not self.reviews:
            return 0
        return round(sum(review.rating for review in self.reviews) / len(self.reviews), 2)


class Cart(db.Model):
    __tablename__ = "cart"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, unique=True)
    items = db.relationship("CartItem", backref="cart", lazy=True, cascade="all, delete-orphan")

    def total_amount(self):
        return round(sum(float(item.product.price) * item.quantity for item in self.items), 2)


class CartItem(db.Model):
    __tablename__ = "cart_items"

    id = db.Column(db.Integer, primary_key=True)
    cart_id = db.Column(db.Integer, db.ForeignKey("cart.id"), nullable=False, index=True)
    product_id = db.Column(db.Integer, db.ForeignKey("products.id"), nullable=False, index=True)
    quantity = db.Column(db.Integer, nullable=False, default=1)

    __table_args__ = (db.UniqueConstraint("cart_id", "product_id", name="uq_cart_product"),)

    product = db.relationship("Product")

    def to_dict(self):
        return {
            "id": self.id,
            "cart_id": self.cart_id,
            "product_id": self.product_id,
            "quantity": self.quantity,
            "product": self.product.to_dict(include_seller=True),
            "line_total": round(float(self.product.price) * self.quantity, 2),
        }


class Order(db.Model):
    __tablename__ = "orders"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    total_amount = db.Column(db.Numeric(10, 2), nullable=False)
    status = db.Column(db.String(30), nullable=False, default="placed")
    shipping_address = db.Column(db.Text, nullable=True)
    contact_phone = db.Column(db.String(40), nullable=True)
    payment_method = db.Column(db.String(40), nullable=False, default="qr_payment")
    payment_reference = db.Column(db.String(80), nullable=True)
    payment_qr_payload = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

    items = db.relationship("OrderItem", backref="order", lazy=True, cascade="all, delete-orphan")

    def to_dict(self, include_items=True):
        data = {
            "id": self.id,
            "user_id": self.user_id,
            "customer_name": self.customer.name if self.customer else None,
            "total_amount": float(self.total_amount),
            "status": self.status,
            "shipping_address": self.shipping_address,
            "contact_phone": self.contact_phone,
            "payment_method": self.payment_method,
            "payment_method_label": PAYMENT_METHOD_LABELS.get(self.payment_method, self.payment_method),
            "payment_reference": self.payment_reference,
            "payment_qr_payload": self.payment_qr_payload,
            "created_at": self.created_at.isoformat(),
        }
        if include_items:
            data["items"] = [item.to_dict() for item in self.items]
        return data


class OrderItem(db.Model):
    __tablename__ = "order_items"

    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey("orders.id"), nullable=False, index=True)
    product_id = db.Column(db.Integer, db.ForeignKey("products.id"), nullable=False, index=True)
    quantity = db.Column(db.Integer, nullable=False)
    price = db.Column(db.Numeric(10, 2), nullable=False)

    product = db.relationship("Product")

    def to_dict(self):
        return {
            "id": self.id,
            "order_id": self.order_id,
            "product_id": self.product_id,
            "quantity": self.quantity,
            "price": float(self.price),
            "product_name": self.product.name if self.product else None,
            "product_image": self.product.image_url if self.product else None,
            "seller_id": self.product.seller_id if self.product else None,
        }


class Review(db.Model):
    __tablename__ = "reviews"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    product_id = db.Column(db.Integer, db.ForeignKey("products.id"), nullable=False, index=True)
    rating = db.Column(db.Integer, nullable=False)
    comment = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

    __table_args__ = (db.UniqueConstraint("user_id", "product_id", name="uq_user_product_review"),)

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "user_name": self.user.name if self.user else None,
            "product_id": self.product_id,
            "rating": self.rating,
            "comment": self.comment,
            "created_at": self.created_at.isoformat(),
        }


class Wishlist(db.Model):
    __tablename__ = "wishlist"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    product_id = db.Column(db.Integer, db.ForeignKey("products.id"), nullable=False, index=True)

    __table_args__ = (db.UniqueConstraint("user_id", "product_id", name="uq_user_product_wishlist"),)

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "product_id": self.product_id,
            "product": self.product.to_dict(include_seller=True),
        }

