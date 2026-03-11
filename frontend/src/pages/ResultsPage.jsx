import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { fetchSearchResults } from "../services/api";
import Select from "react-select";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { filterDropdownStyle } from "../styles/selectStyles";

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

  useEffect(() => {
    const performSearch = async () => {
      if (!query) return;

      setLoading(true);
      try {
        const data = await fetchSearchResults(
          query,
          selectedCountry !== "All Countries" ? selectedCountry : null,
          selectedAdvertiser !== "All Advertisers" ? selectedAdvertiser : null,
        );
        setResults(data);
      } catch (error) {
        console.error("Error fetching search results:", error);
      } finally {
        setLoading(false);
      }
    };

    performSearch();
  }, [query, selectedCountry, selectedAdvertiser]);

  return (
    <div>
      <h1>Results Dashboard</h1>
      {/* Search Bar */}
      <form onSubmit={handleNewSearch} style={{ marginBottom: "1rem" }}>
        <label>Topic: </label>
        <input
          type="text"
          value={newQuery}
          onChange={(e) => setNewQuery(e.target.value)}
          placeholder="Search for a new topic..."
          style={{
            marginTop: "2rem",
            width: "300px",
            padding: "1rem",
            border: "1px solid #ccc",
            borderRadius: "6px",
            marginRight: "0.5rem",
          }}
        />
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
      {/* Filters Section with Country, Date Range, Advertiser dropdowns, and Filter Update Button */}
      <div
        style={{
          display: "flex",
          gap: "1rem",
          marginTop: "1rem",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* Country Dropdown with Searchable Options */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Select
            options={[
              { value: "All Countries", label: "All Countries" },
              { value: "United States", label: "United States" },
              { value: "United Kingdom", label: "United Kingdom" },
              { value: "Canada", label: "Canada" },
              { value: "Australia", label: "Australia" },
            ]}
            value={{ value: selectedCountry, label: selectedCountry }}
            onChange={(selectedOption) =>
              setSelectedCountry(selectedOption.value)
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
            options={[
              { value: "All Advertisers", label: "All Advertisers" },
              { value: "Nike", label: "Nike" },
              { value: "Apple", label: "Apple" },
              { value: "Microsoft", label: "Microsoft" },
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
          style={{
            padding: "1rem 1.5rem",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            backgroundColor: successMessage ? "green" : "#007bff",
            color: successMessage ? "white" : "white",
            transition: "all 0.3s ease",
          }}
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
                Geography
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
            {loading && (
              <tr>
                <td
                  colSpan="5"
                  style={{ textAlign: "center", padding: "2rem" }}
                >
                  Loading results...
                </td>
              </tr>
            )}

            {!loading && results.length === 0 && (
              <tr>
                <td
                  colSpan="5"
                  style={{ textAlign: "center", padding: "2rem" }}
                >
                  No results found. Try a different search term.
                </td>
              </tr>
            )}

            {!loading &&
              results.length > 0 &&
              results.map((ad, index) => (
                <tr key={index} style={{ borderBottom: "1px solid #eee" }}>
                  <td style={{ padding: "1rem" }}>{ad.campaign}</td>
                  <td style={{ padding: "1rem" }}>{ad.advertiser}</td>
                  <td style={{ padding: "1rem" }}>{ad.geography}</td>
                  <td style={{ padding: "1rem" }}>
                    ${ad.total_spend?.toLocaleString()}
                  </td>
                  <td style={{ padding: "1rem" }}>
                    {ad.total_impressions?.toLocaleString()}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
