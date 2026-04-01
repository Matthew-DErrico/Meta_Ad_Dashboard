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

export const fetchTopAdvertisers = async () => {
  const response = await axios.get(`${API_BASE_URL}/analytics/top-advertisers`);
  return response.data;
};

export const fetchAdvertiserDetails = async (
  pagename,
  platform,
  start_date,
  end_date,
) => {
  const params = { page_name: pagename };
  if (platform) params.platform = platform;
  if (start_date) params.start_date = start_date;
  if (end_date) params.end_date = end_date;

  const response = await axios.get(
    `${API_BASE_URL}/exploration/advertiser-details`,
    {
      params,
    },
  );
  return response.data;
};

export const fetchAdDetails = async (adId) => {
  if (!adId) return {};
  const response = await axios.get(
    `${API_BASE_URL}/exploration/ad-details/${adId}`,
  );
  return response.data;
};

export const fetchRecentAds = async (limit = 6) => {
  const response = await axios.get(`${API_BASE_URL}/exploration/ads`, {
    params: { limit },
  });
  return response.data;
};
