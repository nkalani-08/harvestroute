
import csv
from pathlib import Path
from datetime import datetime

DATA_FILE = Path(__file__).parent / "mandi_prices.csv"


def retrieve_market_prices(crop: str, state: str | None = None):
    results = []
    crop = crop.strip().casefold()

    with DATA_FILE.open("r", encoding="utf-8-sig", newline="") as file:
        reader = csv.DictReader(file)

        for row in reader:
            commodity = (row.get("Commodity") or "").strip()
            row_state = (row.get("State") or "").strip()

            if crop not in commodity.casefold():
                continue

            if state and state.casefold() != row_state.casefold():
                continue

            try:
                date = datetime.strptime(
                    row["Arrival_Date"], "%d/%m/%Y"
                ).date()

                results.append({
                    "state": row_state,
                    "district": row["District"],
                    "market": row["Market"],
                    "commodity": commodity,
                    "arrival_date": date.isoformat(),
                    "min_price_per_quintal": float(
                        row["Min_x0020_Price"]
                    ),
                    "max_price_per_quintal": float(
                        row["Max_x0020_Price"]
                    ),
                    "modal_price_per_quintal": float(
                        row["Modal_x0020_Price"]
                    ),
                })
            except (ValueError, KeyError, TypeError):
                continue

    results.sort(
        key=lambda item: item["arrival_date"],
        reverse=True,
    )
    return results
