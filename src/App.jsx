import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import SignupPage from "./pages/SignupPage";
import LoginPage from "./pages/LoginPage";
import HomePage from "./pages/HomePage";
import SalonDashboard from "./pages/SalonDashboard";
import ConsultantDashboard from "./pages/ConsultantDashboard";
import CustomerDashboard from "./pages/CustomerDashboard";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/salon-dashboard/:businessEmail" element={<SalonDashboard />} />
        <Route path="/consultant-dashboard/:consultantEmail" element={<ConsultantDashboard />} />
        <Route path="/customer-dashboard/:customerName" element={<CustomerDashboard />} />
      </Routes>
    </Router>
  );
}

export default App;