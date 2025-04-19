// frontend/src/pages/Home.js
import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion"; // Import motion
import { FiUsers, FiMessageCircle, FiClipboard, FiMapPin } from "react-icons/fi"; // Example icons
import "./Home.css"; // Link specific styles

// --- Animation Variants ---
const sectionVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut", staggerChildren: 0.2 } // Add stagger for children
  },
};

const cardVariants = {
    hidden: { opacity: 0, scale: 0.95, y: 20 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" },
    },
  };

// --- Component ---
const Home = () => {
  return (
    <div className="home-outer-container">
      {/* --- Hero Section --- */}
      <motion.section
        className="hero-section"
        initial="hidden"
        animate="visible"
        variants={sectionVariants}
      >
        <div className="container hero-content">
          <motion.h1 variants={cardVariants}>Your Mental Wellness Journey Starts Here</motion.h1>
          <motion.p className="subtitle" variants={cardVariants}>
            Track your mood, connect with support, and discover tools tailored for your wellbeing.
          </motion.p>
          <motion.div variants={cardVariants}>
             <Link to="/dashboard" className="aura-button primary large hero-button">
                Go to Dashboard
             </Link>
          </motion.div>
        </div>
      </motion.section>

      {/* --- Services Section --- */}
      <motion.section
        className="services-section"
        initial="hidden"
        whileInView="visible" // Animate when scrolled into view
        viewport={{ once: true, amount: 0.2 }} // Trigger animation once, when 20% visible
        variants={sectionVariants}
      >
        <div className="container">
          <h2 className="section-title">Discover Your Tools for Wellbeing</h2>
          <div className="service-cards-grid">
            {/* Card 1: Dashboard */}
            <motion.div className="aura-card service-card" variants={cardVariants}>
                <div className="card-icon"><FiClipboard /></div>
                <h3>Track Your Journey</h3>
                <p>Monitor moods and journal thoughts on your personal dashboard.</p>
                <Link to="/dashboard" className="aura-button secondary">My Dashboard</Link>
            </motion.div>
             {/* Card 2: AI Assistant */}
            <motion.div className="aura-card service-card" variants={cardVariants}>
                 <div className="card-icon"><FiMessageCircle /></div>
                <h3>AI Assistant</h3>
                <p>Get instant, confidential support and guidance anytime.</p>
                <Link to="/chatbot" className="aura-button secondary">Start Chat</Link>
            </motion.div>
            {/* Card 3: Find Support */}
            <motion.div className="aura-card service-card" variants={cardVariants}>
                 <div className="card-icon"><FiMapPin /></div>
                <h3>Find Support</h3>
                <p>Locate nearby hospitals and clinics for professional help.</p>
                <Link to="/find-doctor" className="aura-button secondary">Find Facilities</Link>
            </motion.div>
            {/* Card 4: Community (Example) */}
             <motion.div className="aura-card service-card" variants={cardVariants}>
                 <div className="card-icon"><FiUsers /></div>
                <h3>Community Letters</h3>
                <p>Share thoughts anonymously and connect with others.</p>
                <Link to="/anonymous-letters" className="aura-button secondary">View Letters</Link>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* --- Testimonials Section (Example Structure) --- */}
      <motion.section
        className="testimonials-section"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={sectionVariants}
        >
        <div className="container">
          <h2 className="section-title">What Our Users Say</h2>
          <div className="testimonials-grid">
            <motion.div className="testimonial-card" variants={cardVariants}>
                <p className="testimonial-quote">"Tracking my mood has given me so much insight into my patterns. Highly recommend the dashboard feature!"</p>
                <h4 className="testimonial-author">- Alex P.</h4>
            </motion.div>
            <motion.div className="testimonial-card" variants={cardVariants}>
                <p className="testimonial-quote">"The AI chatbot offers great coping strategies when I'm feeling overwhelmed. It feels supportive and private."</p>
                <h4 className="testimonial-author">- Sam K.</h4>
            </motion.div>
             <motion.div className="testimonial-card" variants={cardVariants}>
                <p className="testimonial-quote">"Connecting with others anonymously made me feel less alone. A wonderful community feature."</p>
                <h4 className="testimonial-author">- Jordan M.</h4>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* --- Call to Action Section --- */}
      <motion.section
        className="cta-section"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        variants={sectionVariants}
      >
        <div className="container cta-content">
          <motion.h2 variants={cardVariants}>Ready to Prioritize Your Mental Health?</motion.h2>
          <motion.p className="subtitle" variants={cardVariants}>
            Join MindWell today and take the first step towards a brighter wellbeing.
          </motion.p>
          <motion.div variants={cardVariants}>
             {/* Link to Auth page if not logged in, Dashboard if logged in (App.js handles redirect) */}
             <Link to="/dashboard" className="aura-button primary large cta-button">
                Get Started Now
             </Link>
          </motion.div>
        </div>
      </motion.section>
    </div>
  );
};

export default Home;