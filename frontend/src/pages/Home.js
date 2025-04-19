import React from "react";
import { Link } from "react-router-dom";
import "./Home.css"; // Ensure you create this CSS file

const Home = () => {
  return (
    <div className="home-container">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <h1>Your Mental Health, Your Priority</h1>
          <p>Find expert help, track your progress, and connect with a supportive community.</p>
          <Link to="/find-doctor" className="btn-primary">Find a Doctor</Link>
        </div>
      </section>

      {/* Services Section */}
      <section className="services">
        <h2>What We Offer</h2>
        <div className="service-cards">
          <div className="card">
            <h3>Find Top Doctors</h3>
            <p>Connect with licensed professionals for expert mental health guidance.</p>
            <Link to="/find-doctor" className="btn-secondary">Explore</Link>
          </div>
          <div className="card">
            <h3>AI Chatbot Support</h3>
            <p>Chat with our AI assistant to get instant support and self-care tips.</p>
            <Link to="/ChatBot" className="btn-secondary">Start Chat</Link>
          </div>
          <div className="card">
            <h3>Mood & Journal Tracking</h3>
            <p>Monitor your mental health progress with our personal dashboard.</p>
            <Link to="/dashboard" className="btn-secondary">View Dashboard</Link>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="testimonials">
        <h2>What Our Users Say</h2>
        <div className="testimonial">
          <p>"This platform helped me connect with an amazing therapist. My journey to mental wellness has never been easier!"</p>
          <h4>- Emily R.</h4>
        </div>
        <div className="testimonial">
          <p>"The AI Chatbot is a game-changer. I love how I can talk anytime and get advice instantly!"</p>
          <h4>- John D.</h4>
        </div>
      </section>

      {/* Call to Action */}
      <section className="cta">
        <h2>Join Our Community</h2>
        <p>Take control of your mental health today.</p>
        <Link to="/auth" className="btn-primary">Get Started</Link>
      </section>
    </div>
  );
};

export default Home;
