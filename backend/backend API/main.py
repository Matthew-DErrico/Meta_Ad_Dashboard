from fastapi import FastAPI
from analytics import analytics_router
from exploration import exploration_router
from metadata import metadata_router

app = FastAPI(title="Political Advertising Transparency API")

app.include_router(analytics_router, prefix="/analytics")
app.include_router(exploration_router, prefix="/exploration")
app.include_router(metadata_router, prefix="/metadata")
