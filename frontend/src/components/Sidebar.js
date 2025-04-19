import React from "react";
import { Link, useLocation } from "react-router-dom";
import { FaHome, FaUserMd, FaComments, FaChartLine, FaEnvelopeOpenText } from "react-icons/fa"; // Import icons
import "./Sidebar.css";

const Sidebar = () => {
    const location = useLocation();

    return (
        <div className="sidebar">
            <h2 className="logo">MindWell</h2>
            <nav>
                <Link to="/dashboard" className={location.pathname === "/dashboard" ? "active" : ""}>
                    <FaChartLine className="icon" />
                    Dashboard
                </Link>
                <Link to="/" className={location.pathname === "/" ? "active" : ""}>
                    <FaHome className="icon" />
                    Home
                </Link>
                <Link to="/find-doctor" className={location.pathname === "/find-doctor" ? "active" : ""}>
                    <FaUserMd className="icon" />
                    Find a Doctor
                </Link>
                <Link to="/ChatBot" className={location.pathname === "/ChatBot" ? "active" : ""}>
                    <FaComments className="icon" />
                    AI Chatbot
                </Link>
                <Link to="/anonymous-letters" className={location.pathname === "/anonymous-letters" ? "active" : ""}>
                    <FaEnvelopeOpenText className="icon" />
                    Anonymous Letters
                </Link>
            </nav>
        </div>
    );
};

export default Sidebar;
