import { useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { ArrowLeft, LogOut, MessageCircle, Plus, Send, UserPlus, Users, X } from "lucide-react";
import authService from "../../service/auth.service";
import chatService from "../../service/chat.service";
import groupService from "../../service/group.service";
import { createChatSocket } from "../../socket/socket";
import "./GroupsPage.css";

const emitWithReply = (socket, event, data) => new Promise((resolve, reject) => {
  socket.timeout(10000).emit(event, data, (error, response) => {
    if (error) return reject(new Error("Request timed out"));
    if (!response?.ok) return reject(new Error(response?.message || "Request failed"));
    resolve(response);
  });
});

export const GroupsPage = () => {
  const currentUser = useSelector((state) => state.auth.user);
  const [groups, setGroups] = useState([]);
  const [friends, setFriends] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const selectedRef = useRef(null);
  const socketRef = useRef(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [showAddMembers, setShowAddMembers] = useState(false);
  const [newMemberIds, setNewMemberIds] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => { selectedRef.current = selectedGroup; }, [selectedGroup]);
  useEffect(() => {
    Promise.all([groupService.list(), authService.getUsers(), chatService.getConnections()])
      .then(([loadedGroups, users, connections]) => {
        setGroups(loadedGroups);
        const friendIds = new Set(connections.filter((item) => item.status === "accepted")
          .map((item) => item.requesterId === currentUser.id ? item.recipientId : item.requesterId));
        setFriends(users.filter((user) => friendIds.has(user.id)));
      }).catch((requestError) => setError(requestError.response?.data?.message || "Unable to load groups"));

    const socket = createChatSocket();
    socketRef.current = socket;
    socket.on("group:message:new", (message) => {
      if (selectedRef.current?.id === message.groupId) {
        setMessages((items) => items.some((item) => item.id === message.id) ? items : [...items, message]);
      }
    });
    return () => socket.disconnect();
  }, [currentUser.id]);

  useEffect(() => {
    if (!selectedGroup) return undefined;
    let active = true;
    groupService.messages(selectedGroup.id).then((items) => { if (active) setMessages(items); })
      .catch((requestError) => setError(requestError.response?.data?.message || "Unable to load messages"));
    socketRef.current?.emit("group:join", { groupId: selectedGroup.id });
    return () => { active = false; };
  }, [selectedGroup]);

  const memberById = useMemo(() => Object.fromEntries(
    (selectedGroup?.members || []).map((member) => [member.id, member])), [selectedGroup]);

  const toggleMember = (userId) => setSelectedMembers((items) =>
    items.includes(userId) ? items.filter((id) => id !== userId) : [...items, userId]);

  const chooseGroup = (group) => {
    setMessages([]);
    setSelectedGroup(group);
  };

  const createGroup = async (event) => {
    event.preventDefault();
    try {
      const group = await groupService.create({ name, memberIds: selectedMembers });
      setGroups((items) => [group, ...items]);
      chooseGroup(group);
      socketRef.current?.emit("group:join", { groupId: group.id });
      setName(""); setSelectedMembers([]); setShowCreate(false); setError(null);
    } catch (requestError) { setError(requestError.response?.data?.message || "Unable to create group"); }
  };

  const addSelectedMembers = async () => {
    if (!newMemberIds.length) return;
    try {
      const group = await groupService.addMembers(selectedGroup.id, newMemberIds);
      setGroups((items) => items.map((item) => item.id === group.id ? group : item));
      setSelectedGroup(group);
      setNewMemberIds([]);
      setShowAddMembers(false);
    } catch (requestError) { setError(requestError.response?.data?.message || "Unable to add member"); }
  };

  const leaveGroup = async () => {
    if (!window.confirm(`Leave ${selectedGroup.name}?`)) return;
    await groupService.leave(selectedGroup.id);
    setGroups((items) => items.filter((item) => item.id !== selectedGroup.id));
    setMessages([]);
    setSelectedGroup(null);
  };

  const sendMessage = async (event) => {
    event.preventDefault();
    const message = text.trim();
    if (!message) return;
    setText("");
    try { await emitWithReply(socketRef.current, "group:message:send", { groupId: selectedGroup.id, message }); }
    catch (sendError) { setText(message); setError(sendError.message); }
  };

  return <section className={`groups-workspace ${selectedGroup ? "has-selection" : ""}`}>
    <aside className="groups-list-panel">
      <header className="groups-heading"><div><p>COMMUNITIES</p><h2>Groups</h2></div><button onClick={() => setShowCreate(true)} aria-label="Create group"><Plus /></button></header>
      {error && <p className="groups-error">{error}</p>}
      {!groups.length && <div className="groups-empty"><Users size={38} /><h3>No groups yet</h3><p>Create one with your connected friends.</p></div>}
      {groups.map((group) => <button className={`group-row ${selectedGroup?.id === group.id ? "selected" : ""}`} key={group.id} onClick={() => chooseGroup(group)}><span className="group-avatar"><Users /></span><span><strong>{group.name}</strong><small>{group.members.length} members</small></span></button>)}
    </aside>

    {selectedGroup && <div className="group-conversation">
      <header className="group-chat-header"><button className="group-back" onClick={() => chooseGroup(null)}><ArrowLeft /></button><span className="group-avatar"><Users /></span><div><h2>{selectedGroup.name}</h2><p>{selectedGroup.members.map((member) => member.name || member.email).join(", ")}</p></div>{["owner", "admin"].includes(selectedGroup.members.find((member) => member.id === currentUser.id)?.role) && <button title="Add connected friends" onClick={() => setShowAddMembers(true)}><UserPlus /></button>}<button className="leave-group" title="Leave group" onClick={leaveGroup}><LogOut /></button></header>
      <div className="group-messages">{!messages.length ? <div className="groups-empty"><MessageCircle /><h3>Start the group conversation</h3></div> : messages.map((message) => <div key={message.id} className={`group-message ${message.senderId === currentUser.id ? "sent" : ""}`}><strong>{message.senderId === currentUser.id ? "You" : memberById[message.senderId]?.name || "Member"}</strong><p>{message.message}</p><time>{new Date(message.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</time></div>)}</div>
      <form className="group-composer" onSubmit={sendMessage}><input value={text} maxLength={4000} onChange={(event) => setText(event.target.value)} placeholder="Message the group…" /><button><Send /></button></form>
    </div>}

    {showCreate && <div className="group-modal-backdrop"><form className="group-modal" onSubmit={createGroup}><button type="button" className="modal-close" onClick={() => setShowCreate(false)}><X /></button><h2>Create group</h2><input required minLength={2} maxLength={80} value={name} onChange={(event) => setName(event.target.value)} placeholder="Group name" /><p>Add connected friends</p><div className="friend-picker">{friends.map((friend) => <label key={friend.id}><input type="checkbox" checked={selectedMembers.includes(friend.id)} onChange={() => toggleMember(friend.id)} /><span>{friend.name || friend.email}</span></label>)}</div><button type="submit" className="create-group-submit">Create group</button></form></div>}
    {showAddMembers && <div className="group-modal-backdrop"><div className="group-modal"><button type="button" className="modal-close" onClick={() => setShowAddMembers(false)}><X /></button><h2>Add people</h2><p>Select connected friends who are not already members.</p><div className="friend-picker">{friends.filter((friend) => !selectedGroup.members.some((member) => member.id === friend.id)).map((friend) => <label key={friend.id}><input type="checkbox" checked={newMemberIds.includes(friend.id)} onChange={() => setNewMemberIds((items) => items.includes(friend.id) ? items.filter((id) => id !== friend.id) : [...items, friend.id])} /><span>{friend.name || friend.email}</span></label>)}</div><button type="button" disabled={!newMemberIds.length} className="create-group-submit" onClick={addSelectedMembers}>Add selected</button></div></div>}
  </section>;
};
