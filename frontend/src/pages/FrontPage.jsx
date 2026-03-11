import { useState, useEffect } from "react";
import { fetchFilters } from "../services/api";
import { useNavigate } from "react-router-dom";
import Select from "react-select";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { filterDropdownStyle } from "../styles/selectStyles";

export default function FrontPage() {
  const [query, setQuery] = useState("");
  const [countryFilter, setCountryFilter] = useState("All Countries");
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [advertiserFilter, setAdvertiserFilter] = useState("All Advertisers");
  const navigate = useNavigate();
  const [geographies, setGeographies] = useState([]);
  const [platforms, setPlatforms] = useState([]);
  const [platformFilter, setPlatformFilter] = useState("All Platforms");

  useEffect(() => {
    const loadFilters = async () => {
      try {
        const filters = await fetchFilters();
        setGeographies(filters.geographies);
        setPlatforms(filters.platforms);
      } catch (error) {
        console.error("Error loading filters:", error);
      }
    };

    loadFilters();
  }, []);

  // Placeholder search handler
  const handleSearch = (e) => {
    e.preventDefault();

    // Pass data through URL search params
    const searchParams = new URLSearchParams();
    if (query) searchParams.append("query", query);
    if (countryFilter) searchParams.append("country", countryFilter);
    if (advertiserFilter) searchParams.append("advertiser", advertiserFilter);
    if (startDate)
      searchParams.append("startDate", startDate.toISOString().split("T")[0]);
    if (endDate)
      searchParams.append("endDate", endDate.toISOString().split("T")[0]);
    navigate(`/results?${searchParams.toString()}`);
  };

  return (
    <div>
      <h1>Political Advertising Transparency Platform</h1>
      <p>
        Explore political ad spending, targeting patterns, and messaging trends
        across Meta platforms.
      </p>

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
          <label>Country: </label>
          <Select
            options={[
              { value: "All Countries", label: "All Countries" },
              ...geographies.map((geo) => ({ value: geo, label: geo })),
            ]}
            isSearchable={true}
            placeholder="All Countries"
            onChange={(selectedOption) =>
              setCountryFilter(selectedOption.value)
            }
            styles={filterDropdownStyle}
          />
        </div>
        {/* Platform dropdown with Searchable Options */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <label>Platform: </label>
          <Select
            options={[
              { value: "All Platforms", label: "All Platforms" },
              ...platforms.map((platform) => ({
                value: platform,
                label: platform,
              })),
            ]}
            isSearchable={true}
            placeholder="All Platforms"
            onChange={(selectedOption) =>
              setPlatformFilter(selectedOption.value)
            }
            styles={filterDropdownStyle}
          />
        </div>
        {/* Date Range Calendar Picker */}
        <style>{`
        .custom-datepicker-wrapper .react-datepicker-wrapper {
          width: 200px;
        }
        .custom-datepicker-wrapper .react-datepicker__input-container input {
          padding: 0.90rem;
          width: 175px;
          border: 1px solid #ccc;
          border-radius: 6px;
          font-size: 14px;
          cursor: pointer;
        }
        .custom-datepicker-wrapper .react-datepicker__input-container input:focus {
          outline: none;
          border-color: #2684FF;
          box-shadow: 0 0 0 1px #2684FF;
        }
      `}</style>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <label>Date Range: </label>
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
          <label>Advertiser: </label>
          <Select
            options={[
              { value: "All Advertisers", label: "All Advertisers" },
              { value: "Nike", label: "Nike" },
              { value: "Apple", label: "Apple" },
              { value: "Microsoft", label: "Microsoft" },
            ]}
            isSearchable={true}
            placeholder="All Advertisers"
            onChange={(selectedOption) =>
              setAdvertiserFilter(selectedOption.value)
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
            width: "300px",
            maxWidth: "80%",
            border: "1px solid #ccc",
            borderRadius: "6px",
            marginRight: "0.5rem",
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
          }}
        >
          Search
        </button>
      </form>
    </div>
  );
}
