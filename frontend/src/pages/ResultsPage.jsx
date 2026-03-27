import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { fetchSearchResults, fetchFilters } from "../services/api";
import Select from "react-select";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { getFilterDropdownStyle } from "../styles/selectStyles";
import "./FrontPage.css";
import "./ResultsPage.css";

export default function ResultsPage() {
  {
    /* variables for URL parameters and state management for filters */
  }
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get("query") || "";
  const [newQuery, setNewQuery] = useState(query);
  const country = searchParams.get("country") || "All Countries";
  const [selectedCountry, setSelectedCountry] = useState(country);
  const advertiser = searchParams.get("advertiser") || "All Advertisers";
  const [selectedAdvertiser, setSelectedAdvertiser] = useState(advertiser);
  const platform = searchParams.get("platform") || "All Platforms";
  const [selectedPlatform, setSelectedPlatform] = useState(platform);

  {
    /* Sidebar Variables */
  }
  const [selectedAd, setSelectedAd] = useState(null);
  {
    /* Data Range variables */
  }
  const startDateParam = searchParams.get("startDate");
  const endDateParam = searchParams.get("endDate");
  const [startDate, setStartDate] = useState(
    startDateParam ? new Date(startDateParam) : null,
  );
  const [endDate, setEndDate] = useState(
    endDateParam ? new Date(endDateParam) : null,
  );

  {
    /* filter button success message */
  }
  const [successMessage, setSuccessMessage] = useState(false);

  {
    /*  sort state variables */
  }
  const [highestToLowest, setHighestToLowest] = useState(false);
  const [isCheckedSpent, setIsCheckedSpent] = useState(false);
  const [isCheckedReach, setIsCheckedReach] = useState(false);
  const [highestToLowestReach, setHighestToLowestReach] = useState(false);

  const [isDark, setIsDark] = useState(
    window.matchMedia("(prefers-color-scheme: dark)").matches,
  );

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e) => setIsDark(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const filterDropdownStyle = getFilterDropdownStyle(isDark);

  {
    /* timer for success message when filters are updated */
  }
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage(false);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  {
    /* Updates URL parameters */
  }
  const handleNewSearch = (e) => {
    e.preventDefault();
    const params = {
      query: newQuery,
      country: selectedCountry,
      advertiser: selectedAdvertiser,
      platform: selectedPlatform,
    };
    if (startDate) params.startDate = startDate.toISOString().split("T")[0];
    if (endDate) params.endDate = endDate.toISOString().split("T")[0];
    setSearchParams(params);
  };

  {
    /* State variables for search results and loading state */
  }
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  {
    /* Effect to perform search whenever query or filters change */
  }

  useEffect(() => {
    const performSearch = async () => {
      if (!query) return;

      setLoading(true);
      try {
        const data = await fetchSearchResults(
          query,
          selectedCountry !== "All Countries" ? selectedCountry : null,
          selectedPlatform !== "All Platforms" ? selectedPlatform : null,
        );
        setResults(data);
      } catch (error) {
        console.error("Error fetching search results:", error);
      } finally {
        setLoading(false);
      }
    };

    performSearch();
  }, [query, selectedCountry, selectedPlatform]);

  {
    /* Load filter options on component mount (dropdowns) */
  }
  const [geographies, setGeographies] = useState([]);
  const [platforms, setPlatforms] = useState([]);
  const [advertisers, setAdvertisers] = useState([]);
  useEffect(() => {
    const loadFilters = async () => {
      try {
        const filters = await fetchFilters();
        setGeographies(filters.geographies);
        setPlatforms(filters.platforms);
        setAdvertisers(filters.advertisers);
      } catch (error) {
        console.error("Error loading filters:", error);
      }
    };

    loadFilters();
  }, []);

  {
    /* Sorting Logic for Spent and Reach (takes current results and just sorts it....)*/
  }

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

  {
    /* Temporary Total Spent and Reach calculation, will need backend to calculate this value and send it to the frontend to get an accurate read,
     remove after presentation 2 */
  }
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
      {/* Search Bar */}
      <form onSubmit={handleNewSearch} className="results-search-form">
        <label className="results-topic-label">Topic:</label>
        <input
          type="text"
          value={newQuery}
          onChange={(e) => setNewQuery(e.target.value)}
          placeholder="Search for a new topic..."
          className="results-search-input"
        />
        <button type="submit" className="results-search-button">
          Search
        </button>
      </form>
      {/* Filters Section with Country, Date Range, Advertiser dropdowns, and Filter Update Button */}
      <div className="results-filters-row">
        {/* Country Dropdown with Searchable Options */}
        <div className="results-filter-item">
          <Select
            options={[
              { value: "All Countries", label: "All Countries" },
              ...geographies.map((geo) => ({ value: geo, label: geo })),
            ]}
            value={{ value: selectedCountry, label: selectedCountry }}
            onChange={(selectedOption) =>
              setSelectedCountry(selectedOption.value)
            }
            styles={filterDropdownStyle}
          />
        </div>
        {/* Platform dropdown with Searchable Options */}
        <div className="results-filter-item">
          <Select
            options={[
              { value: "All Platforms", label: "All Platforms" },
              ...platforms.map((platform) => ({
                value: platform,
                label: platform,
              })),
            ]}
            value={{ value: selectedPlatform, label: selectedPlatform }}
            onChange={(selectedOption) =>
              setSelectedPlatform(selectedOption.value)
            }
            styles={filterDropdownStyle}
          />
        </div>
        {/* Date Range Calendar Picker */}
        <div className="results-filter-item">
          <div className="custom-datepicker-wrapper">
            <DatePicker
              selectsRange={true}
              startDate={startDate}
              endDate={endDate}
              onChange={(update) => {
                const [start, end] = update;
                setStartDate(start);
                setEndDate(end);
              }}
              isClearable={true}
              placeholderText="Select date range"
              dateFormat="MM/dd/yyyy"
              showMonthDropdown
              showYearDropdown
              dropdownMode="select"
              yearDropdownItemNumber={15}
              scrollableYearDropdown
            />
          </div>
        </div>
        {/* Advertiser Dropdown with Searchable Options */}
        <div className="results-filter-item">
          <Select
            options={[
              { value: "All Advertisers", label: "All Advertisers" },
              ...advertisers.map((adv) => ({ value: adv, label: adv })),
            ]}
            value={{ value: selectedAdvertiser, label: selectedAdvertiser }}
            onChange={(selectedOption) =>
              setSelectedAdvertiser(selectedOption.value)
            }
            styles={filterDropdownStyle}
          />
        </div>
        {/* Update Filters Button with success message */}
        <button
          className="results-update-button"
          style={{ backgroundColor: successMessage ? "green" : "#007bff" }}
          onClick={() => {
            const params = {
              query,
              country: selectedCountry,
              advertiser: selectedAdvertiser,
            };
            if (startDate)
              params.startDate = startDate.toISOString().split("T")[0];
            if (endDate) params.endDate = endDate.toISOString().split("T")[0];
            setSearchParams(params);
            setSuccessMessage(true);
          }}
        >
          {successMessage ? "Filters Updated!" : "Update Filters"}
        </button>
      </div>
      {/* Temporary summary stats, will need backend to calculate these values and send them to the frontend to get an accurate read
      as right now it will only get what is actually being presented which has a max of 25.*/}
      <h4 className="results-summary">
        {" "}
        Total Ads: {results.length} | Total Spent: $
        {totalSpent.toLocaleString()} | Total Reach:{" "}
        {totalReach.toLocaleString()}{" "}
      </h4>
      {/* Placeholder for visualizations */}
      <div className="results-chart-placeholder">
        Tableau dashboard placeholder (TREND CHART)
      </div>
      {/* Frontend will deal with sorting the ads based on amount spent and reach, backend will just send the data in a random order */}
      <h4 className="results-list-title">Ads List</h4>
      <label className="results-sort-label">Sorting Options:</label>
      {/* Spent Sorting Options */}
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
      {/* Reach Sorting Options */}
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
      {/* Ad List Table */}
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
