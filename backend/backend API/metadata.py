from fastapi import APIRouter
from fastapi import Query
from typing import Optional
from snowflake_service import SnowflakeService
from schemas import OverviewResponse
from schemas import AdvertiserSpend

metadata_router = APIRouter()
sf = SnowflakeService()
@metadata_router.get("/filters")
def get_filters():

    geo_query = """
        SELECT DISTINCT PAGE_NAME
        FROM META_ADS_DB.ANALYTICS.FACT_ADS
        WHERE PAGE_NAME IS NOT NULL
        ORDER BY PAGE_NAME
    """

    platform_query = """
        SELECT DISTINCT VALUE::STRING AS PLATFORM
        FROM META_ADS_DB.ANALYTICS.FACT_ADS,
        LATERAL FLATTEN(INPUT => PUBLISHER_PLATFORMS)
        ORDER BY PLATFORM
    """

    geos = sf.run_query(geo_query)
    platforms = sf.run_query(platform_query)

    return {
        "geographies": [g[0] for g in geos],   # now PAGE_NAME proxy
        "platforms": [p[0] for p in platforms],
    }