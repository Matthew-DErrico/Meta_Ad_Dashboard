def normalize_ads(raw_ads):
    normalized = []

    for ad in raw_ads:

        # Extract ad text safely (Meta returns a list of body objects)
        bodies = ad.get("ad_creative_bodies", [])
        ad_text = None

        if isinstance(bodies, list) and len(bodies) > 0:
            first_body = bodies[0]

            # Sometimes Meta returns {"text": "..."}
            if isinstance(first_body, dict):
                ad_text = first_body.get("text")
            else:
                ad_text = first_body

        # Convert impressions dict → string
        impressions = ad.get("impressions")
        impressions_range = None
        if isinstance(impressions, dict):
            low = impressions.get("lower_bound")
            high = impressions.get("upper_bound")
            if low and high:
                impressions_range = f"{low}-{high}"

        # convert spend dict → string
        spend = ad.get("spend")
        spend_range = None
        if isinstance(spend, dict):
            low = spend.get("lower_bound")
            high = spend.get("upper_bound")
            if low and high:
                spend_range = f"{low}-{high}"

        normalized.append({
            "ad_id": ad.get("id"),
            "page_id": ad.get("page_id"),
            "page_name": ad.get("page_name"),

            "ad_creation_time": ad.get("ad_creation_time") or ad.get("ad_delivery_start_time"),
            "start_date": ad.get("ad_delivery_start_time"),
            "end_date": ad.get("ad_delivery_stop_time"),

            "ad_text": ad_text,

            "link_title": ad.get("ad_creative_link_title"),
            "link_description": ad.get("ad_creative_link_description"),
            "link_caption": ad.get("ad_creative_link_caption"),

            "impressions_range": impressions_range,
            "spend_range": spend_range,

            "publisher_platforms": ad.get("publisher_platforms") or [],

            "snapshot_url": ad.get("ad_snapshot_url")
        })

    return normalized
