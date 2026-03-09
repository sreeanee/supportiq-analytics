from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import os
from dotenv import load_dotenv

from .sentiment import analyze_sentiment
from .categorize import categorize_ticket
from .forecast import generate_forecast

load_dotenv()

app = FastAPI(
    title="SupportIQ ML Service",
    description="Machine learning microservice for customer support analytics",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request/Response models
class SentimentRequest(BaseModel):
    text: str

class SentimentResponse(BaseModel):
    score: float
    label: str
    confidence: float

class CategorizeRequest(BaseModel):
    subject: str
    description: str

class CategorizeResponse(BaseModel):
    category: str
    confidence: float
    reasoning: str

class ForecastRequest(BaseModel):
    historical_data: List[dict]
    days_ahead: int = 7

class ForecastResponse(BaseModel):
    predictions: List[dict]

# Health check
@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "ml-service"}

# Sentiment analysis endpoint
@app.post("/sentiment", response_model=SentimentResponse)
async def sentiment_endpoint(request: SentimentRequest):
    try:
        result = analyze_sentiment(request.text)
        return SentimentResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Ticket categorization endpoint
@app.post("/categorize", response_model=CategorizeResponse)
async def categorize_endpoint(request: CategorizeRequest):
    try:
        result = categorize_ticket(request.subject, request.description)
        return CategorizeResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Forecast endpoint
@app.post("/forecast", response_model=ForecastResponse)
async def forecast_endpoint(request: ForecastRequest):
    try:
        predictions = generate_forecast(request.historical_data, request.days_ahead)
        return ForecastResponse(predictions=predictions)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
