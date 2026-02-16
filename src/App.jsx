import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import SignupPage from "./pages/SignupPage";
import LoginPage from "./pages/LoginPage";
import HomePage from "./pages/HomePage";
import SalonDashboard from "./pages/SalonDashboard";
import CustomerDashboard from "./pages/CustomerDashboard";
import SalonDetails from "./pages/SalonDetails";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/login" element={<LoginPage />} />
        {/* Unified dashboard for all business managers */}
        <Route path="/salon-dashboard/:businessEmail" element={<SalonDashboard />} />
        <Route path="/customer-dashboard/:customerName" element={<CustomerDashboard />} />
        <Route path="/salon/:id" element={<SalonDetails />} />
      </Routes>
    </Router>
  );
}

export default App;