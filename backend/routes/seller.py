from flask import Blueprint, current_app, request
from sqlalchemy import extract, func

from extensions import db
from models import Order, OrderItem, Product
from utils.decorators import current_user_id, role_required
from utils.responses import error_response, success_response
from utils.uploads import save_image
from utils.validators import get_pagination_args


seller_bp = Blueprint("seller", __name__)


def _parse_seller_product_payload():
    if request.content_type and "multipart/form-data" in request.content_type:
        payload = request.form.to_dict()
    else:
        payload = request.get_json(silent=True) or {}

    return payload


@seller_bp.get("/dashboard")
@role_required("seller")
def seller_dashboard():
    seller_id = current_user_id()

    products_count = Product.query.filter_by(seller_id=seller_id, is_deleted=False).count()

    rows = (
        OrderItem.query.with_entities(
            func.count(func.distinct(OrderItem.order_id)).label("orders_count"),
            func.sum(OrderItem.quantity * OrderItem.price).label("revenue"),
            func.sum(OrderItem.quantity).label("units_sold"),
        )
        .join(Product, Product.id == OrderItem.product_id)
        .filter(Product.seller_id == seller_id)
        .first()
    )

    orders_count = int(rows.orders_count or 0)
    revenue = round(float(rows.revenue or 0), 2)
    units_sold = int(rows.units_sold or 0)

    monthly_rows = (
        OrderItem.query.with_entities(
            extract("month", Order.created_at).label("month"),
            func.sum(OrderItem.quantity * OrderItem.price).label("revenue"),
        )
        .join(Product, Product.id == OrderItem.product_id)
        .join(Order, Order.id == OrderItem.order_id)
        .filter(Product.seller_id == seller_id, extract("year", Order.created_at) == extract("year", func.now()))
        .group_by(extract("month", Order.created_at))
        .all()
    )

    month_map = {int(row.month): float(row.revenue or 0) for row in monthly_rows}
    monthly_revenue = [{"month": month, "revenue": round(month_map.get(month, 0), 2)} for month in range(1, 13)]

    return success_response(
        {
            "products_count": products_count,
            "orders_count": orders_count,
            "revenue": revenue,
            "units_sold": units_sold,
            "monthly_revenue": monthly_revenue,
        }
    )


@seller_bp.get("/products")
@role_required("seller")
def seller_products():
    seller_id = current_user_id()
    page, per_page = get_pagination_args(
        request,
        default_page_size=current_app.config["DEFAULT_PAGE_SIZE"],
        max_page_size=current_app.config["MAX_PAGE_SIZE"],
    )

    pagination = (
        Product.query.filter_by(seller_id=seller_id, is_deleted=False)
        .order_by(Product.created_at.desc())
        .paginate(page=page, per_page=per_page, error_out=False)
    )

    return success_response(
        {
            "items": [product.to_dict(include_seller=False) for product in pagination.items],
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


@seller_bp.post("/products")
@role_required("seller")
def add_product():
    seller_id = current_user_id()
    payload = _parse_seller_product_payload()

    required = ["name", "description", "price", "stock", "category_id"]
    missing = [field for field in required if payload.get(field) in (None, "")]
    if missing:
        return error_response("Missing required fields", 400, {"missing": missing})

    image_url = payload.get("image_url")
    if "image" in request.files:
        try:
            image_url = save_image(
                request.files["image"],
                current_app.config["UPLOAD_FOLDER"],
                current_app.config["ALLOWED_EXTENSIONS"],
            )
        except ValueError as exc:
            return error_response(str(exc), 400)

    product = Product(
        seller_id=seller_id,
        name=payload.get("name").strip(),
        description=payload.get("description").strip(),
        price=float(payload.get("price")),
        stock=int(payload.get("stock")),
        category_id=int(payload.get("category_id")),
        image_url=image_url,
    )

    db.session.add(product)
    db.session.commit()

    return success_response(product.to_dict(include_seller=True), "Product created", 201)


@seller_bp.put("/products/<int:product_id>")
@role_required("seller")
def update_product(product_id):
    seller_id = current_user_id()
    product = Product.query.filter_by(id=product_id, seller_id=seller_id, is_deleted=False).first()
    if not product:
        return error_response("Product not found", 404)

    payload = _parse_seller_product_payload()

    if payload.get("name") is not None:
        product.name = payload.get("name").strip()
    if payload.get("description") is not None:
        product.description = payload.get("description").strip()
    if payload.get("price") is not None:
        product.price = float(payload.get("price"))
    if payload.get("stock") is not None:
        product.stock = int(payload.get("stock"))
    if payload.get("category_id") is not None:
        product.category_id = int(payload.get("category_id"))
    if payload.get("image_url") is not None:
        product.image_url = payload.get("image_url")

    if "image" in request.files:
        try:
            product.image_url = save_image(
                request.files["image"],
                current_app.config["UPLOAD_FOLDER"],
                current_app.config["ALLOWED_EXTENSIONS"],
            )
        except ValueError as exc:
            return error_response(str(exc), 400)

    db.session.commit()

    return success_response(product.to_dict(include_seller=True), "Product updated")


@seller_bp.delete("/products/<int:product_id>")
@role_required("seller")
def delete_product(product_id):
    seller_id = current_user_id()
    product = Product.query.filter_by(id=product_id, seller_id=seller_id, is_deleted=False).first()
    if not product:
        return error_response("Product not found", 404)

    product.is_deleted = True
    product.stock = 0
    db.session.commit()

    return success_response(message="Product deleted")


@seller_bp.get("/orders")
@role_required("seller")
def seller_orders():
    seller_id = current_user_id()

    order_items = (
        OrderItem.query.join(Product, Product.id == OrderItem.product_id)
        .join(Order, Order.id == OrderItem.order_id)
        .filter(Product.seller_id == seller_id)
        .order_by(Order.created_at.desc())
        .all()
    )

    grouped = {}
    for item in order_items:
        if item.order_id not in grouped:
            grouped[item.order_id] = {
                "order_id": item.order_id,
                "customer_name": item.order.customer.name if item.order and item.order.customer else None,
                "status": item.order.status if item.order else None,
                "created_at": item.order.created_at.isoformat() if item.order else None,
                "shipping_address": item.order.shipping_address if item.order else None,
                "contact_phone": item.order.contact_phone if item.order else None,
                "payment_method": item.order.payment_method if item.order else None,
                "payment_method_label": item.order.to_dict(include_items=False).get("payment_method_label") if item.order else None,
                "payment_reference": item.order.payment_reference if item.order else None,
                "items": [],
                "seller_total": 0,
            }

        grouped[item.order_id]["items"].append(item.to_dict())
        grouped[item.order_id]["seller_total"] += round(float(item.price) * item.quantity, 2)

    return success_response(sorted(grouped.values(), key=lambda row: row["order_id"], reverse=True))


@seller_bp.put("/orders/<int:order_id>/status")
@role_required("seller")
def update_order_status(order_id):
    seller_id = current_user_id()
    payload = request.get_json(silent=True) or {}
    status = payload.get("status", "").strip().lower()

    valid_status = {"placed", "processing", "shipped", "delivered", "cancelled"}
    if status not in valid_status:
        return error_response("Invalid order status", 400)

    order = Order.query.get(order_id)
    if not order:
        return error_response("Order not found", 404)

    has_item = any(item.product and item.product.seller_id == seller_id for item in order.items)
    if not has_item:
        return error_response("Unauthorized", 403)

    order.status = status
    db.session.commit()

    return success_response(order.to_dict(), "Order status updated")


@seller_bp.get("/analytics")
@role_required("seller")
def seller_analytics():
    return seller_dashboard()

