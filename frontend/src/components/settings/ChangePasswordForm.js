// src/components/settings/ChangePasswordForm.js
import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getAuth, EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth';
import './SettingsForms.css';

function ChangePasswordForm() {
    const { currentUser } = useAuth();
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const validatePassword = (password) => {
        // Add your password complexity rules here (e.g., length, characters)
        return password.length >= 8; // Example: Minimum 8 characters
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (newPassword !== confirmPassword) {
            setError("New passwords do not match.");
            return;
        }
        if (!validatePassword(newPassword)) {
            setError("Password must be at least 8 characters long."); // Adjust message based on rules
            return;
        }
        if (!currentUser) {
            setError("Not logged in.");
            return;
        }

        setIsLoading(true);

        try {
            const auth = getAuth();
            const user = auth.currentUser;

            if (!user || !user.email) {
                 throw new Error("User or user email not found for reauthentication.");
            }

            // 1. Get credentials for re-authentication
            const credential = EmailAuthProvider.credential(user.email, currentPassword);

            // 2. Re-authenticate the user
            await reauthenticateWithCredential(user, credential);

            // 3. Update the password
            await updatePassword(user, newPassword);

            setSuccess('Password updated successfully!');
            // Clear fields after success
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');

        } catch (err) {
            console.error("Password update error:", err);
            // Provide user-friendly error messages
            if (err.code === 'auth/wrong-password') {
                 setError('Incorrect current password.');
            } else if (err.code === 'auth/too-many-requests') {
                 setError('Too many attempts. Please try again later.');
            } else if (err.code === 'auth/weak-password') {
                 setError('The new password is too weak.');
            } else {
                setError('Failed to update password. Please verify your current password and try again.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="settings-form">
            <h3>Change Password</h3>
             <p className="form-description">
                For security, please enter your current password to change it.
             </p>
            {error && <p className="error-message">{error}</p>}
            {success && <p className="success-message">{success}</p>}

            <div className="form-group">
                <label htmlFor="currentPassword">Current Password</label>
                <input
                    type="password"
                    id="currentPassword"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    disabled={isLoading}
                />
            </div>
            <div className="form-group">
                <label htmlFor="newPassword">New Password</label>
                <input
                    type="password"
                    id="newPassword"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    disabled={isLoading}
                />
            </div>
             <div className="form-group">
                <label htmlFor="confirmPassword">Confirm New Password</label>
                <input
                    type="password"
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    disabled={isLoading}
                />
            </div>

            <button type="submit" disabled={isLoading}>
                {isLoading ? 'Updating...' : 'Update Password'}
            </button>
        </form>
    );
}

export default ChangePasswordForm;