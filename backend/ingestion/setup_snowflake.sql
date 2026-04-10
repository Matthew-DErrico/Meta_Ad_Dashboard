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

-- Create the main database that will hold all schemas and tables.
CREATE DATABASE IF NOT EXISTS META_ADS_DB;

-- Switch to the newly created (or existing) database.
USE DATABASE META_ADS_DB;

-- Create separate schemas for raw staging and final analytics tables.
-- (The pipeline currently writes directly to ANALYTICS, but RAW can be used for staging.)
CREATE SCHEMA IF NOT EXISTS RAW;
CREATE SCHEMA IF NOT EXISTS ANALYTICS;

-- Activate the warehouse for subsequent DDL/DML operations.
USE WAREHOUSE META_WH;

-- Switch to the ANALYTICS schema where the fact table will live.
USE SCHEMA ANALYTICS;

-- Create the main fact table that stores normalised ad data.
-- This table is written by the Python ingestion script (snowflake_loader.py).
CREATE OR REPLACE TABLE FACT_ADS (
    AD_ID STRING PRIMARY KEY,               -- Unique ad identifier from Meta
    PAGE_ID STRING,                         -- Facebook page that ran the ad
    PAGE_NAME STRING,                       -- Name of the page
    AD_CREATION_TIME TIMESTAMP,             -- When the ad was created
    START_DATE DATE,                        -- First day the ad was delivered
    END_DATE DATE,                          -- Last day the ad was delivered
    AD_TEXT STRING,                         -- Primary creative text
    LINK_TITLE STRING,                      -- Title of the linked page
    LINK_DESCRIPTION STRING,                -- Description of the linked page
    LINK_CAPTION STRING,                    -- Caption for the link
    IMPRESSIONS_RANGE STRING,               -- e.g. "1000-5000" (lower-upper bound)
    SPEND_RANGE STRING,                     -- e.g. "25.50-100.00"
    PUBLISHER_PLATFORMS ARRAY,              -- List of platforms (Facebook, Instagram, etc.)
    SNAPSHOT_URL STRING,                    -- URL to the ad snapshot on Meta's library
    INGESTION_DATE DATE DEFAULT CURRENT_DATE  -- When this row was inserted
);

-- Optional quick preview query to verify data.
-- Shows which pages have the most ads.
SELECT 
    PAGE_ID,
    COUNT(*) AS TOTAL_ADS
FROM FACT_ADS
GROUP BY PAGE_ID
ORDER BY TOTAL_ADS DESC;

-- =============================================================================
-- Data Sharing (for team collaboration)
-- =============================================================================
-- Create a share that allows other Snowflake accounts to read the data without
-- copying it. The share is named META_DASHBOARD_SHARE.
CREATE OR REPLACE SHARE META_DASHBOARD_SHARE;

-- Grant usage on the database and schema to the share.
GRANT USAGE ON DATABASE META_ADS_DB TO SHARE META_DASHBOARD_SHARE;
GRANT USAGE ON SCHEMA META_ADS_DB.PUBLIC TO SHARE META_DASHBOARD_SHARE;

-- Grant SELECT on all current (and future) tables in the PUBLIC schema.
-- Note: Our table is in ANALYTICS, but the share grants PUBLIC schema.
-- Adjust if needed.
GRANT SELECT ON ALL TABLES IN SCHEMA META_ADS_DB.PUBLIC TO SHARE META_DASHBOARD_SHARE;

-- Add a specific consumer account (replace with actual teammate account locator).
ALTER SHARE META_DASHBOARD_SHARE
ADD ACCOUNT = LPHUTNN.PZC08721;