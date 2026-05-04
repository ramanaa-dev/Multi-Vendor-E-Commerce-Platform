from flask import Blueprint, current_app, request
from sqlalchemy import asc, desc

from models import Category, Product, User
from utils.responses import error_response, paginated_response, success_response
from utils.validators import get_pagination_args


products_bp = Blueprint("products", __name__)


@products_bp.get("/products")
def list_products():
    page, per_page = get_pagination_args(
        request,
        default_page_size=current_app.config["DEFAULT_PAGE_SIZE"],
        max_page_size=current_app.config["MAX_PAGE_SIZE"],
    )

    query = Product.query.join(User, Product.seller_id == User.id).filter(
        User.status == "active",
        Product.is_deleted.is_(False),
    )

    search = request.args.get("search", "").strip()
    category_id = request.args.get("category_id", type=int)
    seller_id = request.args.get("seller_id", type=int)
    min_price = request.args.get("min_price", type=float)
    max_price = request.args.get("max_price", type=float)
    sort_by = request.args.get("sort_by", "created_at").strip()
    sort_order = request.args.get("order", "desc").strip().lower()

    if search:
        query = query.filter(Product.name.ilike(f"%{search}%"))

    if category_id:
        query = query.filter(Product.category_id == category_id)

    if seller_id:
        query = query.filter(Product.seller_id == seller_id)

    if min_price is not None:
        query = query.filter(Product.price >= min_price)

    if max_price is not None:
        query = query.filter(Product.price <= max_price)

    sort_column = Product.created_at
    if sort_by == "price":
        sort_column = Product.price
    elif sort_by == "name":
        sort_column = Product.name

    query = query.order_by(asc(sort_column) if sort_order == "asc" else desc(sort_column))

    pagination = query.paginate(page=page, per_page=per_page, error_out=False)

    return success_response(
        paginated_response(
            pagination.items,
            pagination,
            serializer=lambda product: product.to_dict(include_seller=True),
        )
    )


@products_bp.get("/products/<int:product_id>")
def get_product(product_id):
    product = Product.query.filter_by(id=product_id, is_deleted=False).first()
    if not product:
        return error_response("Product not found", 404)

    data = product.to_dict(include_seller=True)
    data["reviews"] = [review.to_dict() for review in product.reviews]

    return success_response(data)


@products_bp.get("/products/<int:product_id>/reviews")
def get_product_reviews(product_id):
    product = Product.query.filter_by(id=product_id, is_deleted=False).first()
    if not product:
        return error_response("Product not found", 404)

    return success_response(
        {
            "product_id": product_id,
            "average_rating": product.average_rating,
            "reviews": [review.to_dict() for review in product.reviews],
        }
    )


@products_bp.get("/categories")
def list_categories():
    categories = Category.query.order_by(Category.name.asc()).all()
    return success_response([category.to_dict() for category in categories])

