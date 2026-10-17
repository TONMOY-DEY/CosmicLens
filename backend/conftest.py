"""Pytest configuration and pythonpath initialization for CosmicLens backend tests."""

import os
import sys

# Ensure backend root is always at the front of sys.path
backend_dir = os.path.abspath(os.path.dirname(__file__))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)
