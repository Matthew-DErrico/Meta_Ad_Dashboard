"""
transform_ads.py – Raw ad normalisation

Takes the raw JSON list from Meta API and transforms it into a flat,
database-friendly list of dictionaries. Handles nested fields (impressions,
spend, ad_creative_bodies) and missing values.
"""


def normalize_ads(raw_ads):
    """
    Convert a list of raw ad dictionaries into a list of normalised records.

    Each raw ad may contain nested structures:
      - impressions: {"lower_bound": 1000, "upper_bound": 5000}
      - spend: {"lower_bound": 12.5, "upper_bound": 25.0}
      - ad_creative_bodies: [{"text": "Vote for ..."}]

    The function flattens these into simple string ranges and extracts text.

    Parameters
    ----------
    raw_ads : list of dict
        The 'data' list from Meta API response.

    Returns
    -------
    list of dict
        Each dict contains the fields expected by snowflake_loader.insert_ads().
    """
    normalized = []

    for ad in raw_ads:
        # ------------------- Extract ad text safely -------------------
        # ad_creative_bodies is a list of body objects. The first element
        # may be a string or a dict with a "text" key.
        bodies = ad.get("ad_creative_bodies", [])
        ad_text = None

        if isinstance(bodies, list) and len(bodies) > 0:
            first_body = bodies[0]
            if isinstance(first_body, dict):
                ad_text = first_body.get("text")
            else:
                ad_text = first_body

        # ------------------- Convert impressions dict to string range -------------------
        # Example input: {"lower_bound": 1000, "upper_bound": 5000}
        # Output: "1000-5000"
        impressions = ad.get("impressions")
        impressions_range = None
        if isinstance(impressions, dict):
            low = impressions.get("lower_bound")
            high = impressions.get("upper_bound")
            if low and high:
                impressions_range = f"{low}-{high}"

        # ------------------- Convert spend dict to string range -------------------
        spend = ad.get("spend")
        spend_range = None
        if isinstance(spend, dict):
            low = spend.get("lower_bound")
            high = spend.get("upper_bound")
            if low and high:
                spend_range = f"{low}-{high}"

        # ------------------- Build the final record -------------------
        normalized.append({
            "ad_id": ad.get("id"),
            "page_id": ad.get("page_id"),
            "page_name": ad.get("page_name"),

            # Use ad_creation_time if available; otherwise fall back to start time
            "ad_creation_time": ad.get("ad_creation_time") or ad.get("ad_delivery_start_time"),
            "start_date": ad.get("ad_delivery_start_time"),
            "end_date": ad.get("ad_delivery_stop_time"),

            "ad_text": ad_text,
            "link_title": ad.get("ad_creative_link_title"),
            "link_description": ad.get("ad_creative_link_description"),
            "link_caption": ad.get("ad_creative_link_caption"),

            "impressions_range": impressions_range,
            "spend_range": spend_range,

            # publisher_platforms is kept as a list; the Snowflake table expects an ARRAY type.
            "publisher_platforms": ad.get("publisher_platforms") or [],

            "snapshot_url": ad.get("ad_snapshot_url")
        })

    return normalized