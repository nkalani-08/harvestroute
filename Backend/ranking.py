
def rank_markets(
    market_records,
    quantity_tonnes,
    freight_per_tonne_km=1.8,
    default_distance_km=100,
    fee_percent=2.0,
    spoilage_percent=1.0,
):
    """
    Rank markets by estimated net return.

    Market distances and cost percentages are estimates until
    verified data sources are connected.
    """

    if quantity_tonnes <= 0:
        raise ValueError("Quantity must be greater than zero.")

    ranked = []

    for market in market_records:
        price = market["modal_price_per_quintal"]

        # 1 tonne = 10 quintals.
        gross_revenue = price * 10 * quantity_tonnes

        # Do not pretend the mandi CSV contains distances.
        distance_km = default_distance_km

        freight = (
            quantity_tonnes
            * distance_km
            * freight_per_tonne_km
        )

        fees = gross_revenue * fee_percent / 100
        spoilage = gross_revenue * spoilage_percent / 100

        net_return = gross_revenue - freight - fees - spoilage

        ranked.append({
            **market,
            "distance_km": distance_km,
            "gross_revenue": round(gross_revenue, 2),
            "freight": round(freight, 2),
            "fees": round(fees, 2),
            "spoilage": round(spoilage, 2),
            "netRupees": round(net_return, 2),
            "estimated": True,
            "data_warning": (
                "Distance, freight, fees and spoilage are assumed; "
                "verify them before making a selling decision."
            ),
        })

    ranked.sort(
        key=lambda item: item["netRupees"],
        reverse=True,
    )

    for rank, market in enumerate(ranked, start=1):
        market["rank"] = rank

    return ranked

