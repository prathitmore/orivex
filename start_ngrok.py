
from pyngrok import ngrok
import time
import sys

# Set auth token provided by user
token = "39cc4FH6DhU0X6ksjFeJqUftbGa_5sb7XdStiYkayavZtqpN5"
ngrok.set_auth_token(token)

# Kill any existing tunnels to be clean
ngrok.kill()

# Open a HTTP tunnel on port 5000
try:
    public_url = ngrok.connect(5000).public_url
    print(f"NGROK_URL: {public_url}")
    sys.stdout.flush()
except Exception as e:
    print(f"NGROK_ERROR: {e}")
    sys.stdout.flush()

# Keep the process alive so the tunnel stays open
while True:
    try:
        time.sleep(1)
    except KeyboardInterrupt:
        break
