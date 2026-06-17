import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Navbar from "./components/Navbar";

// Existing pages
import RiskForm    from "./components/RiskForm";
import ResultPage  from "./pages/ResultPage";
import Guidelines  from "./pages/Guidelines";
import AfterCare   from "./pages/AfterCare";

// Auth pages
import LoginPage       from "./pages/LoginPage";
import DoctorLoginPage from "./pages/DoctorLoginPage";

// Patient pages
import MyReports       from "./pages/MyReports";
import MyConsultations from "./pages/MyConsultations";
import PatientChatPage from "./pages/PatientChatPage";

// Doctor pages
import DoctorDashboard from "./pages/DoctorDashboard";
import DoctorChatPage  from "./pages/DoctorChatPage";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        <Routes>
          {/* Public */}
          <Route path="/"          element={<RiskForm />} />
          <Route path="/result"    element={<ResultPage />} />
          <Route path="/guidelines" element={<Guidelines />} />
          <Route path="/after-care" element={<AfterCare />} />
          <Route path="/login"     element={<LoginPage />} />
          <Route path="/doctor/login" element={<DoctorLoginPage />} />

          {/* Patient protected */}
          <Route path="/my-reports" element={
            <ProtectedRoute role="user"><MyReports /></ProtectedRoute>
          } />
          <Route path="/my-consultations" element={
            <ProtectedRoute role="user"><MyConsultations /></ProtectedRoute>
          } />
          <Route path="/consultation/:id" element={
            <ProtectedRoute role="user"><PatientChatPage /></ProtectedRoute>
          } />

          {/* Doctor protected */}
          <Route path="/doctor/dashboard" element={
            <ProtectedRoute role="doctor"><DoctorDashboard /></ProtectedRoute>
          } />
          <Route path="/doctor/chat/:id" element={
            <ProtectedRoute role="doctor"><DoctorChatPage /></ProtectedRoute>
          } />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
