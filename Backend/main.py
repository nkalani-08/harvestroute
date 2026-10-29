
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from workflow import workflow
from ai_assistant import ask_adaption

app = FastAPI(title="HarvestRoute Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class RecommendationRequest(BaseModel):
    farmer_lat: float = Field(ge=-90, le=90)
    farmer_lon: float = Field(ge=-180, le=180)
    quantity_tonnes: float = Field(gt=0)
    crop: str = "Tomato"
    state: str | None = None
    top_n: int = Field(default=5, ge=1, le=20)
class AIAssistantRequest(BaseModel):
    question: str = Field(min_length=1, max_length=2000)

@app.get("/")
def home():
    return {"message": "HarvestRoute backend is working!"}


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/recommendations")
def get_recommendations(request: RecommendationRequest):
    try:
        result = workflow.invoke({
            "farmer_lat": request.farmer_lat,
            "farmer_lon": request.farmer_lon,
            "quantity_tonnes": request.quantity_tonnes,
            "crop": request.crop,
            "state": request.state,
            "top_n": request.top_n,
        })

        if result.get("error"):
            raise HTTPException(
                status_code=400,
                detail=result["error"],
            )

        return {
            "status": "success",
            "recommendations": result.get("recommendations", {}),
            "forecast": result.get(
                "forecast",
                {
                    "status": "unavailable",
                    "message": "No forecast was returned.",
                },
            ),
        }

    except HTTPException:
        raise

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"HarvestRoute workflow failed: {exc}",
        )
@app.post("/ai-assistant")
def ai_assistant(request: AIAssistantRequest):
    try:
        question = request.question.strip()

        if not question:
            raise HTTPException(
                status_code=400,
                detail="Please enter a question.",
            )

        answer = ask_adaption(question)

        return {
            "status": "success",
            "answer": answer,
        }

    except HTTPException:
        raise

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"AI assistant failed: {exc}",
        )
    
    
