# Political Advertising Transparency Platform

## Overview
This project is a **web-based political advertising analytics platform** designed to ingest, process, model, and visualize political advertising data from Meta (Facebook & Instagram). The platform enables journalists, researchers, and the public to explore political ad spending, targeting patterns, and messaging trends across time, geography, and advertisers.

The system is architected as a **cloud-based data pipeline and analytics platform**, not a local dashboard. Users will be able to access the application through a public web URL and interact with live data via a browser.

This project is being developed as a senior-level data engineering and analytics system with an emphasis on **scalability, transparency, and reproducibility**.

---

## Problem Motivation
Existing tools such as PoliDashboard provide useful summaries but lack:
- Flexible analytical exploration
- Transparent data modeling
- Reusable, extensible architectures
- Publicly accessible, query-driven web platforms

This project aims to address these gaps by implementing:
- A modern data warehouse (Snowflake)
- A dimensional data model (snowflake schema)
- A reproducible ingestion and transformation pipeline
- A public-facing web application for exploration and analysis

---

## Architecture Summary

**Option A** is selected initially due to its lower risk and faster implementation timeline.

### High-Level Flow
1. **Data Ingestion**
   - Meta Ad Library API
   - Python-based ingestion scripts
2. **Data Processing**
   - Cleaning, normalization, validation
   - Transformation into analytical formats
3. **Data Warehouse**
   - Snowflake
   - Snowflake (dimensional) schema design
4. **Backend API**
   - Python (FastAPI)
   - Serves queries to frontend
5. **Frontend Web Application**
   - Browser-accessible web interface
   - Interactive filters and visualizations

---

## Data Modeling
The data warehouse uses a **Snowflake Schema**, optimized for analytical queries and ad-hoc exploration.

### Fact Table
- **Fact_Ad_Performance**
  - Ad spend
  - Impressions
  - Start and end dates
  - Foreign keys to dimensions

### Dimension Tables
- **Dim_Advertiser**
- **Dim_Campaign**
- **Dim_Date**
- **Dim_Geography**
- **Dim_Platform**
- **Dim_Ad_Creative**

This design will reduce redundancy while maintaining strong query performance.

---

## Technology Stack

### Backend & Data
- Python
- Snowflake
- SQL
- FastAPI
- Pandas

### Frontend
- Option A: Tableau Public / Tableau Server + Public URL (Simpler and supports future expansion into option B)
- Option B (future): Web App + Embedded Analytics (More adanced)

### Infrastructure
- Docker
- GitHub
- Cloud deployment (TBD)

---

## Deployment Goals
- Publicly accessible web application
- Cloud-hosted backend and database
- Reproducible local development environment
- Clear separation of ingestion, storage, and presentation layers

---

## Project Status
- Architecture and data model finalized
- Repository initialized
- Development beginning with ingestion pipeline

---

## Team
This project is developed as part of a senior capstone course.  
**Team contract content remains unchanged per agreement.**
