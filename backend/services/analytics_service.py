from datetime import datetime
from decimal import Decimal

from flask import Blueprint
from models import Order, OrderItem, Product, User
from sqlalchemy import extract, func


analytics_bp = Blueprint("analytics", __name__)


def seller_sales_overview(seller_id):
    order_items = (
        OrderItem.query.join(Product, Product.id == OrderItem.product_id)
        .join(Order, Order.id == OrderItem.order_id)
        .filter(Product.seller_id == seller_id)
        .all()
    )

    total_sales = sum(item.quantity * float(item.price) for item in order_items)
    total_orders = len({item.order_id for item in order_items})
    units_sold = sum(item.quantity for item in order_items)

    return {
        "total_sales": round(total_sales, 2),
        "total_orders": total_orders,
        "units_sold": units_sold,
    }


def seller_monthly_revenue(seller_id):
    now = datetime.utcnow()
    year = now.year

    rows = (
        OrderItem.query.with_entities(
            extract("month", Order.created_at).label("month"),
            func.sum(OrderItem.quantity * OrderItem.price).label("revenue"),
        )
        .join(Product, Product.id == OrderItem.product_id)
        .join(Order, Order.id == OrderItem.order_id)
        .filter(Product.seller_id == seller_id, extract("year", Order.created_at) == year)
        .group_by(extract("month", Order.created_at))
        .all()
    )

    revenue_map = {int(row.month): float(row.revenue or Decimal(0)) for row in rows}

    return [
        {"month": month, "revenue": round(revenue_map.get(month, 0), 2)} for month in range(1, 13)
    ]


def admin_platform_stats():
    total_users = User.query.count()
    total_customers = User.query.filter_by(role="customer").count()
    total_sellers = User.query.filter_by(role="seller").count()
    total_products = Product.query.count()
    total_orders = Order.query.count()
    revenue = db_revenue()

    return {
        "total_users": total_users,
        "total_customers": total_customers,
        "total_sellers": total_sellers,
        "total_products": total_products,
        "total_orders": total_orders,
        "revenue": revenue,
    }


def db_revenue():
    revenue = Order.query.with_entities(func.sum(Order.total_amount)).scalar()
    return round(float(revenue or 0), 2)
