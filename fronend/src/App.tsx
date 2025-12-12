import './App.css'
import Login from './layouts/login/login'
import Register from './layouts/register/register'
import FrontPage from './layouts/frontpage/frontPage'
import Chat from './layouts/chat/chat'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
function App() {
  
  return (
    <Router>
      <Routes>
        <Route path="/" element={<FrontPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/chat" element={<Chat />} />
      </Routes>
    </Router>
  )
}


export default App
