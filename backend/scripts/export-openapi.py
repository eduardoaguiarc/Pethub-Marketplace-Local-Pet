"""Export the running API contract as UTF-8, without platform-specific decoding."""
import argparse
import json
from pathlib import Path
from urllib.request import urlopen

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("--url", default="http://localhost:8080/v3/api-docs")
parser.add_argument("--output", type=Path, default=Path(__file__).resolve().parents[2] / "postman/specs/pethub.openapi.json")
args = parser.parse_args()
with urlopen(args.url, timeout=20) as response:
    contract = json.loads(response.read().decode("utf-8"))
if not contract.get("openapi", "").startswith("3.") or not contract.get("paths"):
    raise SystemExit("The server did not return a valid OpenAPI 3 contract")
args.output.parent.mkdir(parents=True, exist_ok=True)
args.output.write_text(json.dumps(contract, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(f"Exported OpenAPI {contract['openapi']}: {len(contract['paths'])} paths")
