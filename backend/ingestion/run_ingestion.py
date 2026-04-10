"""
run_ingestion.py – Main ingestion pipeline orchestrator

This script drives the entire ETL process:
  1. Fetch ads from Meta API (with pagination up to 5 pages)
  2. Save raw JSON to data/raw/
  3. Normalise the data using transform_ads.normalize_ads()
  4. Save normalised JSON to data/processed/
  5. Insert the normalised records into Snowflake

Run this script manually or schedule it (cron, Airflow, etc.) to keep data fresh.
"""

import json
import os
from datetime import datetime, timezone

from meta_ads_client import fetch_ads
from transform_ads import normalize_ads
from snowflake_loader import insert_ads


def save_json(data, subfolder, prefix):
    """
    Save a Python object as JSON to a dated file inside data/<subfolder>/.

    Parameters
    ----------
    data : dict or list
        The data to serialise.
    subfolder : str
        Subdirectory under 'data/' (e.g., 'raw' or 'processed').
    prefix : str
        Prefix for the filename (e.g., 'meta_ads_raw').
    """
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    folder = f"data/{subfolder}"
    filename = f"{folder}/{prefix}_{today}.json"

    # Create the folder if it doesn't exist
    os.makedirs(folder, exist_ok=True)

    with open(filename, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)

    print(f"Saved {prefix} data to {filename}")


def run():
    """
    Execute the full ingestion pipeline.
    """
    all_ads = []
    after = None

    # Pagination: fetch up to 5 pages (each page contains 'limit' ads, default 25).
    # The Meta API returns a 'paging.cursors.after' token for the next page.
    for _ in range(5):
        data = fetch_ads(after=after)

        ads = data.get("data", [])
        all_ads.extend(ads)

        paging = data.get("paging", {})
        cursors = paging.get("cursors", {})
        after = cursors.get("after")

        # If there is no 'after' cursor, we have reached the last page.
        if not after:
            break

    print(f"Fetched {len(all_ads)} ads total.")

    # Save raw API response (for audit and debugging)
    save_json(all_ads, subfolder="raw", prefix="meta_ads_raw")

    # Transform raw data into clean, flat records
    normalized_ads = normalize_ads(all_ads)

    # Save normalised data (for reproducibility)
    save_json(normalized_ads, subfolder="processed", prefix="meta_ads_clean")

    # Load into Snowflake
    insert_ads(normalized_ads)


if __name__ == "__main__":
    run()