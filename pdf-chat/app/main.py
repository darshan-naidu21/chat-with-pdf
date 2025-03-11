from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import pdf_chat

# Initialize the FastAPI app
app = FastAPI()

# Set CORS origins
origins = [
    "http://127.0.0.1:8000",
    "http://127.0.0.1:5500",
    "http://localhost:5173",
    "http://127.0.0.1"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include the summarization router
app.include_router(pdf_chat.router)
