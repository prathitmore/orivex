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

from app import app

# Create the handler
# We need to make sure the event object is what apig_wsgi expects.
# Netlify Functions (AWS Lambda) pass an event.
# If path is /api/login, Flask expects /api/login.
# apig_wsgi should handle this. 

# One common issue: The 'path' in the event might be relative to the function.
# Let's try to debug or simplify.
# Actually, let's switch to a simpler manual adapter to transparency.

import json

def handler(event, context):
    # This is a very basic adapter to see if code is running at all.
    # If this works, the issue was the WSGI adapter.
    
    # Construct a WSGI environ from the event
    # This is complex. Let's try to fix path issue first.
    
    # Standard fix: explicitly pass context
    return make_lambda_handler(app, binary_support=True)(event, context)
