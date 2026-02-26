def normalize_ads(raw_ads):
    normalized = []

    for ad in raw_ads:
        normalized.append({
            "ad_id": ad.get("id"),
            "page_id": ad.get("page_id"),
            "start_date": ad.get("ad_delivery_start_time"),
            "snapshot_url": ad.get("ad_snapshot_url"),
        })

    return normalized
