import { BrowserRouter, Routes, Route } from "react-router-dom";

import Navbar from "./components/Navbar.jsx";
import FrontPage from "./pages/FrontPage.jsx";
import ResultsPage from "./pages/ResultsPage.jsx";
import Layout from "./components/Layout.jsx";

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Layout>
        <Routes>
          <Route path="/" element={<FrontPage />} />
          <Route path="/results" element={<ResultsPage />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
