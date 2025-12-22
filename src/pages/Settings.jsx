import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import CustomModal from '../components/CustomModal';
import { useModal } from '../hooks/useModal';
import api from '../utils/api';
import { getCurrentUser, setCurrentUser, logout } from '../utils/auth';
import { applyQuietMode } from '../utils/quietMode';
import logger from '../utils/logger';
import './Settings.css';

function Settings() {
  const { modalState, closeModal, showAlert, showConfirm, showPrompt } = useModal();
  const navigate = useNavigate();
  const currentUser = getCurrentUser();
  const [formData, setFormData] = useState({
    fullName: '',
    displayName: '',
    nickname: '',
    pronouns: '',
    customPronouns: '',
    gender: '',
    customGender: '',
    relationshipStatus: '',
    bio: '',
    location: '',
    website: '',
    socialLinks: []
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [quietModeEnabled, setQuietModeEnabled] = useState(false); // PHASE 2: Quiet Mode
  const [isCreator, setIsCreator] = useState(false); // PHASE 5: Creator Mode
  const [verificationStatus, setVerificationStatus] = useState({
    isVerified: false,
    verificationRequested: false,
    verificationRequestDate: null
  });

  useEffect(() => {
    fetchUserData();
    fetchVerificationStatus();
  }, []);

  const fetchVerificationStatus = async () => {
    try {
      const response = await api.get('/users/verification-status');
      setVerificationStatus(response.data);
    } catch (error) {
      logger.error('Failed to fetch verification status:', error);
    }
  };

  const fetchUserData = async () => {
    try {
      const response = await api.get('/auth/me');
      const user = response.data;
      setFormData({
        fullName: user.fullName || '',
        displayName: user.displayName || '',
        nickname: user.nickname || '',
        pronouns: user.pronouns || '',
        customPronouns: user.customPronouns || '',
        gender: user.gender || '',
        customGender: user.customGender || '',
        relationshipStatus: user.relationshipStatus || '',
        bio: user.bio || '',
        location: user.location || '',
        website: user.website || '',
        socialLinks: user.socialLinks || []
      });
      // PHASE 2: Load quiet mode settings
      const quietMode = user.privacySettings?.quietModeEnabled || false;
      setQuietModeEnabled(quietMode);
      applyQuietMode(quietMode);
      localStorage.setItem('quietMode', quietMode);

      // PHASE 5: Load creator mode setting
      setIsCreator(user.isCreator || false);
    } catch (error) {
      logger.error('Failed to fetch user data:', error);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const addSocialLink = () => {
    setFormData({
      ...formData,
      socialLinks: [...formData.socialLinks, { platform: '', url: '' }]
    });
  };

  const removeSocialLink = (index) => {
    const newLinks = formData.socialLinks.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      socialLinks: newLinks
    });
  };

  const updateSocialLink = (index, field, value) => {
    const newLinks = [...formData.socialLinks];
    newLinks[index][field] = value;
    setFormData({
      ...formData,
      socialLinks: newLinks
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const response = await api.put('/users/profile', formData);
      setCurrentUser({ ...currentUser, ...response.data });
      setMessage('Profile updated successfully!');
    } catch (error) {
      setMessage('Failed to update profile');
      logger.error('Update profile error:', error);
    } finally {
      setLoading(false);
    }
  };

  // PHASE 2: Handle Quiet Mode toggle
  const handleQuietModeToggle = async () => {
    try {
      const newValue = !quietModeEnabled;
      await api.patch('/users/me/settings', { quietModeEnabled: newValue });
      setQuietModeEnabled(newValue);
      setMessage(newValue ? 'Quiet Mode enabled' : 'Quiet Mode disabled');
      applyQuietMode(newValue);
      localStorage.setItem('quietMode', newValue);
    } catch (error) {
      logger.error('Failed to toggle quiet mode:', error);
      setMessage('Failed to update quiet mode');
    }
  };

  // PHASE 5: Handle Creator Mode toggle
  const handleCreatorModeToggle = async () => {
    try {
      const newValue = !isCreator;
      await api.patch('/users/me/creator', { isCreator: newValue });
      setIsCreator(newValue);
      setMessage(newValue ? 'Creator Mode enabled' : 'Creator Mode disabled');
    } catch (error) {
      logger.error('Failed to toggle creator mode:', error);
      setMessage('Failed to update creator mode');
    }
  };

  const handleDownloadData = async () => {
    // ... (existing code)
  };

  const handleDeactivateAccount = async () => {
    // ... (existing code)
  };

  const handleDeleteAccount = async () => {
    // ... (existing code)
  };

  const handleRequestVerification = async () => {
    // ... (existing code)
  };

  return (
    <div className="page-container">
      <Navbar />

      <div className="settings-container">
        {/* ... (existing JSX) */}
      </div>

      <CustomModal
        // ... (existing props)
      />
    </div>
  );
}

export default Settings;
