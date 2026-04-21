from pydantic import BaseModel
from datetime import datetime
from app.models.import_request import ImportStatus

class ImportRequestCreate(BaseModel):
    category_id: int          
    article_url: str
    article_description: str | None = None

class ImportRequestResponse(BaseModel):
    id: int
    user_id: int
    category_id: int
    article_url: str
    article_description: str | None
    screenshot_path: str | None
    status: ImportStatus
    staff_note: str | None
    created_at: datetime

    model_config = {"from_attributes": True}

class ImportStatusUpdate(BaseModel):
    status: ImportStatus
    staff_note: str | None = None