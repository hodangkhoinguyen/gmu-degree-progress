import { BrowserRouter, Routes, Route, NavLink } from "react-router-dom";
import { AppStateProvider } from "./state/AppStateContext.jsx";
import Home from "./pages/Home.jsx";
import TranscriptUpload from "./pages/TranscriptUpload.jsx";
import DegreePicker from "./pages/DegreePicker.jsx";
import ProgressReport from "./pages/ProgressReport.jsx";

function Nav() {
  return (
    <nav className="nav">
      <span className="brand">GMU Degree Progress</span>
      <NavLink to="/" end>
        Home
      </NavLink>
      <NavLink to="/transcript">Transcript</NavLink>
      <NavLink to="/programs">Degree</NavLink>
      <NavLink to="/report">Progress</NavLink>
    </nav>
  );
}

export default function App() {
  return (
    <AppStateProvider>
      <BrowserRouter>
        <Nav />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/transcript" element={<TranscriptUpload />} />
          <Route path="/programs" element={<DegreePicker />} />
          <Route path="/report" element={<ProgressReport />} />
        </Routes>
      </BrowserRouter>
    </AppStateProvider>
  );
}
