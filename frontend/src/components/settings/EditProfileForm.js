// frontend/src/components/settings/EditProfileForm.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios'; // For API calls
import './SettingsForms.css'; // Shared form styles

function EditProfileForm() {
    // Get currentUser, loading state, and the NEW refreshUserData function
    const { currentUser, loading, refreshUserData } = useAuth();
    const [displayName, setDisplayName] = useState('');
    const [isLoading, setIsLoading] = useState(false); // Loading state for this form submission
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Effect to initialize the form field with the current user's display name
    useEffect(() => {
        // Only update if currentUser exists to avoid setting from null
        if (currentUser) {
            setDisplayName(currentUser.displayName || '');
        }
    }, [currentUser]); // Dependency: currentUser

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(''); // Clear previous errors/success messages
        setSuccess('');
        setIsLoading(true); // Set loading state for button

        // Basic client-side validation
        if (!displayName || displayName.trim().length < 3) {
            setError('Display name must be at least 3 characters.');
            setIsLoading(false);
            return;
        }

        // Ensure currentUser and getIdToken are available before proceeding
        if (!currentUser || typeof currentUser.getIdToken !== 'function') {
             setError('User session is invalid. Please log out and log back in.');
             setIsLoading(false);
             return;
        }

        try {
            // 1. Get the Firebase ID token for authentication
            const token = await currentUser.getIdToken();

            // 2. Make the API call to the backend endpoint
            const response = await axios.put(
                '/api/user/profile', // Backend endpoint (ensure proxy or baseURL is set)
                { displayName: displayName.trim() }, // Send trimmed name
                { headers: { Authorization: `Bearer ${token}` } } // Send token in header
            );

            // 3. Show success message from backend response
            setSuccess(response.data.message || 'Profile updated successfully!');

            // 4. Refresh the user data in the AuthContext <<< CRITICAL STEP
            // Check if the function exists before calling it
            if (typeof refreshUserData === 'function') {
                console.log("EditProfileForm: Calling refreshUserData...");
                await refreshUserData(); // Trigger context update
                console.log("EditProfileForm: refreshUserData completed.");
            } else {
                 console.warn("EditProfileForm: refreshUserData function not found in AuthContext. UI might not update immediately.");
                 // Optional: Advise user to refresh manually if function is missing
                 setSuccess(prev => prev + " (Refresh page to see changes everywhere)");
            }

        } catch (err) {
            console.error("Profile update error:", err);
            // Handle potential TypeError if refreshUserData was somehow not a function (defensive)
             if (err instanceof TypeError && err.message.includes('refreshUserData')) {
                 setError('Profile saved, but failed to refresh display immediately. Please refresh the page.');
                 // Keep the success message visible in this specific edge case
             } else {
                 // Handle API errors (like 4xx, 5xx from backend)
                 setError(err.response?.data?.error || 'Failed to update profile. Please try again.');
                 setSuccess(''); // Clear success message if API call failed
            }
        } finally {
            // 5. Reset loading state regardless of success/failure
            setIsLoading(false);
        }
    };

    // Show loading state while AuthContext is initializing
    if (loading && !currentUser) { // Check loading AND currentUser status
        return <p className="loading-message">Loading profile...</p>; // Use a class for styling
    }

    // Handle case where user is somehow null after loading (edge case)
    if (!currentUser) {
         return <p className="error-message">Could not load user profile. Please try refreshing.</p>;
    }


    return (
        <form onSubmit={handleSubmit} className="settings-form">
            <h3>Edit Profile</h3>
            {/* Display error or success message */}
            {error && <p className="error-message">{error}</p>}
            {success && <p className="success-message">{success}</p>}

            {/* Display Name Input */}
            <div className="form-group">
                <label htmlFor="displayName">Display Name</label>
                <input
                    type="text"
                    id="displayName"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    required
                    minLength="3"
                    maxLength="50"
                    disabled={isLoading} // Disable input while submitting
                    aria-describedby="displayNameHelp"
                />
                 <small id="displayNameHelp">Your public name (3-50 characters).</small>
            </div>

             {/* Email Display (Read-Only) */}
             <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                    type="email"
                    id="email"
                    value={currentUser.email || ''}
                    disabled // Make email read-only
                    readOnly // Better accessibility for disabled input
                />
                 <small>Email address cannot be changed here.</small>
            </div>

            {/* Submit Button */}
            {/* Disable button if loading OR if the name hasn't changed */}
            <button
                type="submit"
                disabled={isLoading || displayName === (currentUser?.displayName || '')}
            >
                {isLoading ? 'Saving...' : 'Save Changes'}
            </button>
        </form>
    );
}

export default EditProfileForm;