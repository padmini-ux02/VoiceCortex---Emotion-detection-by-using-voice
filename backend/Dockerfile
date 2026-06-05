FROM python:3.11-slim

WORKDIR /app

# Install system dependencies for librosa and audio processing
RUN apt-get update && apt-get install -y \
    libsndfile1 \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY . .

# Create uploads directory and grant write permissions for Hugging Face (non-root UID 1000)
RUN mkdir -p uploads/reports && chmod -R 777 /app

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
