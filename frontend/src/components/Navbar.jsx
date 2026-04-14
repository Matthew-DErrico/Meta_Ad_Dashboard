import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Select from "react-select";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { fetchFilters } from "../services/api";
import { getFilterDropdownStyle } from "../styles/selectStyles";
import "./Navbar.css";

function useIsDark() {
  const [isDark, setIsDark] = useState(
    window.matchMedia("(prefers-color-scheme: dark)").matches,
  );

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (event) => setIsDark(event.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return isDark;
}

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const isResultsRoute = location.pathname === "/results";

  const [query, setQuery] = useState("");
  const [advertiser, setAdvertiser] = useState("");
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  const [advertisers, setAdvertisers] = useState([]);

  const isDark = useIsDark();

  useEffect(() => {
    if (!isResultsRoute) return;

    const params = new URLSearchParams(location.search);
    setQuery(params.get("query") || "");
    setAdvertiser(params.get("advertiser") || "");

    const startDateParam = params.get("startDate");
    const endDateParam = params.get("endDate");
    setStartDate(startDateParam ? new Date(startDateParam) : null);
    setEndDate(endDateParam ? new Date(endDateParam) : null);
  }, [isResultsRoute, location.search]);

  useEffect(() => {
    if (!isResultsRoute) return;

    const loadFilters = async () => {
      try {
        const filters = await fetchFilters();
        setAdvertisers(filters.geographies || filters.advertisers || []);
      } catch (error) {
        console.error("Error loading filters:", error);
      }
    };

    loadFilters();
  }, [isResultsRoute]);

  const baseDropdownStyle = getFilterDropdownStyle(isDark);
  const dropdownStyle = {
    ...baseDropdownStyle,
    menuPortal: (base) => ({
      ...base,
      zIndex: 1600,
    }),
    menu: (base, state) => ({
      ...(typeof baseDropdownStyle.menu === "function"
        ? baseDropdownStyle.menu(base, state)
        : base),
      zIndex: 1600,
    }),
  };

  const menuPortalTarget =
    typeof document !== "undefined" ? document.body : null;

  const removeFilterAndApply = (paramKey) => {
    const params = new URLSearchParams(location.search);
    params.delete(paramKey);
    const nextQuery = params.toString();
    navigate(nextQuery ? `/results?${nextQuery}` : "/results");
  };

  const handleApply = (event) => {
    event.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set("query", query.trim());
    if (advertiser) params.set("advertiser", advertiser);
    if (startDate)
      params.set("startDate", startDate.toISOString().split("T")[0]);
    if (endDate) params.set("endDate", endDate.toISOString().split("T")[0]);

    navigate(`/results?${params.toString()}`);
  };

  return (
    <nav className="app-navbar">
      <Link className="app-navbar-brand" to="/">
        Meta Ad Dashboard
      </Link>

      {isResultsRoute && (
        <form className="app-navbar-controls" onSubmit={handleApply}>
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search for a topic..."
            className="app-navbar-search"
          />

          <Select
            options={[
              { value: "All Advertisers", label: "All Advertisers" },
              ...advertisers.map((item) => ({ value: item, label: item })),
            ]}
            value={advertiser ? { value: advertiser, label: advertiser } : null}
            isSearchable={true}
            isClearable={true}
            placeholder="Advertiser"
            onChange={(selectedOption, actionMeta) => {
              const nextAdvertiser = selectedOption?.value || "";
              setAdvertiser(nextAdvertiser);

              if (actionMeta?.action === "clear") {
                removeFilterAndApply("advertiser");
              }
            }}
            styles={dropdownStyle}
            menuPortalTarget={menuPortalTarget}
            menuPosition="fixed"
          />

          <div className="app-navbar-datepicker-wrap">
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
              popperClassName="app-navbar-datepicker-popper"
            />
          </div>

          <button type="submit" className="app-navbar-apply-button">
            Apply
          </button>
        </form>
      )}
    </nav>
  );
}
