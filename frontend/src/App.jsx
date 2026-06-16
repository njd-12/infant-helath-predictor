import { BrowserRouter, Routes, Route } from "react-router-dom";
import RiskForm from "./components/RiskForm";
import ResultPage from "./pages/ResultPage";
import Guidelines from "./pages/Guidelines";
import AfterCare from "./pages/AfterCare";


function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RiskForm />} />
        <Route path="/result" element={<ResultPage />} />
        <Route path="/guidelines" element={<Guidelines />} />
        <Route path="/after-care" element={<AfterCare />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;