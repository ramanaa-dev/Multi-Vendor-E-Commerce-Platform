import os
import uuid
from werkzeug.utils import secure_filename


def allowed_file(filename, allowed_extensions):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in allowed_extensions


def save_image(file_storage, upload_folder, allowed_extensions):
    if not file_storage or file_storage.filename == "":
        return None

    if not allowed_file(file_storage.filename, allowed_extensions):
        raise ValueError("Unsupported image format.")

    os.makedirs(upload_folder, exist_ok=True)

    extension = file_storage.filename.rsplit(".", 1)[1].lower()
    filename = secure_filename(file_storage.filename.rsplit(".", 1)[0])
    unique_name = f"{filename}-{uuid.uuid4().hex[:12]}.{extension}"
    path = os.path.join(upload_folder, unique_name)
    file_storage.save(path)

    return f"/api/uploads/{unique_name}"
