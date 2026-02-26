import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function FrontPage() {
  const [query, setQuery] = useState("");
  const [countryFilter, setCountryFilter] = useState("");
  const [dateRangeFilter, setDateRangeFilter] = useState("");
  const navigate = useNavigate();

  // Placeholder search handler
  const handleSearch = (e) => {
    e.preventDefault();

    // Pass data through URL search params
    const searchParams = new URLSearchParams();
    if (query) searchParams.append("query", query);
    if (countryFilter) searchParams.append("country", countryFilter);
    if (dateRangeFilter) searchParams.append("dateRange", dateRangeFilter);
    navigate(`/results?${searchParams.toString()}`);
  };

  return (
    <div>
      <h1>Political Advertising Transparency Platform</h1>
      <p>
        Explore political ad spending, targeting patterns, and messaging trends
        across Meta platforms.
      </p>
      <p>
        May or may not keep navbar, for now it is nice to have for development.
      </p>

      {/*Filter Dropdown*/}
      <label>Country: </label>
      <select
        value={countryFilter}
        onChange={(e) => setCountryFilter(e.target.value)}
        style={{
          marginTop: "2rem",
          width: "150px",
          padding: "0.75rem",
          border: "1px solid #ccc",
          borderRadius: "6px",
          marginRight: "0.5rem",
        }}
      >
        <option value="">All</option>
        <option value="United States">United States</option>
        <option value="United Kingdom">United Kingdom</option>
        <option value="Canada">Canada</option>
        <option value="Australia">Australia</option>
      </select>

      <label>Date Range: </label>
      <select
        value={dateRangeFilter}
        onChange={(e) => setDateRangeFilter(e.target.value)}
        style={{
          padding: "0.75rem",
          width: "150px",
          border: "1px solid #ccc",
          borderRadius: "6px",
          marginRight: "0.5rem",
          maxWidth: "80%",
        }}
      >
        <option value="">All</option>
        <option value="Last 7 Days">Last 7 Days</option>
        <option value="Last 30 Days">Last 30 Days</option>
        <option value="Last Year">Last Year</option>
      </select>

      {/* Search Bar */}
      <form onSubmit={handleSearch} style={{ marginTop: "1rem" }}>
        <input
          type="text"
          placeholder="Search for an advertiser, keyword, or topic..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{
            padding: "0.75rem",
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
            padding: "0.75rem 1.5rem",
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
