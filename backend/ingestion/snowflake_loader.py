import os
import snowflake.connector
from dotenv import load_dotenv
from datetime import date

load_dotenv()

def get_connection():
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
    Inserts a list of ads into Snowflake FACT_ADS table.
    PUBLISHER_PLATFORMS is omitted (set to NULL) to bypass type issues.
    """
    conn = get_connection()
    cursor = conn.cursor()

    try:
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

        today = date.today()
        records = []

        for ad in ads:
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

        cursor.executemany(insert_query, records)
        conn.commit()
        print(f"Inserted {len(ads)} ads into Snowflake.")

    except Exception as e:
        print(f"Error during insertion: {e}")
        raise
    finally:
        cursor.close()
        conn.close()