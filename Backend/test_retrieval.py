
from data_retrieval import retrieve_market_prices

results = retrieve_market_prices("Tomato")

print("Matching records:", len(results))

for market in results[:5]:
    print(
        market["market"],
        "|", market["state"],
        "| ₹", market["modal_price_per_quintal"],
        "per quintal",
        "|", market["arrival_date"],
    )
