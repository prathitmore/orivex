import sys
import os
import logging
import traceback
from apig_wsgi import make_lambda_handler

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger()

root = os.path.abspath(os.path.join(os.path.dirname(__file__), '../..'))
sys.path.insert(0, root)

_handler = None
_error_html = ""

try:
    from app import app
    _handler = make_lambda_handler(app, binary_support=True)
except Exception:
    _error_html = f"<html><body><h1>Startup Error</h1><pre>{traceback.format_exc()}</pre><pre>SysPath: {sys.path}</pre></body></html>"
    logger.error("Failed to import app", exc_info=True)

def handler(event, context):
    if _handler is None:
        return {
            "statusCode": 500,
            "headers": {"Content-Type": "text/html"},
            "body": _error_html
        }
    
    path = event.get('path', '')
    if path.startswith('/.netlify/functions/api'):
         event['path'] = path.replace('/.netlify/functions/api', '/api', 1)

    return _handler(event, context)
