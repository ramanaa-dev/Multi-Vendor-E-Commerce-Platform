import re


EMAIL_REGEX = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def validate_email(email):
    return bool(email and EMAIL_REGEX.match(email))


def validate_password(password):
    return bool(password and len(password) >= 6)


def get_pagination_args(request, default_page_size=10, max_page_size=50):
    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", default_page_size, type=int)

    if page < 1:
        page = 1

    if per_page < 1:
        per_page = default_page_size

    per_page = min(per_page, max_page_size)

    return page, per_page


def require_fields(payload, fields):
    missing = [field for field in fields if payload.get(field) in (None, "")]
    return missing
