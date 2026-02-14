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
handler = make_lambda_handler(app, binary_support=True)
