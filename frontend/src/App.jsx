import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import LeaveApply from "./pages/LeaveApply";
import Navbar from "./components/Navbar";

function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/leave-apply" element={<LeaveApply />} />
      </Routes>
      <Footer/>
    </>
  );
}

export default App;
