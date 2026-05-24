// src/components/AlumniDashboard.js
import React, { useState, useEffect, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import axios from "axios";
import {
  FaBell,
  FaEnvelope,
  FaComments,
  FaCheck,
  FaTimes,
  FaPaperPlane,
  FaUser,
  FaBriefcase,
  FaCalendarAlt,
  FaMapMarkerAlt,
  FaMoneyBillWave,
  FaGraduationCap,
  FaBuilding,
  FaUsers,
  FaVideo,
  FaChalkboardTeacher,
  FaHandshake,
  FaCalendarPlus,
  FaCalendarCheck,
  FaCalendarDay,
  FaClock,
  FaUserTie,
} from "react-icons/fa";
import "./AlumniDashboard.css";

const API_URL = "http://localhost:5000/api";

const AlumniDashboard = () => {
  const [activeTab, setActiveTab] = useState("connections");
  const [opportunities, setOpportunities] = useState([]);
  const [connectionRequests, setConnectionRequests] = useState([]);
  const [events, setEvents] = useState([]); // NEW: Events state
  const [loading, setLoading] = useState(true);
  const { user } = useContext(AuthContext);

  // Messages state
  const [messages, setMessages] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [newMessage, setNewMessage] = useState("");

  // Notifications state
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  const [postData, setPostData] = useState({
    title: "",
    description: "",
    type: "job",
    company: user?.company || "",
    location: "",
    requirements: "",
    skillsRequired: "",
    salary: "",
    deadline: "",
    industry: "",
    tags: "",
    experienceLevel: "entry",
    remote: false,
  });

  useEffect(() => {
    if (user && user.role === "alumni") {
      fetchDashboardData();
      fetchConversations();
      fetchNotifications();
      fetchEvents(); // NEW: Fetch events
    }
  }, [user]);

  useEffect(() => {
    if (activeTab === "connections") {
      fetchConnectionRequests();
    } else if (activeTab === "messages") {
      fetchConversations();
      if (selectedConversation) {
        fetchMessages(selectedConversation._id);
      }
    } else if (activeTab === "opportunities") {
      fetchOpportunities();
    } else if (activeTab === "events") {
      // NEW: Fetch events when tab is active
      fetchEvents();
    }
  }, [activeTab]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      const response = await axios.get(`${API_URL}/alumni/dashboard`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setOpportunities(response.data.postedOpportunities || []);
      setConnectionRequests(response.data.connectionRequests || []);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  // NEW: Fetch events function
  const fetchEvents = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API_URL}/events`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { upcoming: "true" },
      });
      setEvents(response.data || []);
    } catch (error) {
      console.error("Error fetching events:", error);
    }
  };

  const fetchOpportunities = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API_URL}/alumni/dashboard`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOpportunities(response.data.postedOpportunities || []);
    } catch (error) {
      console.error("Error fetching opportunities:", error);
    }
  };

  const fetchConnectionRequests = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API_URL}/connections/requests`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setConnectionRequests(response.data);
    } catch (error) {
      console.error("Error fetching connection requests:", error);
    }
  };

  const fetchConversations = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API_URL}/messages/conversations`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setConversations(response.data);
    } catch (error) {
      console.error("Error fetching conversations:", error);
    }
  };

  const fetchMessages = async (studentId = null) => {
    try {
      const token = localStorage.getItem("token");
      let url = `${API_URL}/messages`;
      if (studentId) {
        url += `?recipientId=${studentId}`;
      }

      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessages(response.data);
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API_URL}/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications(response.data || []);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  // NEW: Register for event function
  const handleEventRegistration = async (eventId) => {
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `${API_URL}/events/${eventId}/register`,
        {},
        { headers: { Authorization: `Bearer ${token}` } },
      );
      alert("Successfully registered for the event!");
      fetchEvents(); // Refresh events to show updated registration status
    } catch (error) {
      alert(
        "Error registering for event: " +
          (error.response?.data?.message || error.message),
      );
    }
  };

  const handleConnectionResponse = async (connectionId, action) => {
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `${API_URL}/connections/${connectionId}/respond`,
        { action },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      alert(`Connection request ${action}ed successfully!`);
      fetchConnectionRequests();
      fetchNotifications();
    } catch (error) {
      alert("Error: " + (error.response?.data?.message || error.message));
    }
  };

  const sendNewMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `${API_URL}/messages/send`,
        {
          recipientId: selectedConversation._id,
          content: newMessage,
        },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      setNewMessage("");
      fetchMessages(selectedConversation._id);
      fetchConversations();
    } catch (error) {
      alert(
        "Error sending message: " +
          (error.response?.data?.message || error.message),
      );
    }
  };

  const handlePostChange = (e) => {
    const { name, value, type, checked } = e.target;
    setPostData({
      ...postData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handlePostSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");

      const formattedData = {
        title: postData.title,
        description: postData.description,
        type: postData.type,
        company: postData.company,
        location: postData.location,
        requirements: postData.requirements
          .split(",")
          .map((r) => r.trim())
          .filter((r) => r),
        skillsRequired: postData.skillsRequired
          .split(",")
          .map((s) => s.trim())
          .filter((s) => s),
        salary: postData.salary,
        deadline: new Date(postData.deadline),
        industry: postData.industry,
        tags: postData.tags
          .split(",")
          .map((t) => t.trim())
          .filter((t) => t),
        experienceLevel: postData.experienceLevel,
        remote: postData.remote,
        postedBy: user._id,
      };

      const response = await axios.post(
        `${API_URL}/opportunities`,
        formattedData,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      alert("Opportunity posted successfully!");
      setPostData({
        title: "",
        description: "",
        type: "job",
        company: user?.company || "",
        location: "",
        requirements: "",
        skillsRequired: "",
        salary: "",
        deadline: "",
        industry: "",
        tags: "",
        experienceLevel: "entry",
        remote: false,
      });
      fetchOpportunities();
      setActiveTab("opportunities");
    } catch (error) {
      alert(
        "Error posting opportunity: " +
          (error.response?.data?.message || error.message),
      );
    }
  };

  const handleDeleteOpportunity = async (opportunityId) => {
    if (!window.confirm("Are you sure you want to delete this opportunity?")) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${API_URL}/opportunities/${opportunityId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert("Opportunity deleted successfully!");
      fetchOpportunities();
    } catch (error) {
      alert(
        "Error deleting opportunity: " +
          (error.response?.data?.message || error.message),
      );
    }
  };

  const markNotificationAsRead = async (notificationId) => {
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `${API_URL}/notifications/${notificationId}/read`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      fetchNotifications();
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const markAllNotificationsAsRead = async () => {
    try {
      const token = localStorage.getItem("token");
      await axios.get(`${API_URL}/notifications?markRead=true`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchNotifications();
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatEventDateTime = (dateString, timeString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const formattedDate = date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    return `${formattedDate} • ${timeString}`;
  };

  // NEW: Get event icon based on type
  const getEventIcon = (type) => {
    switch (type) {
      case "webinar":
        return <FaVideo />;
      case "workshop":
        return <FaChalkboardTeacher />;
      case "conference":
        return <FaUsers />;
      case "networking":
        return <FaHandshake />;
      case "career-fair":
        return <FaBriefcase />;
      default:
        return <FaCalendarAlt />;
    }
  };

  // NEW: Get event type label
  const getEventTypeLabel = (type) => {
    switch (type) {
      case "webinar":
        return "Webinar";
      case "workshop":
        return "Workshop";
      case "conference":
        return "Conference";
      case "networking":
        return "Networking";
      case "career-fair":
        return "Career Fair";
      default:
        return type;
    }
  };

  // NEW: Check if user is already registered for an event
  const isRegisteredForEvent = (event) => {
    if (!event.registrations || !user) return false;
    return event.registrations.some(
      (reg) => reg.userId && reg.userId.toString() === user._id.toString(),
    );
  };

  // NEW: Check if event is upcoming
  const isUpcomingEvent = (eventDate) => {
    return new Date(eventDate) > new Date();
  };

  if (!user || user.role !== "alumni") {
    return <div className="card">Access Denied. Alumni only.</div>;
  }

  const getUnreadNotificationCount = () => {
    return notifications.filter((n) => !n.read).length;
  };

  return (
    <div className="alumni-dashboard">
      <div className="dashboard-header">
        <div>
          <h1>Welcome back, {user.name}!</h1>
          <p className="welcome-subtitle">
            Alumni Dashboard - {user.company || user.position || "Alumni"}
          </p>
        </div>

        <div className="header-actions">
          <div className="notification-container">
            <div
              className="notification-bell"
              onClick={() => {
                setShowNotifications(!showNotifications);
                if (!showNotifications && getUnreadNotificationCount() > 0) {
                  markAllNotificationsAsRead();
                }
              }}
            >
              <FaBell />
              {getUnreadNotificationCount() > 0 && (
                <span className="notification-count">
                  {getUnreadNotificationCount()}
                </span>
              )}
            </div>

            {showNotifications && (
              <div className="notifications-dropdown">
                <div className="notifications-header">
                  <h4>Notifications</h4>
                  {notifications.length > 0 && (
                    <button
                      className="btn btn-sm btn-link"
                      onClick={() => setShowNotifications(false)}
                    >
                      Close
                    </button>
                  )}
                </div>

                {notifications.length === 0 ? (
                  <p className="no-notifications">No new notifications</p>
                ) : (
                  <div className="notifications-list">
                    {notifications.slice(0, 5).map((notification) => (
                      <div
                        key={notification._id}
                        className={`notification-item ${notification.read ? "read" : "unread"}`}
                        onClick={() => markNotificationAsRead(notification._id)}
                      >
                        <div className="notification-content">
                          <strong>{notification.title}</strong>
                          <p>{notification.message}</p>
                          <small>{formatDate(notification.createdAt)}</small>
                        </div>
                      </div>
                    ))}
                    {notifications.length > 5 && (
                      <div className="view-all-notifications">
                        <button
                          className="btn btn-sm btn-link"
                          onClick={() => {
                            // Navigate to full notifications page
                            console.log("View all notifications");
                          }}
                        >
                          View all {notifications.length} notifications
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="tabs">
        <button
          className={`tab-btn ${activeTab === "connections" ? "active" : ""}`}
          onClick={() => setActiveTab("connections")}
        >
          <FaUser /> Connection Requests ({connectionRequests.length})
        </button>
        <button
          className={`tab-btn ${activeTab === "opportunities" ? "active" : ""}`}
          onClick={() => setActiveTab("opportunities")}
        >
          <FaBriefcase /> My Opportunities ({opportunities.length})
        </button>
        <button
          className={`tab-btn ${activeTab === "messages" ? "active" : ""}`}
          onClick={() => setActiveTab("messages")}
        >
          <FaComments /> Messages
        </button>
        <button
          className={`tab-btn ${activeTab === "events" ? "active" : ""}`}
          onClick={() => setActiveTab("events")}
        >
          <FaCalendarAlt /> Events ({events.length})
        </button>
        <button
          className={`tab-btn ${activeTab === "post" ? "active" : ""}`}
          onClick={() => setActiveTab("post")}
        >
          <FaBriefcase /> Post Opportunity
        </button>
        <button
          className={`tab-btn ${activeTab === "profile" ? "active" : ""}`}
          onClick={() => setActiveTab("profile")}
        >
          <FaUser /> My Profile
        </button>
      </div>

      {loading ? (
        <div className="loading">Loading...</div>
      ) : (
        <div className="tab-content">
          {activeTab === "connections" && (
            <div className="connection-requests">
              <h2>Connection Requests</h2>

              {connectionRequests.length === 0 ? (
                <p className="no-requests">No pending connection requests</p>
              ) : (
                <div className="requests-list">
                  {connectionRequests.map((request) => (
                    <div key={request._id} className="request-card card">
                      <div className="request-header">
                        <div>
                          <h3>{request.student?.name || "Unknown Student"}</h3>
                          <span className="student-email">
                            <FaEnvelope /> {request.student?.email}
                          </span>
                        </div>
                        <span className="request-date">
                          {formatDate(request.createdAt)}
                        </span>
                      </div>

                      <div className="request-details">
                        <div className="detail-row">
                          <div className="detail-item">
                            <strong>Department:</strong>
                            <span>{request.student?.department || "N/A"}</span>
                          </div>
                          <div className="detail-item">
                            <strong>Batch:</strong>
                            <span>{request.student?.batch || "N/A"}</span>
                          </div>
                          <div className="detail-item">
                            <strong>CGPA:</strong>
                            <span>{request.student?.cgpa || "N/A"}</span>
                          </div>
                        </div>

                        {request.student?.skills &&
                          request.student.skills.length > 0 && (
                            <div className="detail-item">
                              <strong>Skills:</strong>
                              <div className="skill-tags">
                                {request.student.skills.map((skill, i) => (
                                  <span key={i} className="skill-tag">
                                    {typeof skill === "object"
                                      ? skill.name
                                      : skill}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                        {request.message && (
                          <div className="detail-item">
                            <strong>Message:</strong>
                            <p className="connection-message">
                              {request.message}
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="request-actions">
                        <button
                          className="btn btn-success"
                          onClick={() =>
                            handleConnectionResponse(request._id, "accept")
                          }
                        >
                          <FaCheck /> Accept
                        </button>
                        <button
                          className="btn btn-danger"
                          onClick={() =>
                            handleConnectionResponse(request._id, "reject")
                          }
                        >
                          <FaTimes /> Reject
                        </button>
                        <button
                          className="btn btn-primary"
                          onClick={() => {
                            setSelectedConversation({
                              _id: request.student?._id,
                              name: request.student?.name,
                            });
                            setActiveTab("messages");
                          }}
                        >
                          <FaComments /> Message
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "opportunities" && (
            <div className="my-opportunities">
              <div className="section-header">
                <h2>My Posted Opportunities</h2>
                <button
                  className="btn btn-primary"
                  onClick={() => setActiveTab("post")}
                >
                  + Post New Opportunity
                </button>
              </div>

              {opportunities.length === 0 ? (
                <div className="empty-state">
                  <p>No opportunities posted yet</p>
                  <button
                    className="btn btn-primary"
                    onClick={() => setActiveTab("post")}
                  >
                    Post Your First Opportunity
                  </button>
                </div>
              ) : (
                <div className="opportunities-grid">
                  {opportunities.map((opp) => (
                    <div key={opp._id} className="opportunity-card card">
                      <div className="opportunity-header">
                        <h3>
                          {opp.title}
                          <span className={`opp-type type-${opp.type}`}>
                            {opp.type}
                          </span>
                        </h3>
                        <span className="opp-date">
                          Posted: {formatDate(opp.createdAt)}
                        </span>
                      </div>

                      <div className="opportunity-details">
                        <div className="detail-row">
                          <div className="detail-item">
                            <FaBuilding /> <strong>Company:</strong>
                            <span>{opp.company}</span>
                          </div>
                          <div className="detail-item">
                            <FaMapMarkerAlt /> <strong>Location:</strong>
                            <span>{opp.location || "Remote"}</span>
                          </div>
                        </div>

                        <div className="detail-row">
                          <div className="detail-item">
                            <FaUser /> <strong>Applications:</strong>
                            <span className="application-count">
                              {opp.applications?.length || 0}
                            </span>
                          </div>
                          <div className="detail-item">
                            <FaCalendarAlt /> <strong>Deadline:</strong>
                            <span
                              className={`deadline ${new Date(opp.deadline) < new Date() ? "expired" : ""}`}
                            >
                              {formatDate(opp.deadline)}
                            </span>
                          </div>
                        </div>

                        {opp.salary && (
                          <div className="detail-item">
                            <FaMoneyBillWave /> <strong>Salary/Stipend:</strong>
                            <span className="salary">{opp.salary}</span>
                          </div>
                        )}

                        <div className="opportunity-description">
                          <p>{opp.description.substring(0, 150)}...</p>
                        </div>

                        {opp.skillsRequired &&
                          opp.skillsRequired.length > 0 && (
                            <div className="skill-tags">
                              {opp.skillsRequired.map((skill, i) => (
                                <span key={i} className="skill-tag">
                                  {skill}
                                </span>
                              ))}
                            </div>
                          )}
                      </div>

                      <div className="opp-actions">
                        <button className="btn btn-secondary">
                          View Applications ({opp.applications?.length || 0})
                        </button>
                        <button
                          className="btn btn-danger"
                          onClick={() => handleDeleteOpportunity(opp._id)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "messages" && (
            <div className="messages-section">
              <div className="messages-container">
                {/* Conversations List */}
                <div className="conversations-list">
                  <div className="conversations-header">
                    <h3>Messages</h3>
                    <span className="conversations-count">
                      {conversations.length} conversations
                    </span>
                  </div>
                  <div className="conversations-items">
                    {conversations.length === 0 ? (
                      <div className="empty-conversations">
                        <p>No conversations yet</p>
                        <p className="empty-conversations-hint">
                          Accept connection requests to start messaging
                        </p>
                      </div>
                    ) : (
                      conversations.map((conv) => (
                        <div
                          key={conv._id}
                          className={`conversation-item ${selectedConversation?._id === conv._id ? "active" : ""}`}
                          onClick={() => {
                            setSelectedConversation(conv);
                            fetchMessages(conv._id);
                          }}
                        >
                          <div className="conversation-avatar">
                            {conv.name?.charAt(0).toUpperCase()}
                          </div>
                          <div className="conversation-info">
                            <h4>{conv.name}</h4>
                            <p className="last-message">
                              {conv.lastMessage?.substring(0, 50) ||
                                "Start a conversation..."}
                              {conv.lastMessage?.length > 50 ? "..." : ""}
                            </p>
                          </div>
                          <div className="conversation-time">
                            {conv.timestamp ? formatTime(conv.timestamp) : ""}
                          </div>
                          {conv.unread && <div className="unread-badge"></div>}
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Chat Area */}
                <div className="chat-area">
                  {selectedConversation ? (
                    <>
                      <div className="chat-header">
                        <div className="chat-user-info">
                          <div className="chat-user-avatar">
                            {selectedConversation.name?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h3>{selectedConversation.name}</h3>
                            <p className="chat-user-status">
                              {selectedConversation.lastSeen
                                ? "Recently active"
                                : "Online"}
                            </p>
                          </div>
                        </div>
                        <button
                          className="btn btn-sm btn-secondary"
                          onClick={() => {
                            // View student profile
                            console.log(
                              "View profile of",
                              selectedConversation._id,
                            );
                          }}
                        >
                          <FaUser /> View Profile
                        </button>
                      </div>

                      <div className="messages-list">
                        {messages.length === 0 ? (
                          <div className="no-messages">
                            <p>No messages yet. Start the conversation!</p>
                          </div>
                        ) : (
                          messages.map((msg) => (
                            <div
                              key={msg._id}
                              className={`message-bubble ${msg.sender?._id === user._id ? "sent" : "received"}`}
                            >
                              <div className="message-content">
                                <p>{msg.content}</p>
                                <span className="message-time">
                                  {formatTime(msg.timestamp)}
                                </span>
                              </div>
                              {msg.sender?.name && (
                                <div className="message-sender">
                                  {msg.sender._id === user._id
                                    ? "You"
                                    : msg.sender.name}
                                </div>
                              )}
                            </div>
                          ))
                        )}
                      </div>

                      <div className="message-input-area">
                        <input
                          type="text"
                          className="form-control message-input"
                          placeholder="Type your message here..."
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          onKeyPress={(e) =>
                            e.key === "Enter" && sendNewMessage()
                          }
                        />
                        <button
                          className="btn btn-primary send-btn"
                          onClick={sendNewMessage}
                          disabled={!newMessage.trim()}
                        >
                          <FaPaperPlane />
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="no-conversation-selected">
                      <div className="chat-placeholder">
                        <FaComments className="placeholder-icon" />
                        <h3>Select a conversation</h3>
                        <p>
                          Choose a conversation from the list to start messaging
                        </p>
                        <button
                          className="btn btn-primary mt-3"
                          onClick={() => setActiveTab("connections")}
                        >
                          <FaUser /> View Connection Requests
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === "events" && (
            <div className="events-section">
              <div className="section-header">
                <h2>Upcoming Events</h2>
                <div className="events-filters">
                  <button className="btn btn-secondary">
                    <FaCalendarAlt /> All Events ({events.length})
                  </button>
                  <button className="btn btn-outline-secondary">
                    <FaVideo /> Webinars
                  </button>
                  <button className="btn btn-outline-secondary">
                    <FaHandshake /> Networking
                  </button>
                  <button className="btn btn-outline-secondary">
                    <FaChalkboardTeacher /> Workshops
                  </button>
                </div>
              </div>

              {events.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-events">
                    <FaCalendarAlt className="empty-icon" />
                    <h3>No Upcoming Events</h3>
                    <p>Check back later for new events</p>
                  </div>
                </div>
              ) : (
                <div className="events-grid">
                  {events.map((event) => {
                    const isRegistered = isRegisteredForEvent(event);
                    const isUpcoming = isUpcomingEvent(event.date);

                    return (
                      <div key={event._id} className="event-card card">
                        <div className="event-header">
                          <div className="event-icon">
                            {getEventIcon(event.type)}
                          </div>
                          <div className="event-title-section">
                            <h3>{event.title}</h3>
                            <div className="event-meta">
                              <span className={`event-type type-${event.type}`}>
                                {getEventTypeLabel(event.type)}
                              </span>
                              {event.successPrediction && (
                                <span
                                  className={`event-prediction ${event.successPrediction.toLowerCase().replace(" ", "-")}`}
                                >
                                  {event.successPrediction} Success
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="event-date-badge">
                            <FaCalendarDay />
                            <span>{formatDate(event.date)}</span>
                          </div>
                        </div>

                        <div className="event-details">
                          <p className="event-description">
                            {event.description?.substring(0, 200)}
                            {event.description?.length > 200 ? "..." : ""}
                          </p>

                          <div className="event-info-grid">
                            <div className="event-info-item">
                              <FaClock />
                              <div>
                                <strong>Time</strong>
                                <p>{event.time}</p>
                              </div>
                            </div>

                            <div className="event-info-item">
                              <FaUsers />
                              <div>
                                <strong>Registrations</strong>
                                <p>
                                  {event.registrationCount || 0} /{" "}
                                  {event.maxAttendees || "Unlimited"}
                                </p>
                              </div>
                            </div>

                            {event.speaker && (
                              <div className="event-info-item">
                                <FaUserTie />
                                <div>
                                  <strong>Speaker</strong>
                                  <p>{event.speaker.name}</p>
                                  <small>
                                    {event.speaker.company || "Alumni"}
                                  </small>
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="event-status">
                            {isRegistered ? (
                              <div className="registered-badge">
                                <FaCalendarCheck /> Registered
                              </div>
                            ) : (
                              <div
                                className={`availability-badge ${isUpcoming ? "upcoming" : "past"}`}
                              >
                                {isUpcoming ? "Upcoming" : "Past Event"}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="event-actions">
                          {isUpcoming && !isRegistered ? (
                            <button
                              className="btn btn-primary"
                              onClick={() => handleEventRegistration(event._id)}
                              disabled={
                                event.maxAttendees &&
                                event.registrationCount >= event.maxAttendees
                              }
                            >
                              <FaCalendarPlus /> Register Now
                            </button>
                          ) : isRegistered ? (
                            <button className="btn btn-success" disabled>
                              <FaCalendarCheck /> Already Registered
                            </button>
                          ) : (
                            <button className="btn btn-secondary" disabled>
                              Event Ended
                            </button>
                          )}

                          <button className="btn btn-outline-secondary">
                            View Details
                          </button>

                          {event.maxAttendees &&
                            event.registrationCount >= event.maxAttendees &&
                            !isRegistered && (
                              <span className="event-full-badge">
                                Event Full
                              </span>
                            )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="events-sidebar">
                <div className="sidebar-card card">
                  <h4>My Event Registrations</h4>
                  <div className="my-registrations">
                    {events.filter(isRegisteredForEvent).length === 0 ? (
                      <p className="no-registrations">
                        You haven't registered for any events yet
                      </p>
                    ) : (
                      <div className="registrations-list">
                        {events
                          .filter(isRegisteredForEvent)
                          .slice(0, 3)
                          .map((event) => (
                            <div key={event._id} className="registration-item">
                              <div className="registration-title">
                                {getEventIcon(event.type)}
                                <span>{event.title}</span>
                              </div>
                              <div className="registration-date">
                                {formatDate(event.date)}
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="sidebar-card card">
                  <h4>Event Categories</h4>
                  <div className="event-categories">
                    <div className="category-item">
                      <FaVideo /> Webinars
                      <span className="category-count">
                        {events.filter((e) => e.type === "webinar").length}
                      </span>
                    </div>
                    <div className="category-item">
                      <FaChalkboardTeacher /> Workshops
                      <span className="category-count">
                        {events.filter((e) => e.type === "workshop").length}
                      </span>
                    </div>
                    <div className="category-item">
                      <FaHandshake /> Networking
                      <span className="category-count">
                        {events.filter((e) => e.type === "networking").length}
                      </span>
                    </div>
                    <div className="category-item">
                      <FaBriefcase /> Career Fairs
                      <span className="category-count">
                        {events.filter((e) => e.type === "career-fair").length}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "post" && (
            <div className="post-opportunity">
              <div className="section-header">
                <h2>Post New Opportunity</h2>
                <button
                  className="btn btn-secondary"
                  onClick={() => setActiveTab("opportunities")}
                >
                  ← Back to Opportunities
                </button>
              </div>

              <form onSubmit={handlePostSubmit} className="post-form card">
                <div className="form-row">
                  <div className="form-group">
                    <label>Title *</label>
                    <input
                      type="text"
                      name="title"
                      className="form-control"
                      value={postData.title}
                      onChange={handlePostChange}
                      placeholder="e.g., Senior Software Engineer"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Type *</label>
                    <select
                      name="type"
                      className="form-control"
                      value={postData.type}
                      onChange={handlePostChange}
                      required
                    >
                      <option value="job">Full-time Job</option>
                      <option value="internship">Internship</option>
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Company *</label>
                    <input
                      type="text"
                      name="company"
                      className="form-control"
                      value={postData.company}
                      onChange={handlePostChange}
                      placeholder="Your company name"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Location</label>
                    <input
                      type="text"
                      name="location"
                      className="form-control"
                      value={postData.location}
                      onChange={handlePostChange}
                      placeholder="e.g., Remote, New York, Hybrid"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Description *</label>
                  <textarea
                    name="description"
                    className="form-control"
                    rows="4"
                    value={postData.description}
                    onChange={handlePostChange}
                    placeholder="Describe the role, responsibilities, and company culture..."
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Requirements (comma separated)</label>
                    <textarea
                      name="requirements"
                      className="form-control"
                      rows="3"
                      value={postData.requirements}
                      onChange={handlePostChange}
                      placeholder="e.g., Bachelor's degree in Computer Science, 3+ years experience in React"
                    />
                    <small className="form-text">
                      Separate requirements with commas
                    </small>
                  </div>

                  <div className="form-group">
                    <label>Skills Required (comma separated) *</label>
                    <input
                      type="text"
                      name="skillsRequired"
                      className="form-control"
                      value={postData.skillsRequired}
                      onChange={handlePostChange}
                      placeholder="e.g., React, Node.js, Python, AWS, Docker"
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Salary/Stipend</label>
                    <input
                      type="text"
                      name="salary"
                      className="form-control"
                      value={postData.salary}
                      onChange={handlePostChange}
                      placeholder="e.g., $120,000/year, $25/hour, Competitive"
                    />
                  </div>

                  <div className="form-group">
                    <label>Application Deadline *</label>
                    <input
                      type="date"
                      name="deadline"
                      className="form-control"
                      value={postData.deadline}
                      onChange={handlePostChange}
                      required
                      min={new Date().toISOString().split("T")[0]}
                    />
                    <small className="form-text">
                      Applications will close on this date
                    </small>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Industry</label>
                    <input
                      type="text"
                      name="industry"
                      className="form-control"
                      value={postData.industry}
                      onChange={handlePostChange}
                      placeholder="e.g., Technology, Finance, Healthcare"
                    />
                  </div>

                  <div className="form-group">
                    <label>Tags (comma separated)</label>
                    <input
                      type="text"
                      name="tags"
                      className="form-control"
                      value={postData.tags}
                      onChange={handlePostChange}
                      placeholder="e.g., remote, entry-level, startup"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Experience Level</label>
                    <select
                      name="experienceLevel"
                      className="form-control"
                      value={postData.experienceLevel}
                      onChange={handlePostChange}
                    >
                      <option value="entry">Entry Level</option>
                      <option value="mid">Mid Level</option>
                      <option value="senior">Senior Level</option>
                    </select>
                  </div>

                  <div className="form-group form-check">
                    <label className="form-check-label">
                      <input
                        type="checkbox"
                        name="remote"
                        className="form-check-input"
                        checked={postData.remote}
                        onChange={handlePostChange}
                      />{" "}
                      Remote Work Available
                    </label>
                  </div>
                </div>

                <div className="form-actions">
                  <button type="submit" className="btn btn-primary btn-lg">
                    <FaBriefcase /> Post Opportunity
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setActiveTab("opportunities")}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === "profile" && (
            <div className="profile-section">
              <h2>My Profile</h2>
              <div className="profile-container">
                <div className="profile-card card">
                  <div className="profile-header">
                    <div className="profile-avatar">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="profile-info">
                      <h3>{user.name}</h3>
                      <p className="profile-role">
                        <FaGraduationCap /> Alumni - {user.department}
                      </p>
                      <p className="profile-company">
                        <FaBuilding /> {user.company || "Not specified"}
                      </p>
                    </div>
                  </div>

                  <div className="profile-details">
                    <div className="detail-item">
                      <strong>Email:</strong>
                      <span>{user.email}</span>
                    </div>
                    <div className="detail-item">
                      <strong>Phone:</strong>
                      <span>{user.phone || "Not provided"}</span>
                    </div>
                    <div className="detail-item">
                      <strong>Department:</strong>
                      <span>{user.department}</span>
                    </div>
                    <div className="detail-item">
                      <strong>Batch:</strong>
                      <span>{user.batch}</span>
                    </div>
                    <div className="detail-item">
                      <strong>Company:</strong>
                      <span>{user.company || "Not specified"}</span>
                    </div>
                    <div className="detail-item">
                      <strong>Position:</strong>
                      <span>{user.position || "Not specified"}</span>
                    </div>
                    <div className="detail-item">
                      <strong>Experience:</strong>
                      <span>{user.experience || "0"} years</span>
                    </div>
                    <div className="detail-item">
                      <strong>Location:</strong>
                      <span>
                        {user.location?.city || "Not specified"}
                        {user.location?.country
                          ? `, ${user.location.country}`
                          : ""}
                      </span>
                    </div>
                    <div className="detail-item">
                      <strong>Open to Mentoring:</strong>
                      <span>{user.openToMentoring ? "Yes" : "No"}</span>
                    </div>
                    {user.openToMentoring && (
                      <div className="detail-item">
                        <strong>Mentoring Capacity:</strong>
                        <span>{user.mentoringCapacity || 0} students</span>
                      </div>
                    )}
                  </div>

                  {user.skills && user.skills.length > 0 && (
                    <div className="profile-skills">
                      <h4>Skills</h4>
                      <div className="skill-tags">
                        {user.skills.map((skill, index) => (
                          <span key={index} className="skill-tag">
                            {typeof skill === "object" ? skill.name : skill}
                            {typeof skill === "object" && skill.level && (
                              <span className="skill-level">
                                {" "}
                                ({skill.level})
                              </span>
                            )}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="profile-stats">
                    <div className="stat-item">
                      <strong>{opportunities.length}</strong>
                      <span>Opportunities Posted</span>
                    </div>
                    <div className="stat-item">
                      <strong>{connectionRequests.length}</strong>
                      <span>Connection Requests</span>
                    </div>
                    <div className="stat-item">
                      <strong>{conversations.length}</strong>
                      <span>Conversations</span>
                    </div>
                    <div className="stat-item">
                      <strong>
                        {events.filter(isRegisteredForEvent).length}
                      </strong>
                      <span>Events Registered</span>
                    </div>
                  </div>

                  <div className="profile-actions">
                    <button className="btn btn-primary">Edit Profile</button>
                    <button className="btn btn-outline-secondary">
                      Update Skills
                    </button>
                  </div>
                </div>

                <div className="profile-sidebar">
                  <div className="sidebar-card card">
                    <h4>Quick Stats</h4>
                    <div className="sidebar-stats">
                      <div className="sidebar-stat">
                        <span className="stat-label">Total Applications</span>
                        <span className="stat-value">
                          {opportunities.reduce(
                            (total, opp) =>
                              total + (opp.applications?.length || 0),
                            0,
                          )}
                        </span>
                      </div>
                      <div className="sidebar-stat">
                        <span className="stat-label">Profile Views</span>
                        <span className="stat-value">
                          {user.profileViews || 0}
                        </span>
                      </div>
                      <div className="sidebar-stat">
                        <span className="stat-label">Connections</span>
                        <span className="stat-value">
                          {user.connections?.length || 0}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="sidebar-card card">
                    <h4>Quick Links</h4>
                    <div className="sidebar-links">
                      <button
                        className="btn btn-link"
                        onClick={() => setActiveTab("post")}
                      >
                        <FaBriefcase /> Post New Opportunity
                      </button>
                      <button
                        className="btn btn-link"
                        onClick={() => setActiveTab("connections")}
                      >
                        <FaUser /> View Connection Requests
                      </button>
                      <button
                        className="btn btn-link"
                        onClick={() => setActiveTab("messages")}
                      >
                        <FaComments /> Check Messages
                      </button>
                      <button
                        className="btn btn-link"
                        onClick={() => setActiveTab("events")}
                      >
                        <FaCalendarAlt /> Browse Events
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AlumniDashboard;
