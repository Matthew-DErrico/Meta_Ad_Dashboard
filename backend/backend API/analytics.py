from fastapi import APIRouter
from fastapi import Query
from typing import Optional
from snowflake_service import SnowflakeService

analytics_router = APIRouter()
sf = SnowflakeService()

# takes an input of each possible filter for a given endpoint and creates a custom where clause for that endpoints query
def build_filters(page_name=None, platform=None, keyword=None, start_date=None, end_date=None):

    conditions = []
    params = {}

    if page_name:
        conditions.append("PAGE_NAME = %(page_name)s")
        params["page_name"] = page_name

    if platform:
        conditions.append("p.VALUE::STRING = %(platform)s")
        params["platform"] = platform

    if keyword:
        conditions.append("""
            (
                AD_TEXT ILIKE %(keyword)s 
                OR LINK_TITLE ILIKE %(keyword)s 
                OR LINK_DESCRIPTION ILIKE %(keyword)s 
                OR LINK_CAPTION ILIKE %(keyword)s 
                OR PAGE_NAME ILIKE %(keyword)s 
                OR ARRAY_TO_STRING(f.PUBLISHER_PLATFORMS, ',') ILIKE %(keyword)s
            )
        """)
        params["keyword"] = f"%{keyword}%"

    if start_date:
        conditions.append("START_DATE >= %(start_date)s")
        params["start_date"] = start_date

    if end_date:
        conditions.append("END_DATE <= %(end_date)s")
        params["end_date"] = end_date

    where_clause = ""
    if conditions:
        where_clause = "WHERE " + " AND ".join(conditions)

    return where_clause, params

# Provides a basic overview of all unique pages
@analytics_router.get("/overview")
def get_overview():

    query = """
        SELECT
            COUNT(*) AS total_ads,
            COUNT(DISTINCT PAGE_ID) AS unique_pages,
            SUM(
                (TRY_TO_NUMBER(SPLIT_PART(SPEND_RANGE, '-', 1)) +
                 TRY_TO_NUMBER(SPLIT_PART(SPEND_RANGE, '-', 2))) / 2
            ) AS ESTIMATED_SPENDING,
            SUM(
                (TRY_TO_NUMBER(SPLIT_PART(IMPRESSIONS_RANGE, '-', 1)) +
                 TRY_TO_NUMBER(SPLIT_PART(IMPRESSIONS_RANGE, '-', 2))) / 2
            ) AS ESTIMATED_IMPRESSIONS,
        FROM META_ADS_DB.ANALYTICS.FACT_ADS f
    """

    rows = sf.run_query(query)

    return {
        "total_ads": int(rows[0][0]),
        "unique_pages": int(rows[0][1]),
        "estimated_spending": float(rows[0][2]),
        "estimated_impressions": int(rows[0][3]),
    }

# Outputs the top 10 pages based on estimated spending
# The output can be filtered by a specified page name or platform
@analytics_router.get("/top-advertisers")
def top_advertisers(page_name: Optional[str] = None, platform: Optional[str] = None):

    where_clause, params = build_filters(page_name, platform)

    query = f"""
        SELECT
            PAGE_NAME,
            SUM(
                (TRY_TO_NUMBER(SPLIT_PART(SPEND_RANGE, '-', 1)) +
                 TRY_TO_NUMBER(SPLIT_PART(SPEND_RANGE, '-', 2))) / 2
            ) AS ESTIMATED_SPENDING,
        FROM META_ADS_DB.ANALYTICS.FACT_ADS f
        LEFT JOIN LATERAL FLATTEN(INPUT => f.PUBLISHER_PLATFORMS) p
        {where_clause}
        GROUP BY PAGE_NAME
        ORDER BY ESTIMATED_SPENDING DESC
        LIMIT 10
    """

    rows = sf.run_query(query, params)

    return [
        {"advertiser_name": r[0], "estimated_spending": float(r[1])}
        for r in rows
    ]

# provides a list of dates and the total estimated spending for each
# The list can be filtered using a specific page name, platform, keyword, start date or end date
@analytics_router.get("/spend-trend")
def spend_trend(
    page_name: Optional[str] = None,
    platform: Optional[str] = None,
    keyword: Optional[str] = Query(None, min_length=2),
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
):

    where_clause, params = build_filters(
        page_name, platform, keyword, start_date, end_date
    )

    query = f"""
        SELECT
            START_DATE,
            SUM(
                (TRY_TO_NUMBER(SPLIT_PART(SPEND_RANGE, '-', 1)) +
                 TRY_TO_NUMBER(SPLIT_PART(SPEND_RANGE, '-', 2))) / 2
            ) AS ESTIMATED_SPENDING,
        FROM META_ADS_DB.ANALYTICS.FACT_ADS f
        LEFT JOIN LATERAL FLATTEN(INPUT => f.PUBLISHER_PLATFORMS) p
        {where_clause}
        GROUP BY START_DATE
        ORDER BY START_DATE
    """

    rows = sf.run_query(query, params)

    return [{"date": r[0], "estimated_spending": float(r[1])} for r in rows]

# Provides a list of dates and the total number of ads posted on that day
# The list can be filtered using a specific page name, platform, keyword, start date or end date
@analytics_router.get("/ad-volume-trend")
def ad_volume_trend(
    page_name: Optional[str] = None,
    platform: Optional[str] = None,
    keyword: Optional[str] = Query(None, min_length=2),
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
):

    where_clause, params = build_filters(
        page_name,
        platform,
        keyword,
        start_date,
        end_date
    )

    query = f"""
        SELECT
            START_DATE,
            COUNT(*) AS total_ads
        FROM META_ADS_DB.ANALYTICS.FACT_ADS f
        LEFT JOIN LATERAL FLATTEN(INPUT => f.PUBLISHER_PLATFORMS) p
        {where_clause}
        GROUP BY START_DATE
        ORDER BY START_DATE
    """

    rows = sf.run_query(query, params)

    return [
        {"date": r[0], "total_ads": int(r[1])}
        for r in rows
    ]

# Outputs each platform an ad has been run on and the total amount of estimated spending for each
# The output can be filtered using a specified page name
@analytics_router.get("/platform-breakdown")
def platform_breakdown(page_name: Optional[str] = None):

    where_clause, params = build_filters(page_name=page_name)

    query = f"""
        SELECT
            VALUE::STRING AS platform,
            COUNT(*) AS TOTAL_ADS,
            SUM(
                (TRY_TO_NUMBER(SPLIT_PART(SPEND_RANGE, '-', 1)) +
                 TRY_TO_NUMBER(SPLIT_PART(SPEND_RANGE, '-', 2))) / 2
            ) AS ESTIMATED_SPENDING,
        FROM META_ADS_DB.ANALYTICS.FACT_ADS f,
        LATERAL FLATTEN(INPUT => f.PUBLISHER_PLATFORMS) p
        {where_clause}
        GROUP BY platform
        ORDER BY ESTIMATED_SPENDING DESC
    """

    rows = sf.run_query(query, params)

    return [{"platform": r[0], "total_ads:": r[1], "estimated_spending": float(r[2])} for r in rows]

# Provides the top campaigns (shows top 10 by default) based on total estimated spending as well as the number of ads ran
# The list can be filtered using a specific page, platform or keyword
@analytics_router.get("/top-campaigns")
def top_campaigns(
    limit: int = 10,
    page_name: Optional[str] = None,
    platform: Optional[str] = None,
    keyword: Optional[str] = None,
):

    where_clause, params = build_filters(
        page_name,
        platform,
        keyword
    )

    query = f"""
        SELECT
            COALESCE(LINK_TITLE, LEFT(AD_TEXT, 50)) AS campaign,
            COUNT(*) AS ad_count,
            SUM(
                (TRY_TO_NUMBER(SPLIT_PART(SPEND_RANGE, '-', 1)) +
                 TRY_TO_NUMBER(SPLIT_PART(SPEND_RANGE, '-', 2))) / 2
            ) AS ESTIMATED_SPENDING,
        FROM META_ADS_DB.ANALYTICS.FACT_ADS f
        LEFT JOIN LATERAL FLATTEN(INPUT => f.PUBLISHER_PLATFORMS) p
        {where_clause}
        GROUP BY campaign
        ORDER BY ESTIMATED_SPENDING DESC
        LIMIT {limit}
    """

    rows = sf.run_query(query, params)

    return [
        {
            "campaign": r[0],
            "ad_count": int(r[1]),
            "estimated_spending": float(r[2])
        }
        for r in rows
    ]

# Outputs each creative type along with the total number of ads in each category
@analytics_router.get("/creative-breakdown")
def creative_breakdown():

    query = """
        SELECT
            CASE
                WHEN LINK_TITLE IS NOT NULL THEN 'LINK_AD'
                ELSE 'TEXT_AD'
            END AS creative_type,
            COUNT(*) AS ad_count
        FROM META_ADS_DB.ANALYTICS.FACT_ADS f
        GROUP BY creative_type
    """

    rows = sf.run_query(query)

    return [{"creative_type": r[0], "ad_count": int(r[1])} for r in rows]
