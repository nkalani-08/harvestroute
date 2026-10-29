
from pathlib import Path

# Small starter knowledge base for HarvestRoute.
# We'll expand this with trusted agricultural documents later.
KNOWLEDGE_BASE = [
    {
        "topic": "mandi",
        "text": (
            "An agricultural mandi is a market where farmers sell "
            "their crops to buyers and traders. Market prices can "
            "vary by crop, location, quality, arrivals, and date."
        ),
    },
    {
        "topic": "net_return",
        "text": (
            "HarvestRoute estimates net return by subtracting "
            "estimated transport costs, market fees, and spoilage "
            "allowance from gross crop revenue. These are estimates, "
            "not guaranteed profit."
        ),
    },
    {
        "topic": "historical_prices",
        "text": (
            "Historical mandi and APMC records describe prices "
            "reported on past dates. They must not be presented as "
            "live prices. Always show the source date when available."
        ),
    },
    {
        "topic": "recommendations",
        "text": (
            "HarvestRoute supports Tomato, Onion, Garlic, and Potato. "
            "Its market recommendations rank candidate markets using "
            "estimated net returns and geographic distance."
        ),
    },
]


def retrieve_context(question: str, top_k: int = 2) -> list[str]:
    """Retrieve knowledge-base entries that share words with a question."""

    question_words = {
        word.strip(".,?!:;()[]{}\"'").casefold()
        for word in question.split()
        if len(word.strip(".,?!:;()[]{}\"'")) > 2
    }

    scored = []

    for item in KNOWLEDGE_BASE:
        text = item["topic"] + " " + item["text"]
        text_words = {
            word.strip(".,?!:;()[]{}\"'").casefold()
            for word in text.split()
        }

        score = len(question_words & text_words)

        if score > 0:
            scored.append((score, item["text"]))

    scored.sort(key=lambda result: result[0], reverse=True)

    return [text for _, text in scored[:top_k]]
