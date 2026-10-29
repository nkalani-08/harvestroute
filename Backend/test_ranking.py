
from data_retrieval import retrieve_market_prices
from ranking import rank_markets

markets = retrieve_market_prices("Tomato")

ranked = rank_markets(
    market_records=markets,
    quantity_tonnes=2,
)

print("Top 5 destinations for 2 tonnes of tomatoes:\n")

for market in ranked[:5]:
    print(
        f'{market["rank"]}. {market["market"]}, '
        f'{market["state"]}'
    )
    print(f'   Modal price: ₹{market["modal_price_per_quintal"]}/quintal')
    print(f'   Estimated net return: ₹{market["netRupees"]}')
    print(f'   Warning: {market["data_warning"]}\n')
