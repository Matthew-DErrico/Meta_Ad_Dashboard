import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";

export default function ResultsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get("query") || "";
  const [newQuery, setNewQuery] = useState(query);
  const country = searchParams.get("country") || "All";
  const dateRange = searchParams.get("dateRange") || "All";

  const handleNewSearch = (e) => {
    e.preventDefault();
    setSearchParams({
      query: newQuery,
      country,
      dateRange,
    });
  };

  return (
    <div>
      <h1>Results Dashboard</h1>
      {/* Get topic from search bar from FrontPage and display it here */}
      <form onSubmit={handleNewSearch} style={{ marginBottom: "1rem" }}>
        <label>Search New Topic: </label>
        <input
          type="text"
          value={newQuery}
          onChange={(e) => setNewQuery(e.target.value)}
          placeholder="Search for a new topic..."
          style={{}}
        />
        <button type="submit" style={{ marginLeft: "0.5rem" }}>
          Search
        </button>
      </form>
      <h4>Topic: "{query}"</h4>
      {/* For advertiser, it will be a drop down with options of advertisers in the database for the specifc topic. There should a search feature at the top of the dropdown */}
      <h4>
        {" "}
        Advertiser = Any | Date Range: {dateRange} | Country: {country}
      </h4>{" "}
      <h4> Total Ads: 123 | Total Spent: $00,000 | Top Advertiser: Nike </h4>
      {/* Placeholder for visualizations */}
      <p>Interactive visualizations will appear here.</p>
      <div
        style={{
          marginTop: "2rem",
          padding: "2rem",
          border: "1px solid #ddd",
          borderRadius: "8px",
          textAlign: "center",
          color: "#666",
        }}
      >
        Tableau dashboard placeholder (TREND CHART)
      </div>
      {/* Placeholder for ads list */}
      <h4> Ads List </h4>
      <h4> Sort By: [Most Spent] [Most Reach]</h4>{" "}
      {/*These will be buttons (checkmarks?) which enable the sort options*/}
      <div
        style={{
          marginTop: "2rem",
          padding: "2rem",
          border: "1px solid #eee",
          textAlign: "center",
        }}
      >
        {/* Eventually this will be a table of ads with details */}
        <h4> Ad Name | Advertiser | Spent | Reach</h4>
        <p>Ad 1 | Nike | $5,000 | 1M</p>
        <p>Ad 2 | Nike | $3,000 | 500K</p>
        <p>Ad 3 | Nike | $2,000 | 300K</p>
      </div>
    </div>
  );
}
