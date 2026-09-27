import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { connectSocket, disconnectSocket } from "../socket/socket";

function initials(name = "?") {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function presenceLabel(person) {
  if (person.is_online) return "Online now";
  if (!person.last_seen) return "Offline";
  const minutes = Math.max(1, Math.floor((Date.now() - new Date(person.last_seen).getTime()) / 60000));
  if (minutes < 60) return `Active ${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Active ${hours}h ago`;
  return `Active ${Math.floor(hours / 24)}d ago`;
}

export default function DashboardPage() {
  const navigate = useNavigate();

  const [user, setUser] = useState(
    JSON.parse(localStorage.getItem("connecthub_user") || "null")
  );

  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [me, friendList, received, sent] = await Promise.all([
          api.get("/auth/me"),
          api.get("/friends"),
          api.get("/friends/requests/received"),
          api.get("/friends/requests/sent"),
        ]);

        setUser(me.data.user);
        setFriends(friendList.data.friends);
        setRequests(received.data.requests);
        setSentRequests(sent.data.requests);

        localStorage.setItem(
          "connecthub_user",
          JSON.stringify(me.data.user)
        );
      } catch {
        setMessage("Could not load your profile. Please sign in again.");
      }
    }

    loadDashboard();

    const socket = connectSocket();

    const setPresence = (userId, isOnline) => {
      setFriends((items) => items.map((friend) => Number(friend.id) === Number(userId) ? { ...friend, is_online: isOnline, last_seen: isOnline ? friend.last_seen : new Date().toISOString() } : friend));
      setUser((current) => Number(current?.id) === Number(userId) ? { ...current, is_online: isOnline } : current);
    };
    const handleOnline = ({ userId }) => setPresence(userId, true);
    const handleOffline = ({ userId }) => setPresence(userId, false);
    const handleConnect = () => setUser((current) => current ? { ...current, is_online: true } : current);
    const handlePresenceSync = ({ onlineUserIds }) => {
      const onlineIds = new Set(onlineUserIds.map(Number));
      setFriends((items) => items.map((friend) => ({
        ...friend,
        is_online: onlineIds.has(Number(friend.id)),
      })));
      setUser((current) => current
        ? { ...current, is_online: onlineIds.has(Number(current.id)) }
        : current
      );
    };
    socket?.on("connect", handleConnect);
    socket?.on("user-online", handleOnline);
    socket?.on("user-offline", handleOffline);
    socket?.on("presence-sync", handlePresenceSync);

    return () => {
      socket?.off("connect", handleConnect);
      socket?.off("user-online", handleOnline);
      socket?.off("user-offline", handleOffline);
      socket?.off("presence-sync", handlePresenceSync);
      disconnectSocket();
    };
  }, []);

  async function searchUsers(event) {
    event.preventDefault();

    if (!query.trim()) {
      setResults([]);
      return;
    }

    try {
      const { data } = await api.get(
        `/users/search?search=${encodeURIComponent(query)}`
      );

      const friendIds = new Set(friends.map((friend) => friend.id));
      const pendingIds = new Set(
        sentRequests.map((request) => request.user_id)
      );

      setResults(
        data.users.filter(
          (person) =>
            !friendIds.has(person.id) && !pendingIds.has(person.id)
        )
      );
    } catch {
      setMessage("Search is unavailable right now.");
    }
  }

  async function sendFriendRequest(userId) {
    try {
      await api.post(`/friends/request/${userId}`);

      setResults((currentResults) =>
        currentResults.filter((person) => person.id !== userId)
      );

      setSentRequests((currentRequests) => [
        ...currentRequests,
        { user_id: userId },
      ]);

      setMessage("Friend request sent.");
    } catch (error) {
      setMessage(
        error.response?.data?.message || "Unable to send friend request."
      );
    }
  }

  async function updateRequest(requestId, action) {
    try {
      await api.put(`/friends/requests/${requestId}/${action}`);

      setRequests((currentRequests) =>
        currentRequests.filter(
          (request) => request.request_id !== requestId
        )
      );

      if (action === "accept") {
        const { data } = await api.get("/friends");
        setFriends(data.friends);
      }

      setMessage(
        action === "accept"
          ? "Friend request accepted."
          : "Friend request declined."
      );
    } catch {
      setMessage("Unable to update friend request.");
    }
  }

  async function openChat(friendId) {
    try {
      const { data } = await api.post(`/conversations/private/${friendId}`);
      navigate(`/messages/${data.conversationId}`);
    } catch (error) {
      setMessage(error.response?.data?.message || "Unable to open this conversation.");
    }
  }

  function signOut() {
    disconnectSocket();
    localStorage.removeItem("connecthub_token");
    localStorage.removeItem("connecthub_user");
    navigate("/login");
  }

  return (
    <main className="hub-shell">
      <aside className="hub-sidebar">
        <div className="hub-brand">
          <span className="brand-mark">C</span>
          <strong>ConnectHub</strong>
        </div>

        <nav className="hub-nav">
          <button className="nav-item active" onClick={() => navigate("/dashboard")}>⌂ Home</button>
          <button className="nav-item" onClick={() => document.querySelector(".search-box input")?.focus()}>✦ Discover</button>
          <button className="nav-item" onClick={() => navigate("/messages")}>◌ Messages</button>
        </nav>

        <div className="profile-mini">
          <div className="avatar avatar-violet">{initials(user?.name)}</div>

          <div>
            <strong>{user?.name || "Loading..."}</strong>
            <small>{user?.is_online ? "Online" : "Offline"}</small>
          </div>

          <button className="icon-button" onClick={signOut}>
            ↪
          </button>
        </div>
      </aside>

      <section className="hub-content">
        <header className="hub-topbar">
          <div>
            <p className="eyebrow">YOUR NETWORK</p>
            <h1>
              Good afternoon
              {user?.name ? `, ${user.name.split(" ")[0]}` : ""}.
            </h1>
          </div>

          <form className="search-box" onSubmit={searchUsers}>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search people..."
            />
            <button>Search</button>
          </form>
        </header>

        {message && <p className="toast">{message}</p>}

        <section className="welcome-banner">
          <div>
            <p className="eyebrow">STAY CONNECTED</p>
            <h2>People make the conversation.</h2>
            <p>
              Find friends, share a thought, and let your next conversation
              begin here.
            </p>
          </div>
        </section>

        {results.length > 0 && (
          <section className="content-section">
            <div className="section-heading">
              <h2>Search results</h2>
              <button className="text-button" onClick={() => setResults([])}>
                Clear
              </button>
            </div>

            <div className="people-grid">
              {results.map((person) => (
                <article className="person-card" key={person.id}>
                  <div className="avatar avatar-blue">
                    {initials(person.name)}
                  </div>

                  <div>
                    <h3>{person.name}</h3>
                    <p>{person.email}</p>
                  </div>

                  <button
                    className="outline-button"
                    onClick={() => sendFriendRequest(person.id)}
                  >
                    Add friend
                  </button>
                </article>
              ))}
            </div>
          </section>
        )}

        <section className="content-section">
          <div className="section-heading">
            <h2>Friends ({friends.length})</h2>
          </div>

          {friends.length > 0 ? (
            <div className="people-grid">
              {friends.map((friend) => (
                <article className="person-card" key={friend.id}>
                  <div className="avatar avatar-rose">
                    {initials(friend.name)}
                  </div>

                  <div>
                    <h3>{friend.name}</h3>
                    <p>{presenceLabel(friend)}</p>
                  </div>

                  <button className="outline-button" onClick={() => openChat(friend.id)}>Message</button>
                </article>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <h3>Your circle starts here</h3>
              <p>Search for someone above and send a friend request.</p>
            </div>
          )}
        </section>
      </section>

      <aside className="hub-rightbar">
        <div className="section-heading">
          <h2>Friend requests</h2>
          <span>{requests.length}</span>
        </div>

        {requests.length > 0 ? (
          <div className="request-list">
            {requests.map((request) => (
              <article className="request-card" key={request.request_id}>
                <div className="avatar avatar-amber">
                  {initials(request.name)}
                </div>

                <div>
                  <h3>{request.name}</h3>
                  <p>Wants to connect</p>

                  <button
                    className="mini-button accept"
                    onClick={() =>
                      updateRequest(request.request_id, "accept")
                    }
                  >
                    Accept
                  </button>

                  <button
                    className="mini-button"
                    onClick={() =>
                      updateRequest(request.request_id, "decline")
                    }
                  >
                    Decline
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <p>You’re all caught up.</p>
          </div>
        )}
      </aside>
    </main>
  );
}
