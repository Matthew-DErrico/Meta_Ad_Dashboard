# Backend Analytics API Documentation

## Overview

This backend API provides analytics and exploration capabilities for advertising performance data stored in a **Snowflake data warehouse**. The API is built using **FastAPI** and exposes endpoints that allow dashboards or applications to retrieve aggregated metrics, search advertising data, and fetch metadata for filtering.

The API is organized into three primary layers:

| Layer | Purpose |
|------|------|
| Analytics | Aggregated data used for dashboards and summaries |
| Exploration | Detailed search and exploration of advertising data |
| Metadata | Supporting data such as available filters |

All queries operate primarily on the **Fact_Ad_Performance** table and join supporting **dimension tables** to enrich the results.

# Shared Utility Function

## build_filters()

### Purpose

The `build_filters()` function dynamically constructs SQL `WHERE` conditions based on optional query parameters. This allows multiple endpoints to reuse consistent filtering logic.

### Parameters

| Parameter | Type | Description |
|----------|------|-------------|
| geography | Optional[str] | Filters results by geography |
| platform | Optional[str] | Filters results by advertising platform |
| keyword | Optional[str] | Case-insensitive search for campaign name |
| start_date | Optional[str] | Filters results after this date |
| end_date | Optional[str] | Filters results before this date |

### Returns

The function returns: (where_clause, params)

Example:

    WHERE g.geography_name = %(geography)s AND p.platform_name = %(platform)s

and

    {
        "geography": "United States",
        "platform": "Facebook"
    }

These parameters are passed safely into the Snowflake query.

---

# Analytics Endpoints

**Base route: /analytics/**

These endpoints provide aggregated metrics for analytics dashboards.

---

## /overview

### Purpose

Returns high-level summary metrics across the entire dataset.

### SQL Query

```sql
SELECT
    SUM(ad_spend) AS total_spend,
    SUM(impressions) AS total_impressions,
    COUNT(DISTINCT advertiser_id) AS advertiser_count
FROM Fact_Ad_Performance
```

##### Explanation

| Metric           | Description |
|------------------|---|
| total_spend      | Total advertising spend |
| total_impressions | Total number of ad impressions |
| advertiser_count | Number of unique advertisers |

### Response
```json
{
  "total_spend": 102345.45,
  "total_impressions": 2543210,
  "advertiser_count": 120
}
```

## /top-advertisers
### Purpose

Returns the top advertisers ranked by total ad spend.

### Parameters

| Parameter | Type     | Description         |
|-----------|----------|---------------------|
| Geography | Optional | Filter by geography |
| Platform  | Optional | Filter by platform  |

### SQL Query

#### Explanation

1. Joins advertiser metadata with the fact table.
2. Applies optional filters for geography or platform.
3. Aggregates total ad spend per advertiser.
4. Returns the top 10 advertisers by spend.

### Response

```json
[
  {
    "advertiser_name": "Nike",
    "total_spend": 54000.23
  }
]
```

## /spend-trend

### Purpose

Provides time-series ad spend data.

This endpoint is typically used to generate line charts showing spend over time.

### SQL Query
```sql
SELECT
    d.date,
    SUM(f.ad_spend) AS total_spend
FROM Fact_Ad_Performance f
JOIN Dim_Date d ON f.date_id = d.date_id
LEFT JOIN Dim_Geography g ON f.geography_id = g.geography_id
LEFT JOIN Dim_Platform p ON f.platform_id = p.platform_id
LEFT JOIN Dim_Campaign c ON f.campaign_id = c.campaign_id
WHERE ...
GROUP BY d.date
ORDER BY d.date
```

### Response
```json
[
  {
    "date": "2024-06-01",
    "total_spend": 1345.22
  }
]
```

------------------------------------------------------------------------

## /geography-breakdown

### Purpose

Shows total ad spend grouped by geography.

### SQL Query
```sql
SELECT
    g.geography_name,
    SUM(f.ad_spend) AS total_spend
FROM Fact_Ad_Performance f
JOIN Dim_Geography g ON f.geography_id = g.geography_id
LEFT JOIN Dim_Platform p ON f.platform_id = p.platform_id
LEFT JOIN Dim_Campaign c ON f.campaign_id = c.campaign_id
LEFT JOIN Dim_Date d ON f.date_id = d.date_id
WHERE ...
GROUP BY g.geography_name
ORDER BY total_spend DESC
ORDER BY total_spend DESC
```
### Response
```json
[
  {
    "geography": "United States",
    "total_spend": 150000
  }
]
```

------------------------------------------------------------------------

## /platform-breakdown

### Purpose

Shows ad spend grouped by platform.

### SQL Query
```sql
SELECT
    p.platform_name,
    SUM(f.ad_spend) AS total_spend
FROM Fact_Ad_Performance f
JOIN Dim_Platform p ON f.platform_id = p.platform_id
LEFT JOIN Dim_Geography g ON f.geography_id = g.geography_id
LEFT JOIN Dim_Campaign c ON f.campaign_id = c.campaign_id
LEFT JOIN Dim_Date d ON f.date_id = d.date_id
WHERE ...
GROUP BY p.platform_name
```

### Response

```json

```

------------------------------------------------------------------------

## /top-campaigns

### Purpose

Returns the campaigns with the highest total ad spend.

### Parameters

| Parameters | Description                        |
|------------|------------------------------------|
| Limit      | Number of campaigns returned       |
| geography  | Optional filter based on geography |
| platform   | Optional filter based on platform  |
| keyword    | Campaign name search               |

### SQL Query

```sql
SELECT
    c.campaign_name,
    SUM(f.ad_spend) AS total_spend
FROM Fact_Ad_Performance f
JOIN Dim_Campaign c ON f.campaign_id = c.campaign_id
LEFT JOIN Dim_Geography g ON f.geography_id = g.geography_id
LEFT JOIN Dim_Platform p ON f.platform_id = p.platform_id
LEFT JOIN Dim_Date d ON f.date_id = d.date_id
WHERE ...
GROUP BY c.campaign_name
ORDER BY total_spend DESC
LIMIT {limit}
```

### Response

```json

```

------------------------------------------------------------------------

## /creative-breakdown

### Purpose

Counts the number of ads by creative type.

Creative types may include:

-   Video
-   Image
-   Carousel
-   Text

### SQL Query

```sql
SELECT
    c.creative_type,
    COUNT(*) AS ad_count
FROM Fact_Ad_Performance f
JOIN Dim_Ad_Creative c ON f.creative_id = c.creative_id
LEFT JOIN Dim_Geography g ON f.geography_id = g.geography_id
LEFT JOIN Dim_Platform p ON f.platform_id = p.platform_id
LEFT JOIN Dim_Date d ON f.date_id = d.date_id
WHERE ...
GROUP BY c.creative_type
```

### Response

```json

```
------------------------------------------------------------------------

# Exploration Endpoints

**Base route: /exploration/**

These endpoints allow deeper analysis and searching of ad data.

------------------------------------------------------------------------

## /search

### Purpose

Search campaigns by keyword.

### SQL Query

```sql
SELECT
    a.advertiser_name,
    c.campaign_name,
    SUM(f.ad_spend) AS total_spend
FROM Fact_Ad_Performance f
JOIN Dim_Advertiser a ON f.advertiser_id = a.advertiser_id
JOIN Dim_Campaign c ON f.campaign_id = c.campaign_id
LEFT JOIN Dim_Geography g ON f.geography_id = g.geography_id
LEFT JOIN Dim_Platform p ON f.platform_id = p.platform_id
LEFT JOIN Dim_Date d ON f.date_id = d.date_id
WHERE ...
GROUP BY a.advertiser_name, c.campaign_name
LIMIT 25
```

### Response

```json 

```

------------------------------------------------------------------------

## /advertiser-details

### Purpose

Returns detailed performance metrics for a specific advertiser.

### Metrics Returned

| Metric         | Description                  |
|----------------|------------------------------|
| total_spend    | Total spending by advertiser |
| impressions    | Total impressions            |
| campaign_count | Number of campaigns          |

### SQL Query

```sql
SELECT a.advertiser_name, SUM(f.ad_spend) AS total_spend,
       SUM(f.impressions) AS total_impressions,
       COUNT(DISTINCT f.campaign_id) AS campaign_count
FROM Fact_Ad_Performance f
JOIN Dim_Advertiser a ON f.advertiser_id = a.advertiser_id
LEFT JOIN Dim_Geography g ON f.geography_id = g.geography_id
LEFT JOIN Dim_Platform p ON f.platform_id = p.platform_id
WHERE f.advertiser_id = %(advertiser_id)s
...
GROUP BY a.advertiser_name
```

### Response

```json

```

------------------------------------------------------------------------

## /campaign-details

### Purpose

Returns performance metrics for a specific campaign.

### SQL Query

```sql
SELECT
    c.campaign_name,
    SUM(f.ad_spend) AS total_spend,
    SUM(f.impressions) AS impressions,
    MIN(d.date) AS start_date,
    MAX(d.date) AS end_date
FROM Fact_Ad_Performance f
JOIN Dim_Campaign c ON f.campaign_id = c.campaign_id
JOIN Dim_Date d ON f.date_id = d.date_id
WHERE f.campaign_id = %(campaign_id)s
GROUP BY c.campaign_name
```

### Response

```json

```

------------------------------------------------------------------------

## /ads

### Purpose

Returns individual ads with performance metrics including advertiser,
campaign, creative type, spend, and impressions.

### SQL Query

```sql
SELECT
    a.advertiser_name,
    c.campaign_name,
    cre.creative_type,
    f.ad_spend,
    f.impressions
FROM Fact_Ad_Performance f
JOIN Dim_Advertiser a ON f.advertiser_id = a.advertiser_id
JOIN Dim_Campaign c ON f.campaign_id = c.campaign_id
LEFT JOIN Dim_Ad_Creative cre ON f.creative_id = cre.creative_id
WHERE ...
LIMIT 100
```

### Response

```json

```

------------------------------------------------------------------------

# Metadata Endpoints

**Base route: /metadata/**

These endpoints provide metadata used by the frontend for filtering.

------------------------------------------------------------------------

## /filters

### Purpose

Returns available filter values for the frontend interface.

### SQL Query

```sql
SELECT DISTINCT geography_name FROM Dim_Geography;
SELECT DISTINCT platform_name FROM Dim_Platform;
```

### Example Response

```json
{
  "geographies": ["United States", "Canada", "UK"],
  "platforms": ["Facebook", "Instagram", "Google"] 
}
```

------------------------------------------------------------------------

# API Design Notes

### Reusable Filtering Logic

All filtering is handled through a shared build_filters() function to
ensure consistency across endpoints.

### Parameterized Queries

All SQL queries use parameter binding (%(param)s) to prevent SQL
injection and allow safe query execution.


