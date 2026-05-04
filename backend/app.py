import os

from dotenv import load_dotenv
from flask import Flask, jsonify, send_from_directory
from sqlalchemy import inspect, text
from werkzeug.exceptions import RequestEntityTooLarge

load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

from config import Config
from extensions import bcrypt, cors, db, jwt


SELLER_PROFILE_COLUMNS = {
    "company_name": "VARCHAR(160)",
    "company_phone": "VARCHAR(40)",
    "company_address": "TEXT",
    "company_website": "VARCHAR(255)",
    "business_description": "TEXT",
}

PRODUCT_COLUMNS = {
    "is_deleted": "BOOLEAN NOT NULL DEFAULT 0",
}

ORDER_COLUMNS = {
    "shipping_address": "TEXT",
    "contact_phone": "VARCHAR(40)",
    "payment_method": "VARCHAR(40) NOT NULL DEFAULT 'qr_payment'",
    "payment_reference": "VARCHAR(80)",
    "payment_qr_payload": "TEXT",
}


def ensure_table_columns(table_name, columns):
    inspector = inspect(db.engine)
    if table_name not in inspector.get_table_names():
        return

    existing_columns = {column["name"] for column in inspector.get_columns(table_name)}
    with db.engine.begin() as connection:
        for column_name, column_type in columns.items():
            if column_name not in existing_columns:
                connection.execute(text(f"ALTER TABLE {table_name} ADD COLUMN {column_name} {column_type}"))


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    os.makedirs(app.config["UPLOAD_FOLDER"], exist_ok=True)

    db.init_app(app)
    bcrypt.init_app(app)
    jwt.init_app(app)
    cors.init_app(
        app,
        resources={r"/api/*": {"origins": app.config["CORS_ORIGINS"]}},
        supports_credentials=True,
    )

    from models import User
    from routes.admin import admin_bp
    from routes.auth import auth_bp
    from routes.cart import cart_bp
    from routes.customer import customer_bp
    from routes.orders import orders_bp
    from routes.products import products_bp
    from routes.seller import seller_bp

    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(products_bp, url_prefix="/api")
    app.register_blueprint(cart_bp, url_prefix="/api/cart")
    app.register_blueprint(orders_bp, url_prefix="/api/orders")
    app.register_blueprint(customer_bp, url_prefix="/api/customer")
    app.register_blueprint(seller_bp, url_prefix="/api/seller")
    app.register_blueprint(admin_bp, url_prefix="/api/admin")

    @app.route("/api/health", methods=["GET"])
    def health():
        return jsonify({"success": True, "message": "API is running"})

    @app.route("/api/uploads/<path:filename>", methods=["GET"])
    def uploaded_file(filename):
        return send_from_directory(app.config["UPLOAD_FOLDER"], filename)

    @jwt.user_lookup_loader
    def load_user(_jwt_header, jwt_data):
        identity = jwt_data["sub"]
        try:
            identity = int(identity)
        except (TypeError, ValueError):
            return None

        return User.query.get(identity)

    @jwt.unauthorized_loader
    def unauthorized(_error):
        return jsonify({"success": False, "message": "Missing or invalid token"}), 401

    @jwt.invalid_token_loader
    def invalid_token(_error):
        return jsonify({"success": False, "message": "Invalid token"}), 401

    @jwt.expired_token_loader
    def expired_token(_jwt_header, _jwt_payload):
        return jsonify({"success": False, "message": "Token expired"}), 401

    @app.errorhandler(RequestEntityTooLarge)
    def handle_too_large(_error):
        return jsonify({"success": False, "message": "File is too large"}), 413

    @app.errorhandler(404)
    def handle_404(_error):
        return jsonify({"success": False, "message": "Route not found"}), 404

    @app.errorhandler(500)
    def handle_500(_error):
        return jsonify({"success": False, "message": "Internal server error"}), 500

    with app.app_context():
        db.create_all()
        ensure_table_columns("users", SELLER_PROFILE_COLUMNS)
        ensure_table_columns("products", PRODUCT_COLUMNS)
        ensure_table_columns("orders", ORDER_COLUMNS)

    return app


app = create_app()

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True, use_reloader=False)
