import { useState, useEffect, useRef } from 'react';
import api from '../utils/api';
import { getImageUrl } from '../utils/imageUrl';
import { compressAvatar, compressCoverPhoto } from '../utils/compressImage';
import { uploadWithProgress } from '../utils/uploadWithProgress';
import ImageEditor from './ImageEditor';
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
  // Badge visibility toggle
  const [showBadges, setShowBadges] = useState(true);

  // Photo editor state
  // tempCoverImage/tempAvatarImage: holds the raw image URL before editing
  // editingCover/editingAvatar: controls when the editor is visible
  // avatarMetadata/coverMetadata: stores x, y, scale transforms
  const [tempCoverImage, setTempCoverImage] = useState(null);
  const [tempAvatarImage, setTempAvatarImage] = useState(null);
  const [editingCover, setEditingCover] = useState(false);
  const [editingAvatar, setEditingAvatar] = useState(false);
  const [avatarMetadata, setAvatarMetadata] = useState({ x: 0, y: 0, scale: 1 });
  const [coverMetadata, setCoverMetadata] = useState({ x: 0, y: 0, scale: 1 });
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

      // Reset editor state when modal opens
      setTempCoverImage(null);
      setTempAvatarImage(null);
      setEditingCover(false);
      setEditingAvatar(false);
      // Initialize metadata from existing user data
      setAvatarMetadata(user.profilePhotoPosition || { x: 0, y: 0, scale: 1 });
      setCoverMetadata(user.coverPhotoPosition || { x: 0, y: 0, scale: 1 });
      // Initialize badge visibility (hideBadges=false means showBadges=true)
      setShowBadges(!user.privacySettings?.hideBadges);
    }
  }, [isOpen, user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
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
  };

  const toggleLookingFor = (option) => {
    setFormData(prev => ({
      ...prev,
      lookingFor: prev.lookingFor.includes(option)
        ? prev.lookingFor.filter(o => o !== option)
        : [...prev.lookingFor, option]
    }));
  };

  // Handle file selection - opens crop editor instead of immediate upload
  const handleFileSelect = (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Only image files are allowed.');
      return;
    }

    // Create temporary URL for crop editor
    const imageUrl = URL.createObjectURL(file);

    if (type === 'profile') {
      setTempAvatarImage(imageUrl);
      setEditingAvatar(true);
    } else {
      setTempCoverImage(imageUrl);
      setEditingCover(true);
    }

    // Clear the input so the same file can be selected again
    e.target.value = '';
  };

  // Handle editor completion - uploads the image and saves metadata
  const handleEditorComplete = async (type) => {
    setUploadingPhoto(true);
    setUploadProgress(0);

    try {
      // Get the file from the temporary image URL
      const imageUrl = type === 'profile' ? tempAvatarImage : tempCoverImage;
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const fileName = type === 'profile' ? 'avatar.jpg' : 'cover.jpg';
      const file = new File([blob], fileName, { type: 'image/jpeg' });

      const endpoint = type === 'profile' ? '/upload/profile-photo' : '/upload/cover-photo';

      // Upload with progress tracking
      const uploadResponse = await uploadWithProgress({
        url: `${api.defaults.baseURL}${endpoint}`,
        file: file,
        fieldName: 'photo',
        onProgress: (percent) => {
          setUploadProgress(percent);
        }
      });

      // Validate response
      if (!uploadResponse || !uploadResponse.url) {
        throw new Error('Upload succeeded but no URL returned');
      }

      // Update form data with new image URL and metadata
      if (type === 'profile') {
        setFormData(prev => ({
          ...prev,
          profilePhoto: uploadResponse.url,
          profilePhotoPosition: avatarMetadata
        }));
        setEditingAvatar(false);
        setTempAvatarImage(null);
      } else {
        setFormData(prev => ({
          ...prev,
          coverPhoto: uploadResponse.url,
          coverPhotoPosition: coverMetadata
        }));
        setEditingCover(false);
        setTempCoverImage(null);
      }
    } catch (error) {
      console.error('Failed to upload photo:', error);
      const errorMessage = error.message || 'Image upload failed. Please try again.';
      alert(errorMessage);
    } finally {
      setUploadingPhoto(false);
      setUploadProgress(0);
    }
  };

  // Handle crop cancel - restores previous state
  const handleCropCancel = (type) => {
    if (type === 'profile') {
      setEditingAvatar(false);
      // Clean up the temporary URL
      if (tempAvatarImage) URL.revokeObjectURL(tempAvatarImage);
      setTempAvatarImage(null);
    } else {
      setEditingCover(false);
      if (tempCoverImage) URL.revokeObjectURL(tempCoverImage);
      setTempCoverImage(null);
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
      // formData contains profilePhoto, coverPhoto URLs and position metadata
      const updateData = {
        ...formData,
        // If pronouns is 'custom', send the customPronouns value instead
        pronouns: formData.pronouns === 'custom' ? formData.customPronouns : formData.pronouns,
        // Include position metadata for non-destructive editing
        profilePhotoPosition: avatarMetadata,
        coverPhotoPosition: coverMetadata
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
                {/* Cover Photo Editor */}
                <div className="photo-editor-item">
                  <label>Cover Photo</label>
                  <div className="photo-editor-container">
                    {editingCover && tempCoverImage ? (
                      /* Editor mode - shown when user selects a new image */
                      <>
                        <ImageEditor
                          image={tempCoverImage}
                          aspect={16 / 6} /* Wide aspect for cover photos */
                          cropShape="rect"
                          initialCrop={{ x: coverMetadata.x, y: coverMetadata.y }}
                          initialZoom={coverMetadata.scale}
                          onCropChange={(crop) => setCoverMetadata(prev => ({ ...prev, x: crop.x, y: crop.y }))}
                          onZoomChange={(zoom) => setCoverMetadata(prev => ({ ...prev, scale: zoom }))}
                          onReset={() => setCoverMetadata({ x: 0, y: 0, scale: 1 })}
                          showSafeAreaGuide={true}
                          safeAreaGuideType="cover"
                        />
                        <div className="editor-actions">
                          <button
                            type="button"
                            className="btn-cancel-edit"
                            onClick={() => handleEditorCancel('cover')}
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            className="btn-save-edit"
                            onClick={() => handleEditorComplete('cover')}
                            disabled={uploadingPhoto}
                          >
                            {uploadingPhoto ? `Uploading... ${uploadProgress}%` : 'Save Cover'}
                          </button>
                        </div>
                      </>
                    ) : (
                      /* Preview mode - shows current cover photo */
                      <>
                        <div className="photo-preview cover">
                          {formData.coverPhoto || user?.coverPhoto ? (
                            <img
                              src={getImageUrl(formData.coverPhoto || user.coverPhoto)}
                              alt="Cover"
                            />
                          ) : (
                            <div className="photo-placeholder">No cover photo</div>
                          )}
                        </div>
                        <input
                          ref={coverInputRef}
                          type="file"
                          id="cover-photo-upload"
                          accept="image/*"
                          onChange={(e) => handleFileSelect(e, 'cover')}
                          disabled={uploadingPhoto}
                          style={{ display: 'none' }}
                        />
                        <button
                          type="button"
                          className="photo-change-btn"
                          onClick={() => coverInputRef.current?.click()}
                          disabled={uploadingPhoto}
                        >
                          {formData.coverPhoto || user?.coverPhoto ? 'Change Cover' : 'Add Cover Photo'}
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Profile Photo Editor */}
                <div className="photo-editor-item">
                  <label>Profile Photo</label>
                  <div className="photo-editor-container">
                    {editingAvatar && tempAvatarImage ? (
                      /* Editor mode - shown when user selects a new image */
                      <>
                        <ImageEditor
                          image={tempAvatarImage}
                          aspect={1} /* Square aspect for avatars */
                          cropShape="round"
                          initialCrop={{ x: avatarMetadata.x, y: avatarMetadata.y }}
                          initialZoom={avatarMetadata.scale}
                          onCropChange={(crop) => setAvatarMetadata(prev => ({ ...prev, x: crop.x, y: crop.y }))}
                          onZoomChange={(zoom) => setAvatarMetadata(prev => ({ ...prev, scale: zoom }))}
                          onReset={() => setAvatarMetadata({ x: 0, y: 0, scale: 1 })}
                          showSafeAreaGuide={true}
                          safeAreaGuideType="avatar"
                        />
                        <div className="editor-actions">
                          <button
                            type="button"
                            className="btn-cancel-edit"
                            onClick={() => handleEditorCancel('profile')}
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            className="btn-save-edit"
                            onClick={() => handleEditorComplete('profile')}
                            disabled={uploadingPhoto}
                          >
                            {uploadingPhoto ? `Uploading... ${uploadProgress}%` : 'Save Photo'}
                          </button>
                        </div>
                      </>
                    ) : (
                      /* Preview mode - shows current avatar */
                      <>
                        <div className="photo-preview avatar">
                          {formData.profilePhoto || user?.profilePhoto ? (
                            <img
                              src={getImageUrl(formData.profilePhoto || user.profilePhoto)}
                              alt="Profile"
                            />
                          ) : (
                            <div className="photo-placeholder">No photo</div>
                          )}
                        </div>
                        <input
                          ref={avatarInputRef}
                          type="file"
                          id="profile-photo-upload"
                          accept="image/*"
                          onChange={(e) => handleFileSelect(e, 'profile')}
                          disabled={uploadingPhoto}
                          style={{ display: 'none' }}
                        />
                        <button
                          type="button"
                          className="photo-change-btn"
                          onClick={() => avatarInputRef.current?.click()}
                          disabled={uploadingPhoto}
                        >
                          {formData.profilePhoto || user?.profilePhoto ? 'Change Photo' : 'Add Photo'}
                        </button>
                      </>
                    )}
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
              <h3>🏅 Badge Settings</h3>
              <p className="section-description">Control whether your badges are visible on your profile.</p>
              <div className="form-group toggle-group">
                <label className="toggle-label">
                  <input
                    type="checkbox"
                    checked={showBadges}
                    onChange={async (e) => {
                      const newValue = e.target.checked;
                      setShowBadges(newValue);
                      try {
                        await api.patch('/users/me/settings', { hideBadges: !newValue });
                      } catch (error) {
                        console.error('Failed to update badge visibility:', error);
                        setShowBadges(!newValue); // Revert on error
                      }
                    }}
                  />
                  <span className="toggle-switch-slider"></span>
                  <span className="toggle-text">Show badges on my profile</span>
                </label>
                <p className="toggle-description">
                  {showBadges
                    ? 'All your earned badges will be displayed on your profile.'
                    : 'Your badges are hidden from your profile.'}
                </p>
              </div>
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

          <div className="form-footer">
            <button type="button" onClick={onClose} className="btn-cancel">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn-save">
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditProfileModal;


