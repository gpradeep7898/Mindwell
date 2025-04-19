import React, { useEffect } from "react";
import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import FindDoctor from "./pages/FindDoctor";
import ChatBot from "./pages/ChatBot";
import Auth from "./pages/Auth";
import Sidebar from "./components/Sidebar";
import { auth } from "./services/firebaseConfig";
import { useAuthState } from "react-firebase-hooks/auth";
import Dashboard from "./pages/Dashboard";
import AnonymousLetters from "./pages/AnonymousLetters";
import "./App.css";

const loadGoogleMaps = () => {
  if (!window.google) {
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}&libraries=places`;
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);
  }
};

function ProtectedRoute({ children }) {
    const [user, loading] = useAuthState(auth);
    if (loading) return <p>Loading...</p>;
    return user ? children : <Navigate to="/auth" />;
}

function App() {
    const [user, loading] = useAuthState(auth);

    useEffect(() => {
        loadGoogleMaps();
    }, []);

    if (loading) return <p>Loading...</p>;

    return (
        <Router>
            <div className="app-container">
                {user && <Sidebar />}
                <div className="content-container">
                    <Routes>
                        <Route path="/auth" element={<Auth />} />
                        <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
                        <Route path="/find-doctor" element={<ProtectedRoute><FindDoctor /></ProtectedRoute>} />
                        <Route path="/chatbot" element={<ProtectedRoute><ChatBot /></ProtectedRoute>} />
                        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                        <Route path="/anonymous-letters" element={<ProtectedRoute><AnonymousLetters /></ProtectedRoute>} />
                    </Routes>
                    {user && (
                        <button className="logout-btn" onClick={() => auth.signOut()}>
                            Logout
                        </button>
                    )}
                </div>
            </div>
        </Router>
    );
}

export default App;
