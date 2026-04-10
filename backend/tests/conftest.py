import sys
from pathlib import Path
#using to resolve root for testing purposes, trying to
#find an easier way to do it

ROOT=Path(__file__).resolve().parents[2]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))
