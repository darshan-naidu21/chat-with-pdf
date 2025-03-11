import os
import openai
import boto3
from dotenv import load_dotenv
import fsspec
from llama_index.core import SimpleDirectoryReader
from llama_cloud_services import LlamaParse
from llama_index.core import SimpleDirectoryReader, StorageContext, VectorStoreIndex
from llama_index.vector_stores.supabase import SupabaseVectorStore
from llama_index.core.node_parser import SemanticSplitterNodeParser
from llama_index.embeddings.openai import OpenAIEmbedding
from llama_index.llms.openai import OpenAI
from llama_index.readers.s3 import S3Reader
import asyncio
import nest_asyncio
nest_asyncio.apply()

# Load environment variables
load_dotenv()
openai.api_key = os.getenv("OPENAI_API_KEY")
DB_URL = os.getenv("DB_URL")

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

file_name = ""


def pdf_to_vector_db(file_key):
    global file_name  # Use global variable

    # Extract filename (without extension) and convert to lowercase
    file_name = file_key.lower().replace(".pdf", "")

    # Set up parser
    parser = LlamaParse(
        api_key=os.getenv("LLAMA_CLOUD_API_KEY"),
        parse_mode="parse_page_with_lvm",
        result_type="text",
        use_vendor_multimodal_model=True,
        vendor_multimodal_model_name="openai-gpt-4o-mini",
        vendor_multimodal_api_key=os.getenv("OPENAI_API_KEY"),
        user_prompt="Extract everything from this PDF, including text, tables, charts, images, and any other relevant content. Provide concise yet informative descriptions for images and highlight patterns in charts. Ensure no information is skipped."
    )

    file_extractor = {".pdf": parser}

    # Initialize the S3Reader with your S3 bucket details
    reader = S3Reader(
        bucket=S3_BUCKET_NAME,
        key=file_key,
        aws_access_id=AWS_ACCESS_KEY,
        aws_access_secret=AWS_SECRET_KEY,
        file_extractor=file_extractor
    )

    # Load the data
    documents = reader.load_data()

    # Set up the semantic splitter
    embed_model = OpenAIEmbedding()
    semantic_splitter = SemanticSplitterNodeParser(
        buffer_size=1,
        breakpoint_percentile_threshold=95,
        embed_model=embed_model
    )

    # Apply semantic chunking to the documents
    nodes = semantic_splitter.get_nodes_from_documents(documents)

    # Set up the vector store and storage context
    vector_store = SupabaseVectorStore(
        postgres_connection_string=DB_URL,
        collection_name=file_name
    )
    storage_context = StorageContext.from_defaults(vector_store=vector_store)

    # Create a query engine from the index
    VectorStoreIndex(
        nodes=nodes,
        storage_context=storage_context
    )

    return {"status": "added to supabase"}


async def get_chat_response(user_message: str) -> str:
    global file_name  # Access global variable

    try:
        if not file_name:
            return "Error: No PDF has been processed yet."

        vector_store = SupabaseVectorStore(
            postgres_connection_string=DB_URL,
            collection_name=file_name
        )

        # Initialize the VectorStoreIndex
        index = VectorStoreIndex.from_vector_store(vector_store=vector_store)

        system_prompt = (
            "You are a knowledgeable assistant trained on specific documents. "
            "Answer questions based on those documents. If a question is outside of those documents, kindly ask the user to rephrase or ask something related to the provided documents."
        )

        llm = OpenAI(model="gpt-4o-mini", system_prompt=system_prompt)

        # Create a query engine from the index
        query_engine = index.as_query_engine(llm=llm)

        return query_engine.query(user_message).response
    except Exception as e:
        return f"Error: {str(e)}"