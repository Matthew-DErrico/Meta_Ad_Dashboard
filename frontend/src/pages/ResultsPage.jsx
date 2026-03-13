import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { fetchSearchResults, fetchFilters } from "../services/api";
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
  const [platformFilter, setPlatformFilter] = useState("All Platforms");
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
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
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
      {/* Temporary summary stats, will need backend to calculate these values and send them to the frontend to get an accurate read
      as right now it will only get what is actually being presented which has a max of 25.*/}
      <h4>
        {" "}
        Total Ads: {results.length} | Total Spent: $
        {totalSpent.toLocaleString()} | Total Reach:{" "}
        {totalReach.toLocaleString()}{" "}
      </h4>
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
                Platform
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
                  colSpan="6"
                  style={{ textAlign: "center", padding: "2rem" }}
                >
                  Loading results...
                </td>
              </tr>
            )}

            {!loading && results.length === 0 && (
              <tr>
                <td
                  colSpan="6"
                  style={{ textAlign: "center", padding: "2rem" }}
                >
                  No results found. Try a different search term.
                </td>
              </tr>
            )}

            {!loading &&
              results.length > 0 &&
              sortedResults.map((ad, index) => (
                <tr
                  key={index}
                  style={{ borderBottom: "1px solid #eee", cursor: "pointer" }}
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
                  <td style={{ padding: "1rem" }}>{ad.campaign}</td>
                  <td style={{ padding: "1rem" }}>{ad.advertiser}</td>
                  <td style={{ padding: "1rem" }}>{ad.geography}</td>
                  <td style={{ padding: "1rem" }}>{ad.platform}</td>
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
      {selectedAd && (
        <>
          <div
            onClick={() => setSelectedAd(null)}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              backgroundColor: "rgba(0, 0, 0, 0.3)",
              zIndex: 999,
            }}
          />

          <div
            style={{
              position: "fixed",
              top: 0,
              right: 0,
              width: "350px",
              height: "100vh",
              backgroundColor: "white",
              boxShadow: "-4px 0 10px rgba(0,0,0,0.15)",
              padding: "1.5rem",
              zIndex: 1000,
              overflowY: "auto",
              textAlign: "left",
            }}
          >
            <button
              onClick={() => setSelectedAd(null)}
              style={{
                border: "none",
                background: "transparent",
                fontSize: "1.5rem",
                cursor: "pointer",
                float: "right",
              }}
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
