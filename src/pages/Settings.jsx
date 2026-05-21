/**
 * Nexus AI - Settings Control Center
 * User profile configuration, password rotation, layout toggles, and session revocation.
 */

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { updateProfile as updateProfileApi, updatePassword as updatePasswordApi, logoutAllSessions } from '../api/auth';
import { AVATAR_TEMPLATES } from '../data/avatars';
import './Settings.css';

export default function SettingsSection() {
  const { user, token, updateUser, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState('profile');

  const [fullName, setFullName] = useState(user?.fullName || '');
  const [role, setRole] = useState(user?.role || 'SaaS Explorer');
  const [bio, setBio] = useState(user?.bio || '');
  const [avatar, setAvatar] = useState(user?.avatar || 'grad-cyan');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [emailNotif, setEmailNotif] = useState(user?.preferences?.notifications?.email ?? true);
  const [pushNotif, setPushNotif] = useState(user?.preferences?.notifications?.push ?? true);
  const [selectedTheme, setSelectedTheme] = useState(user?.preferences?.theme ?? theme ?? 'dark');

  const [submitting, setSubmitting] = useState(false);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!fullName.trim()) {
      toast.error('Profile full name is required.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await updateProfileApi({
        fullName: fullName.trim(),
        role: role.trim(),
        bio: bio.trim(),
        avatar
      }, token);

      if (res?.success && res.user) {
        updateUser(res.user);
        toast.success('Neural profile synchronized successfully.');
      }
    } catch (err) {
      console.error('Failed to update profile details:', err);
      toast.error(err.message || 'Failed to update profile.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSavePassword = async (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('Please fill in all password fields.');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }

    try {
      setSubmitting(true);
      await updatePasswordApi({ currentPassword, newPassword }, token);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      toast.success('Security signature updated successfully.');
    } catch (err) {
      console.error('Failed to update password:', err);
      toast.error(err.message || 'Incorrect current password credential.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSavePreferences = async () => {
    try {
      setSubmitting(true);
      const res = await updateProfileApi({
        preferences: {
          theme: selectedTheme,
          notifications: {
            email: emailNotif,
            push: pushNotif
          }
        }
      }, token);

      setTheme(selectedTheme);

      if (res?.success && res.user) {
        updateUser(res.user);
      }

      toast.success('Preferences updated successfully.');
    } catch (err) {
      console.error('Failed to save preferences:', err);
      toast.error(err.message || 'Failed to update preferences.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogoutAll = async () => {
    try {
      setSubmitting(true);
      await logoutAllSessions(token);
      toast.success('Logged out of all sessions. Re-authentication required.');
      setTimeout(() => {
        logout();
      }, 1000);
    } catch (err) {
      console.error('Failed to invalidate all sessions:', err);
      toast.error('Failed to invalidate sessions. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="st-root">
      <div className="st-page-header fade-in">
        <h1 className="st-page-title">Platform Settings</h1>
        <p className="st-page-sub">Configure credentials, workspace layouts, notification filters, and sessions.</p>
      </div>

      <div className="st-container fade-in">
        <div className="st-nav">
          <button className={`st-nav-item ${activeTab === 'profile' ? 'st-nav-active' : ''}`} onClick={() => setActiveTab('profile')}>
            Profile Editor
          </button>
          <button className={`st-nav-item ${activeTab === 'security' ? 'st-nav-active' : ''}`} onClick={() => setActiveTab('security')}>
            Security Signature
          </button>
          <button className={`st-nav-item ${activeTab === 'preferences' ? 'st-nav-active' : ''}`} onClick={() => setActiveTab('preferences')}>
            Preferences
          </button>
          <button className={`st-nav-item ${activeTab === 'sessions' ? 'st-nav-active' : ''}`} onClick={() => setActiveTab('sessions')}>
            Session Controls
          </button>
        </div>

        <div className="st-content">
          {activeTab === 'profile' && (
            <form onSubmit={handleSaveProfile} className="st-form-section">
              <h2 className="st-card-title">Edit Profile</h2>

              <div className="st-field">
                <label className="st-label">Choose Avatar Archetype</label>
                <div className="st-avatars-grid">
                  {AVATAR_TEMPLATES.map((template) => (
                    <div
                      key={template.id}
                      className={`st-avatar-option ${avatar === template.id ? 'st-avatar-active' : ''}`}
                      style={{ background: template.gradient }}
                      onClick={() => setAvatar(template.id)}
                      title={template.label}
                    >
                      <span style={{ fontSize: '1rem', fontWeight: 700, color: '#08121d', letterSpacing: '0.06em' }}>
                        {template.emoji}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="st-field-row">
                <div className="st-field">
                  <label className="st-label">Full Name</label>
                  <input
                    className="st-input"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter full name..."
                    maxLength={50}
                  />
                </div>

                <div className="st-field">
                  <label className="st-label">Designated Role</label>
                  <input
                    className="st-input"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    placeholder="e.g. Lead Engineer"
                    maxLength={30}
                  />
                </div>
              </div>

              <div className="st-field">
                <label className="st-label">Biography</label>
                <textarea
                  className="st-input st-textarea"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Describe your goals and optimization targets..."
                  maxLength={160}
                />
              </div>

              <button type="submit" className="ts-submit-btn" style={{ alignSelf: 'flex-start' }} disabled={submitting}>
                {submitting ? 'Synchronizing...' : 'Save Profile'}
              </button>
            </form>
          )}

          {activeTab === 'security' && (
            <form onSubmit={handleSavePassword} className="st-form-section">
              <h2 className="st-card-title">Security Signature</h2>

              <div className="st-field">
                <label className="st-label">Current Password</label>
                <input
                  type="password"
                  className="st-input"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Verify existing password..."
                />
              </div>

              <div className="st-field-row">
                <div className="st-field">
                  <label className="st-label">New Password</label>
                  <input
                    type="password"
                    className="st-input"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min 6 characters..."
                  />
                </div>

                <div className="st-field">
                  <label className="st-label">Confirm New Password</label>
                  <input
                    type="password"
                    className="st-input"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password..."
                  />
                </div>
              </div>

              <button type="submit" className="ts-submit-btn" style={{ alignSelf: 'flex-start' }} disabled={submitting}>
                {submitting ? 'Calibrating...' : 'Update Password'}
              </button>
            </form>
          )}

          {activeTab === 'preferences' && (
            <div className="st-form-section">
              <h2 className="st-card-title">Preference Tuning</h2>

              <div className="st-toggle-row">
                <div className="st-toggle-info">
                  <span className="st-toggle-title">System Email Sync</span>
                  <span className="st-toggle-desc">Receive security confirmations and weekly summaries.</span>
                </div>
                <label className="st-switch">
                  <input type="checkbox" checked={emailNotif} onChange={(e) => setEmailNotif(e.target.checked)} />
                  <span className="st-slider" />
                </label>
              </div>

              <div className="st-toggle-row">
                <div className="st-toggle-info">
                  <span className="st-toggle-title">Dashboard Push Alerts</span>
                  <span className="st-toggle-desc">Trigger instant audio alerts on checklist updates.</span>
                </div>
                <label className="st-switch">
                  <input type="checkbox" checked={pushNotif} onChange={(e) => setPushNotif(e.target.checked)} />
                  <span className="st-slider" />
                </label>
              </div>

              <div className="st-toggle-row">
                <div className="st-toggle-info">
                  <span className="st-toggle-title">Aesthetic Environment</span>
                  <span className="st-toggle-desc">Switch between the default dark cockpit and a lighter glass workspace.</span>
                </div>
                <select className="st-input st-theme-select" value={selectedTheme} onChange={(e) => setSelectedTheme(e.target.value)}>
                  <option value="dark">Dark Neon</option>
                  <option value="light">Light Glass</option>
                </select>
              </div>

              <button onClick={handleSavePreferences} className="ts-submit-btn" style={{ alignSelf: 'flex-start', marginTop: '1rem' }} disabled={submitting}>
                {submitting ? 'Applying...' : 'Save Preferences'}
              </button>
            </div>
          )}

          {activeTab === 'sessions' && (
            <div className="st-form-section">
              <h2 className="st-card-title">Emergency Controls</h2>

              <div className="st-danger-card">
                <h3 className="st-danger-title">Invalidate All Authorized Sessions</h3>
                <p className="st-danger-text">
                  This command immediately signs you out of all devices and browser tabs by invalidating your secure token claim signature versions in the database. You will be signed out on this device as well.
                </p>
                <button type="button" className="st-danger-btn" onClick={handleLogoutAll} disabled={submitting}>
                  {submitting ? 'Revoking Access...' : 'Force Logout All Sessions'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
