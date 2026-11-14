import { useDispatch, useSelector } from 'react-redux';
import { Moon, Sun, Bell, Search, Menu } from 'lucide-react';
import { toggleSidebar, toggleTheme } from '../redux/slices/uiSlice';
import { clearNotifications } from '../redux/slices/chatSlice';
import './Navbar.css';

export const Navbar = () => {
  const dispatch = useDispatch();
  const theme = useSelector((state) => state.ui.theme);
  const notificationCount = useSelector((state) => state.chat.notificationCount);

  return (
    <header className="navbar">
      <button
        type="button"
        onClick={() => dispatch(toggleSidebar())}
        className="action-btn mobile-menu-btn"
        aria-label="Open navigation"
      >
        <Menu size={22} />
      </button>
      <div className="navbar-search">
        <Search size={20} />
        <input type="text" placeholder="Search messages..." />
      </div>
      
      <div className="navbar-actions">
        <button
          type="button"
          className="action-btn notification-btn"
          aria-label={`${notificationCount} notifications`}
          onClick={() => dispatch(clearNotifications())}
        >
          <Bell size={20} />
          {notificationCount > 0 && (
            <span className="navbar-badge">{notificationCount > 99 ? '99+' : notificationCount}</span>
          )}
        </button>
        <button
          type="button"
          onClick={() => dispatch(toggleTheme())}
          className="action-btn"
          aria-label={theme === 'light' ? 'Use dark theme' : 'Use light theme'}
        >
          {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
        </button>
      </div>
    </header>
  );
};
