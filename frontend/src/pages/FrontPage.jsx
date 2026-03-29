import { useState, useEffect, useRef } from "react";
import { fetchFilters, fetchOverview } from "../services/api";
import { useNavigate } from "react-router-dom";
import Select from "react-select";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { getFilterDropdownStyle } from "../styles/selectStyles";
import "./FrontPage.css";

export default function FrontPage() {
  const [query, setQuery] = useState("");
  const [countryFilter, setCountryFilter] = useState("");
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [advertiserFilter, setAdvertiserFilter] = useState("");
  const navigate = useNavigate();
  const [geographies, setGeographies] = useState([]);
  const [platforms, setPlatforms] = useState([]);
  const [platformFilter, setPlatformFilter] = useState("");
  const [advertisers, setAdvertisers] = useState([]);
  const [overview, setOverview] = useState({
    total_spend: 0,
    total_impressions: 0,
    advertiser_count: 0,
  });
  const [overviewLoading, setOverviewLoading] = useState(true);
  const helpSectionRef = useRef(null);

  {
    /* Load filter options on component mount (dropdowns) */
  }
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

  useEffect(() => {
    const loadOverview = async () => {
      setOverviewLoading(true);
      try {
        const data = await fetchOverview();
        setOverview({
          total_spend: Number(data.total_spend || 0),
          total_impressions: Number(data.total_impressions || 0),
          advertiser_count: Number(data.advertiser_count || 0),
        });
      } catch (error) {
        console.error("Error loading overview:", error);
      } finally {
        setOverviewLoading(false);
      }
    };

    loadOverview();
  }, []);

  // Placeholder search handler
  const handleSearch = (e) => {
    e.preventDefault();

    // Pass data through URL search params
    const searchParams = new URLSearchParams();
    if (query) searchParams.append("query", query);
    if (countryFilter && countryFilter !== "All Countries")
      searchParams.append("country", countryFilter);
    if (advertiserFilter && advertiserFilter !== "All Advertisers")
      searchParams.append("advertiser", advertiserFilter);
    if (platformFilter && platformFilter !== "All Platforms")
      searchParams.append("platform", platformFilter);
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

  // Scroll to help section smoothly
  const scrollToHelp = () => {
    if (helpSectionRef.current) {
      helpSectionRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  {
    /* Prepare options for dropdowns, including "All" option */
  }
  const countryOptions = [
    { value: "All Countries", label: "All Countries" },
    ...geographies.map((geo) => ({ value: geo, label: geo })),
  ];

  const platformOptions = [
    { value: "All Platforms", label: "All Platforms" },
    ...platforms.map((platform) => ({ value: platform, label: platform })),
  ];

  const advertiserOptions = [
    { value: "All Advertisers", label: "All Advertisers" },
    ...advertisers.map((advertiser) => ({
      value: advertiser,
      label: advertiser,
    })),
  ];

  {
    /* Quick filter tags for top platforms, countries, and advertisers */
  }
  const featuredPlatformTags = platforms.slice(0, 2).map((platform) => ({
    label: platform,
    type: "platform",
    value: platform,
  }));

  const featuredCountryTags = geographies.slice(0, 2).map((country) => ({
    label: country,
    type: "country",
    value: country,
  }));

  const featuredAdvertiserTags = advertisers.slice(0, 2).map((advertiser) => ({
    label: advertiser,
    type: "advertiser",
    value: advertiser,
  }));

  const quickFilterTags = [
    ...featuredPlatformTags,
    ...featuredCountryTags,
    ...featuredAdvertiserTags,
  ];

  const selectedCountryOption =
    countryOptions.find((option) => option.value === countryFilter) || null;
  const selectedPlatformOption =
    platformOptions.find((option) => option.value === platformFilter) || null;
  const selectedAdvertiserOption =
    advertiserOptions.find((option) => option.value === advertiserFilter) ||
    null;

  const applyQuickFilterTag = (tag) => {
    if (tag.type === "platform") {
      setPlatformFilter((prev) => (prev === tag.value ? "" : tag.value));
      return;
    }

    if (tag.type === "country") {
      setCountryFilter((prev) => (prev === tag.value ? "" : tag.value));
      return;
    }

    if (tag.type === "advertiser") {
      setAdvertiserFilter((prev) => (prev === tag.value ? "" : tag.value));
    }
  };

  const isQuickTagActive = (tag) => {
    if (tag.type === "platform") return platformFilter === tag.value;
    if (tag.type === "country") return countryFilter === tag.value;
    if (tag.type === "advertiser") return advertiserFilter === tag.value;
    return false;
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
        {/* Country dropdown with Searchable Options */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Select
            options={countryOptions}
            value={selectedCountryOption}
            isSearchable={true}
            isClearable={true}
            placeholder="Country"
            onChange={(selectedOption) =>
              setCountryFilter(selectedOption?.value || "")
            }
            styles={filterDropdownStyle}
          />
        </div>
        {/* Platform dropdown with Searchable Options */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Select
            options={platformOptions}
            value={selectedPlatformOption}
            isSearchable={true}
            isClearable={true}
            placeholder="Platform"
            onChange={(selectedOption) =>
              setPlatformFilter(selectedOption?.value || "")
            }
            styles={filterDropdownStyle}
          />
        </div>
        {/* Date Range Calendar Picker */}
        <style>{`
        custom-datepicker-wrapper .react-datepicker-wrapper {
      width: 200px;
    }
    .custom-datepicker-wrapper .react-datepicker__input-container input {
      padding: 0.90rem;
      width: 175px;
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
            styles={filterDropdownStyle}
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

      <div className="quick-filters" aria-label="Quick filters">
        {quickFilterTags.map((tag) => (
          <button
            key={`${tag.type}-${tag.value}`}
            type="button"
            className={`quick-filter-tag ${isQuickTagActive(tag) ? "active" : ""}`}
            onClick={() => applyQuickFilterTag(tag)}
          >
            {tag.label}
          </button>
        ))}
      </div>

      {/* Called Fun facts in css... Overview Section with key metrics displayed in cards */}
      <section className="fun-facts-section" aria-live="polite">
        <h3 className="fun-facts-title">Ad Intelligence Summary</h3>
        <div className="fun-facts-grid">
          <div className="fun-fact-card">
            <p className="fun-fact-label">Total Spend</p>
            <p className="fun-fact-value">
              {overviewLoading
                ? "..."
                : `$${overview.total_spend.toLocaleString()}`}
            </p>
          </div>
          <div className="fun-fact-card">
            <p className="fun-fact-label">Impressions</p>
            <p className="fun-fact-value">
              {overviewLoading
                ? "..."
                : overview.total_impressions.toLocaleString()}
            </p>
          </div>
          <div className="fun-fact-card">
            <p className="fun-fact-label">Advertisers</p>
            <p className="fun-fact-value">
              {overviewLoading
                ? "..."
                : overview.advertiser_count.toLocaleString()}
            </p>
          </div>
        </div>
      </section>

      {/* Help Arrow Button */}
      <div className="help-arrow-container">
        <button onClick={scrollToHelp} className="help-arrow-button">
          <span className="help-text">Need Help? Press me!</span>
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
            <h3 className="help-card-title">Country Filter</h3>
            <p className="help-card-description">
              Select a specific country to filter ads by geographic location.
              Choose "All Countries" to search across all available markets.
              This helps narrow results to specific regions where ads are
              running.
            </p>
          </div>

          <div className="help-card">
            <h3 className="help-card-title">Platform Filter</h3>
            <p className="help-card-description">
              Filter ads by the Meta platform where they appear (Facebook,
              Instagram, etc.). Choose "All Platforms" to include ads from all
              available platforms. This allows you to focus on specific
              channels.
            </p>
          </div>

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
              Advertisers" to view ads from all parties. Use this to track
              spending and messaging from particular organizations or
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
              search for a keyword in a specific country during a particular
              date range by a certain advertiser. Fill in only the filters you
              need - all are optional.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
