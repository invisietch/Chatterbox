import os
import hashlib
from PIL import Image
from fastapi import HTTPException, UploadFile
from io import BytesIO

IMAGE_DIR = "uploaded_images"

# Ensure image directory exists
if not os.path.exists(IMAGE_DIR):
    os.makedirs(IMAGE_DIR)


def validate_image(file: UploadFile) -> Image:
    """Validate if the uploaded file is a valid image."""
    if file.content_type not in ["image/png", "image/jpeg"]:
        raise HTTPException(status_code=400, detail="Only PNG and JPG images are allowed")

    try:
        img = Image.open(BytesIO(file.file.read()))
        img.verify()  # Verify the image is valid
        file.file.seek(0)  # Reset file pointer after reading
        return img
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid image")


def save_image(file: UploadFile) -> str:
    """Save the image with a SHA-256 checksum as its name for deduplication."""
    # Read file data and compute SHA-256 hash
    file_data = file.file.read()
    sha256_hash = hashlib.sha256(file_data).hexdigest()
    file.file.seek(0)  # Reset file pointer after reading

    # Determine the file extension
    ext = "png" if file.content_type == "image/png" else "jpg"
    filename = f"{sha256_hash}.{ext}"
    file_path = os.path.join(IMAGE_DIR, filename)

    # Save file if it doesn't already exist
    if not os.path.exists(file_path):
        with open(file_path, "wb") as f:
            f.write(file_data)

    return filename

def get_image_path(filename: str) -> str:
    return os.path.join(IMAGE_DIR, filename)