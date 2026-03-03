import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";

export default function ResultsPage() {
  {
    /* variables for URL parameters and state management for filters */
  }
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get("query") || "";
  const [newQuery, setNewQuery] = useState(query);
  const country = searchParams.get("country") || "All";
  const [selectedCountry, setSelectedCountry] = useState(country);
  const dateRange = searchParams.get("dateRange") || "All";
  const [newDateRange, setDateRange] = useState(dateRange);
  const advertiser = searchParams.get("advertiser") || "All";
  const [selectedAdvertiser, setSelectedAdvertiser] = useState(advertiser);

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

  {
    /* timer for success message when filters are updated */
  }
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  {
    /* Updates URL parameters */
  }
  const handleNewSearch = (e) => {
    e.preventDefault();
    setSearchParams({
      query: newQuery,
      country: selectedCountry,
      dateRange: newDateRange,
      advertiser: selectedAdvertiser,
    });
  };

  return (
    <div>
      <h1>Results Dashboard</h1>
      {/* Get topic from search bar from FrontPage and display it here */}
      <form onSubmit={handleNewSearch} style={{ marginBottom: "1rem" }}>
        <label>Topic: </label>
        <input
          type="text"
          value={newQuery}
          onChange={(e) => setNewQuery(e.target.value)}
          placeholder="Search for a new topic..."
          style={{
            marginTop: "2rem",
            width: "150px",
            padding: "0.75rem",
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
      {/* For advertiser, it will be a drop down with options of advertisers in the database for the specifc topic.
       There should a search feature at the top of the dropdown */}
      {/* Country Dropdown */}
      <select
        value={selectedCountry}
        onChange={(e) => setSelectedCountry(e.target.value)}
        style={{
          width: "150px",
          padding: "0.75rem",
          border: "1px solid #ccc",
          borderRadius: "6px",
          marginRight: "0.5rem",
        }}
      >
        <option value="All">All Countries</option>
        <option value="United States">United States</option>
        <option value="United Kingdom">United Kingdom</option>
        <option value="Canada">Canada</option>
        <option value="Australia">Australia</option>
      </select>
      {/* Date Range Dropdown */}
      <select
        value={newDateRange}
        onChange={(e) => setDateRange(e.target.value)}
        style={{
          width: "150px",
          padding: "0.75rem",
          border: "1px solid #ccc",
          borderRadius: "6px",
          marginRight: "0.5rem",
        }}
      >
        <option value="All">All Time</option>
        <option value="Last 7 Days">Last 7 Days</option>
        <option value="Last 30 Days">Last 30 Days</option>
        <option value="Last 90 Days">Last 90 Days</option>
      </select>
      {/* Advertiser Dropdown */}
      <select
        value={selectedAdvertiser}
        onChange={(e) => setSelectedAdvertiser(e.target.value)}
        style={{
          width: "150px",
          padding: "0.75rem",
          border: "1px solid #ccc",
          borderRadius: "6px",
          marginRight: "0.5rem",
        }}
      >
        <option value="All">All Advertisers</option>
        <option value="Nike">Nike</option>
        <option value="Apple">Apple</option>
        <option value="Microsoft">Microsoft</option>
      </select>
      {/* Update Filters Button with success message */}
      <button
        style={{
          padding: "0.75rem 1.5rem",
          border: "none",
          borderRadius: "6px",
          cursor: "pointer",
          backgroundColor: successMessage ? "green" : "#007bff",
          color: successMessage ? "white" : "white",
          transition: "all 0.3s ease",
        }}
        onClick={() => {
          setSearchParams({
            query,
            country: selectedCountry,
            dateRange: newDateRange,
            advertiser: selectedAdvertiser,
          });
          setSuccessMessage(true);
        }}
      >
        {successMessage ? "Filters Updated!" : "Update Filters"}
      </button>
      <h4> Total Ads: 123 | Total Spent: $00,000 | Top Advertiser: Nike </h4>
      {/* Placeholder for visualizations */}
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
      {/* Frontend will deal with sorting the ads based on amount spent and reach, backend will just send the data in a random order */}
      <h4> Ads List </h4>
      <label>Sorting Options: </label>
      {/* Spent Sorting Options */}
      <input
        type="checkbox"
        checked={isCheckedSpent}
        onChange={() => setIsCheckedSpent(!isCheckedSpent)}
        style={{ marginRight: "0.5rem" }}
      />
      <button
        style={{
          backgroundColor: isCheckedSpent ? "#007bff" : "#6e6b6b",
          color: isCheckedSpent ? "white" : "#ffffff",
          border: "none",
          padding: "0.5rem 1rem",
          borderRadius: "4px",
          cursor: "pointer",
          marginRight: "0.5rem",
        }}
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
        style={{ marginRight: "0.5rem" }}
      />
      <button
        style={{
          backgroundColor: isCheckedReach ? "#007bff" : "#6e6b6b",
          color: isCheckedReach ? "white" : "#ffffff",
          border: "none",
          padding: "0.5rem 1rem",
          borderRadius: "4px",
          cursor: "pointer",
          marginRight: "0.5rem",
        }}
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
      <div
        style={{
          marginTop: "2rem",
          padding: "2rem",
          border: "1px solid #eee",
        }}
      >
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            backgroundColor: "white",
          }}
        >
          <thead>
            <tr style={{ backgroundColor: "#007bff", color: "white" }}>
              <th
                style={{
                  padding: "1rem",
                  textAlign: "center",
                  borderBottom: "2px solid #ddd",
                }}
              >
                Ad Name
              </th>
              <th
                style={{
                  padding: "1rem",
                  textAlign: "center",
                  borderBottom: "2px solid #ddd",
                }}
              >
                Advertiser
              </th>
              <th
                style={{
                  padding: "1rem",
                  textAlign: "center",
                  borderBottom: "2px solid #ddd",
                }}
              >
                Spent
              </th>
              <th
                style={{
                  padding: "1rem",
                  textAlign: "center",
                  borderBottom: "2px solid #ddd",
                }}
              >
                Reach
              </th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderBottom: "1px solid #eee" }}>
              <td style={{ padding: "1rem" }}>Ad 1</td>
              <td style={{ padding: "1rem" }}>Nike</td>
              <td style={{ padding: "1rem" }}>$5,000</td>
              <td style={{ padding: "1rem" }}>1M</td>
            </tr>
            <tr style={{ borderBottom: "1px solid #eee" }}>
              <td style={{ padding: "1rem" }}>Ad 2</td>
              <td style={{ padding: "1rem" }}>Nike</td>
              <td style={{ padding: "1rem" }}>$3,000</td>
              <td style={{ padding: "1rem" }}>500K</td>
            </tr>
            <tr style={{ borderBottom: "1px solid #eee" }}>
              <td style={{ padding: "1rem" }}>Ad 3</td>
              <td style={{ padding: "1rem" }}>Nike</td>
              <td style={{ padding: "1rem" }}>$2,000</td>
              <td style={{ padding: "1rem" }}>300K</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
