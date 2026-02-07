import { useState, useEffect, useRef } from 'react';
import api from '../utils/api';
import { getImageUrl } from '../utils/imageUrl';
import { compressAvatar, compressCoverPhoto } from '../utils/compressImage';
import { uploadWithProgress } from '../utils/uploadWithProgress';
import ImageEditor from './ImageEditor';
import BadgeSettings from './BadgeSettings';
import './EditProfileModal.css';

function EditProfileModal({ isOpen, onClose, user, onUpdate }) {
  const [formData, setFormData] = useState({
    fullName: '',
    nickname: '',
    displayNameType: 'fullName', // 'fullName', 'nickname', 'custom'
    customDisplayName: '',
    pronouns: '',
    customPronouns: '',
    gender: '',
    customGender: '',
    sexualOrientation: '',
    birthday: '',
    bio: '',
    postcode: '',
    city: '',
    website: '',
    socialLinks: [],
    interests: [],
    lookingFor: [],
    communicationStyle: '',
    safetyPreferences: '',
    profilePhoto: null,
    coverPhoto: null
  });

  const [newInterest, setNewInterest] = useState('');
  const [newSocialLink, setNewSocialLink] = useState({ platform: '', url: '' });
  const [loading, setLoading] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [locationSuggestions, setLocationSuggestions] = useState([]);

  // Photo editor state
  // NON-DESTRUCTIVE EDITING: Editor is always available when image exists
  // avatarPos/coverPos: stores x, y, scale transforms (live state)
  // No temp images needed - editor works directly with existing URLs
  const [avatarPos, setAvatarPos] = useState({ x: 0, y: 0, scale: 1.05 });
  const [coverPos, setCoverPos] = useState({ x: 0, y: 0, scale: 1.05 });
  const [isDraggingAvatar, setIsDraggingAvatar] = useState(false);
  const [isDraggingCover, setIsDraggingCover] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const coverInputRef = useRef(null);
  const avatarInputRef = useRef(null);

  useEffect(() => {
    if (isOpen && user) {
      // Predefined pronouns list
      const predefinedPronouns = ['', 'She/Her', 'He/Him', 'They/Them', 'She/They', 'He/They', 'Any Pronouns', 'Ask Me', 'Ze/Zir', 'Xe/Xem', 'Prefer Not to Say'];

      // Check if user has custom pronouns (not in predefined list)
      const isCustomPronouns = user.pronouns && !predefinedPronouns.includes(user.pronouns);

      setFormData({
        fullName: user.fullName || '',
        nickname: user.nickname || '',
        displayNameType: user.displayNameType || 'fullName',
        customDisplayName: user.customDisplayName || '',
        pronouns: isCustomPronouns ? 'custom' : (user.pronouns || ''),
        customPronouns: isCustomPronouns ? user.pronouns : (user.customPronouns || ''),
        gender: user.gender || '',
        customGender: user.customGender || '',
        sexualOrientation: user.sexualOrientation || '',
        birthday: user.birthday ? user.birthday.split('T')[0] : '',
        bio: user.bio || '',
        postcode: user.postcode || '',
        city: user.city || '',
        website: user.website || '',
        socialLinks: user.socialLinks || [],
        interests: user.interests || [],
        lookingFor: user.lookingFor || [],
        communicationStyle: user.communicationStyle || '',
        safetyPreferences: user.safetyPreferences || '',
        profilePhoto: user.profilePhoto || null,
        coverPhoto: user.coverPhoto || null
      });

      // Initialize position state from existing user data
      // NON-DESTRUCTIVE: Load saved positions so user can continue editing
      setAvatarPos(user.profilePhotoPosition || { x: 0, y: 0, scale: 1.05 });
      setCoverPos(user.coverPhotoPosition || { x: 0, y: 0, scale: 1.05 });
    }
  }, [isOpen, user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setHasChanges(true);
  };

  const handleAddInterest = () => {
    if (newInterest.trim() && !formData.interests.includes(newInterest.trim())) {
      setFormData(prev => ({
        ...prev,
        interests: [...prev.interests, newInterest.trim()]
      }));
      setNewInterest('');
    }
  };

  const handleRemoveInterest = (interest) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.filter(i => i !== interest)
    }));
    setHasChanges(true);
  };

  const handleAddSocialLink = () => {
    if (newSocialLink.platform.trim() && newSocialLink.url.trim()) {
      setFormData(prev => ({
        ...prev,
        socialLinks: [...prev.socialLinks, { ...newSocialLink }]
      }));
      setNewSocialLink({ platform: '', url: '' });
    }
  };

  const handleRemoveSocialLink = (index) => {
    setFormData(prev => ({
      ...prev,
      socialLinks: prev.socialLinks.filter((_, i) => i !== index)
    }));
    setHasChanges(true);
  };

  const toggleLookingFor = (option) => {
    setFormData(prev => ({
      ...prev,
      lookingFor: prev.lookingFor.includes(option)
        ? prev.lookingFor.filter(o => o !== option)
        : [...prev.lookingFor, option]
    }));
  };

  // Handle photo upload - uploads new image and resets position
  const handlePhotoUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Only image files are allowed.');
      return;
    }

    setUploadingPhoto(true);
    setUploadProgress(0);

    try {
      // Compress image before upload
      let compressedFile = file;
      try {
        if (type === 'profile') {
          compressedFile = await compressAvatar(file);
        } else {
          compressedFile = await compressCoverPhoto(file);
        }
      } catch (error) {
        console.warn('Image compression failed, using original:', error);
      }

      const endpoint = type === 'profile' ? '/upload/profile-photo' : '/upload/cover-photo';

      // Upload with progress tracking
      const response = await uploadWithProgress({
        url: `${api.defaults.baseURL}${endpoint}`,
        file: compressedFile,
        fieldName: 'photo',
        onProgress: (percent) => {
          setUploadProgress(percent);
        }
      });

      // Validate response
      if (!response || !response.url) {
        throw new Error('Upload succeeded but no URL returned');
      }

      if (type === 'profile') {
        setFormData(prev => ({ ...prev, profilePhoto: response.url }));
        // Reset avatar position for new photo
        setAvatarPos({ x: 0, y: 0, scale: 1.05 });
      } else {
        setFormData(prev => ({ ...prev, coverPhoto: response.url }));
        // Reset cover position for new photo
        setCoverPos({ x: 0, y: 0, scale: 1.05 });
      }
      setHasChanges(true);
    } catch (error) {
      console.error('Failed to upload photo:', error);

      // Extract user-friendly error message
      const errorMessage = error.message ||
                          'Image upload failed. Please try again or use a smaller image.';

      alert(errorMessage);
    } finally {
      setUploadingPhoto(false);
      setUploadProgress(0);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.fullName.trim()) {
      alert('Full Name is required');
      return;
    }

    setLoading(true);
    try {
      // Include photo URLs and position metadata in the update
      // formData already contains profilePhoto and coverPhoto from user or upload
      const updateData = {
        ...formData,
        // If pronouns is 'custom', send the customPronouns value instead
        pronouns: formData.pronouns === 'custom' ? formData.customPronouns : formData.pronouns,
        coverPhotoPosition: coverPos,
        profilePhotoPosition: avatarPos
      };

      const response = await api.put('/users/profile', updateData);
      onUpdate(response.data.user);
      onClose();
    } catch (error) {
      console.error('Failed to update profile:', error);
      alert(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="edit-profile-modal" onClick={(e) => e.stopPropagation()}>
        <div className="edit-profile-header">
          <h2>✏️ Edit Profile</h2>
          <button className="btn-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="edit-profile-form">
          <div className="form-body">
            {/* Visual Section */}
            <section className="form-section">
              <h3>📸 Visual</h3>

              <div className="photo-editors">
                {/* Cover Photo Editor - Always-On Non-Destructive */}
                <div className="photo-editor-item">
                  <label>Cover Photo</label>
                  <div className="photo-editor-container">
                    <div className="photo-preview-wrapper cover">
                      <div
                        className={`photo-preview-draggable cover ${isDraggingCover ? 'dragging' : ''}`}
                        onMouseDown={(e) => {
                          if (!formData.coverPhoto && !user?.coverPhoto) return;
                          setIsDraggingCover(true);
                          setHasChanges(true);
                          const startX = e.clientX;
                          const startY = e.clientY;
                          const startPosX = coverPos.x;
                          const startPosY = coverPos.y;

                          const handleMouseMove = (e) => {
                            const deltaX = e.clientX - startX;
                            const deltaY = e.clientY - startY;
                            const newX = startPosX + deltaX;
                            const newY = startPosY + deltaY;

                            // Soft bounds - allow some overflow but ease back
                            const maxX = 100;
                            const maxY = 100;
                            const boundedX = Math.max(-maxX, Math.min(maxX, newX));
                            const boundedY = Math.max(-maxY, Math.min(maxY, newY));

                            setCoverPos(prev => ({
                              ...prev,
                              x: boundedX,
                              y: boundedY
                            }));
                          };

                          const handleMouseUp = () => {
                            setIsDraggingCover(false);
                            document.removeEventListener('mousemove', handleMouseMove);
                            document.removeEventListener('mouseup', handleMouseUp);
                          };

                          document.addEventListener('mousemove', handleMouseMove);
                          document.addEventListener('mouseup', handleMouseUp);
                        }}
                        onKeyDown={(e) => {
                          if (!formData.coverPhoto && !user?.coverPhoto) return;
                          const step = 5;
                          let newX = coverPos.x;
                          let newY = coverPos.y;

                          switch (e.key) {
                            case 'ArrowUp':
                              newY -= step;
                              break;
                            case 'ArrowDown':
                              newY += step;
                              break;
                            case 'ArrowLeft':
                              newX -= step;
                              break;
                            case 'ArrowRight':
                              newX += step;
                              break;
                            default:
                              return;
                          }

                          e.preventDefault();
                          setHasChanges(true);
                          const maxX = 100;
                          const maxY = 100;
                          setCoverPos(prev => ({
                            ...prev,
                            x: Math.max(-maxX, Math.min(maxX, newX)),
                            y: Math.max(-maxY, Math.min(maxY, newY))
                          }));
                        }}
                        tabIndex={formData.coverPhoto || user?.coverPhoto ? 0 : -1}
                        role="img"
                        aria-label="Cover photo editor - drag to reposition"
                      >
                        {formData.coverPhoto || user?.coverPhoto ? (
                          <div
                            className="photo-image"
                            style={{
                              backgroundImage: `url(${getImageUrl(formData.coverPhoto || user.coverPhoto)})`,
                              backgroundSize: 'cover',
                              backgroundPosition: 'center',
                              width: '100%',
                              height: '100%',
                              transform: `translate(${coverPos.x}px, ${coverPos.y}px) scale(${coverPos.scale})`,
                              transformOrigin: 'center',
                              transition: isDraggingCover ? 'none' : 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                            }}
                          />
                        ) : (
                          <div className="photo-placeholder">No cover photo</div>
                        )}
                      </div>
                      {/* Safety Guides */}
                      {(formData.coverPhoto || user?.coverPhoto) && (
                        <div className={`safety-guides cover ${isDraggingCover ? 'faded' : ''}`}>
                          {/* Avatar overlap guide */}
                          <div className="guide avatar-guide"></div>
                          {/* Text clearance guide */}
                          <div className="guide text-guide"></div>
                        </div>
                      )}
                    </div>
                    <div className="photo-controls">
                      <label htmlFor="cover-zoom">Zoom: {coverPos.scale.toFixed(2)}x</label>
                      <input
                        id="cover-zoom"
                        type="range"
                        min="1"
                        max="2"
                        step="0.01"
                        value={coverPos.scale}
                        onChange={(e) => setCoverPos({ ...coverPos, scale: parseFloat(e.target.value) })}
                        className="zoom-slider"
                      />
                      <input
                        type="file"
                        id="cover-photo-upload"
                        accept="image/*"
                        onChange={(e) => handlePhotoUpload(e, 'cover')}
                        disabled={uploadingPhoto}
                        style={{ marginTop: '8px' }}
                      />
                      {uploadingPhoto && (
                        <div className="upload-progress" style={{ marginTop: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                          Uploading... {uploadProgress}%
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Profile Photo Editor - Always-On Non-Destructive */}
                <div className="photo-editor-item">
                  <label>Profile Photo</label>
                  <div className="photo-editor-container">
                    <div className="photo-preview-wrapper avatar">
                      <div
                        className={`photo-preview-draggable avatar ${isDraggingAvatar ? 'dragging' : ''}`}
                        onMouseDown={(e) => {
                          if (!formData.profilePhoto && !user?.profilePhoto) return;
                          setIsDraggingAvatar(true);
                          setHasChanges(true);
                          const startX = e.clientX;
                          const startY = e.clientY;
                          const startPosX = avatarPos.x;
                          const startPosY = avatarPos.y;

                          const handleMouseMove = (e) => {
                            const deltaX = e.clientX - startX;
                            const deltaY = e.clientY - startY;
                            const newX = startPosX + deltaX;
                            const newY = startPosY + deltaY;

                            // Soft bounds - allow some overflow but ease back
                            const maxX = 50;
                            const maxY = 50;
                            const boundedX = Math.max(-maxX, Math.min(maxX, newX));
                            const boundedY = Math.max(-maxY, Math.min(maxY, newY));

                            setAvatarPos(prev => ({
                              ...prev,
                              x: boundedX,
                              y: boundedY
                            }));
                          };

                          const handleMouseUp = () => {
                            setIsDraggingAvatar(false);
                            document.removeEventListener('mousemove', handleMouseMove);
                            document.removeEventListener('mouseup', handleMouseUp);
                          };

                          document.addEventListener('mousemove', handleMouseMove);
                          document.addEventListener('mouseup', handleMouseUp);
                        }}
                        onKeyDown={(e) => {
                          if (!formData.profilePhoto && !user?.profilePhoto) return;
                          const step = 5;
                          let newX = avatarPos.x;
                          let newY = avatarPos.y;

                          switch (e.key) {
                            case 'ArrowUp':
                              newY -= step;
                              break;
                            case 'ArrowDown':
                              newY += step;
                              break;
                            case 'ArrowLeft':
                              newX -= step;
                              break;
                            case 'ArrowRight':
                              newX += step;
                              break;
                            default:
                              return;
                          }

                          e.preventDefault();
                          setHasChanges(true);
                          const maxX = 50;
                          const maxY = 50;
                          setAvatarPos(prev => ({
                            ...prev,
                            x: Math.max(-maxX, Math.min(maxX, newX)),
                            y: Math.max(-maxY, Math.min(maxY, newY))
                          }));
                        }}
                        tabIndex={formData.profilePhoto || user?.profilePhoto ? 0 : -1}
                        role="img"
                        aria-label="Profile photo editor - drag to reposition"
                      >
                        {formData.profilePhoto || user?.profilePhoto ? (
                          <div
                            className="photo-image"
                            style={{
                              backgroundImage: `url(${getImageUrl(formData.profilePhoto || user.profilePhoto)})`,
                              backgroundSize: 'cover',
                              backgroundPosition: 'center',
                              width: '100%',
                              height: '100%',
                              transform: `translate(${avatarPos.x}px, ${avatarPos.y}px) scale(${avatarPos.scale})`,
                              transformOrigin: 'center',
                              transition: isDraggingAvatar ? 'none' : 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                            }}
                          />
                        ) : (
                          <div className="photo-placeholder">No photo</div>
                        )}
                      </div>
                    </div>
                    <div className="photo-controls">
                      <label htmlFor="avatar-zoom">Fine tune size</label>
                      <input
                        id="avatar-zoom"
                        type="range"
                        min="1"
                        max="2"
                        step="0.01"
                        value={avatarPos.scale}
                        onChange={(e) => {
                          setAvatarPos({ ...avatarPos, scale: parseFloat(e.target.value) });
                          setHasChanges(true);
                        }}
                        className="zoom-slider"
                      />
                      <input
                        type="file"
                        id="profile-photo-upload"
                        accept="image/*"
                        onChange={(e) => handlePhotoUpload(e, 'profile')}
                        disabled={uploadingPhoto}
                        style={{ marginTop: '8px' }}
                      />
                      {uploadingPhoto && (
                        <div className="upload-progress" style={{ marginTop: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                          Uploading... {uploadProgress}%
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Basic Information */}
            <section className="form-section">
              <h3>ℹ️ Basic Information</h3>

              <div className="form-group">
                <label>Full Name <span className="required">*</span></label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  required
                  placeholder="Enter your full name"
                />
              </div>

              <div className="form-group">
                <label>Nickname</label>
                <input
                  type="text"
                  name="nickname"
                  value={formData.nickname}
                  onChange={handleChange}
                  placeholder="Enter a nickname (optional)"
                />
              </div>

              <div className="form-group">
                <label>Display Name</label>
                <select
                  name="displayNameType"
                  value={formData.displayNameType}
                  onChange={handleChange}
                >
                  <option value="fullName">Full Name</option>
                  <option value="nickname">Nickname</option>
                  <option value="custom">Custom</option>
                </select>
                {formData.displayNameType === 'custom' && (
                  <input
                    type="text"
                    name="customDisplayName"
                    value={formData.customDisplayName}
                    onChange={handleChange}
                    placeholder="Enter custom display name"
                    className="mt-2"
                  />
                )}
              </div>

              <div className="form-group">
                <label>Pronouns</label>
                <select
                  name="pronouns"
                  value={formData.pronouns === 'custom' || formData.customPronouns ? 'custom' : formData.pronouns}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === 'custom') {
                      setFormData({...formData, pronouns: 'custom', customPronouns: ''});
                    } else {
                      setFormData({...formData, pronouns: value, customPronouns: ''});
                    }
                  }}
                >
                  <option value="">Select Pronouns (Optional)</option>
                  <option value="She/Her">She/Her</option>
                  <option value="He/Him">He/Him</option>
                  <option value="They/Them">They/Them</option>
                  <option value="She/They">She/They</option>
                  <option value="He/They">He/They</option>
                  <option value="Any Pronouns">Any Pronouns</option>
                  <option value="Ask Me">Ask Me</option>
                  <option value="Ze/Zir">Ze/Zir</option>
                  <option value="Xe/Xem">Xe/Xem</option>
                  <option value="Prefer Not to Say">Prefer Not to Say</option>
                  <option value="custom">Custom (type below)</option>
                </select>
                {(formData.pronouns === 'custom' || formData.customPronouns) && (
                  <input
                    type="text"
                    name="customPronouns"
                    value={formData.customPronouns || ''}
                    onChange={(e) => setFormData({...formData, customPronouns: e.target.value})}
                    placeholder="Enter your pronouns"
                    className="mt-2"
                    style={{ marginTop: '0.5rem' }}
                  />
                )}
              </div>

              <div className="form-group">
                <label>Gender</label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                >
                  <option value="">Select Gender (Optional)</option>
                  <option value="Woman">Woman</option>
                  <option value="Man">Man</option>
                  <option value="Non-Binary">Non-Binary</option>
                  <option value="Genderqueer">Genderqueer</option>
                  <option value="Genderfluid">Genderfluid</option>
                  <option value="Agender">Agender</option>
                  <option value="Bigender">Bigender</option>
                  <option value="Two-Spirit">Two-Spirit</option>
                  <option value="Transgender Woman">Transgender Woman</option>
                  <option value="Transgender Man">Transgender Man</option>
                  <option value="Questioning">Questioning</option>
                  <option value="Prefer Not to Say">Prefer Not to Say</option>
                  <option value="custom">Custom (type below)</option>
                </select>
                {formData.gender === 'custom' && (
                  <input
                    type="text"
                    name="customGender"
                    value={formData.customGender || ''}
                    onChange={(e) => setFormData({...formData, customGender: e.target.value})}
                    placeholder="Enter your gender"
                    className="mt-2"
                    style={{ marginTop: '0.5rem' }}
                  />
                )}
              </div>

              <div className="form-group">
                <label>Sexual Orientation</label>
                <select
                  name="sexualOrientation"
                  value={formData.sexualOrientation === 'other' || !['', 'heterosexual', 'gay', 'lesbian', 'bisexual', 'pansexual', 'asexual', 'demisexual', 'queer', 'questioning', 'prefer_not_to_say'].includes(formData.sexualOrientation) ? 'other' : formData.sexualOrientation}
                  onChange={handleChange}
                >
                  <option value="">Select Orientation (Optional)</option>
                  <option value="heterosexual">Heterosexual/Straight</option>
                  <option value="gay">Gay</option>
                  <option value="lesbian">Lesbian</option>
                  <option value="bisexual">Bisexual</option>
                  <option value="pansexual">Pansexual</option>
                  <option value="asexual">Asexual</option>
                  <option value="demisexual">Demisexual</option>
                  <option value="queer">Queer</option>
                  <option value="questioning">Questioning</option>
                  <option value="prefer_not_to_say">Prefer Not to Say</option>
                  <option value="other">Other (type below)</option>
                </select>
                {(formData.sexualOrientation === 'other' || !['', 'heterosexual', 'gay', 'lesbian', 'bisexual', 'pansexual', 'asexual', 'demisexual', 'queer', 'questioning', 'prefer_not_to_say'].includes(formData.sexualOrientation)) && (
                  <input
                    type="text"
                    name="sexualOrientation"
                    value={formData.sexualOrientation === 'other' ? '' : formData.sexualOrientation}
                    onChange={(e) => setFormData({...formData, sexualOrientation: e.target.value})}
                    placeholder="Enter your sexual orientation"
                    className="mt-2"
                    style={{ marginTop: '0.5rem' }}
                  />
                )}
              </div>

              {/* DEPRECATED: Relationship Status UI removed 2025-12-26 */}

              <div className="form-group">
                <label>Birthday <span className="info-text">(Only age shows on profile)</span></label>
                <input
                  type="date"
                  name="birthday"
                  value={formData.birthday}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label>Bio</label>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  placeholder="Write about yourself..."
                  rows="4"
                />
              </div>

              <div className="form-group">
                <label>Location <span className="info-text">(Only city/town shows on profile)</span></label>
                <input
                  type="text"
                  name="postcode"
                  value={formData.postcode}
                  onChange={handleChange}
                  placeholder="Enter your postcode"
                />
                {formData.postcode && (
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    placeholder="City/Town"
                    className="mt-2"
                  />
                )}
              </div>

              <div className="form-group">
                <label>Website</label>
                <input
                  type="url"
                  name="website"
                  value={formData.website}
                  onChange={handleChange}
                  placeholder="https://yourwebsite.com"
                />
              </div>
            </section>

            {/* Social Links */}
            <section className="form-section">
              <h3>🔗 Social Links</h3>
              <p className="section-description">Add unlimited social media links to your profile</p>

              <div className="social-links-list">
                {formData.socialLinks.map((link, index) => (
                  <div key={index} className="social-link-item">
                    <div className="social-link-info">
                      <strong>{link.platform}</strong>
                      <a href={link.url} target="_blank" rel="noopener noreferrer">{link.url}</a>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveSocialLink(index)}
                      className="btn-remove"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>

              <div className="add-social-link">
                <input
                  type="text"
                  value={newSocialLink.platform}
                  onChange={(e) => setNewSocialLink(prev => ({ ...prev, platform: e.target.value }))}
                  placeholder="Platform (e.g., Instagram, Twitter)"
                />
                <input
                  type="url"
                  value={newSocialLink.url}
                  onChange={(e) => setNewSocialLink(prev => ({ ...prev, url: e.target.value }))}
                  placeholder="URL"
                />
                <button
                  type="button"
                  onClick={handleAddSocialLink}
                  className="btn-add"
                >
                  + Add Link
                </button>
              </div>
            </section>

            {/* Community Preferences */}
            <section className="form-section">
              <h3>🌈 Community Preferences</h3>

              <div className="form-group">
                <label>Interests / Tags</label>
                <div className="tags-container">
                  {formData.interests.map((interest, index) => (
                    <span key={index} className="tag">
                      {interest}
                      <button
                        type="button"
                        onClick={() => handleRemoveInterest(interest)}
                        className="tag-remove"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <div className="add-tag">
                  <select
                    value={newInterest}
                    onChange={(e) => setNewInterest(e.target.value)}
                    className="interest-dropdown"
                  >
                    <option value="">Select an interest...</option>
                    <optgroup label="Arts & Creativity">
                      <option value="Art">Art</option>
                      <option value="Crafts">Crafts</option>
                      <option value="Dance">Dance</option>
                      <option value="Drawing">Drawing</option>
                      <option value="Fashion">Fashion</option>
                      <option value="Music">Music</option>
                      <option value="Painting">Painting</option>
                      <option value="Photography">Photography</option>
                      <option value="Theater">Theater</option>
                      <option value="Writing">Writing</option>
                    </optgroup>
                    <optgroup label="Entertainment">
                      <option value="Anime">Anime</option>
                      <option value="Comics">Comics</option>
                      <option value="Gaming">Gaming</option>
                      <option value="Movies">Movies</option>
                      <option value="TV Shows">TV Shows</option>
                    </optgroup>
                    <optgroup label="Sports & Fitness">
                      <option value="Basketball">Basketball</option>
                      <option value="Cycling">Cycling</option>
                      <option value="Fitness">Fitness</option>
                      <option value="Football">Football</option>
                      <option value="Hiking">Hiking</option>
                      <option value="Running">Running</option>
                      <option value="Soccer">Soccer</option>
                      <option value="Swimming">Swimming</option>
                      <option value="Yoga">Yoga</option>
                    </optgroup>
                    <optgroup label="Food & Drink">
                      <option value="Baking">Baking</option>
                      <option value="Coffee">Coffee</option>
                      <option value="Cooking">Cooking</option>
                      <option value="Food">Food</option>
                      <option value="Wine">Wine</option>
                    </optgroup>
                    <optgroup label="Technology">
                      <option value="Coding">Coding</option>
                      <option value="Cryptocurrency">Cryptocurrency</option>
                      <option value="Tech">Tech</option>
                      <option value="Web Development">Web Development</option>
                    </optgroup>
                    <optgroup label="Lifestyle">
                      <option value="Books">Books</option>
                      <option value="DIY">DIY</option>
                      <option value="Gardening">Gardening</option>
                      <option value="Meditation">Meditation</option>
                      <option value="Pets">Pets</option>
                      <option value="Travel">Travel</option>
                    </optgroup>
                    <optgroup label="LGBTQ+ Specific">
                      <option value="Activism">Activism</option>
                      <option value="Drag">Drag</option>
                      <option value="LGBTQ+ History">LGBTQ+ History</option>
                      <option value="Pride Events">Pride Events</option>
                      <option value="Queer Culture">Queer Culture</option>
                    </optgroup>
                    <optgroup label="Other">
                      <option value="Astrology">Astrology</option>
                      <option value="Board Games">Board Games</option>
                      <option value="Karaoke">Karaoke</option>
                      <option value="Languages">Languages</option>
                      <option value="Nature">Nature</option>
                      <option value="Podcasts">Podcasts</option>
                      <option value="Science">Science</option>
                      <option value="Volunteering">Volunteering</option>
                    </optgroup>
                  </select>
                  <button
                    type="button"
                    onClick={handleAddInterest}
                    className="btn-add-compact"
                    disabled={!newInterest}
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label>Looking For</label>
                <p className="field-description">Select what you're hoping to find on Pryde Social</p>
                <div className="checkbox-group">
                  <label className="checkbox-label-compact">
                    <input
                      type="checkbox"
                      id="looking-for-friends"
                      name="lookingFor-friends"
                      checked={formData.lookingFor.includes('friends')}
                      onChange={() => toggleLookingFor('friends')}
                    />
                    <span className="checkbox-option-wrapper">
                      <span className="checkbox-option-label">Friends</span>
                      <span className="checkbox-option-helper">Casual connections and people to chat with</span>
                    </span>
                  </label>
                  <label className="checkbox-label-compact">
                    <input
                      type="checkbox"
                      id="looking-for-support"
                      name="lookingFor-support"
                      checked={formData.lookingFor.includes('support')}
                      onChange={() => toggleLookingFor('support')}
                    />
                    <span className="checkbox-option-wrapper">
                      <span className="checkbox-option-label">Support</span>
                      <span className="checkbox-option-helper">Emotional support, understanding, or a safe space</span>
                    </span>
                  </label>
                  <label className="checkbox-label-compact">
                    <input
                      type="checkbox"
                      id="looking-for-community"
                      name="lookingFor-community"
                      checked={formData.lookingFor.includes('community')}
                      onChange={() => toggleLookingFor('community')}
                    />
                    <span className="checkbox-option-wrapper">
                      <span className="checkbox-option-label">Community</span>
                      <span className="checkbox-option-helper">Shared identity, belonging, and group connection</span>
                    </span>
                  </label>
                  <label className="checkbox-label-compact">
                    <input
                      type="checkbox"
                      id="looking-for-networking"
                      name="lookingFor-networking"
                      checked={formData.lookingFor.includes('networking')}
                      onChange={() => toggleLookingFor('networking')}
                    />
                    <span className="checkbox-option-wrapper">
                      <span className="checkbox-option-label">Networking</span>
                      <span className="checkbox-option-helper">Professional, creative, or collaboration connections</span>
                    </span>
                  </label>
                </div>
              </div>
            </section>

            {/* Badge Settings */}
            <section className="form-section" id="badge-settings">
              <BadgeSettings onUpdate={async () => {
                // Refresh user data after badge update
                try {
                  const response = await api.get(`/users/${user.username}`);
                  onUpdate(response.data);
                } catch (error) {
                  console.error('Failed to refresh user data:', error);
                }
              }} />
            </section>

            {/* Accessibility & Communication */}
            <section className="form-section">
              <h3>♿ Accessibility & Communication</h3>
              <p className="section-description">Help others understand how to communicate with you best.</p>

              <div className="form-group">
                <label>Preferred Communication Style</label>
                <textarea
                  name="communicationStyle"
                  value={formData.communicationStyle}
                  onChange={handleChange}
                  placeholder="e.g., I prefer direct and clear communication, I may take time to reply, Clear boundaries help me feel safe..."
                  rows="3"
                />
              </div>

              <div className="form-group">
                <label>Safety/Preferences</label>
                <textarea
                  name="safetyPreferences"
                  value={formData.safetyPreferences}
                  onChange={handleChange}
                  placeholder="e.g., Please avoid sudden topics, I appreciate content warnings, I prefer gentle communication..."
                  rows="3"
                />
              </div>
            </section>
          </div>

          <div className="form-footer sticky">
            <div className="change-indicator">
              {hasChanges && <span>Changes won't apply until you save</span>}
            </div>
            <div className="form-actions">
              <button type="button" onClick={onClose} className="btn-cancel">
                Cancel
              </button>
              <button type="submit" disabled={loading || !hasChanges} className="btn-save">
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditProfileModal;


