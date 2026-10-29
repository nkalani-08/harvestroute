
import csv
from pathlib import Path

BASE_DIR = Path(__file__).parent

SOURCE = BASE_DIR / "apmc-arrivals-and-prices-old-data.csv"
OUTPUT = BASE_DIR / "tomato_history.csv"

count = 0
dates = set()
markets = set()

with SOURCE.open("r", encoding="utf-8-sig", newline="") as source:
    reader = csv.DictReader(source)

    required = {
        "report_date",
        "commodity",
        "market_center",
        "modal_price",
        "arrivals_tonnes",
    }

    missing = required - set(reader.fieldnames or [])
    if missing:
        raise ValueError(f"Missing required columns: {missing}")

    with OUTPUT.open("w", encoding="utf-8", newline="") as target:
        columns = [
            "report_date",
            "state_name",
            "district_name",
            "market_center",
            "market_code",
            "latitude",
            "longitude",
            "commodity",
            "variety",
            "arrivals_tonnes",
            "min_price",
            "max_price",
            "modal_price",
            "price_unit",
        ]

        writer = csv.DictWriter(target, fieldnames=columns)
        writer.writeheader()

        for row in reader:
            if (row.get("commodity") or "").strip().casefold() != "tomato":
                continue

            try:
                price = float(row["modal_price"])
                date = row["report_date"].strip()

                if price <= 0 or not date:
                    continue

                writer.writerow({col: row.get(col, "") for col in columns})
                count += 1
                dates.add(date)
                markets.add((
                    row.get("state_name", ""),
                    row.get("market_center", ""),
                ))

            except (ValueError, TypeError):
                continue

print("Tomato extraction complete!")
print("Records:", count)
print("Distinct dates:", len(dates))
print("Distinct markets:", len(markets))
print("First date:", min(dates) if dates else "None")
print("Last date:", max(dates) if dates else "None")
print("Output:", OUTPUT)
