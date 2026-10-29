
import pandas as pd
from pathlib import Path
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error
from sklearn.model_selection import train_test_split

BASE_DIR = Path(__file__).parent
DATA_FILE = BASE_DIR / "tomato_history.csv"


def load_data():
    df = pd.read_csv(DATA_FILE, parse_dates=["report_date"])

    df["modal_price"] = pd.to_numeric(df["modal_price"], errors="coerce")
    df["arrivals_tonnes"] = pd.to_numeric(
        df["arrivals_tonnes"], errors="coerce"
    )

    df = df.dropna(
        subset=["report_date", "market_center", "modal_price"]
    )
    df = df[df["modal_price"] > 0]

    return df.sort_values("report_date")


def train_market_model(df, market_name, state_name=None):
    market = df[
        df["market_center"].str.casefold() == market_name.casefold()
    ].copy()

    if state_name:
        market = market[
            market["state_name"].str.casefold() == state_name.casefold()
        ]

    if market.empty:
        raise ValueError(f"No records found for market: {market_name}")

    # Combine duplicate records for the same market and date.
    market = (
        market.groupby("report_date", as_index=False)
        .agg(
            modal_price=("modal_price", "mean"),
            arrivals_tonnes=("arrivals_tonnes", "mean"),
        )
        .sort_values("report_date")
    )

    # Use recent prices and arrivals to estimate the next observed day's price.
    market["price_lag_1"] = market["modal_price"].shift(1)
    market["price_lag_7"] = market["modal_price"].shift(7)
    market["arrival_lag_1"] = market["arrivals_tonnes"].shift(1)
    market["target"] = market["modal_price"]

    features = [
        "price_lag_1",
        "price_lag_7",
        "arrival_lag_1",
    ]

    data = market.dropna(subset=features + ["target"]).copy()

    if len(data) < 40:
        raise ValueError(
            f"Only {len(data)} usable daily records for {market_name}. "
            "Choose a market with more historical records."
        )

    split = int(len(data) * 0.8)
    train = data.iloc[:split]
    test = data.iloc[split:]

    model = RandomForestRegressor(
        n_estimators=100,
        random_state=42,
        min_samples_leaf=3,
    )
    model.fit(train[features], train["target"])

    predictions = model.predict(test[features])
    mae = mean_absolute_error(test["target"], predictions)

    # Forecast one next observed day using the latest available features.
    latest = data.iloc[-1]
    next_prediction = float(
        model.predict(pd.DataFrame([latest[features].to_dict()]))[0]
    )

    return {
        "market": market_name,
        "state": state_name,
        "records_used": len(data),
        "test_mae_rs_per_quintal": round(float(mae), 2),
        "last_observed_date": market["report_date"].max().strftime("%Y-%m-%d"),
        "last_observed_price": round(float(market.iloc[-1]["modal_price"]), 2),
        "next_observed_day_estimate": round(next_prediction, 2),
        "unit": "Rs/Quintal",
        "note": (
            "Experimental one-step estimate, not a validated 7-day forecast. "
            "Market reporting dates may have gaps."
        ),
    }


if __name__ == "__main__":
    data = load_data()

    # Pick a market with enough historical observations.
    counts = data.groupby(["state_name", "market_center"]).size()
    counts = counts.sort_values(ascending=False)

    print("Markets with most tomato records:")
    print(counts.head(10).to_string())

    state, market_name = counts.index[0]
    print(f"\nTraining model for {market_name}, {state}...")

    result = train_market_model(data, market_name, state)
    print("\nForecast result:")
    for key, value in result.items():
        print(f"{key}: {value}")
