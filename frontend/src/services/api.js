import axios from "axios";

const API_BASE_URL = "http://localhost:8000";

export const fetchFilters = async () => {
  const response = await axios.get(`${API_BASE_URL}/metadata/filters`);
  return response.data;
};

export const fetchSearchResults = async (keyword, geography, platform) => {
  const params = { keyword };
  if (geography) params.geography = geography;
  if (platform) params.platform = platform;

  const response = await axios.get(`${API_BASE_URL}/exploration/search`, {
    params,
  });
  return response.data;
};

export const fetchOverview = async () => {
  const response = await axios.get(`${API_BASE_URL}/analytics/overview`);
  return response.data;
};

export const fetchAdvertiserDetails = async (
  advertiserId,
  geography,
  platform,
) => {
  const params = { advertiser_id: advertiserId };
  if (geography) params.geography = geography;
  if (platform) params.platform = platform;

  const response = await axios.get(
    `${API_BASE_URL}/exploration/advertiser-details`,
    {
      params,
    },
  );
  return response.data;
};
