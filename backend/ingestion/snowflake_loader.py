"""
snowflake_loader.py – Snowflake database loader

Provides functions to connect to Snowflake and insert normalised ad records
into the FACT_ADS table. Environment variables (loaded from .env) are used
for credentials and connection parameters.
"""

import os
import snowflake.connector
from dotenv import load_dotenv
from datetime import date

load_dotenv()


def get_connection():
    """
    Create and return a Snowflake connection using environment variables.

    Expects the following variables in .env:
        SNOWFLAKE_ACCOUNT
        SNOWFLAKE_USER
        SNOWFLAKE_PASSWORD
        SNOWFLAKE_WAREHOUSE
        SNOWFLAKE_DATABASE
        SNOWFLAKE_SCHEMA
    """
    return snowflake.connector.connect(
        account=os.getenv("SNOWFLAKE_ACCOUNT"),
        user=os.getenv("SNOWFLAKE_USER"),
        password=os.getenv("SNOWFLAKE_PASSWORD"),
        warehouse=os.getenv("SNOWFLAKE_WAREHOUSE"),
        database=os.getenv("SNOWFLAKE_DATABASE"),
        schema=os.getenv("SNOWFLAKE_SCHEMA"),
    )


def insert_ads(ads):
    """
    Insert a list of normalised ad records into the FACT_ADS table.

    Parameters
    ----------
    ads : list of dict
        Each dict should contain exactly the keys expected by the INSERT query:
        ad_id, page_id, page_name, ad_creation_time, start_date, end_date,
        ad_text, link_title, link_description, link_caption,
        impressions_range, spend_range, snapshot_url.

        Note: publisher_platforms is omitted from this insertion to avoid type
        mismatches (the current table schema may not have it or expects a different type).
        If needed, modify the INSERT query and the table schema accordingly.

    Returns
    -------
    None
    """
    conn = get_connection()
    cursor = conn.cursor()

    try:
        # Insert query – note that PUBLISHER_PLATFORMS is NOT included.
        # This avoids ARRAY type issues. The table schema in the provided SQL
        # does include PUBLISHER_PLATFORMS, so future developers may decide to
        # add it back.
        insert_query = """
            INSERT INTO FACT_ADS (
                AD_ID, PAGE_ID, PAGE_NAME, AD_CREATION_TIME,
                START_DATE, END_DATE, AD_TEXT, LINK_TITLE,
                LINK_DESCRIPTION, LINK_CAPTION,
                IMPRESSIONS_RANGE, SPEND_RANGE,
                SNAPSHOT_URL, INGESTION_DATE
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """

        today = date.today()  # used for INGESTION_DATE
        records = []

        for ad in ads:
            # Build a tuple of values in the same order as the INSERT columns
            record = (
                ad['ad_id'],
                ad['page_id'],
                ad['page_name'],
                ad['ad_creation_time'],
                ad['start_date'],
                ad['end_date'],
                ad['ad_text'],
                ad['link_title'],
                ad['link_description'],
                ad['link_caption'],
                ad['impressions_range'],
                ad['spend_range'],
                ad['snapshot_url'],
                today
            )
            records.append(record)

        # Execute bulk insert
        cursor.executemany(insert_query, records)
        conn.commit()
        print(f"Inserted {len(ads)} ads into Snowflake.")

    except Exception as e:
        print(f"Error during insertion: {e}")
        raise
    finally:
        cursor.close()
        conn.close()