# Frontend Documentation

This frontend is a React + Vite single-page application for exploring Meta political ad data through search, filtering, and visual analytics.

## Tech Stack

- React 19
- React Router
- Axios
- Recharts
- React Select
- React Datepicker
- Vite
- ESLint

## Frontend Scope

The frontend provides:

- A landing page with quick search tags and discovery widgets
- A results page with search, sorting, pagination, detail drill-down, and comparison views
- Interactive charts for spend and reach analysis
- Route-aware top navigation with filter controls

## Project Structure

frontend/
src/
App.jsx # Route wiring
main.jsx # Application entry point
components/
Layout.jsx # Shared page wrapper
Navbar.jsx # Top navigation + results filters
pages/
FrontPage.jsx # Landing and search page
ResultsPage.jsx # Search results, charts, compare flow
services/
api.js # Frontend API client functions
styles/
selectStyles.js # Shared react-select style config

## Routing

- `/` -> `FrontPage`
- `/results` -> `ResultsPage`

Query parameters used on `/results`:

- `query`
- `advertiser`
- `startDate`
- `endDate`
- `country` (optional)
- `platform` (optional)

## Local Development

### 1. Install dependencies

```bash
cd frontend
npm install
```

### 2. Start the frontend (MAIN WAY TO RUN FRONTEND!!)

```bash
npm run dev
```

By default, Vite serves at `http://localhost:5173`.

### 3. Build for production

```bash
npm run build
```

### 4. Preview production build

```bash
npm run preview
```

### 5. Lint

```bash
npm run lint
```

## Backend API Dependency

The frontend expects the backend API at:

- `http://localhost:8000`

This is currently defined in `src/services/api.js` as `API_BASE_URL`.

If your backend runs on a different host or port, update that constant accordingly.

## API Endpoints Used by Frontend

The frontend consumes these backend endpoints:

- `GET /metadata/filters`
- `GET /exploration/search`
- `GET /analytics/overview`
- `GET /analytics/top-advertisers`
- `GET /exploration/advertiser-details`
- `GET /exploration/ad-details/{ad_id}`
- `GET /exploration/ads`

## Key UI Behaviors

- Landing page loads filter options, top advertisers, and recent ads on mount
- Search form pushes state to URL query params for shareable and reload-safe views
- Results page reads URL params and re-fetches data when filters change
- Sorting supports spend and reach modes (ascending/descending)
- Pagination defaults to 50 ads per page
- Side panel shows ad details and advertiser details without route change
- Compare modal supports comparing up to 3 ads

## Styling Notes

- Global styles live in `src/index.css`
- Page-specific styles are in:
  - `src/pages/FrontPage.css`
  - `src/pages/ResultsPage.css`
- Navigation styles are in `src/components/Navbar.css`
- Dropdown styles are centralized in `src/styles/selectStyles.js`

## Common Troubleshooting

### No data appears in UI

- Confirm backend is running on `http://localhost:8000`
- Check browser DevTools Network tab for failed requests
- Verify backend routes return expected JSON payloads

### Filters or advertiser dropdown look empty

- Check response shape from `GET /metadata/filters`
- Frontend currently maps `filters.geographies` and fallback `filters.advertisers`

### Date filters not applying

- Ensure selected dates serialize to `YYYY-MM-DD`
- Confirm backend accepts `start_date` and `end_date` query params

### Build succeeds locally but UI differs in production

- Run `npm run build` and `npm run preview` before deployment
- Verify production API host matches frontend API base URL
