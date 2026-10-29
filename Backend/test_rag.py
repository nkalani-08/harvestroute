
from rag_service import retrieve_context

question = "How does HarvestRoute calculate net return?"

results = retrieve_context(question)

print("Retrieved context:\n")

for item in results:
    print("-", item)
    print()
