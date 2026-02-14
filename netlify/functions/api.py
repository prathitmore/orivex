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
    # Standard handler
    _flask_handler = make_lambda_handler(app, binary_support=True)
except Exception as e:
    import traceback
    _trace = traceback.format_exc()
    _flask_handler = None

def handler(event, context):
    # Debugging: Check if imports failed
    if _flask_handler is None:
        return {
            "statusCode": 500,
            "headers": {"Content-Type": "text/plain"},
            "body": f"Import Error:\n{_trace}\n\nSysPath: {sys.path}"
        }
    
    # Debugging: Check path
    # Flask expects /api/login. The event path might be /.netlify/functions/api/login
    # We might need to rewrite the path for Flask
    path = event.get('path', '')
    
    # If using direct function access, path might be /.netlify/functions/api/login
    # Flask routes are defined as /api/...
    # So if the path contains /api/, we are probably good?
    # Let's try to run it.
    
    try:
        response = _flask_handler(event, context)
        # If Flask returns 404, intercept it to show debug info
        if response.get('statusCode') == 404:
            response['body'] = f"Flask 404. Path requested: {path}. Event keys: {list(event.keys())}"
        return response
    except Exception as e:
        return {
            "statusCode": 500,
            "body": f"Handler Error: {str(e)}"
        }
