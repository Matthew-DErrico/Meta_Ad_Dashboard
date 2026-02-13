import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function FrontPage() {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  // Placeholder search handler
  const handleSearch = (e) => {
    e.preventDefault();

    // Eventually pass the query to /results
    // For now just navigate to the results page
    navigate("/results");
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

      {/* Search Bar */}
      {/* Remember to move this to center of page and make it look nice */}
      <form onSubmit={handleSearch} style={{ marginTop: "2rem" }}>
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
