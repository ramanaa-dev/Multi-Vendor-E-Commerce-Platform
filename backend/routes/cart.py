from flask import Blueprint, request

from extensions import db
from models import Cart, CartItem, Product
from utils.decorators import current_user_id, role_required
from utils.responses import error_response, success_response
from utils.validators import require_fields


cart_bp = Blueprint("cart", __name__)


def get_or_create_cart(user_id):
    cart = Cart.query.filter_by(user_id=user_id).first()
    if not cart:
        cart = Cart(user_id=user_id)
        db.session.add(cart)
        db.session.flush()
    return cart


def prune_unavailable_items(cart):
    removed = False
    for item in list(cart.items):
        if not item.product or item.product.is_deleted:
            db.session.delete(item)
            removed = True
    return removed


@cart_bp.get("")
@role_required("customer")
def get_cart():
    user_id = current_user_id()
    cart = get_or_create_cart(user_id)
    prune_unavailable_items(cart)
    db.session.commit()

    items = [item.to_dict() for item in cart.items]
    return success_response(
        {
            "cart_id": cart.id,
            "items": items,
            "total_amount": cart.total_amount(),
        }
    )


@cart_bp.post("/add")
@role_required("customer")
def add_to_cart():
    user_id = current_user_id()
    payload = request.get_json(silent=True) or {}

    missing = require_fields(payload, ["product_id", "quantity"])
    if missing:
        return error_response("Missing required fields", 400, {"missing": missing})

    product_id = int(payload.get("product_id"))
    quantity = int(payload.get("quantity", 1))

    if quantity < 1:
        return error_response("Quantity must be at least 1", 400)

    product = Product.query.get(product_id)
    if not product or product.is_deleted:
        return error_response("Product not found", 404)

    cart = get_or_create_cart(user_id)

    item = CartItem.query.filter_by(cart_id=cart.id, product_id=product_id).first()
    if item:
        if item.quantity + quantity > product.stock:
            return error_response("Requested quantity exceeds available stock", 400)
        item.quantity += quantity
    else:
        if quantity > product.stock:
            return error_response("Requested quantity exceeds available stock", 400)
        item = CartItem(cart_id=cart.id, product_id=product_id, quantity=quantity)
        db.session.add(item)

    db.session.commit()
    return success_response(item.to_dict(), "Product added to cart")


@cart_bp.post("/remove")
@role_required("customer")
def remove_from_cart():
    user_id = current_user_id()
    payload = request.get_json(silent=True) or {}

    missing = require_fields(payload, ["item_id"])
    if missing:
        return error_response("Missing required fields", 400, {"missing": missing})

    cart = get_or_create_cart(user_id)
    item = CartItem.query.filter_by(cart_id=cart.id, id=payload.get("item_id")).first()
    if not item:
        return error_response("Cart item not found", 404)

    db.session.delete(item)
    db.session.commit()
    return success_response(message="Item removed from cart")


@cart_bp.put("/item/<int:item_id>")
@role_required("customer")
def update_cart_item(item_id):
    user_id = current_user_id()
    payload = request.get_json(silent=True) or {}

    quantity = int(payload.get("quantity", 1))
    if quantity < 1:
        return error_response("Quantity must be at least 1", 400)

    cart = get_or_create_cart(user_id)
    item = CartItem.query.filter_by(cart_id=cart.id, id=item_id).first()
    if not item:
        return error_response("Cart item not found", 404)

    if item.product.is_deleted:
        db.session.delete(item)
        db.session.commit()
        return error_response("Product is no longer available", 400)

    if quantity > item.product.stock:
        return error_response("Requested quantity exceeds available stock", 400)

    item.quantity = quantity
    db.session.commit()

    return success_response(item.to_dict(), "Cart item updated")


@cart_bp.delete("/item/<int:item_id>")
@role_required("customer")
def delete_cart_item(item_id):
    user_id = current_user_id()
    cart = get_or_create_cart(user_id)
    item = CartItem.query.filter_by(cart_id=cart.id, id=item_id).first()

    if not item:
        return error_response("Cart item not found", 404)

    db.session.delete(item)
    db.session.commit()
    return success_response(message="Item removed from cart")


@cart_bp.delete("/clear")
@role_required("customer")
def clear_cart():
    user_id = current_user_id()
    cart = get_or_create_cart(user_id)

    for item in cart.items:
        db.session.delete(item)

    db.session.commit()
    return success_response(message="Cart cleared")

