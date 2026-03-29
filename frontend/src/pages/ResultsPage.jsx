import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { fetchSearchResults } from "../services/api";
import "./FrontPage.css";
import "./ResultsPage.css";

export default function ResultsPage() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("query") || "";
  const country = searchParams.get("country") || "All Countries";
  const platform = searchParams.get("platform") || "All Platforms";

  const [selectedAd, setSelectedAd] = useState(null);
  const [highestToLowest, setHighestToLowest] = useState(false);
  const [isCheckedSpent, setIsCheckedSpent] = useState(false);
  const [isCheckedReach, setIsCheckedReach] = useState(false);
  const [highestToLowestReach, setHighestToLowestReach] = useState(false);

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
    if (isCheckedSpent) {
      const aSpend = Number(a.total_spend) || 0;
      const bSpend = Number(b.total_spend) || 0;
      return highestToLowest ? bSpend - aSpend : aSpend - bSpend;
    }

    if (isCheckedReach) {
      const aReach = Number(a.total_impressions) || 0;
      const bReach = Number(b.total_impressions) || 0;
      return highestToLowestReach ? bReach - aReach : aReach - bReach;
    }

    return 0;
  });

  const totalSpent = results.reduce((sum, ad) => {
    const spend = Number(ad.total_spend) || 0;
    return sum + spend;
  }, 0);
  const totalReach = results.reduce((sum, ad) => {
    const Reach = Number(ad.total_impressions) || 0;
    return sum + Reach;
  }, 0);

  return (
    <div className="results-page">
      <h1 className="results-title">Results Dashboard</h1>

      <h4 className="results-summary">
        {" "}
        Total Ads: {results.length} | Total Spent: $
        {totalSpent.toLocaleString()} | Total Reach:{" "}
        {totalReach.toLocaleString()}{" "}
      </h4>
      <div className="results-chart-placeholder">
        Tableau dashboard placeholder (TREND CHART)
      </div>

      <h4 className="results-list-title">Ads List</h4>
      <label className="results-sort-label">Sorting Options:</label>

      <input
        type="checkbox"
        checked={isCheckedSpent}
        onChange={() => setIsCheckedSpent(!isCheckedSpent)}
        className="results-sort-checkbox"
      />
      <button
        className="results-sort-button"
        style={{ backgroundColor: isCheckedSpent ? "#007bff" : "#6e6b6b" }}
        onClick={() => {
          setHighestToLowest(!highestToLowest);
        }}
      >
        {isCheckedSpent
          ? highestToLowest
            ? "Spent (Highest To Lowest) ↑"
            : "Spent (Lowest To Highest) ↓"
          : "← Sort By Amount Spent"}
      </button>

      <input
        type="checkbox"
        checked={isCheckedReach}
        onChange={() => setIsCheckedReach(!isCheckedReach)}
        className="results-sort-checkbox"
      />
      <button
        className="results-sort-button"
        style={{ backgroundColor: isCheckedReach ? "#007bff" : "#6e6b6b" }}
        onClick={() => {
          setHighestToLowestReach(!highestToLowestReach);
        }}
      >
        {isCheckedReach
          ? highestToLowestReach
            ? "Reach (Highest To Lowest) ↑"
            : "Reach (Lowest To Highest) ↓"
          : "← Sort By Reach"}
      </button>

      <div className="results-table-wrap">
        <table className="results-table">
          <thead>
            <tr className="results-table-header-row">
              <th className="results-table-head-cell">Ad Name</th>
              <th className="results-table-head-cell">Advertiser</th>
              <th className="results-table-head-cell">Geography</th>
              <th className="results-table-head-cell">Platform</th>
              <th className="results-table-head-cell">Spent</th>
              <th className="results-table-head-cell">Reach</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan="6" className="results-table-empty-cell">
                  Loading results...
                </td>
              </tr>
            )}

            {!loading && results.length === 0 && (
              <tr>
                <td colSpan="6" className="results-table-empty-cell">
                  No results found. Try a different search term.
                </td>
              </tr>
            )}

            {!loading &&
              results.length > 0 &&
              sortedResults.map((ad, index) => (
                <tr
                  key={index}
                  className="results-table-row"
                  onClick={() =>
                    setSelectedAd({
                      campaign: ad.campaign,
                      advertiser: ad.advertiser,
                      geography: ad.geography,
                      platform: ad.platform,
                      spent: Number(ad.total_spend) || 0,
                      reach: Number(ad.total_impressions) || 0,
                      startDate: ad.start_date,
                      endDate: ad.end_date,
                    })
                  }
                >
                  <td className="results-table-cell">{ad.campaign}</td>
                  <td className="results-table-cell">{ad.advertiser}</td>
                  <td className="results-table-cell">{ad.geography}</td>
                  <td className="results-table-cell">{ad.platform}</td>
                  <td className="results-table-cell">
                    ${ad.total_spend?.toLocaleString()}
                  </td>
                  <td className="results-table-cell">
                    {ad.total_impressions?.toLocaleString()}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
      {selectedAd && (
        <>
          <div
            onClick={() => setSelectedAd(null)}
            className="results-modal-overlay"
          />

          <div className="results-side-panel">
            <button
              onClick={() => setSelectedAd(null)}
              className="results-side-panel-close"
            >
              ×
            </button>

            <h2>Ad Details</h2>
            <p>
              <strong>Ad Name:</strong> {selectedAd.campaign || "N/A"}
            </p>
            <p>
              <strong>Advertiser:</strong> {selectedAd.advertiser || "N/A"}
            </p>
            <p>
              <strong>Geography:</strong> {selectedAd.geography || "N/A"}
            </p>
            <p>
              <strong>Platform:</strong> {selectedAd.platform || "N/A"}
            </p>
            <p>
              <strong>Spent:</strong> ${selectedAd.spent?.toLocaleString()}
            </p>
            <p>
              <strong>Reach:</strong> {selectedAd.reach?.toLocaleString()}
            </p>
            <p>
              <strong>Start Date:</strong> {selectedAd.startDate || "N/A"}
            </p>
            <p>
              <strong>End Date:</strong> {selectedAd.endDate || "N/A"}
            </p>
          </div>
        </>
      )}
    </div>
  );
}
