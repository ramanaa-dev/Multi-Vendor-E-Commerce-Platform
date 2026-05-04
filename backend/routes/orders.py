from urllib.parse import quote

from flask import Blueprint, current_app, request

from extensions import db
from models import Cart, Order, OrderItem, PAYMENT_METHOD_LABELS
from utils.decorators import current_user_id, role_required
from utils.responses import error_response, success_response
from utils.validators import get_pagination_args


orders_bp = Blueprint("orders", __name__)


VALID_PAYMENT_METHODS = set(PAYMENT_METHOD_LABELS)


@orders_bp.post("/create")
@role_required("customer")
def create_order():
    user_id = current_user_id()
    cart = Cart.query.filter_by(user_id=user_id).first()
    payload = request.get_json(silent=True) or {}

    if not cart or not cart.items:
        return error_response("Cart is empty", 400)

    shipping_address = payload.get("shipping_address", "").strip()
    contact_phone = payload.get("contact_phone", "").strip()
    payment_method = payload.get("payment_method", "").strip().lower()

    if not shipping_address:
        return error_response("Shipping address is required", 400)

    if not contact_phone:
        return error_response("Phone number is required", 400)

    if payment_method not in VALID_PAYMENT_METHODS:
        return error_response("Invalid payment method", 400)

    # Validate stock first so checkout is all-or-nothing.
    for item in cart.items:
        if not item.product or item.product.is_deleted:
            return error_response("One or more cart items are no longer available", 400)
        if item.quantity > item.product.stock:
            return error_response(f"Insufficient stock for {item.product.name}", 400)

    total_amount = round(sum(float(item.product.price) * item.quantity for item in cart.items), 2)

    order = Order(
        user_id=user_id,
        total_amount=total_amount,
        status="placed",
        shipping_address=shipping_address,
        contact_phone=contact_phone,
        payment_method=payment_method,
    )
    db.session.add(order)
    db.session.flush()

    order.payment_reference = f"PAY-{order.id:06d}"
    if payment_method == "qr_payment":
        order.payment_qr_payload = (
            f"upi://pay?pa=vendosphere@upi&pn={quote('VendoSphere')}"
            f"&am={total_amount:.2f}&cu=INR&tn={quote(f'Order {order.payment_reference}')}"
        )

    for item in cart.items:
        order_item = OrderItem(
            order_id=order.id,
            product_id=item.product_id,
            quantity=item.quantity,
            price=item.product.price,
        )
        item.product.stock -= item.quantity
        db.session.add(order_item)

    for item in list(cart.items):
        db.session.delete(item)

    db.session.commit()

    return success_response(order.to_dict(), "Order placed successfully", 201)


@orders_bp.get("/history")
@role_required("customer")
def order_history():
    user_id = current_user_id()
    page, per_page = get_pagination_args(
        request,
        default_page_size=current_app.config["DEFAULT_PAGE_SIZE"],
        max_page_size=current_app.config["MAX_PAGE_SIZE"],
    )

    pagination = (
        Order.query.filter_by(user_id=user_id)
        .order_by(Order.created_at.desc())
        .paginate(page=page, per_page=per_page, error_out=False)
    )

    return success_response(
        {
            "items": [order.to_dict() for order in pagination.items],
            "pagination": {
                "page": pagination.page,
                "per_page": pagination.per_page,
                "total": pagination.total,
                "pages": pagination.pages,
                "has_next": pagination.has_next,
                "has_prev": pagination.has_prev,
            },
        }
    )


@orders_bp.get("/<int:order_id>")
@role_required("customer", "seller", "admin")
def order_details(order_id):
    user_id = current_user_id()
    order = Order.query.get(order_id)
    if not order:
        return error_response("Order not found", 404)

    from models import User

    user = User.query.get(user_id)

    if user.role == "customer" and order.user_id != user_id:
        return error_response("Unauthorized", 403)

    if user.role == "seller":
        has_seller_item = any(item.product and item.product.seller_id == user_id for item in order.items)
        if not has_seller_item:
            return error_response("Unauthorized", 403)

    return success_response(order.to_dict())
