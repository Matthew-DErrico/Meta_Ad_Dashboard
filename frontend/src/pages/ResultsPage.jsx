import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  fetchAdDetails,
  fetchAdvertiserDetails,
  fetchSearchResults,
} from "../services/api";
import "./FrontPage.css";
import "./ResultsPage.css";

function CompareModal({ ads, onClose }) {
  if (!ads.length) return null;

  const fields = [
    { label: "Advertiser", key: "page_name" },
    { label: "Ad Text", key: "ad_text", long: true },
    { label: "Platform", key: "platform" },
    { label: "Geography", key: "geography" },
    { label: "Est. Spend", key: "estimated_spending", money: true },
    { label: "Impressions", key: "estimated_impressions", number: true },
    { label: "Start Date", key: "start_date" },
    { label: "End Date", key: "end_date" },
    { label: "Spend Range", key: "spend_range" },
  ];

  const fmt = (val, money, number) => {
    if (val == null || val === "") return "N/A";
    if (money) return `$${Number(val).toLocaleString()}`;
    if (number) return Number(val).toLocaleString();
    return val;
  };

  const highestIdx = (fieldKey) => {
    const nums = ads.map((a) => Number(a[fieldKey]) || 0);
    const max = Math.max(...nums);
    return max > 0 ? nums.indexOf(max) : -1;
  };

  return (
    <>
      <div className="results-modal-overlay" onClick={onClose} />
      <div className="compare-modal">
        <div className="compare-modal-header">
          <h2 className="compare-modal-title">Ad Comparison</h2>
          <button className="results-side-panel-close" onClick={onClose}>
            ×
          </button>
        </div>
        <div
          className="compare-grid"
          style={{ gridTemplateColumns: `160px repeat(${ads.length}, 1fr)` }}
        >
          <div className="compare-cell compare-label-header" />
          {ads.map((ad, i) => (
            <div key={i} className="compare-cell compare-col-header">
              <span className="compare-col-advertiser">
                {ad.page_name || "Ad " + (i + 1)}
              </span>
              <span className="compare-col-badge">{ad.platform || "Meta"}</span>
            </div>
          ))}
          {fields.map(({ label, key, long, money, number }) => {
            const best = money || number ? highestIdx(key) : -1;
            return (
              <div key={key} className="compare-row-group">
                <div className="compare-cell compare-row-label">{label}</div>
                {ads.map((ad, i) => (
                  <div
                    key={i}
                    className={`compare-cell compare-row-value ${long ? "long" : ""} ${best === i ? "highlight" : ""}`}
                  >
                    {fmt(ad[key], money, number)}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

export default function ResultsPage() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("query") || "";
  const advertiser = searchParams.get("advertiser") || "";
  const country = searchParams.get("country") || "All Countries";
  const platform = searchParams.get("platform") || "All Platforms";

  const [selectedAd, setSelectedAd] = useState(null);
  const [adDetails, setAdDetails] = useState(null);
  const [adDetailsLoading, setAdDetailsLoading] = useState(false);
  const [adDetailsError, setAdDetailsError] = useState("");
  const [panelView, setPanelView] = useState("ad");
  const [advertiserInfo, setAdvertiserInfo] = useState(null);
  const [advertiserInfoLoading, setAdvertiserInfoLoading] = useState(false);
  const [advertiserInfoError, setAdvertiserInfoError] = useState("");
  const [sortMode, setSortMode] = useState("none");
  const [sortDirection, setSortDirection] = useState("desc");

  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const resultsTitleQuery = query?.trim() || "All Ads";
  const normalizedQuery = query.trim().toLowerCase();

  const highlightMatchedQuery = (text) => {
    const content = String(text || "");
    if (!normalizedQuery || !content) return content;

    const escapedQuery = normalizedQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const matcher = new RegExp(`(${escapedQuery})`, "ig");
    const segments = content.split(matcher);

    return segments.map((segment, index) =>
      segment.toLowerCase() === normalizedQuery ? (
        <mark key={`${segment}-${index}`} className="results-query-highlight">
          {segment}
        </mark>
      ) : (
        segment
      ),
    );
  };

  const getCardPreviewText = (text) => {
    const content = String(text || "");
    if (!content || !normalizedQuery) return content;

    const matchIndex = content.toLowerCase().indexOf(normalizedQuery);
    if (matchIndex === -1) return content;

    const charsBeforeMatch = 72;
    const charsAfterMatch = 180;
    const start = Math.max(0, matchIndex - charsBeforeMatch);
    const end = Math.min(
      content.length,
      matchIndex + normalizedQuery.length + charsAfterMatch,
    );

    let preview = content.slice(start, end).trim();
    if (start > 0) preview = `...${preview}`;
    if (end < content.length) preview = `${preview}...`;

    return preview;
  };
  const [compareList, setCompareList] = useState([]);
  const [compareOpen, setCompareOpen] = useState(false);

  useEffect(() => {
    const performSearch = async () => {
      if (!query) return;

      setLoading(true);
      try {
        const data = await fetchSearchResults(
          query,
          country !== "All Countries" ? country : null,
          platform !== "All Platforms" ? platform : null,
          advertiser && advertiser !== "All Advertisers" ? advertiser : null,
        );
        setResults(data);
      } catch (error) {
        console.error("Error fetching search results:", error);
      } finally {
        setLoading(false);
      }
    };

    performSearch();
  }, [query, country, platform, advertiser]);

  const sortedResults = [...results].sort((a, b) => {
    if (sortMode === "spend") {
      const aSpend = Number(a.estimated_spending) || 0;
      const bSpend = Number(b.estimated_spending) || 0;
      return sortDirection === "desc" ? bSpend - aSpend : aSpend - bSpend;
    }

    if (sortMode === "reach") {
      const aReach = Number(a.estimated_impressions) || 0;
      const bReach = Number(b.estimated_impressions) || 0;
      return sortDirection === "desc" ? bReach - aReach : aReach - bReach;
    }

    return 0;
  });

  const toggleSort = (mode) => {
    if (sortMode === mode) {
      setSortDirection((prev) => (prev === "desc" ? "asc" : "desc"));
      return;
    }
    setSortMode(mode);
    setSortDirection("desc");
  };

  const clearSort = () => {
    setSortMode("none");
    setSortDirection("desc");
  };

  const totalSpent = results.reduce((sum, ad) => {
    const spend = Number(ad.estimated_spending) || 0;
    return sum + spend;
  }, 0);
  const totalReach = results.reduce((sum, ad) => {
    const Reach = Number(ad.estimated_impressions) || 0;
    return sum + Reach;
  }, 0);

  const openAdDetails = async (ad) => {
    const adId = ad?.ad_id;
    if (!adId) return;

    setPanelView("ad");
    setSelectedAd({
      ad_id: adId,
      ad_text: ad.ad_text,
      page_name: ad.page_name,
    });
    setAdDetails(null);
    setAdDetailsError("");
    setAdDetailsLoading(true);
    setAdvertiserInfo(null);
    setAdvertiserInfoError("");
    setAdvertiserInfoLoading(false);

    try {
      const details = await fetchAdDetails(adId);
      setAdDetails(details || {});
    } catch (error) {
      console.error("Error fetching ad details:", error);
      setAdDetailsError("Unable to load ad details right now.");
    } finally {
      setAdDetailsLoading(false);
    }
  };

  const openAdvertiserInfo = async () => {
    const advertiserName = detailAd?.page_name;
    if (!advertiserName) return;

    setPanelView("advertiser");
    setAdvertiserInfo(null);
    setAdvertiserInfoError("");
    setAdvertiserInfoLoading(true);

    try {
      const details = await fetchAdvertiserDetails(
        advertiserName,
        platform !== "All Platforms" ? platform : null,
        null,
        null,
      );
      setAdvertiserInfo(details || {});
    } catch (error) {
      console.error("Error fetching advertiser details:", error);
      setAdvertiserInfoError("Unable to load advertiser details right now.");
    } finally {
      setAdvertiserInfoLoading(false);
    }
  };

  const backToAdInfo = () => {
    setPanelView("ad");
  };

  const closeSidePanel = () => {
    setSelectedAd(null);
    setAdDetails(null);
    setAdDetailsError("");
    setAdDetailsLoading(false);
    setPanelView("ad");
    setAdvertiserInfo(null);
    setAdvertiserInfoLoading(false);
    setAdvertiserInfoError("");
  };

  const isInCompare = (ad) => compareList.some((c) => c.ad_id === ad.ad_id);

  const toggleCompare = (e, ad) => {
    e.stopPropagation();
    if (isInCompare(ad)) {
      setCompareList((prev) => prev.filter((c) => c.ad_id !== ad.ad_id));
    } else if (compareList.length < 3) {
      setCompareList((prev) => [...prev, ad]);
    }
  };

  const detailAd = adDetails || selectedAd;
  const platformBadges = Array.isArray(detailAd?.platforms)
    ? detailAd.platforms
    : typeof detailAd?.platforms === "string"
      ? detailAd.platforms
          .split(",")
          .map((p) => p.trim())
          .filter(Boolean)
      : [];

  return (
    <div className="results-page">
      <div className="results-overview-header">
        <div className="results-overview-eyebrow" aria-hidden="true" />
        <h1 className="results-overview-title">
          RESULTS OVERVIEW - "{resultsTitleQuery}"
        </h1>
      </div>

      <div className="results-summary-grid">
        <div className="results-summary-card">
          <p className="results-summary-label">Total Ads</p>
          <p className="results-summary-value">
            {results.length.toLocaleString()}
          </p>
        </div>
        <div className="results-summary-card">
          <p className="results-summary-label">Total Spent</p>
          <p className="results-summary-value">
            ${totalSpent.toLocaleString()}
          </p>
        </div>
        <div className="results-summary-card">
          <p className="results-summary-label">Total Reach</p>
          <p className="results-summary-value">{totalReach.toLocaleString()}</p>
        </div>
      </div>

      <div className="results-chart-placeholder">
        Tableau dashboard placeholder (TREND CHART)
      </div>

      <div className="results-overview-header">
        <div className="results-overview-eyebrow" aria-hidden="true" />
        <h2 className="results-overview-title">AD RESULTS</h2>
      </div>
      <div className="results-sort-controls">
        <span className="results-sort-label">Sorting:</span>
        <button
          type="button"
          className={`results-sort-pill ${sortMode === "spend" ? "active" : ""}`}
          onClick={() => toggleSort("spend")}
        >
          Spent{" "}
          {sortMode === "spend" ? (sortDirection === "desc" ? "↓" : "↑") : ""}
        </button>
        <button
          type="button"
          className={`results-sort-pill ${sortMode === "reach" ? "active" : ""}`}
          onClick={() => toggleSort("reach")}
        >
          Reach{" "}
          {sortMode === "reach" ? (sortDirection === "desc" ? "↓" : "↑") : ""}
        </button>
        <button
          type="button"
          className="results-sort-reset"
          onClick={clearSort}
          disabled={sortMode === "none"}
        >
          No Sort
        </button>
      </div>

      <div className="results-cards-wrap">
        {loading && (
          <div className="results-cards-empty-state">Loading results...</div>
        )}

        {!loading && results.length === 0 && (
          <div className="results-cards-empty-state">
            No results found. Try a different search term.
          </div>
        )}

        {!loading &&
          results.length > 0 &&
          sortedResults.map((ad, index) => {
            const inCompare = isInCompare(ad);
            const atLimit = compareList.length >= 3 && !inCompare;
            return (
              <div
                key={`${ad.campaign || "campaign"}-${ad.advertiser || "advertiser"}-${index}`}
                className={`results-ad-card-wrapper ${inCompare ? "compare-selected" : ""}`}
              >
                <button
                  type="button"
                  className={`compare-toggle-btn ${inCompare ? "active" : ""} ${atLimit ? "disabled" : ""}`}
                  onClick={(e) => toggleCompare(e, ad)}
                  disabled={atLimit}
                >
                  {inCompare ? "✓ Added" : "+ Compare"}
                </button>
                <button
                  type="button"
                  className="results-ad-card"
                  onClick={() => openAdDetails(ad)}
                >
                  <div className="results-ad-card-top-row">
                    <span className="results-ad-card-advertiser">
                      {highlightMatchedQuery(ad.page_name || "N/A")}
                    </span>
                    <span className="results-ad-card-badge platform">
                      {ad.platform || "Meta"}
                    </span>
                  </div>

                  <p className="results-ad-card-campaign">
                    {highlightMatchedQuery(
                      getCardPreviewText(ad.ad_text || "N/A"),
                    )}
                  </p>

                  {ad.snapshot_url && (
                    <a
                      href={ad.snapshot_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="results-ad-card-link"
                      onClick={(event) => event.stopPropagation()}
                    >
                      Snapshot URL
                    </a>
                  )}

                  <div className="results-ad-card-meta-row">
                    <span className="results-ad-card-geography">
                      {ad.geography || "Unknown Geography"}
                    </span>
                  </div>

                  <div className="results-ad-card-metrics-grid">
                    <div>
                      <p className="results-ad-card-metric-label">
                        Total Spend
                      </p>
                      <p className="results-ad-card-metric-value">
                        ${Number(ad.estimated_spending || 0).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="results-ad-card-metric-label">
                        Impressions
                      </p>
                      <p className="results-ad-card-metric-value">
                        {Number(ad.estimated_impressions || 0).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </button>
              </div>
            );
          })}
      </div>
      {compareList.length > 0 && (
        <div className="compare-bar">
          <div className="compare-bar-chips">
            {compareList.map((ad) => (
              <span key={ad.ad_id} className="compare-bar-chip">
                {ad.page_name || "Ad"}
                <button
                  className="compare-bar-chip-remove"
                  onClick={() =>
                    setCompareList((prev) =>
                      prev.filter((c) => c.ad_id !== ad.ad_id),
                    )
                  }
                >
                  ×
                </button>
              </span>
            ))}
            <span className="compare-bar-hint">
              {3 - compareList.length} slot
              {3 - compareList.length !== 1 ? "s" : ""} remaining
            </span>
          </div>
          <div className="compare-bar-actions">
            <button
              className="compare-bar-clear"
              onClick={() => setCompareList([])}
            >
              Clear
            </button>
            <button
              className="compare-bar-go"
              onClick={() => setCompareOpen(true)}
              disabled={compareList.length < 2}
            >
              Compare {compareList.length} Ads →
            </button>
          </div>
        </div>
      )}

      {compareOpen && (
        <CompareModal ads={compareList} onClose={() => setCompareOpen(false)} />
      )}
      {selectedAd && (
        <>
          <div onClick={closeSidePanel} className="results-modal-overlay" />

          <div className="results-side-panel">
            <button
              onClick={closeSidePanel}
              className="results-side-panel-close"
            >
              ×
            </button>

            <h2 className="results-side-panel-title">
              {panelView === "advertiser" ? "Advertiser Info" : "Ad Details"}
            </h2>

            {panelView === "advertiser" && (
              <button
                type="button"
                className="results-side-panel-action secondary"
                onClick={backToAdInfo}
              >
                Back to Ad Info
              </button>
            )}

            {panelView === "ad" && adDetailsLoading && (
              <p className="results-side-panel-status">Loading ad details...</p>
            )}

            {panelView === "ad" && !adDetailsLoading && adDetailsError && (
              <p className="results-side-panel-status error">
                {adDetailsError}
              </p>
            )}

            {panelView === "ad" &&
              !adDetailsLoading &&
              !adDetailsError &&
              detailAd && (
                <div className="results-side-panel-section">
                  <div className="results-side-panel-inline-row">
                    <div className="results-side-panel-field grow">
                      <span className="results-side-panel-label">
                        Advertiser
                      </span>
                      <span className="results-side-panel-value">
                        {highlightMatchedQuery(detailAd.page_name || "N/A")}
                      </span>
                    </div>
                    <button
                      type="button"
                      className="results-side-panel-action"
                      onClick={openAdvertiserInfo}
                      disabled={!detailAd.page_name || advertiserInfoLoading}
                    >
                      Advertiser Info
                    </button>
                  </div>

                  <div className="results-side-panel-field">
                    <span className="results-side-panel-label">
                      Full Ad Text
                    </span>
                    <span className="results-side-panel-value long-text">
                      {highlightMatchedQuery(detailAd.ad_text || "N/A")}
                    </span>
                  </div>

                  <div className="results-side-panel-field">
                    <span className="results-side-panel-label">
                      Link Description
                    </span>
                    <span className="results-side-panel-value long-text">
                      {highlightMatchedQuery(
                        detailAd.link_description || "N/A",
                      )}
                    </span>
                  </div>

                  <div className="results-side-panel-field">
                    <span className="results-side-panel-label">Snapshot</span>
                    {detailAd.snapshot_url ? (
                      <>
                        <a
                          href={detailAd.snapshot_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="results-ad-card-link"
                        >
                          Open Snapshot URL
                        </a>
                      </>
                    ) : (
                      <span className="results-side-panel-value">N/A</span>
                    )}
                  </div>

                  <div className="results-side-panel-field">
                    <span className="results-side-panel-label">Platforms</span>
                    <div className="results-side-panel-platform-badges">
                      {platformBadges.length > 0 ? (
                        platformBadges.map((platformName) => (
                          <span
                            key={platformName}
                            className="results-ad-card-badge platform"
                          >
                            {platformName}
                          </span>
                        ))
                      ) : (
                        <span className="results-side-panel-value">N/A</span>
                      )}
                    </div>
                  </div>

                  <div className="results-side-panel-field">
                    <span className="results-side-panel-label">Timeline</span>
                    <div className="results-side-panel-timeline">
                      <span>{detailAd.start_date || "N/A"}</span>
                      <div className="results-side-panel-timeline-bar" />
                      <span>{detailAd.end_date || "Ongoing"}</span>
                    </div>
                  </div>

                  <div className="results-side-panel-field">
                    <span className="results-side-panel-label">
                      Spend Range
                    </span>
                    <div className="results-side-panel-range-row">
                      <span className="results-side-panel-value">
                        {detailAd.spend_range || "N/A"}
                      </span>
                      <span className="results-side-panel-midpoint">
                        Midpoint: $
                        {Number(
                          detailAd.estimated_spending || 0,
                        ).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="results-side-panel-field">
                    <span className="results-side-panel-label">
                      Impressions Range
                    </span>
                    <div className="results-side-panel-range-row">
                      <span className="results-side-panel-value">
                        {detailAd.impressions_range || "N/A"}
                      </span>
                      <span className="results-side-panel-midpoint">
                        Midpoint:{" "}
                        {Number(
                          detailAd.estimated_impressions || 0,
                        ).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              )}

            {panelView === "advertiser" && advertiserInfoLoading && (
              <p className="results-side-panel-status">
                Loading advertiser details...
              </p>
            )}

            {panelView === "advertiser" &&
              !advertiserInfoLoading &&
              advertiserInfoError && (
                <p className="results-side-panel-status error">
                  {advertiserInfoError}
                </p>
              )}

            {panelView === "advertiser" &&
              !advertiserInfoLoading &&
              !advertiserInfoError &&
              advertiserInfo && (
                <div className="results-side-panel-section">
                  <div className="results-side-panel-field">
                    <span className="results-side-panel-label">Advertiser</span>
                    <span className="results-side-panel-value">
                      {advertiserInfo.advertiser ||
                        detailAd?.page_name ||
                        "N/A"}
                    </span>
                  </div>

                  <div className="results-advertiser-metrics-grid">
                    <div className="results-advertiser-metric-card">
                      <p className="results-advertiser-metric-label">
                        Total Ads
                      </p>
                      <p className="results-advertiser-metric-value">
                        {Number(advertiserInfo.total_ads || 0).toLocaleString()}
                      </p>
                    </div>

                    <div className="results-advertiser-metric-card">
                      <p className="results-advertiser-metric-label">
                        Estimated Spend
                      </p>
                      <p className="results-advertiser-metric-value">
                        $
                        {Number(
                          advertiserInfo.estimated_spending || 0,
                        ).toLocaleString()}
                      </p>
                    </div>

                    <div className="results-advertiser-metric-card">
                      <p className="results-advertiser-metric-label">
                        Estimated Impressions
                      </p>
                      <p className="results-advertiser-metric-value">
                        {Number(
                          advertiserInfo.estimated_impressions || 0,
                        ).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="results-side-panel-field">
                    <span className="results-side-panel-label">
                      Activity Timeline
                    </span>
                    <div className="results-side-panel-timeline">
                      <span>{advertiserInfo.first_seen || "N/A"}</span>
                      <div className="results-side-panel-timeline-bar" />
                      <span>{advertiserInfo.last_seen || "N/A"}</span>
                    </div>
                  </div>
                </div>
              )}
          </div>
        </>
      )}
    </div>
  );
}
