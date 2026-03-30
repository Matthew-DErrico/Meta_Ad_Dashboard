import json
import os
from datetime import datetime, timezone

from meta_ads_client import fetch_ads
from transform_ads import normalize_ads

from snowflake_loader import insert_ads

def save_json(data, subfolder, prefix):
    """
    Generic JSON saver for raw or processed data.
    """
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    folder = f"data/{subfolder}"
    filename = f"{folder}/{prefix}_{today}.json"

    os.makedirs(folder, exist_ok=True)

    with open(filename, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)

    print(f"Saved {prefix} data to {filename}")


def run():
    all_ads = []
    after = None

    # Controlled pagination (max 5 pages for now)
    for _ in range(5):
        data = fetch_ads(after=after)

        ads = data.get("data", [])
        all_ads.extend(ads)

        paging = data.get("paging", {})
        cursors = paging.get("cursors", {})
        after = cursors.get("after")

        if not after:
            break

    print(f"Fetched {len(all_ads)} ads total.")

    # Save raw API response
    save_json(all_ads, subfolder="raw", prefix="meta_ads_raw")

    # Normalize data
    normalized_ads = normalize_ads(all_ads)

    #Save normalized (analytics-ready) data
    save_json(normalized_ads, subfolder="processed", prefix="meta_ads_clean")

    # Insert into Snowflake
    insert_ads(normalized_ads)


if __name__ == "__main__":
    run()
