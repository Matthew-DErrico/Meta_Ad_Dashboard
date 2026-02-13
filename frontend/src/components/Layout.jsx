export default function Layout({ children }) {
  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "2rem" }}>
      {children}
    </div>
  );
}
