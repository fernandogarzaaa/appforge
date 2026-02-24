#!/usr/bin/env python3
"""
Clawd Hybrid RTX LLM Server Launcher
"""
import sys
import os
from pathlib import Path

# Get the directory containing this script
SCRIPT_DIR = Path(__file__).parent.absolute()
sys.path.insert(0, str(SCRIPT_DIR))

print(f"Starting Clawd Hybrid RTX LLM from: {SCRIPT_DIR}")

try:
    import uvicorn
    uvicorn.run(
        "src.api_server:app",
        host="0.0.0.0",
        port=7860,
        reload=False,
        workers=1,
    )
except ImportError as e:
    print(f"Missing dependency: {e}")
    print("Run: pip install -r requirements.txt")
    sys.exit(1)
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
