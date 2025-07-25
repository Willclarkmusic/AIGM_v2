#!/usr/bin/env python3
"""Start server with full output"""

import os
import sys
import uvicorn

# Add app directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'app'))

if __name__ == "__main__":
    print("Starting FastAPI server with full debug output...")
    print("Server will be available at http://127.0.0.1:8000")
    print("Ctrl+C to stop")
    
    try:
        uvicorn.run(
            "app.main:app",
            host="127.0.0.1",
            port=8000,
            reload=True,
            log_level="debug"
        )
    except KeyboardInterrupt:
        print("\nServer stopped")
    except Exception as e:
        print(f"Server error: {e}")
        import traceback
        traceback.print_exc()