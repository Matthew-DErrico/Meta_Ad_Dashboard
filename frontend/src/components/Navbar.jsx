import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <nav
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "1rem 2rem",
        borderBottom: "1px solid #ddd",
      }}
    >
      <h2 style={{ margin: 0 }}>Meta Ad Dashboard</h2>

      <div style={{ display: "flex", gap: "1rem" }}>
        <Link to="/">Home</Link>
        <Link to="/results">Results</Link>
      </div>
    </nav>
  );
}
