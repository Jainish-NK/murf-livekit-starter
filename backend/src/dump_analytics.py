import sys
import json
from pathlib import Path

# Ensure src directory is available on sys.path
src_dir = Path(__file__).resolve().parent
if str(src_dir) not in sys.path:
    sys.path.insert(0, str(src_dir))

try:
    from analytics_service import get_call_analytics, get_call_history, get_failure_breakdown
except ImportError:
    from src.analytics_service import get_call_analytics, get_call_history, get_failure_breakdown

def main():
    try:
        analytics = get_call_analytics()
        history = get_call_history()
        failures = get_failure_breakdown()
        
        output = {
            "analytics": analytics,
            "history": history,
            "failures": failures
        }
        
        print(json.dumps(output, indent=2))
    except Exception as e:
        print(json.dumps({"error": str(e)}), file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
