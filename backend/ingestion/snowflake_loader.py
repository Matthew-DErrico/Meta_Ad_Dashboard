import os
import snowflake.connector
from dotenv import load_dotenv
from datetime import datetime, timezone

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
    conn = get_connection()
    cursor = conn.cursor()

    try:
        insert_query = """
            INSERT INTO FACT_ADS (AD_ID, PAGE_ID, START_DATE, SNAPSHOT_URL)
            VALUES (%s, %s, %s, %s)
        """

        for ad in ads:
            cursor.execute(
                insert_query,
                (
                    ad["ad_id"],
                    ad["page_id"],
                    ad["start_date"],
                    ad["snapshot_url"],
                ),
            )

        conn.commit()
        print(f"Inserted {len(ads)} ads into Snowflake.")

    finally:
        cursor.close()
        conn.close()