import sys
import os
from apig_wsgi import make_lambda_handler

# Ensure dependencies are available
# If using Netlify's build, libraries are installed in site-packages
# But we need to make sure 'app' is importable.
# Netlify usually zips the function directory. If we put 'app.py' in root, we might need to adjust.
# However, standard practice: import from parent.

# Add project root to sys.path
root = os.path.abspath(os.path.join(os.path.dirname(__file__), '../..'))
sys.path.insert(0, root)

try:
    from app import app
    from apig_wsgi import make_lambda_handler
    _handler = make_lambda_handler(app, binary_support=True)
except Exception as e:
    import traceback
    err = traceback.format_exc()
    def _handler(event, context):
        return {
            "statusCode": 500,
            "headers": {"Content-Type": "text/plain"},
            "body": f"Startup/Import Error:\n{err}\n\nSys Path: {sys.path}"
        }

def handler(event, context):
    return _handler(event, context)
