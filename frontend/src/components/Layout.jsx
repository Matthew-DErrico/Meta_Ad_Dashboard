export default function Layout({ children }) {
  return (
    <div
      style={{
        margin: "0 auto",
        padding: "2rem",
        textAlign: "center",
      }}
    >
      {children}
    </div>
  );
}
