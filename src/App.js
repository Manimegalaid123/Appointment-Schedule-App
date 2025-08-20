import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ConsultantDashboard from './pages/ConsultantDashboard';
// ...other imports...

function App() {
  return (
    <Router>
      <Routes>
        {/* Other routes */}
        <Route path="/consultant/:consultantEmail" element={<ConsultantDashboard />} />
        {/* ...other routes... */}
      </Routes>
    </Router>
  );
}

export default App;