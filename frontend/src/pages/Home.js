// frontend/src/pages/Home.js
// TESTING VERSION - Framer Motion REMOVED, Debug Logs ACTIVE

import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
// import { motion } from "framer-motion"; // <-- Removed Framer Motion import
import axios from 'axios';
import { FiBookOpen } from "react-icons/fi";
import GlobalLoader from "../components/GlobalLoader";

import "./Home.css"; // Ensure this links to the final Home.css

// --- Animation Variants REMOVED ---
// const sectionVariants = { ... };
// const cardVariants = { ... };

// --- Individual Article Card Component (No Motion) ---
const ArticleCard = ({ article }) => {
    const placeholderImage = "/assets/placeholder-news.png"; // Make sure this path is correct
    const imageUrl = article.urlToImage || placeholderImage;

    const handleImageError = (e) => {
        e.target.onerror = null;
        if (e.target.src !== placeholderImage) {
            console.warn(`Image failed to load: ${article.urlToImage}. Falling back to placeholder.`);
            e.target.src = placeholderImage;
        }
    };

    const descriptionSnippet = article.description ?
        (article.description.length > 120 ? article.description.substring(0, 117) + "..." : article.description)
        : "No description available.";

    if (!article.title || article.title === '[Removed]' || !article.url) {
        console.warn("ArticleCard rendering skipped due to missing title or URL:", article);
        return null;
    }

    return (
        // Using regular div instead of motion.div
        <div className="aura-card news-card"> {/* Removed variants */}
            <a href={article.url} target="_blank" rel="noopener noreferrer" className="news-card-link">
                <div className="news-card-image-container">
                     <img
                        src={imageUrl}
                        alt={article.title}
                        className="news-card-image"
                        onError={handleImageError}
                        loading="lazy"
                     />
                </div>
                <div className="news-card-content">
                     <span className="news-card-source">{article.source?.name || 'Unknown Source'}</span>
                     <h3 className="news-card-title">{article.title}</h3>
                     <p className="news-card-description">{descriptionSnippet}</p>
                </div>
            </a>
        </div>
    );
};

// --- Home Component (No Motion) ---
const Home = () => {
  const [articles, setArticles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch articles from backend endpoint on component mount
  useEffect(() => {
    const fetchWellnessFeed = async () => {
      console.log("DEBUG: useEffect fetchWellnessFeed triggered.");
      setIsLoading(true);
      setError(null);
      let fetchError = null;

      try {
        const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8081';
        const endpoint = `${apiUrl}/api/wellness-feed`;
        console.log(`DEBUG: Attempting to fetch wellness feed from: ${endpoint}`);

        const response = await axios.get(endpoint);
        console.log("DEBUG: RAW API Response Data:", response.data);

        let fetchedArticles = [];
        if (response.data && Array.isArray(response.data.articles)) {
            fetchedArticles = response.data.articles;
        } else if (Array.isArray(response.data)) {
             fetchedArticles = response.data;
             console.warn("DEBUG: API response data root is an array.");
        } else {
            console.warn("DEBUG: Unexpected API response structure.", response.data);
        }

        console.log("DEBUG: Fetched Articles Array (before filtering):", fetchedArticles);

        const validArticles = fetchedArticles.filter(article => {
            const isValid = article && article.title && article.title !== '[Removed]' && article.url;
            return isValid;
        });
        console.log("DEBUG: Filtered Valid Articles (after filtering):", validArticles);

        setArticles(validArticles);
        console.log(`DEBUG: State update - setArticles called with ${validArticles.length} articles.`);

      } catch (err) {
        console.error("ERROR fetching wellness feed:", err);
        fetchError = "Could not load wellness insights. ";
        if (err.response) {
             console.error("Error response data:", err.response.data);
             console.error("Error response status:", err.response.status);
             fetchError += `Server responded with status ${err.response.status}.`;
        } else if (err.request) {
            console.error("Error request details:", err.request);
            fetchError += "Could not reach the server.";
        } else {
            console.error('Error setting up request:', err.message);
            fetchError += "Error during request setup.";
        }
        setError(fetchError);
        setArticles([]);
        console.log("DEBUG: State update - setError and cleared articles due to fetch error.");
      } finally {
        setIsLoading(false);
        console.log("DEBUG: Fetch attempt finished. Setting isLoading to false.");
      }
    };

    fetchWellnessFeed();

    return () => {
      console.log("DEBUG: Home component unmounting.");
    };
  }, []);

  console.log(`DEBUG: RENDERING Home component: isLoading=${isLoading}, error=${error}, articles count=${articles.length}`);

  return (
    <div className="home-outer-container">
      {/* --- Hero Section (No Motion) --- */}
      <section className="hero-section"> {/* Removed motion + props */}
        <div className="container hero-content">
          <h1>Your Mental Wellness Journey Starts Here</h1> {/* Removed motion + props */}
          <p className="subtitle"> {/* Removed motion + props */}
             Explore insights, track your progress, and find support tailored for you.
          </p>
          <div> {/* Removed motion + props */}
             <Link to="/dashboard" className="aura-button primary large hero-button">Go to Dashboard</Link>
          </div>
        </div>
      </section>

      {/* --- Wellness Feed Section (No Motion) --- */}
      <section className="wellness-feed-section"> {/* Removed motion + props */}
        <div className="container">
          <h2 className="section-title">
            <FiBookOpen style={{ marginRight: '10px', verticalAlign: 'bottom' }} />
            Wellness Insights & News
          </h2>

          {/* Loading State Display */}
          {isLoading && <GlobalLoader message="Loading latest insights..." />}

          {/* Error State Display */}
          {!isLoading && error && <p className="error-message">{error}</p>}

          {/* Content Display (Only when NOT loading and NO error) */}
          {!isLoading && !error && (
            <>
              {articles.length > 0 ? (
                <div className="news-cards-grid">
                  {articles.map((article) => (
                    <ArticleCard key={article.url || Math.random()} article={article} />
                  ))}
                </div>
              ) : (
                <p className="info-message">No wellness insights found at the moment. Please check back later!</p>
              )}
              <p className="api-attribution" style={{ textAlign: 'center', fontSize: '0.8rem', color: '#aaa', marginTop: '2rem' }}>
                 {/* Optional Attribution */}
              </p>
            </>
          )}
        </div>
      </section>
      {/* --- End Wellness Feed Section --- */}

      {/* --- Call to Action Section (No Motion) --- */}
      <section className="cta-section"> {/* Removed motion + props */}
        <div className="container cta-content">
          <h2>Ready to Prioritize Your Mental Health?</h2> {/* Removed motion + props */}
          <p className="subtitle"> Join MindWell today. </p> {/* Removed motion + props */}
          <div> {/* Removed motion + props */}
             <Link to="/dashboard" className="aura-button primary large cta-button">Get Started Now</Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;