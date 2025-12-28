import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useOutletContext } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../utils/api';
import { getImageUrl } from '../utils/imageUrl';
import { getCurrentUser } from '../utils/auth';
import './Profile.css';

function Following() {
  const { username } = useParams();
  const navigate = useNavigate();
  // Get menu handler from AppLayout outlet context
  const { onMenuOpen } = useOutletContext() || {};
  const currentUser = getCurrentUser();
  const [following, setFollowing] = useState([]);
  const [loading, setLoading] = useState(true);
  const [profileUser, setProfileUser] = useState(null);

  useEffect(() => {
    fetchFollowing();
  }, [username]);

  const fetchFollowing = async () => {
    try {
      setLoading(true);
      // First get the user to get their ID
      const userResponse = await api.get(`/users/${username}`);
      setProfileUser(userResponse.data);
      
      // Then get who they're following
      const followingResponse = await api.get(`/follow/following/${userResponse.data._id}`);
      setFollowing(followingResponse.data.following || followingResponse.data || []);
    } catch (error) {
      console.error('Failed to fetch following:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar onMenuClick={onMenuOpen} />
        <div className="profile-container">
          <div className="loading">Loading following...</div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar onMenuClick={onMenuOpen} />
      <div className="profile-container">
        <div className="following-page">
          <div className="page-header">
            <button className="btn-back" onClick={() => navigate(`/profile/${username}`)}>
              ← Back to Profile
            </button>
            <h1>Following</h1>
            <p className="page-subtitle">
              People {profileUser?.displayName || username} follows
            </p>
          </div>

          {following.length === 0 ? (
            <div className="empty-state glossy">
              <p>Not following anyone yet</p>
            </div>
          ) : (
            <div className="users-list">
              {following.map((user) => (
                <Link
                  key={user._id}
                  to={`/profile/${user.username}`}
                  className="user-card glossy"
                >
                  <div className="user-avatar">
                    {user.profilePhoto ? (
                      <img src={getImageUrl(user.profilePhoto)} alt={user.displayName} />
                    ) : (
                      <span>{user.displayName?.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <div className="user-info">
                    <div className="user-name">{user.displayName}</div>
                    <div className="user-username">@{user.username}</div>
                    {user.bio && (
                      <div className="user-bio">{user.bio}</div>
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

export default Following;

