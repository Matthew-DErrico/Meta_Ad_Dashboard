from fastapi import APIRouter
from fastapi import Query
from typing import Optional
from snowflake_service import SnowflakeService
from sql_service import SQLiteService
from schemas import OverviewResponse
from schemas import AdvertiserSpend

metadata_router = APIRouter()
#sf = SnowflakeService()
sf = SQLiteService()
@metadata_router.get("/filters")
def get_filters():

    geo_query = "SELECT DISTINCT geography_name FROM DIM_GEOGRAPHY"
    platform_query = "SELECT DISTINCT platform_name FROM DIM_PLATFORM"

    geos = sf.run_query(geo_query)
    platforms = sf.run_query(platform_query)

    return {
        "geographies": [g[0] for g in geos],
        "platforms": [p[0] for p in platforms],
    }