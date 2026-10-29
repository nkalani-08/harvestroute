
from ai_assistant import ask_adaption

print("Testing HarvestRoute AI + RAG...\n")

answer = ask_adaption(
    "How does HarvestRoute calculate net return?"
)

print("HarvestRoute AI answer:\n")
print(answer)
