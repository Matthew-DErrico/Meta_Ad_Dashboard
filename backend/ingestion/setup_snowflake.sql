"""
Snowflake Setup Script for Meta Ads Dashboard
=============================================================================
Purpose:
Create all necessary Snowflake objects (warehouse, database, schemas, table)
for the Meta Ads ingestion pipeline and analytics.

Usage:
Run this script in a Snowflake worksheet or via SnowSQL.
It is idempotent (uses IF NOT EXISTS / OR REPLACE where appropriate).
"""

-- Create a virtual warehouse (compute cluster) for running queries.
-- XSMALL is sufficient for this project; auto-suspend saves credits.
CREATE WAREHOUSE IF NOT EXISTS META_WH
  WAREHOUSE_SIZE = 'XSMALL'
  AUTO_SUSPEND = 60
  AUTO_RESUME = TRUE;

-- Create database
CREATE DATABASE IF NOT EXISTS META_ADS_DB;

-- Use the database
USE DATABASE META_ADS_DB;

-- Create schemas
CREATE SCHEMA IF NOT EXISTS RAW;
CREATE SCHEMA IF NOT EXISTS ANALYTICS;

-- Use warehouse
USE WAREHOUSE META_WH;

-- Switch to analytics schema
USE SCHEMA ANALYTICS;

-- Create improved fact table for ad analytics
CREATE OR REPLACE TABLE FACT_ADS (
    AD_ID STRING PRIMARY KEY,
    PAGE_ID STRING,
    PAGE_NAME STRING,
    AD_CREATION_TIME TIMESTAMP,
    START_DATE DATE,
    END_DATE DATE,
    AD_TEXT STRING,
    LINK_TITLE STRING,
    LINK_DESCRIPTION STRING,
    LINK_CAPTION STRING,
    IMPRESSIONS_RANGE STRING,
    SPEND_RANGE STRING,
    PUBLISHER_PLATFORMS ARRAY,
    SNAPSHOT_URL STRING,
    INGESTION_DATE DATE DEFAULT CURRENT_DATE
);

-- Optional: quick query to preview data
SELECT 
    PAGE_ID,
    COUNT(*) AS TOTAL_ADS
FROM FACT_ADS
GROUP BY PAGE_ID
ORDER BY TOTAL_ADS DESC;

-- SELECT COUNT(*) FROM META_ADS_DB.ANALYTICS.FACT_ADS;

SELECT * FROM META_ADS_DB.ANALYTICS.FACT_ADS LIMIT 100000;

-- Data can have missing values, use this to enter default values for PUBLISHER_PLATFORMS
UPDATE META_ADS_DB.ANALYTICS.FACT_ADS
SET PUBLISHER_PLATFORMS = ARRAY_CONSTRUCT('Meta', 'Instagram')
WHERE PUBLISHER_PLATFORMS IS NULL;

-- Optional: testing
SELECT
            PAGE_NAME,
            SUM(
                (TRY_TO_NUMBER(SPLIT_PART(SPEND_RANGE, '-', 1)) +
                 TRY_TO_NUMBER(SPLIT_PART(SPEND_RANGE, '-', 2))) / 2
                 ) AS ESTIMATED_SPENDING
        FROM META_ADS_DB.ANALYTICS.FACT_ADS f
        LEFT JOIN LATERAL FLATTEN(INPUT => f.PUBLISHER_PLATFORMS)
        GROUP BY PAGE_NAME
        ORDER BY ESTIMATED_SPENDING DESC;
        

-- Data can have missing values, use this to enter default values for IMPRESSIONS_RANGE
UPDATE META_ADS_DB.ANALYTICS.FACT_ADS
SET IMPRESSIONS_RANGE = '0-0'
WHERE IMPRESSIONS_RANGE IS NULL;