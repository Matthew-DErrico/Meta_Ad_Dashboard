import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Select from "react-select";
import { filterDropdownStyle } from "../styles/selectStyles";

export default function FrontPage() {
  const [query, setQuery] = useState("");
  const [countryFilter, setCountryFilter] = useState("All Countries");
  const [dateRangeFilter, setDateRangeFilter] = useState("All Time");
  const [advertiserFilter, setAdvertiserFilter] = useState("All Advertisers");
  const navigate = useNavigate();

  // Placeholder search handler
  const handleSearch = (e) => {
    e.preventDefault();

    // Pass data through URL search params
    const searchParams = new URLSearchParams();
    if (query) searchParams.append("query", query);
    if (countryFilter) searchParams.append("country", countryFilter);
    if (dateRangeFilter) searchParams.append("dateRange", dateRangeFilter);
    if (advertiserFilter) searchParams.append("advertiser", advertiserFilter);
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
              { value: "United States", label: "United States" },
              { value: "United Kingdom", label: "United Kingdom" },
              { value: "Canada", label: "Canada" },
              { value: "Australia", label: "Australia" },
            ]}
            isSearchable={true}
            placeholder="All Countries"
            onChange={(selectedOption) =>
              setCountryFilter(selectedOption.value)
            }
            styles={filterDropdownStyle}
          />
        </div>
        {/* Date Range Dropdown with Searchable Options */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <label>Date Range: </label>
          <Select
            options={[
              { value: "All Time", label: "All Time" },
              { value: "Last 7 Days", label: "Last 7 Days" },
              { value: "Last 30 Days", label: "Last 30 Days" },
              { value: "Last 90 Days", label: "Last 90 Days" },
            ]}
            placeholder="All Time"
            onChange={(selectedOption) =>
              setDateRangeFilter(selectedOption.value)
            }
            styles={filterDropdownStyle}
          />
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
