import sys
import os
from apig_wsgi import make_lambda_handler

# Ensure dependencies are available
# If using Netlify's build, libraries are installed in site-packages
# But we need to make sure 'app' is importable.
# Netlify usually zips the function directory. If we put 'app.py' in root, we might need to adjust.
# However, standard practice: import from parent.

# Add project root and local libs to sys.path
root = os.path.abspath(os.path.join(os.path.dirname(__file__), '../..'))
libs = os.path.abspath(os.path.join(os.path.dirname(__file__), 'libs'))
sys.path.insert(0, libs)
sys.path.insert(0, root)

try:
    from app import app
    from apig_wsgi import make_lambda_handler
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
            "body": f"Import/Startup Error:\n{_trace}\n\nSysPath: {sys.path}"
        }
    
    # Path/Routing Fix
    # The event path from Netlify is typically long (e.g. /.netlify/functions/api/login)
    # But Flask routes are defined as /api/login.
    # We need to strip the prefix so Flask sees what it expects.
    current_path = event.get('path', '')
    if current_path.startswith('/.netlify/functions/api'):
        # Replace the function preamble with just /api to match Flask routes
        # e.g. /.netlify/functions/api/login -> /api/login
        event['path'] = current_path.replace('/.netlify/functions/api', '/api', 1)
        
    try:
        response = _flask_handler(event, context)
        return response
    except Exception as e:
        return {
            "statusCode": 500,
            "body": f"Runtime Handler Error: {str(e)}"
        }
