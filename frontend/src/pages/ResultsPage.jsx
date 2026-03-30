import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { fetchAdvertiserDetails, fetchSearchResults } from "../services/api";
import "./FrontPage.css";
import "./ResultsPage.css";

export default function ResultsPage() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("query") || "";
  const country = searchParams.get("country") || "All Countries";
  const platform = searchParams.get("platform") || "All Platforms";

  const [selectedAd, setSelectedAd] = useState(null);
  const [showAdvertiserInfo, setShowAdvertiserInfo] = useState(false);
  const [advertiserInfo, setAdvertiserInfo] = useState(null);
  const [advertiserInfoLoading, setAdvertiserInfoLoading] = useState(false);
  const [advertiserInfoError, setAdvertiserInfoError] = useState("");
  const [sortMode, setSortMode] = useState("none");
  const [sortDirection, setSortDirection] = useState("desc");

  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const performSearch = async () => {
      if (!query) return;

      setLoading(true);
      try {
        const data = await fetchSearchResults(
          query,
          country !== "All Countries" ? country : null,
          platform !== "All Platforms" ? platform : null,
        );
        setResults(data);
      } catch (error) {
        console.error("Error fetching search results:", error);
      } finally {
        setLoading(false);
      }
    };

    performSearch();
  }, [query, country, platform]);

  const sortedResults = [...results].sort((a, b) => {
    if (sortMode === "spend") {
      const aSpend = Number(a.total_spend) || 0;
      const bSpend = Number(b.total_spend) || 0;
      return sortDirection === "desc" ? bSpend - aSpend : aSpend - bSpend;
    }

    if (sortMode === "reach") {
      const aReach = Number(a.total_impressions) || 0;
      const bReach = Number(b.total_impressions) || 0;
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
    const spend = Number(ad.total_spend) || 0;
    return sum + spend;
  }, 0);
  const totalReach = results.reduce((sum, ad) => {
    const Reach = Number(ad.total_impressions) || 0;
    return sum + Reach;
  }, 0);

  const openAdvertiserInfo = async () => {
    if (!selectedAd?.advertiserId) return;

    setShowAdvertiserInfo(true);

    if (advertiserInfo) return;

    setAdvertiserInfoLoading(true);
    setAdvertiserInfoError("");
    try {
      const details = await fetchAdvertiserDetails(
        selectedAd.advertiserId,
        country !== "All Countries" ? country : null,
        platform !== "All Platforms" ? platform : null,
      );
      setAdvertiserInfo(details || {});
    } catch (error) {
      console.error("Error fetching advertiser details:", error);
      setAdvertiserInfoError("Unable to load advertiser info right now.");
    } finally {
      setAdvertiserInfoLoading(false);
    }
  };

  const activeFilters = [
    country !== "All Countries" ? { label: "Geography", value: country } : null,
    platform !== "All Platforms"
      ? { label: "Platform", value: platform }
      : null,
  ].filter(Boolean);

  return (
    <div className="results-page">
      <h1 className="results-title">Results Dashboard</h1>
      <p className="results-subtitle">
        Explore ad activity with a quick summary and card-based results.
      </p>

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

      <h4 className="results-list-title">Ads List</h4>
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
          sortedResults.map((ad, index) => (
            <button
              key={`${ad.campaign || "campaign"}-${ad.advertiser || "advertiser"}-${index}`}
              type="button"
              className="results-ad-card"
              onClick={() =>
                setSelectedAd({
                  advertiserId: ad.advertiser_id,
                  campaign: ad.campaign,
                  advertiser: ad.advertiser,
                  geography: ad.geography,
                  platform: ad.platform,
                  creativeType: ad.creative_type,
                  spent: Number(ad.total_spend) || 0,
                  reach: Number(ad.total_impressions) || 0,
                  startDate: ad.start_date,
                  endDate: ad.end_date,
                })
              }
            >
              <div className="results-ad-card-top-row">
                <span className="results-ad-card-advertiser">
                  {ad.advertiser || "N/A"}
                </span>
                <span className="results-ad-card-badge platform">
                  {ad.platform || "Unknown Platform"}
                </span>
              </div>

              <p className="results-ad-card-campaign">{ad.campaign || "N/A"}</p>

              <div className="results-ad-card-meta-row">
                <span className="results-ad-card-geography">
                  {ad.geography || "Unknown Geography"}
                </span>
              </div>

              <div className="results-ad-card-metrics-grid">
                <div>
                  <p className="results-ad-card-metric-label">Total Spend</p>
                  <p className="results-ad-card-metric-value">
                    ${Number(ad.total_spend || 0).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="results-ad-card-metric-label">Impressions</p>
                  <p className="results-ad-card-metric-value">
                    {Number(ad.total_impressions || 0).toLocaleString()}
                  </p>
                </div>
              </div>
            </button>
          ))}
      </div>
      {selectedAd && (
        <>
          <div
            onClick={() => {
              setSelectedAd(null);
              setShowAdvertiserInfo(false);
              setAdvertiserInfo(null);
              setAdvertiserInfoError("");
            }}
            className="results-modal-overlay"
          />

          <div className="results-side-panel">
            <button
              onClick={() => {
                setSelectedAd(null);
                setShowAdvertiserInfo(false);
                setAdvertiserInfo(null);
                setAdvertiserInfoError("");
              }}
              className="results-side-panel-close"
            >
              ×
            </button>

            {!showAdvertiserInfo && (
              <>
                <h2 className="results-side-panel-title">Ad Details</h2>
                <div className="results-side-panel-section">
                  <div className="results-side-panel-field">
                    <span className="results-side-panel-label">Ad Name</span>
                    <span className="results-side-panel-value">
                      {selectedAd.campaign || "N/A"}
                    </span>
                  </div>

                  <div className="results-side-panel-inline-row">
                    <div className="results-side-panel-field grow">
                      <span className="results-side-panel-label">
                        Advertiser
                      </span>
                      <span className="results-side-panel-value">
                        {selectedAd.advertiser || "N/A"}
                      </span>
                    </div>
                    <button
                      type="button"
                      className="results-side-panel-action"
                      onClick={openAdvertiserInfo}
                      disabled={!selectedAd.advertiserId}
                    >
                      Advertiser Info
                    </button>
                  </div>

                  <div className="results-side-panel-field">
                    <span className="results-side-panel-label">Geography</span>
                    <span className="results-side-panel-value">
                      {selectedAd.geography || "N/A"}
                    </span>
                  </div>

                  <div className="results-side-panel-field">
                    <span className="results-side-panel-label">Platform</span>
                    <span className="results-side-panel-value">
                      {selectedAd.platform || "N/A"}
                    </span>
                  </div>

                  <div className="results-side-panel-field">
                    <span className="results-side-panel-label">
                      Creative Type
                    </span>
                    <span className="results-side-panel-value">
                      {selectedAd.creativeType || "N/A"}
                    </span>
                  </div>

                  <div className="results-side-panel-field">
                    <span className="results-side-panel-label">Spent</span>
                    <span className="results-side-panel-value">
                      ${selectedAd.spent?.toLocaleString()}
                    </span>
                  </div>

                  <div className="results-side-panel-field">
                    <span className="results-side-panel-label">Reach</span>
                    <span className="results-side-panel-value">
                      {selectedAd.reach?.toLocaleString()}
                    </span>
                  </div>

                  <div className="results-side-panel-field">
                    <span className="results-side-panel-label">Start Date</span>
                    <span className="results-side-panel-value">
                      {selectedAd.startDate || "N/A"}
                    </span>
                  </div>

                  <div className="results-side-panel-field">
                    <span className="results-side-panel-label">End Date</span>
                    <span className="results-side-panel-value">
                      {selectedAd.endDate || "N/A"}
                    </span>
                  </div>
                </div>
              </>
            )}

            {showAdvertiserInfo && (
              <>
                <h2 className="results-side-panel-title">Advertiser Info</h2>
                <button
                  type="button"
                  className="results-side-panel-action secondary"
                  onClick={() => setShowAdvertiserInfo(false)}
                >
                  Back to Ad Details
                </button>

                <p className="results-side-panel-note">
                  Note: Advertiser totals are affected by active filters (such
                  as geography and platform), so values can vary.
                </p>

                <div className="results-side-panel-filters">
                  <p className="results-side-panel-filters-title">
                    Active Filters
                  </p>
                  {activeFilters.length === 0 ? (
                    <p className="results-side-panel-filters-empty">
                      No active filters
                    </p>
                  ) : (
                    <div className="results-side-panel-filters-list">
                      {activeFilters.map((filter) => (
                        <span
                          key={filter.label}
                          className="results-side-panel-filter-chip"
                        >
                          {filter.label}: {filter.value}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {advertiserInfoLoading && (
                  <p className="results-side-panel-status">
                    Loading advertiser info...
                  </p>
                )}

                {!advertiserInfoLoading && advertiserInfoError && (
                  <p className="results-side-panel-status error">
                    {advertiserInfoError}
                  </p>
                )}

                {!advertiserInfoLoading && !advertiserInfoError && (
                  <div className="results-side-panel-section">
                    <div className="results-side-panel-field">
                      <span className="results-side-panel-label">
                        Advertiser
                      </span>
                      <span className="results-side-panel-value">
                        {advertiserInfo?.advertiser || "N/A"}
                      </span>
                    </div>
                    <div className="results-side-panel-field">
                      <span className="results-side-panel-label">
                        Total Spend
                      </span>
                      <span className="results-side-panel-value">
                        $
                        {Number(
                          advertiserInfo?.total_spend || 0,
                        ).toLocaleString()}
                      </span>
                    </div>
                    <div className="results-side-panel-field">
                      <span className="results-side-panel-label">
                        Impressions
                      </span>
                      <span className="results-side-panel-value">
                        {Number(
                          advertiserInfo?.impressions || 0,
                        ).toLocaleString()}
                      </span>
                    </div>
                    <div className="results-side-panel-field">
                      <span className="results-side-panel-label">
                        Campaign Count
                      </span>
                      <span className="results-side-panel-value">
                        {Number(
                          advertiserInfo?.campaign_count || 0,
                        ).toLocaleString()}
                      </span>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
