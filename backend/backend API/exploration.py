from fastapi import APIRouter
from fastapi import Query
from typing import Optional
from snowflake_service import SnowflakeService
from analytics import build_filters
from schemas import OverviewResponse
from schemas import AdvertiserSpend

exploration_router = APIRouter()
sf = SnowflakeService()

@exploration_router.get("/search")
def search_ads(
    keyword: str = Query(..., min_length=2),
    page: Optional[str] = None,
    geography: Optional[str] = None,
    platform: Optional[str] = None,
):

    where_clause, params = build_filters(
        page,
        platform,
        keyword
    )

    query = f"""
    SELECT
        AD_ID,
        PAGE_NAME,
        START_DATE,
        AD_TEXT,
        LINK_TITLE,
        LINK_DESCRIPTION,
        SNAPSHOT_URL,
        SPEND_RANGE,
        TRY_TO_NUMBER(SPLIT_PART(SPEND_RANGE, '-', 1)) + TRY_TO_NUMBER(SPLIT_PART(SPEND_RANGE, '-', 2)) / 2 AS ESTIMATED_SPENDING,
        IMPRESSIONS_RANGE,
        TRY_TO_NUMBER(SPLIT_PART(IMPRESSIONS_RANGE, '-', 1)) + TRY_TO_NUMBER(SPLIT_PART(IMPRESSIONS_RANGE, '-', 2)) / 2 AS ESTIMATED_IMPRESSIONS
    FROM META_ADS_DB.ANALYTICS.FACT_ADS f
    LEFT JOIN LATERAL FLATTEN(INPUT => f.PUBLISHER_PLATFORMS) p,
    {where_clause}
    LIMIT 50
"""

    rows = sf.run_query(query, params)

    return [
        {
            "ad_id": r[0],
            "page_name": r[1],
            "start_date": r[2],
            "ad_text": r[3],
            "link_title": r[4],
            "link_description": r[5],
            "spending_range": r[7],
            "estimated_spending": r[8],
            "impressions_range": r[9],
            "estimated_impressions": r[10],
            "snapshot_url": r[6]
        }
        for r in rows
    ]

@exploration_router.get("/ad-details/{ad_id}")
def ad_details(ad_id: str):

    query = """
        SELECT
            AD_ID,
            PAGE_ID,
            PAGE_NAME,
            AD_TEXT,
            LINK_TITLE,
            LINK_DESCRIPTION,
            LINK_CAPTION,
            SNAPSHOT_URL,
            START_DATE,
            END_DATE,
            PUBLISHER_PLATFORMS,
            SPEND_RANGE,
            IMPRESSIONS_RANGE,
            TRY_TO_NUMBER(SPLIT_PART(SPEND_RANGE, '-', 1)) + TRY_TO_NUMBER(SPLIT_PART(SPEND_RANGE, '-', 2)) / 2 AS ESTIMATED_SPENDING,
            TRY_TO_NUMBER(SPLIT_PART(IMPRESSIONS_RANGE, '-', 1)) + TRY_TO_NUMBER(SPLIT_PART(IMPRESSIONS_RANGE, '-', 2)) / 2 AS ESTIMATED_IMPRESSIONS
        FROM META_ADS_DB.ANALYTICS.FACT_ADS f
        WHERE AD_ID = %(ad_id)s
    """

    rows = sf.run_query(query, {"ad_id": ad_id})

    if not rows:
        return {}

    r = rows[0]

    return {
        "ad_id": r[0],
        "page_id": r[1],
        "page_name": r[2],
        "ad_text": r[3],
        "link_title": r[4],
        "link_description": r[5],
        "link_caption": r[6],
        "snapshot_url": r[7],
        "start_date": r[8],
        "end_date": r[9],
        "platforms": r[10],
        "spend_range": r[11],
        "impressions_range": r[12],
        "estimated_spending": float(r[13]),
        "estimated_impressions": float(r[14]),
    }

@exploration_router.get("/advertiser-details")
def advertiser_details(
    page_name: str,
    platform: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
):

    where_clause, params = build_filters(
        page_name=page_name,
        platform=platform,
        start_date=start_date,
        end_date=end_date
    )

    query = f"""
        SELECT
            PAGE_NAME,
            COUNT(*) AS total_ads,
            SUM(
                (TRY_TO_NUMBER(SPLIT_PART(SPEND_RANGE, '-', 1)) +
                 TRY_TO_NUMBER(SPLIT_PART(SPEND_RANGE, '-', 2))) / 2
            ) AS ESTIMATED_SPENDING,
            SUM(
                (TRY_TO_NUMBER(SPLIT_PART(IMPRESSIONS_RANGE, '-', 1)) +
                 TRY_TO_NUMBER(SPLIT_PART(IMPRESSIONS_RANGE, '-', 2))) / 2
            ) AS ESTIMATED_IMPRESSIONS,
            MIN(START_DATE) AS first_seen,
            MAX(START_DATE) AS last_seen
        FROM META_ADS_DB.ANALYTICS.FACT_ADS f
        {where_clause}
        GROUP BY PAGE_NAME
    """

    rows = sf.run_query(query, params)

    if not rows:
        return {}

    r = rows[0]

    return {
        "advertiser": r[0],
        "total_ads": int(r[1]),
        "estimated_spending": float(r[2]),
        "estimated_impressions": int(r[3]),
        "first_seen": r[4],
        "last_seen": r[5],
    }

@exploration_router.get("/campaign-details")
def campaign_details(
    campaign: str,
    page_name: Optional[str] = None,
):

    params = {
        "campaign": campaign
    }

    query = """
        SELECT
            COALESCE(LINK_TITLE, LEFT(AD_TEXT, 50)) AS campaign,
            COUNT(*) AS total_ads,
            SUM(
                (TRY_TO_NUMBER(SPLIT_PART(SPEND_RANGE, '-', 1)) +
                 TRY_TO_NUMBER(SPLIT_PART(SPEND_RANGE, '-', 2))) / 2
            ) AS ESTIMATED_SPENDING,
            SUM(
                (TRY_TO_NUMBER(SPLIT_PART(IMPRESSIONS_RANGE, '-', 1)) +
                 TRY_TO_NUMBER(SPLIT_PART(IMPRESSIONS_RANGE, '-', 2))) / 2
            ) AS ESTIMATED_IMPRESSIONS,
            MIN(START_DATE) AS start_date,
            MAX(START_DATE) AS end_date

        FROM META_ADS_DB.ANALYTICS.FACT_ADS f
        WHERE COALESCE(LINK_TITLE, LEFT(AD_TEXT, 50)) = %(campaign)s
        GROUP BY campaign
    """

    rows = sf.run_query(query, params)

    if not rows:
        return {}

    r = rows[0]

    return {
        "campaign": r[0],
        "total_ads": int(r[1]),
        "estimated_spending": float(r[2]),
        "estimated_impressions": int(r[3]),
        "start_date": r[4],
        "end_date": r[5],
    }

@exploration_router.get("/ads")
def ads_list(
    keyword: Optional[str] = None,
    page: Optional[str] = None,
    platform: Optional[str] = None,
    limit: int = 100
):

    where_clause, params = build_filters(page, platform, keyword)

    query = f"""
            SELECT
                AD_ID,
                PAGE_NAME,
                START_DATE,
                AD_TEXT,
                SNAPSHOT_URL
            FROM META_ADS_DB.ANALYTICS.FACT_ADS f
            LEFT JOIN LATERAL FLATTEN(INPUT => f.PUBLISHER_PLATFORMS) p
            {where_clause}
            ORDER BY START_DATE DESC
            LIMIT {limit}
        """
    rows = sf.run_query(query, params)

    return [
        {
            "ad_id": r[0],
            "page_name": r[1],
            "start_date": r[2],
            "ad_text": r[3],
            "snapshot_url": r[4]
        }
        for r in rows
    ]
