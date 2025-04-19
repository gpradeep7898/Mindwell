// frontend/src/pages/WellnessStore.js
import React from 'react';
import { motion } from 'framer-motion';
// Import the product array and the placeholder image
import wellnessProducts, { placeholderImage } from '../utils/wellnessProducts'; // Ensure path is correct
import './WellnessStore.css'; // Ensure CSS file exists and is linked

// --- Animation Variants ---
const pageVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.5 } },
};

const cardVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.98 },
    visible: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: { duration: 0.5, ease: "easeOut" },
    },
};

const sectionVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.1 } }
};


// --- Component ---
const WellnessStore = () => {

    return (
        <motion.div
            className="wellness-store-container"
            variants={pageVariants}
            initial="hidden"
            animate="visible"
        >
            {/* --- Header --- */}
            <header className="page-header store-header">
                <span className="header-icon">🛍️</span>
                <h2 className="page-title">MindWell Wellness Store</h2>
                <p className="page-subtitle">Curated items to support your wellbeing journey.</p>
            </header>

            {/* --- Product Grid --- */}
            {/* Add motion to grid for staggered children animation */}
            <motion.div
                className="store-content product-grid"
                variants={sectionVariants} // Apply stagger effect here
            >
                {wellnessProducts.map((product) => (
                    <motion.div
                        key={product.id}
                        className="aura-card product-card" // Use standard card and add specific class
                        variants={cardVariants} // Animate each card
                        layout // Animate layout changes if grid reflows
                    >
                        {/* Image Container */}
                        <div className="product-image-container">
                            <img
                                src={product.imageUrl || placeholderImage} // Use product image or placeholder
                                alt={product.name}
                                className="product-image"
                                onError={(e) => { e.target.onerror = null; e.target.src = placeholderImage; }} // Use imported placeholder on error
                            />
                        </div>

                        {/* Product Details */}
                        <div className="product-details">
                            <h3 className="product-name">{product.name}</h3>
                            <p className="product-description">{product.description}</p>

                            {/* Meta Info */}
                            <div className="product-meta">
                                <span className="product-benefit">
                                    <strong>Benefit:</strong> {product.benefit}
                                </span>
                                <span className="product-type">
                                    <strong>Type:</strong> {product.type}
                                </span>
                            </div>

                            {/* Price Display */}
                             <p className="product-price">
                                {/* Ensure priceUSD exists and format */}
                                {product.priceUSD ? `$${parseFloat(product.priceUSD).toFixed(2)}` : 'Price not available'}
                                {product.type === 'Subscription' && product.priceUSD ? ' / month' : ''}
                             </p>

                            {/* Link to External Store Page */}
                            <a
                                href={product.productUrl || '#'} // Use the actual URL from data file
                                target={product.productUrl ? "_blank" : "_self"} // Open new tab only if URL exists
                                rel="noopener noreferrer"
                                className={`aura-button secondary small view-product-button ${!product.productUrl ? 'disabled-link' : ''}`} // Style as button, disable if no URL
                                style={{ textDecoration: 'none', display: 'inline-block', marginTop: 'auto' }} // Styling
                                onClick={(e) => !product.productUrl && e.preventDefault()} // Prevent click if no URL
                                title={product.productUrl ? `View ${product.name} in store` : "Link unavailable"} // Tooltip
                            >
                                View & Purchase
                            </a>
                        </div>
                    </motion.div>
                ))}
            </motion.div>

            {/* --- Disclaimer --- */}
            <p className="disclaimer-text">
                Products are offered as supplementary tools. Clicking 'View & Purchase' will redirect you to our secure partner platform to complete your order. MindWell is not responsible for third-party products or services.
            </p>

        </motion.div>
    );
};

export default WellnessStore;