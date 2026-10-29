
import csv
from pathlib import Path
from collections import Counter

BASE_DIR = Path(__file__).parent

files = [
    BASE_DIR / "tomato_history.csv",
    BASE_DIR / "mandi_prices.csv",
   BASE_DIR / "apmc-arrivals-and-prices-old-data.csv",
]

crops = ["tomato", "onion", "garlic", "potato", "cabbage"]

for path in files:
    print(f"\n--- {path.name} ---")

    if not path.exists():
        print("File not found:", path)
        continue

    counts = Counter()

    with path.open("r", encoding="utf-8-sig", newline="") as f:
        reader = csv.DictReader(f)
        print("Columns:", reader.fieldnames)

        if not reader.fieldnames:
            continue

        commodity_col = next(
            (col for col in reader.fieldnames
             if "commod" in col.lower()),
            None,
        )

        if commodity_col is None:
            print("No commodity column detected")
            continue

        for row in reader:
            commodity = (
                row.get(commodity_col) or ""
            ).strip().casefold()

            for crop in crops:
                if crop in commodity:
                    counts[crop] += 1

    print("Finished reading file")
    print("Matching crop records:", dict(counts))
