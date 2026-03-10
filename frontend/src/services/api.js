import axios from "axios";

const API_BASE_URL = "http://localhost:8000";

export const fetchFilters = async () => {
  // Using test endpoint until Snowflake is configured
  const response = await axios.get(`${API_BASE_URL}/test`);
  return response.data;
};
