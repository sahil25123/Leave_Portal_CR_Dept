import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Login from './pages/Login'
import LeaveApply from './pages/LeaveApply'

function App() {
  return (
    // Define app routes here.
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/leave-apply" element={<LeaveApply />} />
    </Routes>
  )
}

export default App
