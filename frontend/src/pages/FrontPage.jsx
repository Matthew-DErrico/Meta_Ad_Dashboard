import { useState, useEffect, useRef } from "react";
import {
  fetchFilters,
  fetchRecentAds,
  fetchTopAdvertisers,
} from "../services/api";
import { useNavigate } from "react-router-dom";
import Select from "react-select";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { getFilterDropdownStyle } from "../styles/selectStyles";
import "./FrontPage.css";

export default function FrontPage() {
  const quickSearchTags = [
    "Election",
    "Voting",
    "Campaign Finance",
    "Healthcare",
    "Economy",
    "Education",
  ];

  const [query, setQuery] = useState("");
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [advertiserFilter, setAdvertiserFilter] = useState("");
  const navigate = useNavigate();
  const [advertisers, setAdvertisers] = useState([]);
  const [topAdvertisers, setTopAdvertisers] = useState([]);
  const [topAdvertisersLoading, setTopAdvertisersLoading] = useState(true);
  const [topAdvertisersError, setTopAdvertisersError] = useState("");
  const [trendingAds, setTrendingAds] = useState([]);
  const [trendingLoading, setTrendingLoading] = useState(true);
  const [trendingError, setTrendingError] = useState("");
  const topAdvertisersTitleRef = useRef(null);
  const helpSectionRef = useRef(null);

  {
    /* Load filter options on component mount (dropdowns) */
  }
  useEffect(() => {
    const loadFilters = async () => {
      try {
        const filters = await fetchFilters();
        setAdvertisers(filters.geographies); /* Geographies is page_name */
      } catch (error) {
        console.error("Error loading filters:", error);
      }
    };

    loadFilters();
  }, []);

  useEffect(() => {
    const loadTopAdvertisers = async () => {
      setTopAdvertisersLoading(true);
      setTopAdvertisersError("");

      try {
        const data = await fetchTopAdvertisers();
        setTopAdvertisers(Array.isArray(data) ? data.slice(0, 10) : []);
      } catch (error) {
        console.error("Error loading top advertisers:", error);
        setTopAdvertisersError("Unable to load top advertisers right now.");
      } finally {
        setTopAdvertisersLoading(false);
      }
    };

    loadTopAdvertisers();
  }, []);

  useEffect(() => {
    const loadTrendingAds = async () => {
      setTrendingLoading(true);
      setTrendingError("");

      try {
        const rows = await fetchRecentAds(6);
        setTrendingAds(Array.isArray(rows) ? rows.slice(0, 6) : []);
      } catch (error) {
        console.error("Error loading trending ads:", error);
        setTrendingError("Unable to load trending ads right now.");
      } finally {
        setTrendingLoading(false);
      }
    };

    loadTrendingAds();
  }, []);

  // Placeholder search handler
  const handleSearch = (e) => {
    e.preventDefault();

    // Pass data through URL search params
    const searchParams = new URLSearchParams();
    if (query) searchParams.append("query", query);
    if (advertiserFilter && advertiserFilter !== "All Advertisers")
      searchParams.append("advertiser", advertiserFilter);
    if (startDate)
      searchParams.append("startDate", startDate.toISOString().split("T")[0]);
    if (endDate)
      searchParams.append("endDate", endDate.toISOString().split("T")[0]);
    navigate(`/results?${searchParams.toString()}`);
  };

  // for dynamic styling of dropdowns based on dark mode preference
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
  const filterControlWidth = 260;
  const advertiserDropdownStyle = {
    ...filterDropdownStyle,
    control: (base, state) => ({
      ...filterDropdownStyle.control(base, state),
      width: `${filterControlWidth}px`,
      minHeight: "48px",
      padding: "0.35rem",
    }),
    menu: (base, state) => ({
      ...filterDropdownStyle.menu(base, state),
      width: `${filterControlWidth}px`,
    }),
  };

  // Scroll to help section smoothly
  const scrollToHelp = () => {
    if (helpSectionRef.current) {
      helpSectionRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  const scrollToInsights = () => {
    if (topAdvertisersTitleRef.current) {
      topAdvertisersTitleRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  };

  {
    /* Prepare options for dropdowns, including "All" option */
  }
  const advertiserOptions = [
    { value: "All Advertisers", label: "All Advertisers" },
    ...advertisers.map((advertiser) => ({
      value: advertiser,
      label: advertiser,
    })),
  ];

  const selectedAdvertiserOption =
    advertiserOptions.find((option) => option.value === advertiserFilter) ||
    null;

  const applyQuickSearchTag = (tag) => {
    setQuery(tag);
  };

  const isQuickSearchActive = (tag) => {
    return query.trim().toLowerCase() === tag.toLowerCase();
  };

  return (
    <div>
      <div className="title-row">
        <div className="title-column">
          <div className="title-eyebrow">Meta Ads Intelligence</div>
          <h1 className="titleFont">
            Ad <span>Finder</span>
          </h1>
          <p className="title-sub">
            Explore political ad spending, targeting patterns, and messaging
            trends across Meta platforms.
          </p>
        </div>
      </div>

      <div className="header-divider" aria-hidden="true" />

      {/*Filter Dropdown*/}
      {/* Add a search bar feature inside of the dropdown section for easy choosing of filter options */}
      <div
        style={{
          display: "flex",
          gap: "1rem",
          marginTop: "4rem",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* Date Range Calendar Picker */}
        <style>{`
    .custom-datepicker-wrapper .react-datepicker-wrapper {
      width: ${filterControlWidth}px;
    }
    .custom-datepicker-wrapper .react-datepicker__input-container {
      width: ${filterControlWidth}px;
    }
    .custom-datepicker-wrapper .react-datepicker__input-container input {
      box-sizing: border-box;
      padding: 0.98rem;
      width: 100%;
      border: 1px solid ${isDark ? "#464141" : "#d1d5db"};
      border-radius: 6px;
      font-size: 14px;
      font-family: "DM Mono", monospace;
      cursor: pointer;
      background-color: ${isDark ? "#1f1d1d" : "#ffffff"};
      color: ${isDark ? "#e8edf7" : "#2C2C2A"};
    }
    .custom-datepicker-wrapper .react-datepicker__input-container input:focus {
      outline: none;
      border-color: #2684FF;
      box-shadow: 0 0 0 1px #2684FF;
    }
      `}</style>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
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
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Select
            options={advertiserOptions}
            value={selectedAdvertiserOption}
            isSearchable={true}
            isClearable={true}
            placeholder="Advertiser"
            onChange={(selectedOption) =>
              setAdvertiserFilter(selectedOption?.value || "")
            }
            styles={advertiserDropdownStyle}
          />
        </div>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearch} style={{ marginTop: "1rem" }}>
        <input
          type="text"
          placeholder="Search for a keyword, or topic..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{
            padding: "1rem",
            width: "750px",
            maxWidth: "80%",
            border: isDark ? "1px solid #464141" : "1px solid #d1d5db",
            borderRadius: "6px",
            marginRight: "0.5rem",
            backgroundColor: isDark ? "#1f1d1d" : "#ffffff",
            color: isDark ? "#e8edf7" : "#2C2C2A",
            outline: "none",
            fontFamily: "'DM Mono', monospace",
            fontSize: "14px",
          }}
        />
        {/* Search Button */}
        <button
          type="submit"
          style={{
            padding: "1rem 1.5rem",
            background: "#007bff",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontFamily: "'DM Mono', monospace",
            fontSize: "14px",
            fontWeight: "500",
            letterSpacing: "0.06em",
          }}
        >
          Search
        </button>
      </form>

      <div className="quick-filters" aria-label="Quick search starters">
        {quickSearchTags.map((tag) => (
          <button
            key={tag}
            type="button"
            className={`quick-filter-tag ${isQuickSearchActive(tag) ? "active" : ""}`}
            onClick={() => applyQuickSearchTag(tag)}
          >
            {tag}
          </button>
        ))}
      </div>

      <div className="help-arrow-container explore-arrow-container">
        <button onClick={scrollToInsights} className="help-arrow-button">
          <span className="help-text">Explore</span>
          <span className="help-arrow">↓</span>
        </button>
      </div>

      <section className="top-advertisers-section" aria-live="polite">
        <h3 ref={topAdvertisersTitleRef} className="top-advertisers-title">
          Top 10 Advertisers
        </h3>

        {topAdvertisersLoading ? (
          <div className="top-advertisers-status">
            Loading top advertisers...
          </div>
        ) : topAdvertisersError ? (
          <div className="top-advertisers-status error">
            {topAdvertisersError}
          </div>
        ) : topAdvertisers.length === 0 ? (
          <div className="top-advertisers-status">
            No advertiser data found.
          </div>
        ) : (
          <div className="top-advertisers-table-wrap">
            <table className="top-advertisers-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Advertiser</th>
                  <th>Estimated Spend</th>
                </tr>
              </thead>
              <tbody>
                {topAdvertisers.map((row, index) => (
                  <tr key={`${row.advertiser_name}-${index}`}>
                    <td>{index + 1}</td>
                    <td>{row.advertiser_name || "N/A"}</td>
                    <td>
                      ${Number(row.estimated_spending || 0).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="trending-ads-section" aria-live="polite">
        <div className="trending-ads-header">
          <h3 className="trending-ads-title">Trending Ads Preview</h3>
          <span className="trending-ads-subtitle">Most recent activity</span>
        </div>

        {trendingLoading ? (
          <div className="trending-ads-status">Loading recent ads...</div>
        ) : trendingError ? (
          <div className="trending-ads-status error">{trendingError}</div>
        ) : trendingAds.length === 0 ? (
          <div className="trending-ads-status">No recent ads found.</div>
        ) : (
          <div className="trending-ads-row">
            {trendingAds.map((ad) => (
              <article
                key={ad.ad_id || `${ad.page_name}-${ad.start_date}`}
                className="trending-ad-card"
              >
                <div className="trending-ad-topline">
                  <span className="trending-ad-page">
                    {ad.page_name || "Unknown advertiser"}
                  </span>
                  <span className="trending-ad-date">
                    {ad.start_date
                      ? new Date(ad.start_date).toLocaleDateString()
                      : "Date unavailable"}
                  </span>
                </div>
                <p className="trending-ad-text">
                  {ad.ad_text || "No ad copy available."}
                </p>
                {ad.snapshot_url && (
                  <a
                    href={ad.snapshot_url}
                    target="_blank"
                    rel="noreferrer"
                    className="trending-ad-link"
                  >
                    View Snapshot
                  </a>
                )}
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Help Arrow Button */}
      <div className="help-arrow-container">
        <button onClick={scrollToHelp} className="help-arrow-button">
          <span className="help-text">Need Help? Down Here!</span>
          <span className="help-arrow">↓</span>
        </button>
      </div>

      {/* Help Section */}
      <div ref={helpSectionRef} className="help-section">
        <div className="title-row">
          <div className="title-column">
            <div className="title-eyebrow">User Guide</div>
            <h2 className="helpTitleFont">
              How to Use <span>Ad Finder</span>
            </h2>
          </div>
        </div>

        <div className="help-content">
          <div className="help-card">
            <h3 className="help-card-title">Date Range</h3>
            <p className="help-card-description">
              Select a date range to view ads within a specific time period.
              Click on the calendar icon or input field to open the date picker.
              Both start and end dates are optional - leave blank to see all
              available dates.
            </p>
          </div>

          <div className="help-card">
            <h3 className="help-card-title">Advertiser Filter</h3>
            <p className="help-card-description">
              Search and filter by specific advertisers. Choose "All
              Advertisers" or leave blank to view ads from all parties. Use this
              to track spending and messaging from particular organizations or
              candidates.
            </p>
          </div>

          <div className="help-card">
            <h3 className="help-card-title">Search Keywords</h3>
            <p className="help-card-description">
              Enter keywords or topics to search for specific ad content. This
              searches across ad text, messaging, and related terms. You can
              combine keyword searches with filters for more precise results.
            </p>
          </div>

          <div className="help-card">
            <h3 className="help-card-title">Combining Filters</h3>
            <p className="help-card-description">
              Filters work together to refine your search. For example, you can
              search for a keyword during a particular date range by a certain
              advertiser. Fill in only the filters you need - all are optional.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
