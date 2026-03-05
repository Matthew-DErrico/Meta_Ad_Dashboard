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
      <Link
        style={{
          fontSize: "1.5rem",
          fontWeight: "bold",
          textDecoration: "none",
          color: "inherit",
        }}
        to="/"
      >
        Meta Ad Dashboard
      </Link>

      <div style={{ display: "flex", gap: "1rem" }}>
        <Link to="/">Home</Link>
      </div>
    </nav>
  );
}
