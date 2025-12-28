import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useOutletContext } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../utils/api';
import { getImageUrl } from '../utils/imageUrl';
import { getCurrentUser } from '../utils/auth';
import './Profile.css';

function Followers() {
  const { username } = useParams();
  const navigate = useNavigate();
  // Get menu handler from AppLayout outlet context
  const { onMenuOpen } = useOutletContext() || {};
  const currentUser = getCurrentUser();
  const [followers, setFollowers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [profileUser, setProfileUser] = useState(null);

  useEffect(() => {
    fetchFollowers();
  }, [username]);

  const fetchFollowers = async () => {
    try {
      setLoading(true);
      // First get the user to get their ID
      const userResponse = await api.get(`/users/${username}`);
      setProfileUser(userResponse.data);
      
      // Then get their followers
      const followersResponse = await api.get(`/follow/followers/${userResponse.data._id}`);
      setFollowers(followersResponse.data.followers || followersResponse.data || []);
    } catch (error) {
      console.error('Failed to fetch followers:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar onMenuClick={onMenuOpen} />
        <div className="profile-container">
          <div className="loading">Loading followers...</div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar onMenuClick={onMenuOpen} />
      <div className="profile-container">
        <div className="followers-page">
          <div className="page-header">
            <button className="btn-back" onClick={() => navigate(`/profile/${username}`)}>
              ← Back to Profile
            </button>
            <h1>Followers</h1>
            <p className="page-subtitle">
              {profileUser?.displayName || username}'s followers
            </p>
          </div>

          {followers.length === 0 ? (
            <div className="empty-state glossy">
              <p>No followers yet</p>
            </div>
          ) : (
            <div className="users-list">
              {followers.map((follower) => (
                <Link
                  key={follower._id}
                  to={`/profile/${follower.username}`}
                  className="user-card glossy"
                >
                  <div className="user-avatar">
                    {follower.profilePhoto ? (
                      <img src={getImageUrl(follower.profilePhoto)} alt={follower.displayName} />
                    ) : (
                      <span>{follower.displayName?.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <div className="user-info">
                    <div className="user-name">{follower.displayName}</div>
                    <div className="user-username">@{follower.username}</div>
                    {follower.bio && (
                      <div className="user-bio">{follower.bio}</div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default Followers;

