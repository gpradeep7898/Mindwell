// frontend/src/components/Sidebar.js
import React from "react";
import { NavLink } from "react-router-dom";
import { motion } from "framer-motion";
// Import appropriate icons from react-icons
import {
    FiLayout,         // Dashboard
    FiHome,           // Home
    FiMapPin,         // Find Doctor/Support
    FiMessageSquare,  // AI Chatbot/Assistant
    FiMail,           // Anonymous Letters
    FiShield,         // Quick Relief
    FiShoppingCart,   // Wellness Store
    FiLogOut          // Logout icon
} from "react-icons/fi";
import { getAuth, signOut } from "firebase/auth";
import "./Sidebar.css"; // Link to the CSS file

// Import your logo - adjust path if necessary
import appLogo from '../assets/Logo.webp'; // Assuming Logo.webp is in src/assets

// --- Sidebar navigation items configuration ---
const navItems = [
    // Order can be adjusted based on importance/flow
    { path: "/dashboard", icon: <FiLayout />, label: "Dashboard" },
    { path: "/", icon: <FiHome />, label: "Home" },
    { path: "/quick-relief", icon: <FiShield />, label: "Quick Relief" },
    { path: "/chatbot", icon: <FiMessageSquare />, label: "AI Assistant" },
    { path: "/anonymous-letters", icon: <FiMail />, label: "Community Letters" },
    { path: "/find-doctor", icon: <FiMapPin />, label: "Find Support" },
    { path: "/wellness-store", icon: <FiShoppingCart />, label: "Wellness Store" },
];

// --- Animation variants ---
const sidebarVariants = {
    hidden: { x: "-100%", opacity: 0 },
    visible: { x: 0, opacity: 1, transition: { duration: 0.4, ease: "easeInOut" } },
    exit: { x: "-100%", opacity: 0, transition: { duration: 0.3, ease: "easeInOut" } }
};

const navListVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.07, delayChildren: 0.2 } } // Stagger animation for list items
};

const navItemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.3, ease: "easeOut" } }
};

// --- Sidebar Component ---
const Sidebar = () => {

     // Function to handle logout
    const handleLogout = async () => {
        const authInstance = getAuth(); // Get auth instance from firebaseConfig
        try {
            await signOut(authInstance);
            // Navigation back to /auth (or login page) is handled by App.js observing auth state change
            console.log("User logged out successfully");
        } catch (error) {
            console.error("Error logging out:", error);
            // Consider showing a user-facing error notification here
        }
    };

    return (
        // Using motion.aside for semantic correctness
        <motion.aside
            className="sidebar-container"
            variants={sidebarVariants}
            initial="hidden" // Start hidden
            animate="visible" // Animate to visible state
            exit="exit"       // Animate on exit (if wrapped in AnimatePresence in App.js)
            aria-label="Main navigation sidebar"
        >
            {/* --- Logo Area --- */}
            <div className="sidebar-logo-area">
                <img
                    src={appLogo} // Use the imported logo
                    alt="MindWell Logo" // Descriptive alt text
                    className="app-logo-image" // Class for styling
                />
                <h1 className="app-title">MindWell</h1> {/* App title */}
            </div>

            {/* --- Navigation --- */}
            <nav className="sidebar-navigation" aria-label="Sidebar navigation">
                <motion.ul
                    className="nav-list"
                    variants={navListVariants}
                    initial="hidden"
                    animate="visible"
                >
                    {navItems.map((item) => (
                        <motion.li key={item.path} className="nav-item" variants={navItemVariants}>
                            <NavLink
                                to={item.path}
                                className={({ isActive }) => // Style active link
                                    isActive ? "nav-link active" : "nav-link"
                                }
                                // `end` prop ensures exact match for "/" path
                                end={item.path === "/"}
                                title={item.label} // Tooltip for accessibility/clarity
                            >
                                <span className="nav-icon" aria-hidden="true">{item.icon}</span>
                                <span className="nav-label">{item.label}</span>
                            </NavLink>
                        </motion.li>
                    ))}
                </motion.ul>
            </nav>

           {/* --- Footer with Logout Button --- */}
            <div className="sidebar-footer">
                <motion.button
                    className="logout-button"
                    onClick={handleLogout}
                    whileHover={{ scale: 1.03, opacity: 0.95 }} // Subtle hover effect
                    whileTap={{ scale: 0.97 }}
                    aria-label="Logout" // Accessibility label
                >
                    <FiLogOut className="logout-icon" aria-hidden="true" />
                    <span className="logout-label">Logout</span>
                </motion.button>
            </div>
        </motion.aside>
    );
};

export default Sidebar;