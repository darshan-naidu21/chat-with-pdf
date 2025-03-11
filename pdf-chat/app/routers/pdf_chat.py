from fastapi import APIRouter, UploadFile, File, HTTPException
from app.schemas.pdf_chat_schema import ChatRequest, ChatResponse
from app.services.pdf_chat_service import get_chat_response, pdf_to_vector_db
import boto3
import os
from dotenv import load_dotenv
import random

router = APIRouter()

load_dotenv()

# AWS S3 Configuration
AWS_ACCESS_KEY = os.getenv("AWS_ACCESS_KEY")
AWS_SECRET_KEY = os.getenv("AWS_SECRET_KEY")
S3_BUCKET_NAME = os.getenv("AWS_BUCKET_NAME")
AWS_REGION = os.getenv("AWS_REGION")

s3_client = boto3.client(
    "s3",
    aws_access_key_id=AWS_ACCESS_KEY,
    aws_secret_access_key=AWS_SECRET_KEY,
    region_name=AWS_REGION
)

@router.post("/get_response", response_model=ChatResponse)
async def get_response(request: ChatRequest):
    """Handles user queries and returns responses from the AI system."""
    try:
        response = await get_chat_response(request.user_message)
        return ChatResponse(bot_reply=response)
    except Exception as e:
        return ChatResponse(bot_reply=f"Error: {str(e)}")


@router.post("/upload_pdf")
async def upload_pdf(file: UploadFile = File(...)):
    """Uploads PDF to S3 and updates the vector database."""
    try:
        # Generate a unique 6-digit identifier
        unique_id = random.randint(100000, 999999)
        
        # Extract original filename and extension
        filename, file_extension = os.path.splitext(file.filename)

        # Create a unique file key
        unique_filename = f"{filename}_{unique_id}{file_extension}"
        file_key = unique_filename  # S3 object key

        # Upload file to S3
        s3_client.upload_fileobj(file.file, S3_BUCKET_NAME, file_key)

        # Construct S3 URL
        s3_url = f"https://{S3_BUCKET_NAME}.s3.{AWS_REGION}.amazonaws.com/{file_key}"

        pdf_to_vector_db(file_key)  

        return {
            "message": f"PDF '{file.filename}' uploaded to S3 and indexed successfully.",
            "s3_url": s3_url
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/healthcheck")
async def healthcheck():
    return {"status": "ok"}
