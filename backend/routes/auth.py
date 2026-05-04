from flask import Blueprint, request
from flask_jwt_extended import create_access_token, jwt_required
from sqlalchemy import or_

from extensions import bcrypt, db
from models import Cart, User
from utils.decorators import current_user_id
from utils.responses import error_response, success_response
from utils.validators import require_fields, validate_email, validate_password


auth_bp = Blueprint("auth", __name__)


@auth_bp.post("/register")
def register():
    payload = request.get_json(silent=True) or {}
    missing = require_fields(payload, ["name", "email", "password"])
    if missing:
        return error_response("Missing required fields", 400, {"missing": missing})

    name = payload.get("name", "").strip()
    email = payload.get("email", "").strip().lower()
    password = payload.get("password", "")
    role = (payload.get("role") or "customer").strip().lower()

    missing = [field for field, value in {"name": name, "email": email, "password": password}.items() if not value]
    if missing:
        return error_response("Missing required fields", 400, {"missing": missing})

    if role != "customer":
        return error_response("This registration form is for customers only", 400)

    if not validate_email(email):
        return error_response("Invalid email format", 400)

    if not validate_password(password):
        return error_response("Password must be at least 6 characters", 400)

    existing = User.query.filter_by(email=email).first()
    if existing:
        return error_response("Email already exists", 409)

    user = User(
        name=name,
        email=email,
        password=bcrypt.generate_password_hash(password).decode("utf-8"),
        role="customer",
        status="active",
    )

    db.session.add(user)
    db.session.flush()

    cart = Cart(user_id=user.id)
    db.session.add(cart)
    db.session.commit()

    return success_response(user.to_dict(), "Customer registration successful", 201)


@auth_bp.post("/register-seller")
def register_seller():
    payload = request.get_json(silent=True) or {}
    missing = require_fields(
        payload,
        ["name", "email", "password", "company_name", "company_phone", "company_address", "business_description"],
    )
    if missing:
        return error_response("Missing required fields", 400, {"missing": missing})

    name = payload.get("name", "").strip()
    email = payload.get("email", "").strip().lower()
    password = payload.get("password", "")
    company_name = payload.get("company_name", "").strip()
    company_phone = payload.get("company_phone", "").strip()
    company_address = payload.get("company_address", "").strip()
    company_website = (payload.get("company_website") or "").strip()
    business_description = payload.get("business_description", "").strip()

    missing = [
        field
        for field, value in {
            "name": name,
            "email": email,
            "password": password,
            "company_name": company_name,
            "company_phone": company_phone,
            "company_address": company_address,
            "business_description": business_description,
        }.items()
        if not value
    ]
    if missing:
        return error_response("Missing required fields", 400, {"missing": missing})

    if not validate_email(email):
        return error_response("Invalid email format", 400)

    if not validate_password(password):
        return error_response("Password must be at least 6 characters", 400)

    existing = User.query.filter_by(email=email).first()
    if existing:
        return error_response("Email already exists", 409)

    user = User(
        name=name,
        email=email,
        password=bcrypt.generate_password_hash(password).decode("utf-8"),
        role="seller",
        status="pending",
        company_name=company_name,
        company_phone=company_phone,
        company_address=company_address,
        company_website=company_website or None,
        business_description=business_description,
    )

    db.session.add(user)
    db.session.flush()

    cart = Cart(user_id=user.id)
    db.session.add(cart)
    db.session.commit()

    return success_response(user.to_dict(), "Seller application submitted and pending admin approval", 201)


@auth_bp.post("/login")
def login():
    payload = request.get_json(silent=True) or {}
    missing = require_fields(payload, ["email", "password"])
    if missing:
        return error_response("Missing required fields", 400, {"missing": missing})

    email = payload.get("email", "").strip().lower()
    password = payload.get("password", "")

    user = User.query.filter_by(email=email).first()
    if not user or not bcrypt.check_password_hash(user.password, password):
        return error_response("Invalid email or password", 401)

    if user.status == "blocked":
        return error_response("Your account is blocked", 403)

    if user.role == "seller" and user.status != "active":
        return error_response("Seller account is not approved yet", 403)

    additional_claims = {"role": user.role, "status": user.status}
    token = create_access_token(identity=str(user.id), additional_claims=additional_claims)

    return success_response(
        {
            "access_token": token,
            "user": user.to_dict(),
        },
        "Login successful",
    )


@auth_bp.get("/me")
@jwt_required()
def me():
    user_id = current_user_id()
    user = User.query.get(user_id)
    if not user:
        return error_response("User not found", 404)

    return success_response(user.to_dict())


@auth_bp.post("/logout")
@jwt_required()
def logout():
    return success_response(message="Logout successful. Remove token from client storage.")


@auth_bp.get("/users/search")
@jwt_required()
def search_users():
    query = request.args.get("q", "").strip()
    if not query:
        return success_response([])

    users = (
        User.query.filter(or_(User.name.ilike(f"%{query}%"), User.email.ilike(f"%{query}%")))
        .limit(20)
        .all()
    )
    return success_response([user.to_dict() for user in users])
