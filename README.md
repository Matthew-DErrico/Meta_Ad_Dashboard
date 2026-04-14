# Political Advertising Transparency Platform

## Overview
This project is a **web-based political advertising analytics platform** designed to ingest, process, model, and visualize political advertising data from Meta (Facebook & Instagram). The platform enables journalists, researchers, and the public to explore political ad spending, targeting patterns, and messaging trends across time, geography, and advertisers.

The system is architected as a **cloud-based data pipeline and analytics platform**, not a local dashboard. Users will be able to access the application through a public web URL and interact with live data via a browser.

This project is being developed as a senior-level data engineering and analytics system with an emphasis on **scalability, transparency, and reproducibility**.

---

## Problem Motivation
Existing platforms such as PoliDashboard provide summaries of political ads but lack:
- Flexible querying capabilities
- Transparent data pipelines
- Scalable architecture for large datasets
- Custom analytics and filtering
This project addresses those gaps by building:
- A fully reproducible ingestion pipeline
- A cloud-based data warehouse (Snowflake)
- A structured analytics-ready data model
- A future web interface for interactive exploration

---
## Technology Stack

### Backend & Data
- Python
- Snowflake
- SQL
- FastAPI

### Frontend
- Web App + Embedded Analytics using Tableau

---

## Architecture Summary

### High-Level Data Flow
1. **Data Ingestion**
   - Source: Meta Ad Library API
   - Python scripts fetch political ad data using ads_read permission
   - Pagination implemented for batch data retrieval
2. **Data Processing**
   - Raw JSON → cleaned/normalized JSON
   - Handles:
     - Nested API fields (e.g., ad text bodies)
     - Missing values
     - Safe field extraction (due to API permission limits)
3. **Data Storage**
   - Snowflake data warehouse
   - Structured fact table (FACT_ADS)
   - Automated insertion from pipeline
4. **Data Access**
   - SQL-based querying inside Snowflake
   - Preparing for Tableau / API integration
5. **Frontend Web Application**
   - Browser-accessible web interface
   - Interactive filters and visualizations

---

## Repository structure:
```
Meta_Ad_Dashboard/
│
├── backend/
│   └── ingestion/
│       ├── run_ingestion.py       # Main pipeline runner
│       ├── meta_ads_client.py     # API requests to Meta
│       ├── transform_ads.py       # Data cleaning & normalization
│       └── snowflake_loader.py    # Inserts data into Snowflake
│
├── data/
│   ├── raw/                       # Raw API responses
│   └── processed/                 # Cleaned analytics-ready data
│
├── frontend/                      # Web application code
│                 
├── .env                           # API + Snowflake credentials (NOT pushed)
├── .gitignore                     # Prevents sensitive files from being pushed
└── README.md
```

### Data Pipeline
- **Step-by-Step Flow**
1. Fetch Data
   - meta_ads_client.py
   - Calls Meta Ads Archive API
   - Uses safe fields compatible with ads_read
2. Save Raw Data
   - Stored in:
     - data/raw/meta_ads_raw_<date>.json
3. Transform Data
   - transform_ads.py
   - Extracts and cleans:
     - Ad IDs
     - Page info
     - Dates
   - Ad text (from nested structures)
   - Metadata fields
4. Save Clean Data
   - Stored in:
     - data/processed/meta_ads_clean_<date>.json
5. Load into Snowflake
   - snowflake_loader.py
   - Inserts structured records into FACT_ADS

### Snowflake Data Warehouse
**FACT_ADS Table Schema**
- **AD_ID STRING PRIMARY KEY**
- **PAGE_ID STRING**
- **PAGE_NAME STRING**
- **AD_CREATION_TIME TIMESTAMP**
- **START_DATE DATE**
- **END_DATE DATE**
- **AD_TEXT STRING**
- **LINK_TITLE STRING**
- **LINK_DESCRIPTION STRING**
- **LINK_CAPTION STRING**
- **PUBLISHER_PLATFORMS ARRAY (currently NULL in DB)**
- **SNAPSHOT_URL STRING**
- **INGESTION_DATE DATE**

**Notes**
- **PUBLISHER_PLATFORMS is temporarily set to NULL due to type issues (ARRAY handling)**
- **Raw + processed JSON still retain full data for future fixes**
- **Schema is designed to expand into a full dimensional model**

---

## Key Engineering Challenges Solved
1. Meta API Permission Limitations
- Many fields (e.g., spend, impressions) require advanced access
- Solution:
   - Use safe fields only
   - Build pipeline first, expand later
2. Deprecated Fields
- Meta removed older fields (ad_creative_body, funding_entity)
- Solution:
   - Updated to supported fields (ad_creative_bodies)
3. Nested JSON Structures
Some fields returned as arrays/dictionaries
- Solution:
   - Custom parsing logic in transform_ads.py
4. Snowflake Type Issues
- ARRAY + dict insertion caused failures
- Solution:
   - Temporarily removed from insert
   - Pipeline stabilized first

---

## How to run the Pipeline
1. Activate Virtual Environment
   '''venv\Scripts\activate'''
2. Run Ingestion
   '''python backend/ingestion/run_ingestion.py'''
**Expected Output**
   '''Fetched X ads total.
   Saved raw data...
   Saved processed data...
   Inserted X ads into Snowflake.'''

### Enviroment Variables (.env)
'''META_ACCESS_TOKEN=your_meta_token

SNOWFLAKE_ACCOUNT=your_account
SNOWFLAKE_USER=your_user
SNOWFLAKE_PASSWORD=your_password
SNOWFLAKE_WAREHOUSE=META_WH
SNOWFLAKE_DATABASE=META_ADS_DB
SNOWFLAKE_SCHEMA=ANALYTICS'''

### Future Improvements
- Add:
   - Spend ranges
   - Impression ranges
   - Demographic breakdowns
- Convert to full Snowflake Schema (fact + dimensions)
- Handle ARRAY + JSON fields properly in Snowflake
- Deploy as a public web platform 

---

## Deployment Goal
A fully functional platform where users can:
- Search political ads
- Filter by advertiser, keyword, or date
- View trends and rankings
- Access the system via a public URL

---

## Team
This project is developed as part of a senior capstone course.  
**Team contract content remains unchanged per agreement.**
