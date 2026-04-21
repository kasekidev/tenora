def validate_image_bytes(data: bytes) -> bool:
    if data[:3] == b'\xff\xd8\xff':
        return True  # JPEG
    if data[:4] == b'\x89PNG':
        return True  # PNG
    if data[:4] == b'RIFF' and data[8:12] == b'WEBP':
        return True  # WEBP
    return False