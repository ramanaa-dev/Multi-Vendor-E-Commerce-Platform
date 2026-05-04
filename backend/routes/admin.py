import csv
import io

from flask import Blueprint, current_app, request, send_file
from sqlalchemy import extract, func, or_

from extensions import db
from models import Category, Order, Product, User
from utils.decorators import role_required
from utils.responses import error_response, success_response
from utils.validators import get_pagination_args


admin_bp = Blueprint("admin", __name__)


@admin_bp.get("/dashboard")
@role_required("admin")
def admin_dashboard():
    total_users = User.query.count()
    total_customers = User.query.filter_by(role="customer").count()
    total_sellers = User.query.filter_by(role="seller").count()
    pending_sellers = User.query.filter_by(role="seller", status="pending").count()
    total_products = Product.query.filter_by(is_deleted=False).count()
    total_orders = Order.query.count()
    total_revenue = round(float(Order.query.with_entities(func.sum(Order.total_amount)).scalar() or 0), 2)

    monthly_rows = (
        Order.query.with_entities(
            extract("month", Order.created_at).label("month"),
            func.sum(Order.total_amount).label("revenue"),
        )
        .filter(extract("year", Order.created_at) == extract("year", func.now()))
        .group_by(extract("month", Order.created_at))
        .all()
    )

    month_map = {int(row.month): float(row.revenue or 0) for row in monthly_rows}
    monthly_revenue = [{"month": month, "revenue": round(month_map.get(month, 0), 2)} for month in range(1, 13)]

    return success_response(
        {
            "total_users": total_users,
            "total_customers": total_customers,
            "total_sellers": total_sellers,
            "pending_sellers": pending_sellers,
            "total_products": total_products,
            "total_orders": total_orders,
            "total_revenue": total_revenue,
            "monthly_revenue": monthly_revenue,
        }
    )


@admin_bp.get("/users")
@role_required("admin")
def admin_users():
    page, per_page = get_pagination_args(
        request,
        default_page_size=current_app.config["DEFAULT_PAGE_SIZE"],
        max_page_size=current_app.config["MAX_PAGE_SIZE"],
    )

    role = request.args.get("role", "").strip().lower()
    status = request.args.get("status", "").strip().lower()
    search = request.args.get("search", "").strip()

    query = User.query
    if role:
        query = query.filter(User.role == role)
    if status:
        query = query.filter(User.status == status)
    if search:
        query = query.filter(or_(User.name.ilike(f"%{search}%"), User.email.ilike(f"%{search}%")))

    pagination = query.order_by(User.created_at.desc()).paginate(page=page, per_page=per_page, error_out=False)

    return success_response(
        {
            "items": [user.to_dict() for user in pagination.items],
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


@admin_bp.put("/users/<int:user_id>/status")
@role_required("admin")
def update_user_status(user_id):
    payload = request.get_json(silent=True) or {}
    status = payload.get("status", "").strip().lower()

    if status not in {"active", "blocked", "pending"}:
        return error_response("Invalid status", 400)

    user = User.query.get(user_id)
    if not user:
        return error_response("User not found", 404)

    user.status = status
    db.session.commit()

    return success_response(user.to_dict(), "User status updated")


@admin_bp.put("/sellers/<int:seller_id>/approve")
@role_required("admin")
def approve_seller(seller_id):
    seller = User.query.filter_by(id=seller_id, role="seller").first()
    if not seller:
        return error_response("Seller not found", 404)

    seller.status = "active"
    db.session.commit()

    return success_response(seller.to_dict(), "Seller approved")


@admin_bp.get("/products")
@role_required("admin")
def admin_products():
    page, per_page = get_pagination_args(
        request,
        default_page_size=current_app.config["DEFAULT_PAGE_SIZE"],
        max_page_size=current_app.config["MAX_PAGE_SIZE"],
    )

    search = request.args.get("search", "").strip()

    query = Product.query.filter(Product.is_deleted.is_(False))
    if search:
        query = query.filter(Product.name.ilike(f"%{search}%"))

    pagination = query.order_by(Product.created_at.desc()).paginate(page=page, per_page=per_page, error_out=False)

    return success_response(
        {
            "items": [product.to_dict(include_seller=True) for product in pagination.items],
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


@admin_bp.delete("/products/<int:product_id>")
@role_required("admin")
def admin_delete_product(product_id):
    product = Product.query.filter_by(id=product_id, is_deleted=False).first()
    if not product:
        return error_response("Product not found", 404)

    product.is_deleted = True
    product.stock = 0
    db.session.commit()

    return success_response(message="Product deleted")


@admin_bp.get("/orders")
@role_required("admin")
def admin_orders():
    page, per_page = get_pagination_args(
        request,
        default_page_size=current_app.config["DEFAULT_PAGE_SIZE"],
        max_page_size=current_app.config["MAX_PAGE_SIZE"],
    )

    pagination = Order.query.order_by(Order.created_at.desc()).paginate(page=page, per_page=per_page, error_out=False)

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


@admin_bp.get("/categories")
@role_required("admin")
def admin_categories():
    categories = Category.query.order_by(Category.name.asc()).all()
    return success_response([category.to_dict() for category in categories])


@admin_bp.post("/categories")
@role_required("admin")
def add_category():
    payload = request.get_json(silent=True) or {}
    name = payload.get("name", "").strip()
    if not name:
        return error_response("Category name is required", 400)

    existing = Category.query.filter(func.lower(Category.name) == name.lower()).first()
    if existing:
        return error_response("Category already exists", 409)

    category = Category(name=name)
    db.session.add(category)
    db.session.commit()

    return success_response(category.to_dict(), "Category created", 201)


@admin_bp.put("/categories/<int:category_id>")
@role_required("admin")
def update_category(category_id):
    payload = request.get_json(silent=True) or {}
    name = payload.get("name", "").strip()
    if not name:
        return error_response("Category name is required", 400)

    category = Category.query.get(category_id)
    if not category:
        return error_response("Category not found", 404)

    category.name = name
    db.session.commit()

    return success_response(category.to_dict(), "Category updated")


@admin_bp.delete("/categories/<int:category_id>")
@role_required("admin")
def delete_category(category_id):
    category = Category.query.get(category_id)
    if not category:
        return error_response("Category not found", 404)

    if category.products:
        return error_response("Cannot delete category with products", 400)

    db.session.delete(category)
    db.session.commit()

    return success_response(message="Category deleted")


@admin_bp.get("/reports/export")
@role_required("admin")
def export_report():
    report_type = request.args.get("type", "orders").strip().lower()

    output = io.StringIO()
    writer = csv.writer(output)

    if report_type == "users":
        writer.writerow(["id", "name", "email", "role", "status", "created_at"])
        users = User.query.order_by(User.id.asc()).all()
        for user in users:
            writer.writerow([user.id, user.name, user.email, user.role, user.status, user.created_at])
    elif report_type == "products":
        writer.writerow(["id", "name", "seller", "price", "stock", "category", "created_at"])
        products = Product.query.filter(Product.is_deleted.is_(False)).order_by(Product.id.asc()).all()
        for product in products:
            writer.writerow([
                product.id,
                product.name,
                product.seller.name if product.seller else "",
                product.price,
                product.stock,
                product.category.name if product.category else "",
                product.created_at,
            ])
    elif report_type == "orders":
        writer.writerow(["id", "customer", "total_amount", "status", "created_at"])
        orders = Order.query.order_by(Order.id.asc()).all()
        for order in orders:
            writer.writerow([
                order.id,
                order.customer.name if order.customer else "",
                order.total_amount,
                order.status,
                order.created_at,
            ])
    else:
        return error_response("Unsupported report type. Use users/products/orders", 400)

    memory_file = io.BytesIO()
    memory_file.write(output.getvalue().encode("utf-8"))
    memory_file.seek(0)
    output.close()

    return send_file(
        memory_file,
        as_attachment=True,
        download_name=f"{report_type}_report.csv",
        mimetype="text/csv",
    )

