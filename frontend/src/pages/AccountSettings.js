// src/pages/AccountSettings.js
import React, { useState } from 'react';
import EditProfileForm from '../components/settings/EditProfileForm';
import ChangePasswordForm from '../components/settings/ChangePasswordForm';
import ProfilePictureUpload from '../components/settings/ProfilePictureUpload';
import './AccountSettings.css'; // Create CSS for layout

function AccountSettings() {
    const [activeTab, setActiveTab] = useState('profile'); // Default tab

    return (
        <div className="account-settings-page motion-fade-in"> {/* Add animation class */}
            <header className="page-header">
                <h2 className="page-title">Account Settings</h2>
            </header>

            {/* Tab Navigation */}
            <nav className="settings-tabs">
                <button
                    className={`tab-button ${activeTab === 'profile' ? 'active' : ''}`}
                    onClick={() => setActiveTab('profile')}
                    aria-current={activeTab === 'profile' ? 'page' : undefined}
                >
                    Profile
                </button>
                 <button
                    className={`tab-button ${activeTab === 'picture' ? 'active' : ''}`}
                    onClick={() => setActiveTab('picture')}
                     aria-current={activeTab === 'picture' ? 'page' : undefined}
                >
                    Picture
                </button>
                <button
                    className={`tab-button ${activeTab === 'security' ? 'active' : ''}`}
                    onClick={() => setActiveTab('security')}
                     aria-current={activeTab === 'security' ? 'page' : undefined}
                >
                    Security
                </button>
            </nav>

            {/* Content Area for Active Tab */}
            <div className="settings-content">
                {activeTab === 'profile' && <EditProfileForm />}
                {activeTab === 'picture' && <ProfilePictureUpload />}
                {activeTab === 'security' && <ChangePasswordForm />}
            </div>
        </div>
    );
}

export default AccountSettings;