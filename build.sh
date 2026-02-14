#!/bin/bash
echo "Building functions..."
mkdir -p netlify/functions/libs
pip install -r requirements.txt --target netlify/functions/libs
