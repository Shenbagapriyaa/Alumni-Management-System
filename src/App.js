// src/App.js
import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import "./App.css";

// Components
import Navbar from "./components/Navbar";
import Login from "./components/Login";
import AdminDashboard from "./components/AdminDashboard";
import StudentDashboard from "./components/StudentDashboard";
import AlumniDashboard from "./components/AlumniDashboard";
import Registration from "./components/Registration";
import Chatbot from './components/Chatbot'; // Add this import

// Context
import { AuthProvider } from "./context/AuthContext";

// This component conditionally renders the Chatbot
function ChatbotWrapper() {
  const location = useLocation();
  const authenticatedPaths = ['/student', '/alumni', '/admin'];
  
  // Check if current path starts with any authenticated path
  const shouldShowChatbot = authenticatedPaths.some(path => 
    location.pathname.startsWith(path)
  );
  
  return shouldShowChatbot ? <Chatbot /> : null;
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Navbar />
          <div className="container">
            <Routes>
              <Route path="/" element={<Navigate to="/login" />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Registration />} />
              <Route path="/admin/*" element={<AdminDashboard />} />
              <Route path="/student/*" element={<StudentDashboard />} />
              <Route path="/alumni/*" element={<AlumniDashboard />} />
            </Routes>
          </div>
          
          {/* Chatbot appears on authenticated pages */}
          <ChatbotWrapper />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;