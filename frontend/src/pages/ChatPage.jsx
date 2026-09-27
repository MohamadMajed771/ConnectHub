import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api/axios";
import { connectSocket, disconnectSocket } from "../socket/socket";

const initials = (name = "?") => name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();

function sentLabel(message, currentUserId) {
  if (Number(message.sender_id) !== Number(currentUserId)) return "";
  if (message.is_read) return "Seen";
  const minutes = Math.max(0, Math.floor((Date.now() - new Date(message.created_at).getTime()) / 60000));
  if (minutes < 1) return "Sent now";
  if (minutes < 60) return `Sent ${minutes}m ago`;
  return `Sent ${Math.floor(minutes / 60)}h ago`;
}

export default function ChatPage() {
  const navigate = useNavigate();
  const { conversationId } = useParams();
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const user = JSON.parse(localStorage.getItem("connecthub_user") || "null");
  const selectedId = Number(conversationId);
  const selected = conversations.find((item) => item.conversation_id === selectedId);

  useEffect(() => {
    api.get("/conversations").then(({ data }) => setConversations(data.conversations)).catch(() => setError("Unable to load your conversations."));
  }, []);

  useEffect(() => {
    if (!selectedId) return undefined;
    api.get(`/messages/${selectedId}`).then(({ data }) => setMessages(data.messages)).catch(() => setError("Unable to load messages."));
    const socket = connectSocket();
    socket?.emit("join-conversation", selectedId);
    const receive = (message) => {
      if (Number(message.conversation_id) === selectedId) {
        setMessages((items) => items.some((item) => item.id === message.id) ? items : [...items, message]);
        if (Number(message.sender_id) !== Number(user?.id)) socket?.emit("mark-messages-read", selectedId);
      }
    };
    const markRead = ({ conversationId, readerId }) => {
      if (Number(conversationId) === selectedId && Number(readerId) !== Number(user?.id)) {
        setMessages((items) => items.map((item) => Number(item.sender_id) === Number(user?.id) ? { ...item, is_read: true } : item));
      }
    };
    const setPresence = (userId, isOnline) => {
      setConversations((items) => items.map((item) =>
        Number(item.user_id) === Number(userId)
          ? { ...item, is_online: isOnline }
          : item
      ));
    };
    const handleOnline = ({ userId }) => setPresence(userId, true);
    const handleOffline = ({ userId }) => setPresence(userId, false);
    const handlePresenceSync = ({ onlineUserIds }) => {
      const onlineIds = new Set(onlineUserIds.map(Number));
      setConversations((items) => items.map((item) => ({
        ...item,
        is_online: onlineIds.has(Number(item.user_id)),
      })));
    };
    socket?.on("receive-message", receive);
    socket?.on("messages-read", markRead);
    socket?.on("user-online", handleOnline);
    socket?.on("user-offline", handleOffline);
    socket?.on("presence-sync", handlePresenceSync);
    socket?.emit("mark-messages-read", selectedId);
    return () => { socket?.emit("leave-conversation", selectedId); socket?.off("receive-message", receive); socket?.off("messages-read", markRead); socket?.off("user-online", handleOnline); socket?.off("user-offline", handleOffline); socket?.off("presence-sync", handlePresenceSync); disconnectSocket(); };
  }, [selectedId, user?.id]);

  function send(event) {
    event.preventDefault();
    if (!draft.trim() || !selectedId) return;
    connectSocket()?.emit("send-message", { conversationId: selectedId, content: draft.trim() });
    setDraft("");
  }

  return <main className="chat-layout">
    <aside className="chat-sidebar"><div className="hub-brand"><span className="brand-mark">C</span><strong>ConnectHub</strong></div><button className="back-button" onClick={() => navigate("/dashboard")}>← Back to home</button><p className="eyebrow chat-label">MESSAGES</p><div className="conversation-list">{conversations.length ? conversations.map((item) => <button className={item.conversation_id === selectedId ? "conversation-item active" : "conversation-item"} key={item.conversation_id} onClick={() => navigate(`/messages/${item.conversation_id}`)}><span className="avatar avatar-violet">{initials(item.name)}</span><span><strong>{item.name}</strong><small>{item.last_message || "Start a conversation"}</small></span></button>) : <p className="chat-empty">No conversations yet. Start one from a friend’s Message button.</p>}</div></aside>
    <section className="chat-main">{selected ? <><header className="chat-header"><div className="avatar avatar-rose">{initials(selected.name)}</div><div><h1>{selected.name}</h1><p>{selected.is_online ? "Online now" : "Offline"}</p></div></header>{error && <p className="toast toast-error">{error}</p>}<div className="message-area">{messages.map((message) => <div className={Number(message.sender_id) === Number(user?.id) ? "message-row mine" : "message-row"} key={message.id}><div><p>{message.content}</p><small>{sentLabel(message, user?.id)}</small></div></div>)}</div><form className="message-form" onSubmit={send}><input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Write a message..." /><button disabled={!draft.trim()}>Send</button></form></> : <div className="chat-welcome"><span>◌</span><h1>Your messages</h1><p>Select a conversation, or start one from the dashboard.</p></div>}</section>
  </main>;
}
