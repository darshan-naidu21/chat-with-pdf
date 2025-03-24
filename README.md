# 📄 Chat with PDF

This project enables users to **upload PDFs, store them in AWS S3, and query them** using a vector database for retrieving relevant information. It extracts and indexes PDF content into **Supabase Vector Store**, allowing for **semantic search** and **conversational querying** using OpenAI’s `gpt-4o-mini` **Vision-Language Model (VLM)**.

---

## 🚀 **Key Features**  

### 📂 PDF Upload & Storage  
- Users upload PDFs via an **API endpoint**.  
- Files are stored securely in **AWS S3** with a **unique identifier**.  

### 🧠 Intelligent PDF Processing (with **VLM**)  
- Extracts **text, tables, charts, and images** using **LlamaParse**.  
- Uses **GPT-4o-mini (VLM)** for **multimodal document understanding**.  
- Converts images, graphs, and tables into **descriptive text & structured data**.  
- Uses **semantic chunking** to enhance retrieval accuracy.  
- Stores processed data in **Supabase Vector Store** for efficient querying.  

### 🔎 AI-Powered Querying  
- Enables **semantic search** on uploaded PDFs.  
- Uses `gpt-4o-mini` to generate **context-aware responses**.  
- Maintains **multi-turn conversations** with memory.  

### 🔄 Fully Async API with FastAPI  
- FastAPI-based backend ensures **fast and scalable** interactions.  
- Uses **asynchronous operations** for efficient data processing.  

---

## 🛠 **Tech Stack**  

| Component         | Technology |
|------------------|------------|
| **Backend**       | FastAPI  |
| **LLM Model**     | OpenAI `gpt-4o-mini` (VLM) |
| **PDF Parsing**   | LlamaParse (with **VLM** for images & charts) |
| **Vector Database** | Supabase (pgvector) |
| **Storage**       | AWS S3 |
| **Embedding Model** | OpenAIEmbedding |
| **Indexing**      | LlamaIndex |

---

## 📖 **How It Works**  

1️⃣ **User uploads a PDF** → File is stored in **AWS S3**.  
2️⃣ **PDF is processed using LlamaParse + GPT-4o-mini (VLM)** →  
   - Extracts **text, tables, and images**.  
   - Uses **Vision-Language Model (VLM)** to **analyze images, charts, and graphs**.  
   - Converts non-textual elements into structured, searchable content.  
3️⃣ **Content is indexed into Supabase Vector Store**.  
4️⃣ **User asks a question** → Query is **semantically matched** using **pgvector**.  
5️⃣ **GPT-4o-mini generates a response** based on indexed data. 
