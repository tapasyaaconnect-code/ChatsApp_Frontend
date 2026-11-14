import { Sidebar } from '../components/Sidebar';
import { Navbar } from '../components/Navbar';
import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setSidebarOpen } from '../redux/slices/uiSlice';
import './MainLayout.css';
import { MobileNav } from '../components/MobileNav';
import chatService from '../service/chat.service';
import { createChatSocket } from '../socket/socket';
import { clearLastMessageForUser, clearLastMessageIfMatches, clearUnreadForUser, incrementUnreadForUser, setLastMessageForUser, setUnreadCounts } from '../redux/slices/chatSlice';

export const MainLayout = ({ children }) => {
  const dispatch = useDispatch();
  const sidebarOpen = useSelector((state) => state.ui.sidebarOpen);
  const theme = useSelector((state) => state.ui.theme);
  const currentUser = useSelector((state) => state.auth.user);
  const activeChatUserId = useSelector((state) => state.chat.activeChatUserId);
  const activeChatUserRef = useRef(activeChatUserId);

  useEffect(() => { activeChatUserRef.current = activeChatUserId; }, [activeChatUserId]);

  useEffect(() => {
    chatService.getUnreadCounts().then((counts) => dispatch(setUnreadCounts(counts))).catch(() => {});
    const socket = createChatSocket();
    socket.on('message:new', (message) => {
      const otherUserId = message.senderId === currentUser.id ? message.receiverId : message.senderId;
      dispatch(setLastMessageForUser({ userId: otherUserId, message }));
      if (message.receiverId !== currentUser.id) return;
      if (activeChatUserRef.current === message.senderId) {
        dispatch(clearUnreadForUser(message.senderId));
        socket.emit('message:read', { senderId: message.senderId });
      } else {
        dispatch(incrementUnreadForUser(message.senderId));
      }
    });
    socket.on('messages:cleared', ({ userIds }) => {
      const otherUserId = userIds.find((userId) => userId !== currentUser.id);
      if (otherUserId) {
        dispatch(clearLastMessageForUser(otherUserId));
        dispatch(clearUnreadForUser(otherUserId));
      }
    });
    socket.on('message:deleted', ({ messageId, senderId, receiverId }) => {
      const otherUserId = senderId === currentUser.id ? receiverId : senderId;
      dispatch(clearLastMessageIfMatches({ userId: otherUserId, messageId }));
    });
    return () => socket.disconnect();
  }, [currentUser.id, dispatch]);

  useEffect(() => {
    const mobileQuery = window.matchMedia('(max-width: 767px)');
    const syncSidebar = (event) => dispatch(setSidebarOpen(!event.matches));

    syncSidebar(mobileQuery);
    mobileQuery.addEventListener('change', syncSidebar);

    return () => mobileQuery.removeEventListener('change', syncSidebar);
  }, [dispatch]);

  return (
    <div className={`main-layout ${theme} ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
      <Sidebar />
      {sidebarOpen && (
        <button
          type="button"
          className="sidebar-backdrop"
          onClick={() => dispatch(setSidebarOpen(false))}
          aria-label="Close navigation"
        />
      )}
      <div className="main-content">
        <Navbar />
        <div className="content-area">
          {children}
        </div>
      </div>
      <MobileNav />
    </div>
  );
};
