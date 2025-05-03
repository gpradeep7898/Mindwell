// src/components/settings/ProfilePictureUpload.js
import React, { useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import './SettingsForms.css';

function ProfilePictureUpload() {
    const { currentUser, refreshUserData } = useAuth();
    const [selectedFile, setSelectedFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const fileInputRef = useRef(null); // Ref to trigger file input click

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file && file.type.startsWith('image/')) {
            if (file.size > 5 * 1024 * 1024) { // 5MB limit example
                 setError('File is too large. Maximum size is 5MB.');
                 setSelectedFile(null);
                 setPreview(null);
                 return;
            }
            setSelectedFile(file);
            setError('');
            // Create image preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreview(reader.result);
            };
            reader.readAsDataURL(file);
        } else {
             setError('Please select a valid image file (JPEG, PNG, GIF, WEBP).');
             setSelectedFile(null);
             setPreview(null);
        }
    };

    const handleUpload = async () => {
        if (!selectedFile || !currentUser) {
             setError('Please select an image file first.');
             return;
        }

        setIsLoading(true);
        setError('');
        setSuccess('');

        const formData = new FormData();
        formData.append('profilePic', selectedFile); // Key matches backend upload.single()

        try {
            const token = await currentUser.getIdToken();
            const response = await axios.post(
                '/api/user/profile-picture', // Your backend endpoint
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            setSuccess(response.data.message || 'Profile picture updated!');
            setSelectedFile(null); // Clear selection
            // Preview will update automatically if refreshUserData updates currentUser.photoURL
             await refreshUserData(); // Refresh context data


        } catch (err) {
             console.error("Profile picture upload error:", err);
             setError(err.response?.data?.error || 'Failed to upload picture. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

     // Function to trigger the hidden file input
    const triggerFileInput = () => {
        fileInputRef.current?.click();
    };


    return (
        <div className="settings-form">
            <h3>Profile Picture</h3>
             {error && <p className="error-message">{error}</p>}
             {success && <p className="success-message">{success}</p>}

            <div className="profile-picture-preview">
                 <img
                    src={preview || currentUser?.photoURL || '/path/to/default-avatar.png'} // Show preview, current, or default
                    alt="Profile Preview"
                    className="avatar-image" // Add CSS for styling
                />
            </div>

            {/* Hidden file input */}
             <input
                type="file"
                accept="image/*" // Accept only image types
                onChange={handleFileChange}
                ref={fileInputRef}
                style={{ display: 'none' }} // Hide the default input
                id="profilePicInput"
            />

            {/* Custom button to trigger file input */}
             <button type="button" onClick={triggerFileInput} disabled={isLoading} className="button-outline">
                Choose Image
             </button>

            {selectedFile && (
                <div className="file-actions">
                     <span>{selectedFile.name}</span>
                     <button onClick={handleUpload} disabled={isLoading || !selectedFile}>
                        {isLoading ? 'Uploading...' : 'Upload & Save'}
                    </button>
                </div>
            )}


        </div>
    );
}

export default ProfilePictureUpload;