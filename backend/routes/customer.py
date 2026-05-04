from flask import Blueprint, request

from extensions import db
from models import Order, Product, Review, User, Wishlist
from utils.decorators import current_user_id, role_required
from utils.responses import error_response, success_response
from utils.validators import require_fields, validate_email


customer_bp = Blueprint("customer", __name__)


@customer_bp.get("/dashboard")
@role_required("customer")
def customer_dashboard():
    user_id = current_user_id()

    orders = Order.query.filter_by(user_id=user_id).order_by(Order.created_at.desc()).limit(5).all()
    all_orders = Order.query.filter_by(user_id=user_id).all()
    wishlist_count = Wishlist.query.filter_by(user_id=user_id).count()

    return success_response(
        {
            "orders_count": len(all_orders),
            "total_spent": round(sum(float(order.total_amount) for order in all_orders), 2),
            "wishlist_count": wishlist_count,
            "recent_orders": [order.to_dict() for order in orders],
        }
    )


@customer_bp.get("/profile")
@role_required("customer", "seller", "admin", allow_pending=True)
def profile():
    user = User.query.get(current_user_id())
    if not user:
        return error_response("User not found", 404)
    return success_response(user.to_dict())


@customer_bp.put("/profile")
@role_required("customer", "seller", "admin", allow_pending=True)
def update_profile():
    user = User.query.get(current_user_id())
    if not user:
        return error_response("User not found", 404)

    payload = request.get_json(silent=True) or {}
    name = payload.get("name", "").strip()
    email = payload.get("email", "").strip().lower()

    if not name:
        return error_response("Name is required", 400)

    if not validate_email(email):
        return error_response("Invalid email", 400)

    existing = User.query.filter(User.email == email, User.id != user.id).first()
    if existing:
        return error_response("Email already in use", 409)

    user.name = name
    user.email = email

    db.session.commit()

    return success_response(user.to_dict(), "Profile updated")


@customer_bp.get("/wishlist")
@role_required("customer")
def wishlist():
    user_id = current_user_id()
    items = Wishlist.query.filter_by(user_id=user_id).all()
    return success_response([item.to_dict() for item in items])


@customer_bp.post("/wishlist/add")
@role_required("customer")
def add_wishlist():
    user_id = current_user_id()
    payload = request.get_json(silent=True) or {}

    missing = require_fields(payload, ["product_id"])
    if missing:
        return error_response("Missing required fields", 400, {"missing": missing})

    product_id = int(payload.get("product_id"))
    product = Product.query.get(product_id)
    if not product:
        return error_response("Product not found", 404)

    existing = Wishlist.query.filter_by(user_id=user_id, product_id=product_id).first()
    if existing:
        return error_response("Product already in wishlist", 409)

    entry = Wishlist(user_id=user_id, product_id=product_id)
    db.session.add(entry)
    db.session.commit()

    return success_response(entry.to_dict(), "Added to wishlist", 201)


@customer_bp.delete("/wishlist/<int:product_id>")
@role_required("customer")
def remove_wishlist(product_id):
    user_id = current_user_id()
    entry = Wishlist.query.filter_by(user_id=user_id, product_id=product_id).first()
    if not entry:
        return error_response("Wishlist item not found", 404)

    db.session.delete(entry)
    db.session.commit()
    return success_response(message="Removed from wishlist")


@customer_bp.post("/reviews")
@role_required("customer")
def add_review():
    user_id = current_user_id()
    payload = request.get_json(silent=True) or {}

    missing = require_fields(payload, ["product_id", "rating", "comment"])
    if missing:
        return error_response("Missing required fields", 400, {"missing": missing})

    product_id = int(payload.get("product_id"))
    rating = int(payload.get("rating"))
    comment = payload.get("comment", "").strip()

    if rating < 1 or rating > 5:
        return error_response("Rating must be between 1 and 5", 400)

    product = Product.query.get(product_id)
    if not product:
        return error_response("Product not found", 404)

    existing = Review.query.filter_by(user_id=user_id, product_id=product_id).first()
    if existing:
        existing.rating = rating
        existing.comment = comment
        db.session.commit()
        return success_response(existing.to_dict(), "Review updated")

    review = Review(user_id=user_id, product_id=product_id, rating=rating, comment=comment)
    db.session.add(review)
    db.session.commit()

    return success_response(review.to_dict(), "Review added", 201)


@customer_bp.delete("/reviews/<int:review_id>")
@role_required("customer")
def delete_review(review_id):
    user_id = current_user_id()
    review = Review.query.filter_by(id=review_id, user_id=user_id).first()
    if not review:
        return error_response("Review not found", 404)

    db.session.delete(review)
    db.session.commit()

    return success_response(message="Review deleted")

