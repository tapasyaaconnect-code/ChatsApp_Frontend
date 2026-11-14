import { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { ArrowLeft, Ban, Check, CheckCheck, Clock, MessageCircle, MoreVertical, Phone, Search, Send, Trash2, UserPlus, Video, X } from "lucide-react";
import authService from "../../service/auth.service";
import chatService from "../../service/chat.service";
import socialService from "../../service/social.service";
import { createChatSocket } from "../../socket/socket";
import { getAvatarUrl } from "../../utils/avatar";
import {
  clearUnreadForUser,
  clearLastMessageForUser,
  clearLastMessageIfMatches,
  decrementNotificationCount,
  incrementNotificationCount,
  setActiveChatUserId,
  setLastMessages,
  setNotificationCount,
} from "../../redux/slices/chatSlice";
import "./ChatPage.css";

const UserAvatar = ({ user }) => {
  const avatarUrl = getAvatarUrl(user.avatar);
  return (
    <div className="chat-user-avatar">
      <span className="chat-avatar-image">
        {avatarUrl ? <img src={avatarUrl} alt="" /> : (
          <span>{user.name?.charAt(0).toUpperCase() || user.email.charAt(0).toUpperCase()}</span>
        )}
      </span>
      {user.isOnline && <span className="online-dot" aria-label="Online" />}
    </div>
  );
};

const emitWithReply = (socket, event, data) =>
  new Promise((resolve, reject) => {
    socket.timeout(10000).emit(event, data, (timeoutError, response) => {
      if (timeoutError) return reject(new Error("Request timed out"));
      if (!response?.ok) return reject(new Error(response?.message || "Request failed"));
      resolve(response);
    });
  });

const formatPresence = (user) => {
  if (user.isOnline) return "Online";
  if (!user.lastSeen) return "Offline";

  const lastSeen = new Date(user.lastSeen);
  if (Number.isNaN(lastSeen.getTime())) return "Offline";

  const now = new Date();
  const isToday = lastSeen.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday = lastSeen.toDateString() === yesterday.toDateString();
  const time = lastSeen.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  if (isToday) return `Last seen today at ${time}`;
  if (isYesterday) return `Last seen yesterday at ${time}`;
  return `Last seen ${lastSeen.toLocaleDateString([], { day: "numeric", month: "short", year: "numeric" })} at ${time}`;
};

export const ChatPage = () => {
  const dispatch = useDispatch();
  const currentUser = useSelector((state) => state.auth.user);
  const unreadCounts = useSelector((state) => state.chat.unreadCounts);
  const lastMessages = useSelector((state) => state.chat.lastMessages);
  const [users, setUsers] = useState([]);
  const [connections, setConnections] = useState([]);
  const [blockedUserIds, setBlockedUserIds] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const selectedUserRef = useRef(null);
  const connectionsRef = useRef([]);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const socketRef = useRef(null);
  const peerRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const pendingCandidatesRef = useRef([]);
  const [call, setCall] = useState(null);
  const [incomingCall, setIncomingCall] = useState(null);
  const [remoteConnected, setRemoteConnected] = useState(false);
  const [showConversationMenu, setShowConversationMenu] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);

  useEffect(() => { selectedUserRef.current = selectedUser; }, [selectedUser]);
  useEffect(() => { connectionsRef.current = connections; }, [connections]);

  useEffect(() => {
    let active = true;
    Promise.all([authService.getUsers(), chatService.getConnections(), socialService.getBlockedUsers()])
      .then(([loadedUsers, loadedConnections, loadedBlockedUsers]) => {
        if (active) {
          setUsers(loadedUsers);
          setConnections(loadedConnections);
          setBlockedUserIds(loadedBlockedUsers);
          dispatch(setLastMessages(Object.fromEntries(loadedConnections
            .filter((item) => item.lastMessage)
            .map((item) => [item.requesterId === currentUser.id ? item.recipientId : item.requesterId, item.lastMessage]))));
          dispatch(setNotificationCount(loadedConnections.filter((item) =>
            item.status === "pending" && item.recipientId === currentUser.id).length));
        }
      })
      .catch((requestError) => {
        if (active) setError(requestError.response?.data?.message || "Unable to load chat");
      })
      .finally(() => { if (active) setLoading(false); });

    const socket = createChatSocket();
    socketRef.current = socket;
    socket.on("connect_error", (socketError) => setError(socketError.message));
    socket.on("presence:update", ({ userId, ...presence }) => {
      setUsers((items) => items.map((user) => user.id === userId ? { ...user, ...presence } : user));
      setSelectedUser((user) => user?.id === userId ? { ...user, ...presence } : user);
    });
    socket.on("connection:update", (updated) => {
      setConnections((items) => updated.status === "rejected"
        ? items.filter((item) => item.id !== updated.id)
        : [...items.filter((item) => item.id !== updated.id), updated]);
      setError(null);
      if (updated.notifyUserId === currentUser.id && updated.eventType !== "rejected") {
        dispatch(incrementNotificationCount());
      }
    });
    socket.on("message:new", (incoming) => {
      const selectedId = selectedUserRef.current?.id;
      const activeConnection = connectionsRef.current.find((item) =>
        item.status === "accepted" &&
        ((item.requesterId === currentUser.id && item.recipientId === selectedId) ||
         (item.recipientId === currentUser.id && item.requesterId === selectedId)));
      if (activeConnection?.id === incoming.conversationId) {
        setMessages((items) => items.some((item) => item.id === incoming.id) ? items : [...items, incoming]);
      }
    });
    socket.on("messages:cleared", ({ conversationId }) => {
      const selectedId = selectedUserRef.current?.id;
      const activeConnection = connectionsRef.current.find((item) =>
        ((item.requesterId === currentUser.id && item.recipientId === selectedId) ||
         (item.recipientId === currentUser.id && item.requesterId === selectedId)));
      if (activeConnection?.id === conversationId) setMessages([]);
    });
    socket.on("message:deleted", ({ messageId }) => {
      setMessages((items) => items.filter((item) => item.id !== messageId));
      setSelectedMessage((item) => item?.id === messageId ? null : item);
    });
    socket.on("call:incoming", (payload) => setIncomingCall(payload));
    socket.on("call:answered", async ({ answer }) => {
      try {
        await peerRef.current?.setRemoteDescription(answer);
        for (const candidate of pendingCandidatesRef.current.splice(0)) {
          await peerRef.current?.addIceCandidate(candidate);
        }
        setCall((current) => current ? { ...current, status: "Connected" } : current);
      } catch { setError("Unable to connect the call"); }
    });
    socket.on("call:ice", async ({ candidate }) => {
      if (!candidate) return;
      if (!peerRef.current?.remoteDescription) pendingCandidatesRef.current.push(candidate);
      else try { await peerRef.current.addIceCandidate(candidate); } catch { /* ignore an invalid network candidate */ }
    });
    socket.on("call:ended", () => {
      peerRef.current?.close();
      localStreamRef.current?.getTracks().forEach((track) => track.stop());
      peerRef.current = null; localStreamRef.current = null; remoteStreamRef.current = null;
      pendingCandidatesRef.current = [];
      setRemoteConnected(false);
      setCall(null); setIncomingCall(null);
    });

    return () => {
      active = false;
      socket.disconnect();
      peerRef.current?.close();
      localStreamRef.current?.getTracks().forEach((track) => track.stop());
      socketRef.current = null;
    };
  }, [currentUser.id, dispatch]);

  const connectionFor = (userId) => connections.find((item) =>
    (item.requesterId === currentUser.id && item.recipientId === userId) ||
    (item.recipientId === currentUser.id && item.requesterId === userId));
  const selectedConnection = selectedUser ? connectionFor(selectedUser.id) : null;

  useEffect(() => {
    if (!selectedUser || selectedConnection?.status !== "accepted") {
      setMessages([]);
      return;
    }
    let active = true;
    chatService.getMessages(selectedUser.id)
      .then((result) => { if (active) setMessages(result); })
      .catch((requestError) => { if (active) setError(requestError.response?.data?.message || "Unable to load messages"); });
    return () => { active = false; };
  }, [selectedUser, selectedConnection?.status]);

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();
    return query ? users.filter((user) =>
      [user.name, user.email].some((value) => value?.toLowerCase().includes(query))) : users;
  }, [search, users]);

  const performAction = async (event, data) => {
    setActionLoading(true);
    setError(null);
    try {
      await emitWithReply(socketRef.current, event, data);
      if (event === "connection:respond") dispatch(decrementNotificationCount());
    }
    catch (actionError) { setError(actionError.message); }
    finally { setActionLoading(false); }
  };

  const selectUser = (user) => {
    setShowConversationMenu(false);
    setSelectedUser(user);
    if (unreadCounts[user.id]) {
      dispatch(clearUnreadForUser(user.id));
      chatService.markMessagesRead(user.id).catch(() => {});
      socketRef.current?.emit("message:read", { senderId: user.id });
    }
  };

  const markAllRead = async () => {
    if (!selectedUser) return;
    await chatService.markMessagesRead(selectedUser.id);
    dispatch(clearUnreadForUser(selectedUser.id));
    socketRef.current?.emit("message:read", { senderId: selectedUser.id });
    setShowConversationMenu(false);
  };

  const deleteAllMessages = async () => {
    if (!selectedUser || !window.confirm("Delete every message in this conversation for both users?")) return;
    try {
      await emitWithReply(socketRef.current, "message:delete-all", { recipientId: selectedUser.id });
      setMessages([]);
      dispatch(clearUnreadForUser(selectedUser.id));
      dispatch(clearLastMessageForUser(selectedUser.id));
      setShowConversationMenu(false);
    } catch (deleteError) { setError(deleteError.message); }
  };

  const deleteMessage = async (mode) => {
    if (!selectedMessage) return;
    try {
      await emitWithReply(socketRef.current, "message:delete", { messageId: selectedMessage.id, mode });
      setMessages((items) => items.filter((item) => item.id !== selectedMessage.id));
      dispatch(clearLastMessageIfMatches({ userId: selectedUser.id, messageId: selectedMessage.id }));
      setSelectedMessage(null);
    } catch (deleteError) { setError(deleteError.message); }
  };

  useEffect(() => {
    dispatch(setActiveChatUserId(selectedUser?.id || null));
    return () => { dispatch(setActiveChatUserId(null)); };
  }, [dispatch, selectedUser?.id]);

  const sendMessage = async (event) => {
    event.preventDefault();
    const text = messageText.trim();
    if (!text || !selectedUser) return;
    setMessageText("");
    try {
      await emitWithReply(socketRef.current, "message:send", { recipientId: selectedUser.id, message: text });
    } catch (sendError) {
      setMessageText(text);
      setError(sendError.message);
    }
  };

  const createPeer = (recipientId) => {
    const peer = new RTCPeerConnection({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] });
    peer.onicecandidate = ({ candidate }) => {
      if (candidate) socketRef.current?.emit("call:ice", { recipientId, candidate });
    };
    peer.ontrack = ({ streams }) => {
      remoteStreamRef.current = streams[0];
      setRemoteConnected(true);
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = streams[0];
    };
    peerRef.current = peer;
    return peer;
  };

  const getCallMedia = async (mode) => {
    if (!navigator.mediaDevices?.getUserMedia) throw new Error("Calls require HTTPS and media permissions");
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: mode === "video" });
    localStreamRef.current = stream;
    if (localVideoRef.current) localVideoRef.current.srcObject = stream;
    return stream;
  };

  const startCall = async (mode) => {
    try {
      const peer = createPeer(selectedUser.id);
      const stream = await getCallMedia(mode);
      stream.getTracks().forEach((track) => peer.addTrack(track, stream));
      const offer = await peer.createOffer();
      await peer.setLocalDescription(offer);
      setCall({ userId: selectedUser.id, mode, status: "Calling…" });
      await emitWithReply(socketRef.current, "call:offer", { recipientId: selectedUser.id, mode, offer });
    } catch (callError) { endCall(false); setError(callError.message); }
  };

  const acceptCall = async () => {
    const incoming = incomingCall;
    try {
      const peer = createPeer(incoming.senderId);
      const stream = await getCallMedia(incoming.mode);
      stream.getTracks().forEach((track) => peer.addTrack(track, stream));
      await peer.setRemoteDescription(incoming.offer);
      for (const candidate of pendingCandidatesRef.current.splice(0)) await peer.addIceCandidate(candidate);
      const answer = await peer.createAnswer();
      await peer.setLocalDescription(answer);
      setCall({ userId: incoming.senderId, mode: incoming.mode, status: "Connected" });
      setIncomingCall(null);
      await emitWithReply(socketRef.current, "call:answer", { recipientId: incoming.senderId, answer });
    } catch (callError) { endCall(false); setError(callError.message); }
  };

  const endCall = (notify = true) => {
    const recipientId = call?.userId || incomingCall?.senderId;
    if (notify && recipientId) socketRef.current?.emit("call:end", { recipientId });
    peerRef.current?.close();
    localStreamRef.current?.getTracks().forEach((track) => track.stop());
    peerRef.current = null; localStreamRef.current = null; remoteStreamRef.current = null;
    pendingCandidatesRef.current = [];
    setRemoteConnected(false);
    setCall(null); setIncomingCall(null);
  };

  useEffect(() => {
    if (localVideoRef.current && localStreamRef.current) localVideoRef.current.srcObject = localStreamRef.current;
    if (remoteVideoRef.current && remoteStreamRef.current) remoteVideoRef.current.srcObject = remoteStreamRef.current;
  }, [call]);

  const toggleBlock = async () => {
    if (!selectedUser) return;
    const isBlocked = blockedUserIds.includes(selectedUser.id);
    if (!isBlocked && !window.confirm(`Block ${selectedUser.name || selectedUser.email}?`)) return;
    try {
      if (isBlocked) {
        await socialService.unblock(selectedUser.id);
        setBlockedUserIds((items) => items.filter((id) => id !== selectedUser.id));
      } else {
        await socialService.block(selectedUser.id);
        setBlockedUserIds((items) => [...items, selectedUser.id]);
        setConnections((items) => items.filter((item) =>
          !((item.requesterId === currentUser.id && item.recipientId === selectedUser.id) ||
            (item.recipientId === currentUser.id && item.requesterId === selectedUser.id))));
      }
    } catch (requestError) { setError(requestError.response?.data?.message || "Unable to update block"); }
  };

  const relationLabel = (user) => {
    const relation = connectionFor(user.id);
    if (blockedUserIds.includes(user.id)) return "Blocked";
    if (relation?.status === "accepted") return "";
    if (relation?.requesterId === currentUser.id) return "Pending";
    if (relation) return "Respond";
    return "Add";
  };

  return (
    <section className={`chat-workspace ${selectedUser ? "has-selection" : ""}`}>
      <aside className="people-panel" aria-label="People">
        <div className="people-header"><div><p className="section-eyebrow">Messages</p><h2>People</h2></div><span className="people-count">{users.length}</span></div>
        <label className="people-search"><Search size={18} /><span className="visually-hidden">Search people</span><input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or email" /></label>
        <div className="people-list">
          {loading && <p className="panel-message">Loading people…</p>}
          {error && <p className="panel-message panel-error">{error}</p>}
          {!loading && filteredUsers.length === 0 && <div className="panel-empty"><MessageCircle size={30} /><h3>No users found</h3></div>}
          {filteredUsers.map((user) => (
            <button type="button" key={user.id} className={`person-row ${selectedUser?.id === user.id ? "selected" : ""}`} onClick={() => selectUser(user)}>
              <UserAvatar user={user} /><span className="person-copy"><strong>{user.name || "Unnamed user"}</strong><small className={unreadCounts[user.id] ? "unread-preview" : ""}>{lastMessages[user.id]?.message || user.about || user.email}</small></span>
              {unreadCounts[user.id] > 0 ? <span className="message-count-badge">{unreadCounts[user.id] > 99 ? "99+" : unreadCounts[user.id]}</span> : relationLabel(user) && <span className={`relation-badge relation-${relationLabel(user).toLowerCase()}`}>{relationLabel(user)}</span>}
            </button>
          ))}
        </div>
      </aside>

      {selectedUser && <div className="conversation-panel">
        <header className="conversation-header">
          <button type="button" className="conversation-back" onClick={() => setSelectedUser(null)}><ArrowLeft size={21} /></button>
          <UserAvatar user={selectedUser} />
          <div className="conversation-person"><h2>{selectedUser.name || "Unnamed user"}</h2><p className={selectedUser.isOnline ? "presence-online" : ""}>{formatPresence(selectedUser)}</p></div>
          {selectedConnection?.status === "accepted" && !blockedUserIds.includes(selectedUser.id) && <div className="call-actions"><button type="button" title="Audio call" onClick={() => startCall("audio")}><Phone size={19} /></button><button type="button" title="Video call" onClick={() => startCall("video")}><Video size={19} /></button></div>}
          <div className="conversation-menu-wrap">
            <button type="button" className="conversation-menu-button" aria-label="Conversation options" aria-expanded={showConversationMenu} onClick={() => setShowConversationMenu((open) => !open)}><MoreVertical size={20} /></button>
            {showConversationMenu && <div className="conversation-menu">
              <button type="button" onClick={markAllRead}><CheckCheck size={17} /><span>Read all</span></button>
              <button type="button" disabled={selectedConnection?.status !== "accepted"} onClick={deleteAllMessages}><Trash2 size={17} /><span>Delete all messages</span></button>
              <button type="button" className="danger" onClick={async () => { await toggleBlock(); setShowConversationMenu(false); }}><Ban size={17} /><span>{blockedUserIds.includes(selectedUser.id) ? "Unblock user" : "Block user"}</span></button>
            </div>}
          </div>
        </header>

        {selectedConnection?.status === "accepted" ? <>
          <div className="conversation-messages">
            {messages.length === 0 ? <div className="conversation-empty"><MessageCircle size={38} /><h3>Start a conversation</h3><p>Send your first message.</p></div> :
              messages.map((item) => <button type="button" key={item.id} className={`message-bubble ${item.senderId === currentUser.id ? "sent" : "received"}`} onClick={() => setSelectedMessage(item)}><p>{item.message}</p><time>{new Date(item.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</time></button>)}
          </div>
          <form className="message-composer" onSubmit={sendMessage}><input value={messageText} onChange={(e) => setMessageText(e.target.value)} maxLength={4000} placeholder="Type a message…" /><button type="submit"><Send size={19} /><span>Send</span></button></form>
        </> : <div className="request-panel">
          {blockedUserIds.includes(selectedUser.id) ? <><Ban size={42} /><h3>User blocked</h3><p>Unblock this user before sending a new connection request.</p><button onClick={toggleBlock}>Unblock</button></> : !selectedConnection && <><UserPlus size={42} /><h3>Connect before chatting</h3><p>Send a request to {selectedUser.name || selectedUser.email}. You can chat after they accept.</p><button disabled={actionLoading} onClick={() => performAction("connection:send", { recipientId: selectedUser.id })}><UserPlus size={18} /> Send request</button></>}
          {selectedConnection?.requesterId === currentUser.id && <><Clock size={42} /><h3>Request pending</h3><p>Waiting for {selectedUser.name || selectedUser.email} to accept your request.</p></>}
          {selectedConnection?.recipientId === currentUser.id && <><UserPlus size={42} /><h3>Chat request</h3><p>{selectedUser.name || selectedUser.email} wants to connect with you.</p><div className="request-actions"><button disabled={actionLoading} onClick={() => performAction("connection:respond", { connectionId: selectedConnection.id, action: "accept" })}><Check size={18} /> Accept</button><button className="reject" disabled={actionLoading} onClick={() => performAction("connection:respond", { connectionId: selectedConnection.id, action: "reject" })}><X size={18} /> Reject</button></div></>}
        </div>}
      </div>}
      {(call || incomingCall) && <div className="call-overlay">
        <div className={`call-card ${((call?.mode || incomingCall?.mode) === "video") ? "video-call" : "audio-call"}`}>
          <div className="remote-media"><video ref={remoteVideoRef} autoPlay playsInline /><div className={`call-placeholder ${remoteConnected && (call?.mode || incomingCall?.mode) === "video" ? "hidden" : ""}`}><UserAvatar user={users.find((user) => user.id === (call?.userId || incomingCall?.senderId)) || selectedUser || { email: "?" }} /><h2>{incomingCall ? "Incoming call" : call?.status}</h2><p>{(call?.mode || incomingCall?.mode) === "video" ? "Video call" : "Audio call"}</p></div></div>
          <video className="local-media" ref={localVideoRef} autoPlay muted playsInline />
          <div className="call-controls">{incomingCall && <button className="accept-call" onClick={acceptCall}><Phone /></button>}<button className="end-call" onClick={() => endCall(true)}><Phone /></button></div>
        </div>
      </div>}
      {selectedMessage && <div className="message-delete-backdrop" onClick={() => setSelectedMessage(null)}>
        <div className="message-delete-dialog" role="dialog" aria-modal="true" aria-label="Delete message" onClick={(event) => event.stopPropagation()}>
          <h3>Delete message?</h3>
          <button type="button" onClick={() => deleteMessage("me")}><Trash2 size={18} /> Delete for me</button>
          {selectedMessage.senderId === currentUser.id && <button type="button" className="danger" onClick={() => deleteMessage("everyone")}><Trash2 size={18} /> Delete for everyone</button>}
          <button type="button" onClick={() => setSelectedMessage(null)}>Cancel</button>
        </div>
      </div>}
    </section>
  );
};
