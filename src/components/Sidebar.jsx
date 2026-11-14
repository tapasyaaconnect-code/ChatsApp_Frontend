import { useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  MessageCircle, 
  Users, 
  Settings, 
  LogOut, 
  Menu,
  ChevronLeft 
} from 'lucide-react';
import { logout } from '../redux/slices/authSlice';
import { updateAvatar } from '../redux/actions/authActions';
import { toggleSidebar } from '../redux/slices/uiSlice';
import { getAvatarUrl } from '../utils/avatar';
import './Sidebar.css';

export const Sidebar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const sidebarOpen = useSelector((state) => state.ui.sidebarOpen);
  const user = useSelector((state) => state.auth.user);
  const avatarInputRef = useRef(null);
  const [avatarError, setAvatarError] = useState(null);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/email');
  };

  const handleAvatarChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setAvatarError(null);
    try {
      await dispatch(updateAvatar(file)).unwrap();
    } catch (error) {
      setAvatarError(error);
    } finally {
      event.target.value = '';
    }
  };

  const avatarUrl = getAvatarUrl(user?.avatar);

  return (
    <aside className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
      <div className="sidebar-header">
        <div className="logo">
          <MessageCircle className="logo-icon" />
          {sidebarOpen && <span>ChatApp</span>}
        </div>
        <button
          type="button"
          onClick={() => dispatch(toggleSidebar())}
          className="toggle-btn"
          aria-label={sidebarOpen ? 'Collapse navigation' : 'Expand navigation'}
        >
          {sidebarOpen ? <ChevronLeft size={20} /> : <Menu size={20} />}
        </button>
      </div>

      <div className="user-info">
        <button
          type="button"
          className="avatar avatar-button"
          onClick={() => avatarInputRef.current?.click()}
          aria-label="Change profile photo"
          title="Change profile photo"
        >
          {avatarUrl ? (
            <img src={avatarUrl} alt="" />
          ) : (
            user?.name?.charAt(0).toUpperCase() || '?'
          )}
        </button>
        <input
          ref={avatarInputRef}
          className="visually-hidden"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          capture="user"
          onChange={handleAvatarChange}
        />
        {sidebarOpen && (
          <div className="user-details">
            <h4>{user?.name}</h4>
            <p>{user?.email}</p>
            {avatarError && <p className="sidebar-error">{avatarError}</p>}
          </div>
        )}
      </div>

      <nav className="sidebar-nav">
        <button className={`nav-item ${location.pathname === '/chat' ? 'active' : ''}`} onClick={() => navigate('/chat')}>
          <MessageCircle size={20} />
          {sidebarOpen && <span>Chats</span>}
        </button>
        <button className={`nav-item ${location.pathname === '/groups' ? 'active' : ''}`} onClick={() => navigate('/groups')}>
          <Users size={20} />
          {sidebarOpen && <span>Groups</span>}
        </button>
        <button className="nav-item">
          <Settings size={20} />
          {sidebarOpen && <span>Settings</span>}
        </button>
      </nav>

      <div className="sidebar-footer">
        <button onClick={handleLogout} className="nav-item logout">
          <LogOut size={20} />
          {sidebarOpen && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
};
