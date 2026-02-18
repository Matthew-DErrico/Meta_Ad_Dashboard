from fastapi import FastAPI
from analytics import router as analytics_router
from analytics import router as advertisers_router

app = FastAPI(title="Political Advertising Transparency API")

app.include_router(analytics_router, prefix="/analytics")
