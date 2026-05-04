from functools import wraps

from flask_jwt_extended import get_jwt_identity, jwt_required

from models import User


def current_user_id():
    identity = get_jwt_identity()
    if identity is None:
        return None

    # JWT identity is stored as string for compatibility across JWT libraries.
    try:
        return int(identity)
    except (TypeError, ValueError):
        return None


def current_user_or_none():
    user_id = current_user_id()
    if user_id is None:
        return None
    return User.query.get(user_id)


def role_required(*allowed_roles, allow_pending=False):
    def decorator(fn):
        @wraps(fn)
        @jwt_required()
        def wrapper(*args, **kwargs):
            user = current_user_or_none()
            if not user:
                return {"success": False, "message": "User not found"}, 404

            if user.status == "blocked":
                return {"success": False, "message": "Account is blocked"}, 403

            if user.role not in allowed_roles:
                return {"success": False, "message": "You are not allowed to access this resource"}, 403

            if user.role == "seller" and user.status == "pending" and not allow_pending:
                return {"success": False, "message": "Seller account is pending admin approval"}, 403

            return fn(*args, **kwargs)

        return wrapper

    return decorator
