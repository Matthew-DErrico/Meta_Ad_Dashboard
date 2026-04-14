// Select filter dropdown style
export const getFilterDropdownStyle = (isDark) => ({
  control: (base) => ({
    ...base,
    padding: "0.25rem",
    width: "200px",
    border: isDark ? "1px solid #464141" : "1px solid #d1d5db",
    borderRadius: "6px",
    backgroundColor: isDark ? "#1f1d1d" : "#ffffff",
    color: isDark ? "#F1EFE8" : "#2C2C2A",

  }),
  menu: (base) => ({
    ...base,
    width: "200px",
    fontFamily: "'DM Mono', monospace",
    border: isDark ? "1px solid #464141" : "1px solid #d1d5db",
    borderRadius: "6px",
    backgroundColor: isDark ? "#1f1d1d" : "#ffffff",
  }),
  option: (base, state) => ({
    ...base,
    fontFamily: "'DM Mono', monospace",
    backgroundColor: state.isFocused
      ? isDark
        ? "#2a2a2a"
        : "#f3f4f6"
      : isDark
        ? "#1f1d1d"
        : "#ffffff",
    color: isDark ? "#F1EFE8" : "#2C2C2A",
  }),
  singleValue: (base) => ({
    ...base,
    color: isDark ? "#F1EFE8" : "#2C2C2A",
  }),
  placeholder: (base) => ({
    ...base,
    color: isDark ? "#666666" : "#9ca3af",
    fontFamily: "'DM Mono', monospace",
    fontSize: "14px",
  }),
  input: (base) => ({
    ...base,
    color: isDark ? "#F1EFE8" : "#2C2C2A",
    fontFamily: "'DM Mono', monospace",
    fontSize: "14px",
  }),
});
