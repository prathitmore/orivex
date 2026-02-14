FROM python:3.9-slim

WORKDIR /app

# Upgrade pip
RUN pip install --upgrade pip

COPY requirements.txt ./
# Install gunicorn and other dependencies
RUN pip install --no-cache-dir -r requirements.txt gunicorn

COPY . .

# Set environment variable for Flask
ENV FLASK_APP=app.py

# Run gunicorn bound to the PORT environment variable
CMD exec gunicorn --bind 0.0.0.0:$PORT --workers 1 --threads 8 --timeout 0 app:app
