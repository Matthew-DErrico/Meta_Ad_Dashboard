from fastapi import APIRouter
from fastapi import Query
from typing import Optional
from snowflake_service import SnowflakeService

metadata_router = APIRouter()
sf = SnowflakeService()
@metadata_router.get("/filters")
def get_filters():

    page_query = """
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

    pages = sf.run_query(page_query)
    platforms = sf.run_query(platform_query)

    return {
        "pages": [pg[0] for pg in pages],   # now PAGE_NAME proxy
        "platforms": [pl[0] for pl in platforms],
    }