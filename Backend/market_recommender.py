
import math
import pandas as pd
from pathlib import Path

BASE_DIR = Path(__file__).parent
TOMATO_DATA_FILE = BASE_DIR / "tomato_history.csv"
MANDI_DATA_FILE = BASE_DIR / "mandi_prices.csv"

# DEMO ASSUMPTIONS — replace with verified costs when available.
FREIGHT_PER_TONNE_KM = 1.8
MARKET_FEE_RATE = 0.02
SPOILAGE_RATE = 0.01

# Use only records within this many days of the latest date in the dataset.
RECENT_DAYS = 90

# Exclude implausible prices for this initial demo.
# These are configurable filters, not official market-price limits.
MIN_PRICE = 100
MAX_PRICE = 10000


def haversine_km(lat1, lon1, lat2, lon2):
    """Calculate straight-line distance between two coordinates."""
    earth_radius_km = 6371

    lat1, lon1, lat2, lon2 = map(
        math.radians, [lat1, lon1, lat2, lon2]
    )

    dlat = lat2 - lat1
    dlon = lon2 - lon1

    a = (
        math.sin(dlat / 2) ** 2
        + math.cos(lat1)
        * math.cos(lat2)
        * math.sin(dlon / 2) ** 2
    )

    return 2 * earth_radius_km * math.asin(
        math.sqrt(min(1.0, a))
    )




def load_recent_market_data(crop="Tomato", state=None):
    """Load historical crop prices with market coordinates."""

    crop_normalized = crop.strip().casefold()

    if crop_normalized == "tomato":
        data_file = TOMATO_DATA_FILE
        df = pd.read_csv(data_file)

    elif crop_normalized in {"onion", "garlic", "potato"}:
        data_file = BASE_DIR / "apmc-arrivals-and-prices-old-data.csv"
        df = pd.read_csv(data_file, low_memory=False)

    else:
        return pd.DataFrame(), None

    required = [
        "report_date",
        "state_name",
        "market_center",
        "latitude",
        "longitude",
        "commodity",
        "modal_price",
    ]

    missing = [col for col in required if col not in df.columns]
    if missing:
        raise ValueError(f"Missing columns in dataset: {missing}")

    df["report_date"] = pd.to_datetime(
        df["report_date"], errors="coerce"
    )

    for col in ["latitude", "longitude", "modal_price"]:
        df[col] = pd.to_numeric(df[col], errors="coerce")

    df = df.dropna(subset=required)

    df["commodity"] = df["commodity"].astype(str).str.strip()

    df = df[
        df["commodity"].str.casefold() == crop_normalized
    ]

    df = df[df["modal_price"].between(MIN_PRICE, MAX_PRICE)]

    if state:
        df = df[
            df["state_name"].astype(str).str.strip().str.casefold()
            == state.strip().casefold()
        ]

    if df.empty:
        return df, None

    latest_date = df["report_date"].max()
    cutoff_date = latest_date - pd.Timedelta(days=RECENT_DAYS)

    recent = df[df["report_date"] >= cutoff_date].copy()

    latest = (
        recent.sort_values("report_date")
        .groupby(["state_name", "market_center"], as_index=False)
        .tail(1)
        .copy()
    )

    return latest, latest_date




def recommend_markets(
    farmer_lat,
    farmer_lon,
    quantity_tonnes,
    crop="Tomato",
    state=None,
    top_n=5,
):
    """Rank markets by estimated return using recent historical prices."""

    if not (-90 <= farmer_lat <= 90):
        raise ValueError("Latitude must be between -90 and 90.")

    if not (-180 <= farmer_lon <= 180):
        raise ValueError("Longitude must be between -180 and 180.")

    if quantity_tonnes <= 0:
        raise ValueError("Quantity must be greater than zero.")

    if top_n < 1:
        raise ValueError("top_n must be at least 1.")

    markets, latest_date = load_recent_market_data(crop, state)

    if markets.empty:
        return {
            "status": "no_data",
            "message": (
                "No eligible recent price records found. "
                "Try another crop or state."
            ),
            "results": [],
        }

    markets["distance_km"] = markets.apply(
        lambda row: haversine_km(
            farmer_lat,
            farmer_lon,
            row["latitude"],
            row["longitude"],
        ),
        axis=1,
    )

    # Historical modal price is Rs per quintal.
    # One tonne = ten quintals.
    markets["gross_revenue_rs"] = (
        markets["modal_price"] * 10 * quantity_tonnes
    )

    # Straight-line distance is only a rough distance proxy.
    markets["transport_cost_rs"] = (
        markets["distance_km"]
        * FREIGHT_PER_TONNE_KM
        * quantity_tonnes
    )

    markets["market_fee_rs"] = (
        markets["gross_revenue_rs"] * MARKET_FEE_RATE
    )

    markets["spoilage_loss_rs"] = (
        markets["gross_revenue_rs"] * SPOILAGE_RATE
    )

    markets["estimated_net_return_rs"] = (
        markets["gross_revenue_rs"]
        - markets["transport_cost_rs"]
        - markets["market_fee_rs"]
        - markets["spoilage_loss_rs"]
    )

    markets = markets.sort_values(
        "estimated_net_return_rs",
        ascending=False,
    )

    results = []

    for _, row in markets.head(top_n).iterrows():
        results.append(
            {
                "market": str(row["market_center"]),
                "state": str(row["state_name"]),
                "distance_km_straight_line": round(
                    float(row["distance_km"]), 1
                ),
                "historical_price_rs_per_quintal": round(
                    float(row["modal_price"]), 2
                ),
                "price_date": row["report_date"].strftime("%Y-%m-%d"),
                "estimated_gross_revenue_rs": round(
                    float(row["gross_revenue_rs"]), 2
                ),
                "estimated_transport_cost_rs": round(
                    float(row["transport_cost_rs"]), 2
                ),
                "estimated_market_fee_rs": round(
                    float(row["market_fee_rs"]), 2
                ),
                "estimated_spoilage_loss_rs": round(
                    float(row["spoilage_loss_rs"]), 2
                ),
                "estimated_net_return_rs": round(
                    float(row["estimated_net_return_rs"]), 2
                ),
            }
        )

    return {
        "status": "success",
        "crop": crop,
        "quantity_tonnes": quantity_tonnes,
        "latest_date_in_filtered_dataset": latest_date.strftime("%Y-%m-%d"),
        "recent_record_window_days": RECENT_DAYS,
        "records_used": len(markets),
        "assumptions": {
            "freight_rs_per_tonne_km": FREIGHT_PER_TONNE_KM,
            "market_fee_rate": MARKET_FEE_RATE,
            "spoilage_rate": SPOILAGE_RATE,
            "distance_method": "Straight-line, not road distance",
            "price_filter_rs_per_quintal": [
                MIN_PRICE,
                MAX_PRICE,
            ],
        },
        "warning": (
            "Historical estimates only, not live prices or guaranteed profit. "
            "Cost assumptions and straight-line distances are approximate. "
            "The latest dataset date may be old."
        ),
        "results": results,
    }


if __name__ == "__main__":
    # Demo coordinates: Gwalior, Madhya Pradesh.
    # Replace these with the farmer's actual coordinates when available.
    report = recommend_markets(
        farmer_lat=26.2183,
        farmer_lon=78.1828,
        quantity_tonnes=1,
        crop="Tomato",
        top_n=5,
    )

    print("\nHARVESTROUTE MARKET RECOMMENDATIONS")
    print("=" * 42)

    for key, value in report.items():
        if key != "results":
            print(f"{key}: {value}")

    print("\nTOP MARKETS")

    if not report["results"]:
        print(report["message"])
    else:
        for index, market in enumerate(report["results"], start=1):
            print(f"\n{index}. {market['market']}, {market['state']}")
            print(
                "   Historical price: "
                f"Rs {market['historical_price_rs_per_quintal']}/quintal"
            )
            print(f"   Price date: {market['price_date']}")
            print(
                "   Straight-line distance: "
                f"{market['distance_km_straight_line']} km"
            )
            print(
                "   Estimated net return: "
                f"Rs {market['estimated_net_return_rs']}"
            )

    print("\nRemember: these are historical estimates, not live offers.")
