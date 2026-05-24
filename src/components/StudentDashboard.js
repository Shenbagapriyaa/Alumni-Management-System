import React, { useState, useEffect, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import axios from "axios";
import {
  FaLinkedin,
  FaGithub,
  FaEnvelope,
  FaBriefcase,
  FaComments,
  FaPaperPlane,
  FaUser,
  FaBuilding,
  FaGraduationCap,
  FaRobot,
  FaQuestionCircle,
  FaSync,
  FaFilter,
  FaStar,
  FaMapMarkerAlt,
  FaCheckCircle,
  FaTimesCircle,
  FaExclamationCircle,
  FaLightbulb,
  FaFire,
  FaClock,
} from "react-icons/fa";
import "./StudentDashboard.css";

const API_URL = "http://localhost:5000/api";

const StudentDashboard = () => {
  const [activeTab, setActiveTab] = useState("alumni");
  const [smartRecommendations, setSmartRecommendations] = useState([]);
  const [opportunities, setOpportunities] = useState([]);
  const [alumniProfiles, setAlumniProfiles] = useState([]);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [selectedAlumni, setSelectedAlumni] = useState(null);
  const [connectionRequest, setConnectionRequest] = useState("");
  const [appliedOpportunities, setAppliedOpportunities] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDepartment, setSelectedDepartment] =
    useState("All Departments");

  // AI Recommendation states
  const [showSmartRecs, setShowSmartRecs] = useState(true);
  const [recLoading, setRecLoading] = useState(false);
  const [matchExplanation, setMatchExplanation] = useState(null);
  const [showExplanationModal, setShowExplanationModal] = useState(false);
  const [recFilter, setRecFilter] = useState("all");
  const [recommendationStats, setRecommendationStats] = useState(null);

  // Opportunity Recommendation states
  const [personalizedOpportunities, setPersonalizedOpportunities] = useState(
    [],
  );
  const [opportunitySuggestions, setOpportunitySuggestions] = useState([]);
  const [activeOpportunityTab, setActiveOpportunityTab] =
    useState("recommended");
  const [opportunityLoading, setOpportunityLoading] = useState(false);

  // Messages state
  const [messages, setMessages] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [newMessage, setNewMessage] = useState("");
  const { user } = useContext(AuthContext);

  useEffect(() => {
    if (user && user.role === "student") {
      fetchDashboardData();
      fetchMessages();
    }
  }, [user, activeTab]);

  useEffect(() => {
    if (user && user.role === "student" && activeTab === "alumni") {
      fetchSmartRecommendations();
    }
  }, [user, activeTab, recFilter]);

  useEffect(() => {
    if (activeTab === "alumni" && !showSmartRecs) {
      fetchAlumniProfiles();
    } else if (activeTab === "messages") {
      fetchConversations();
    }
    fetchNotifications();
    fetchAppliedOpportunities();
  }, [activeTab, showSmartRecs]);

  // Add this useEffect for opportunities tab
  useEffect(() => {
    if (activeTab === "opportunities") {
      fetchPersonalizedOpportunities();
      fetchOpportunitySuggestions("skills");
    }
  }, [activeTab]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      const response = await axios.get(`${API_URL}/student/dashboard`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setOpportunities(response.data.opportunities || []);
      if (response.data.recommendations) {
        setSmartRecommendations(response.data.recommendations);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAlumniProfiles = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const params = {};

      if (searchTerm) {
        params.search = searchTerm;
      }
      if (selectedDepartment !== "All Departments") {
        params.department = selectedDepartment;
      }

      const response = await axios.get(`${API_URL}/alumni/profiles`, {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });

      if (response.data && response.data.alumni) {
        setAlumniProfiles(response.data.alumni);
        checkConnectionStatus(response.data.alumni);
      } else {
        setAlumniProfiles([]);
      }
    } catch (error) {
      console.error("Error fetching alumni profiles:", error);
      setAlumniProfiles([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchSmartRecommendations = async () => {
    try {
      setRecLoading(true);
      const token = localStorage.getItem("token");

      const response = await axios.get(`${API_URL}/student/recommendations`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          limit: 20,
          filter: recFilter,
          refresh: false,
        },
      });

      setSmartRecommendations(response.data.recommendations || []);
      setRecommendationStats(response.data);

      // Track view of recommendations
      if (response.data.recommendations?.length > 0) {
        response.data.recommendations.forEach((rec) => {
          trackInteraction(rec.alumni._id, "recommendation_view");
        });
      }
    } catch (error) {
      console.error("Error fetching smart recommendations:", error);
    } finally {
      setRecLoading(false);
    }
  };

  // Add this function to fetch personalized opportunities
  const fetchPersonalizedOpportunities = async () => {
    try {
      setOpportunityLoading(true);
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${API_URL}/student/opportunities/recommended`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: { limit: 10 },
        },
      );
      setPersonalizedOpportunities(response.data.recommendations || []);
    } catch (error) {
      console.error("Error fetching personalized opportunities:", error);
    } finally {
      setOpportunityLoading(false);
    }
  };

  const fetchOpportunitySuggestions = async (type = "skills") => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${API_URL}/student/opportunities/suggestions`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: { type },
        },
      );
      setOpportunitySuggestions(response.data.suggestions || []);
    } catch (error) {
      console.error("Error fetching opportunity suggestions:", error);
    }
  };

  // Add this function to refresh recommendations
  const refreshOpportunityRecommendations = async () => {
    try {
      setOpportunityLoading(true);
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${API_URL}/student/opportunities/recommended`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: { refresh: true, limit: 10 },
        },
      );
      setPersonalizedOpportunities(response.data.recommendations || []);
    } catch (error) {
      console.error("Error refreshing opportunity recommendations:", error);
    } finally {
      setOpportunityLoading(false);
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

  const fetchMessages = async (alumniId = null) => {
    try {
      const token = localStorage.getItem("token");
      let url = `${API_URL}/messages`;
      if (alumniId) {
        url += `?recipientId=${alumniId}`;
      }

      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessages(response.data);
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  const checkConnectionStatus = async (alumniList) => {
    const token = localStorage.getItem("token");
    const statusMap = {};

    for (const alumni of alumniList) {
      try {
        const response = await axios.get(
          `${API_URL}/connections/status/${alumni._id}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        statusMap[alumni._id] = response.data;
      } catch (error) {
        console.error("Error checking connection status:", error);
        statusMap[alumni._id] = { exists: false, status: null };
      }
    }
    setConnectionStatus(statusMap);
  };

  const fetchAppliedOpportunities = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API_URL}/student/applications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAppliedOpportunities(response.data);
    } catch (error) {
      console.error("Error fetching applications:", error);
    }
  };

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API_URL}/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications(response.data);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  const trackInteraction = async (alumniId, type, details = {}) => {
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `${API_URL}/student/interaction`,
        {
          alumniId,
          type,
          details,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
    } catch (error) {
      console.error("Error tracking interaction:", error);
    }
  };

  const handleConnectRequest = async () => {
    if (!connectionRequest.trim()) {
      alert("Please add a connection message");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `${API_URL}/connections/request`,
        {
          alumniId: selectedAlumni._id,
          message: connectionRequest,
        },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      alert("Connection request sent!");
      setShowConnectModal(false);
      setConnectionRequest("");
      setSelectedAlumni(null);

      setConnectionStatus((prev) => ({
        ...prev,
        [selectedAlumni._id]: { exists: true, status: "pending" },
      }));

      if (showSmartRecs) {
        fetchSmartRecommendations();
      } else {
        fetchAlumniProfiles();
      }
    } catch (error) {
      alert(
        "Error: " +
          (error.response?.data?.message ||
            "Failed to send connection request"),
      );
    }
  };

  const handleSendMessage = async (alumniId, alumniName) => {
    setActiveTab("messages");
    const conversation = {
      _id: alumniId,
      name: alumniName,
      lastMessage: "Start a conversation...",
      timestamp: new Date(),
    };
    setSelectedConversation(conversation);
    fetchMessages(alumniId);
    trackInteraction(alumniId, "message_sent");
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

  const handleApplyOpportunity = async (opportunityId) => {
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `${API_URL}/opportunities/${opportunityId}/apply`,
        {},
        { headers: { Authorization: `Bearer ${token}` } },
      );
      alert("Application submitted successfully!");
      fetchDashboardData();
      fetchAppliedOpportunities();
      // Refresh personalized opportunities after applying
      fetchPersonalizedOpportunities();
    } catch (error) {
      alert("Error: " + (error.response?.data?.message || "Failed to apply"));
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchAlumniProfiles();
  };

  const handleDepartmentChange = (e) => {
    setSelectedDepartment(e.target.value);
  };

  const getConnectionButtonText = (alumniId) => {
    const status = connectionStatus[alumniId];
    if (!status || !status.exists) return "Connect";

    switch (status.status) {
      case "pending":
        return "Request Sent";
      case "accepted":
        return "Connected ✓";
      case "rejected":
        return "Request Rejected";
      default:
        return "Connect";
    }
  };

  const isConnectionDisabled = (alumniId) => {
    const status = connectionStatus[alumniId];
    return status && status.exists && status.status !== "rejected";
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const handleExplainMatch = async (alumniId) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${API_URL}/student/recommendations/${alumniId}/explain`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      setMatchExplanation(response.data);
      setShowExplanationModal(true);
      trackInteraction(alumniId, "recommendation_view", { action: "explain" });
    } catch (error) {
      console.error("Error fetching match explanation:", error);
      alert("Could not load match explanation. Please try again.");
    }
  };

  const refreshRecommendations = async () => {
    try {
      setRecLoading(true);
      const token = localStorage.getItem("token");

      const response = await axios.get(`${API_URL}/student/recommendations`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { refresh: true, limit: 20, filter: recFilter },
      });

      setSmartRecommendations(response.data.recommendations || []);
      setRecommendationStats(response.data);
    } catch (error) {
      console.error("Error refreshing recommendations:", error);
      alert("Failed to refresh recommendations");
    } finally {
      setRecLoading(false);
    }
  };

  const filterRecommendations = (filterType) => {
    setRecFilter(filterType);
  };

  const getMatchScoreColor = (score) => {
    if (score >= 0.8) return "high-match";
    if (score >= 0.6) return "medium-match";
    return "low-match";
  };

  const getMatchLevel = (score) => {
    const percentage = Math.round(score * 100);
    if (percentage >= 80) return "Excellent Match";
    if (percentage >= 60) return "Good Match";
    if (percentage >= 40) return "Fair Match";
    return "Low Match";
  };

  const getMatchQualityIcon = (quality) => {
    switch (quality) {
      case "excellent":
        return <FaStar className="match-icon excellent" />;
      case "good":
        return <FaCheckCircle className="match-icon good" />;
      case "fair":
        return <FaExclamationCircle className="match-icon fair" />;
      default:
        return <FaTimesCircle className="match-icon poor" />;
    }
  };

  const getOpportunityMatchColor = (percentage) => {
    if (percentage >= 80) return "high-match";
    if (percentage >= 60) return "medium-match";
    return "low-match";
  };

  const getOpportunityMatchLevel = (percentage) => {
    if (percentage >= 80) return "Perfect Fit";
    if (percentage >= 60) return "Strong Match";
    if (percentage >= 40) return "Good Match";
    return "Fair Match";
  };

  const renderSkillLevel = (level) => {
    const colors = {
      beginner: "#4CAF50",
      intermediate: "#2196F3",
      advanced: "#FF9800",
      expert: "#F44336",
    };

    return (
      <span className="skill-level" style={{ color: colors[level] || "#666" }}>
        {level?.charAt(0).toUpperCase() + level?.slice(1)}
      </span>
    );
  };

  if (!user || user.role !== "student") {
    return <div className="card">Access Denied. Students only.</div>;
  }

  return (
    <div className="student-dashboard">
      <div className="dashboard-header">
        <div>
          <h1>Welcome, {user.name}!</h1>
          <p className="welcome-subtitle">
            Student Dashboard - {user.department} ({user.batch})
          </p>
        </div>
        <div className="ai-indicator">
          <FaRobot /> AI-Powered Recommendations Active
        </div>
      </div>

      <div className="tabs">
        <button
          className={`tab-btn ${activeTab === "alumni" ? "active" : ""}`}
          onClick={() => setActiveTab("alumni")}
        >
          <FaUser /> Alumni Network
        </button>
        <button
          className={`tab-btn ${activeTab === "opportunities" ? "active" : ""}`}
          onClick={() => setActiveTab("opportunities")}
        >
          <FaBriefcase /> Opportunities
        </button>
        <button
          className={`tab-btn ${activeTab === "messages" ? "active" : ""}`}
          onClick={() => setActiveTab("messages")}
        >
          <FaComments /> Messages
        </button>
      </div>

      {loading ? (
        <div className="loading">Loading...</div>
      ) : (
        <div className="tab-content">
          {activeTab === "alumni" && (
            <div className="alumni-section">
              <div className="section-header-with-controls">
                <div>
                  <h2>Alumni Network</h2>
                  <p className="section-description">
                    {showSmartRecs
                      ? "🤖 AI-powered recommendations based on your profile, skills, and interests"
                      : "Connect with alumni for mentorship and career guidance"}
                  </p>
                </div>

                <div className="recommendation-controls">
                  <div className="toggle-switch">
                    <span className="toggle-label">Smart Recommendations</span>
                    <label className="switch">
                      <input
                        type="checkbox"
                        checked={showSmartRecs}
                        onChange={() => setShowSmartRecs(!showSmartRecs)}
                      />
                      <span className="slider"></span>
                    </label>
                  </div>

                  {showSmartRecs && (
                    <div className="rec-controls-group">
                      <div className="filter-dropdown">
                        <FaFilter />
                        <select
                          value={recFilter}
                          onChange={(e) =>
                            filterRecommendations(e.target.value)
                          }
                          className="form-control-sm"
                        >
                          <option value="all">All Matches</option>
                          <option value="high">High Matches (80%+)</option>
                          <option value="medium">
                            Medium Matches (50-79%)
                          </option>
                          <option value="low">Low Matches (&lt;50%)</option>
                        </select>
                      </div>
                      <button
                        className="btn btn-outline-primary refresh-btn"
                        onClick={refreshRecommendations}
                        disabled={recLoading}
                      >
                        <FaSync /> {recLoading ? "Refreshing..." : "Refresh"}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {showSmartRecs ? (
                <>
                  {recLoading ? (
                    <div className="loading-ai">
                      <FaRobot /> Analyzing alumni profiles for the best
                      matches...
                    </div>
                  ) : smartRecommendations.length === 0 ? (
                    <div className="empty-state">
                      <div className="ai-recommendation-empty">
                        <FaRobot className="ai-icon" />
                        <h3>No AI recommendations found</h3>
                        <p>
                          Try adjusting your filters or browse all alumni
                          profiles
                        </p>
                        <div className="action-buttons">
                          <button
                            className="btn btn-primary"
                            onClick={refreshRecommendations}
                          >
                            Regenerate Recommendations
                          </button>
                          <button
                            className="btn btn-outline-secondary"
                            onClick={() => setShowSmartRecs(false)}
                          >
                            Browse All Alumni
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="smart-recommendations">
                      <div className="recommendation-header">
                        <div className="recommendation-badge">
                          <FaRobot /> AI Recommended •{" "}
                          {smartRecommendations.length} matches found
                        </div>
                        {recommendationStats && (
                          <p className="recommendation-info">
                            Generated on{" "}
                            {new Date(
                              recommendationStats.generatedAt,
                            ).toLocaleDateString()}
                          </p>
                        )}
                      </div>

                      <div className="recommendation-filters">
                        <div className="filter-tags">
                          <span
                            className={`filter-tag ${recFilter === "all" ? "active" : ""}`}
                            onClick={() => filterRecommendations("all")}
                          >
                            All ({smartRecommendations.length})
                          </span>
                          <span
                            className={`filter-tag ${recFilter === "high" ? "active" : ""}`}
                            onClick={() => filterRecommendations("high")}
                          >
                            High Match (
                            {
                              smartRecommendations.filter(
                                (r) => r.similarity >= 0.8,
                              ).length
                            }
                            )
                          </span>
                          <span
                            className={`filter-tag ${recFilter === "medium" ? "active" : ""}`}
                            onClick={() => filterRecommendations("medium")}
                          >
                            Medium Match (
                            {
                              smartRecommendations.filter(
                                (r) =>
                                  r.similarity >= 0.5 && r.similarity < 0.8,
                              ).length
                            }
                            )
                          </span>
                          <span
                            className={`filter-tag ${recFilter === "low" ? "active" : ""}`}
                            onClick={() => filterRecommendations("low")}
                          >
                            Low Match (
                            {
                              smartRecommendations.filter(
                                (r) => r.similarity < 0.5,
                              ).length
                            }
                            )
                          </span>
                        </div>
                      </div>

                      <div className="alumni-profiles-grid">
                        {smartRecommendations.map((rec) => {
                          const matchScore = rec.similarity;
                          const matchPercentage = Math.round(matchScore * 100);
                          const alumni = rec.alumni;

                          return (
                            <div
                              key={alumni._id}
                              className="alumni-profile-card card recommended"
                              onClick={() =>
                                trackInteraction(alumni._id, "profile_view")
                              }
                            >
                              <div className="recommendation-score">
                                <div
                                  className={`match-score ${getMatchScoreColor(matchScore)}`}
                                >
                                  <span className="score-value">
                                    {matchPercentage}%
                                  </span>
                                  <span className="score-label">
                                    {getMatchLevel(matchScore)}
                                  </span>
                                </div>
                                <div className="match-quality">
                                  {getMatchQualityIcon(rec.matchQuality)}
                                  <span className="quality-text">
                                    {rec.matchQuality?.toUpperCase()}
                                  </span>
                                </div>
                                <button
                                  className="explain-btn"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleExplainMatch(alumni._id);
                                  }}
                                  title="Why is this a good match?"
                                >
                                  <FaQuestionCircle />
                                </button>
                              </div>

                              <div className="profile-header">
                                <div className="profile-avatar">
                                  {alumni.name?.charAt(0).toUpperCase() || "A"}
                                </div>
                                <div className="profile-info">
                                  <h3>{alumni.name || "Alumni"}</h3>
                                  <div className="profile-meta">
                                    <span className="alumni-batch">
                                      <FaGraduationCap /> Batch:{" "}
                                      {alumni.batch || "N/A"}
                                    </span>
                                    <span className="alumni-dept">
                                      {alumni.department || "N/A"}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {rec.strengths && rec.strengths.length > 0 && (
                                <div className="match-indicators">
                                  {rec.strengths
                                    .slice(0, 3)
                                    .map((strength, i) => (
                                      <span key={i} className="match-indicator">
                                        {strength.replace("_", " ")}
                                      </span>
                                    ))}
                                  {rec.strengths.length > 3 && (
                                    <span className="match-indicator more">
                                      +{rec.strengths.length - 3} more
                                    </span>
                                  )}
                                </div>
                              )}

                              <div className="profile-details">
                                <div className="detail-item">
                                  <FaBuilding className="detail-icon" />
                                  <div>
                                    <strong>Company:</strong>
                                    <p>{alumni.company || "Not specified"}</p>
                                  </div>
                                </div>

                                <div className="detail-item">
                                  <FaBriefcase className="detail-icon" />
                                  <div>
                                    <strong>Position:</strong>
                                    <p>{alumni.position || "Not specified"}</p>
                                  </div>
                                </div>

                                <div className="detail-item">
                                  <FaBriefcase className="detail-icon" />
                                  <div>
                                    <strong>Experience:</strong>
                                    <p>{alumni.experience || 0} years</p>
                                  </div>
                                </div>

                                {alumni.location?.city && (
                                  <div className="detail-item">
                                    <FaMapMarkerAlt className="detail-icon" />
                                    <div>
                                      <strong>Location:</strong>
                                      <p>
                                        {alumni.location.city},{" "}
                                        {alumni.location.country}
                                      </p>
                                    </div>
                                  </div>
                                )}

                                {alumni.skills && alumni.skills.length > 0 && (
                                  <div className="skills-section">
                                    <strong>Skills:</strong>
                                    <div className="skill-tags">
                                      {alumni.skills
                                        .slice(0, 5)
                                        .map((skill, i) => (
                                          <span key={i} className="skill-tag">
                                            {typeof skill === "object"
                                              ? skill.name
                                              : skill}
                                            {typeof skill === "object" &&
                                              skill.level && (
                                                <span className="skill-level-badge">
                                                  {renderSkillLevel(
                                                    skill.level,
                                                  )}
                                                </span>
                                              )}
                                          </span>
                                        ))}
                                      {alumni.skills.length > 5 && (
                                        <span className="skill-tag more">
                                          +{alumni.skills.length - 5}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>

                              <div className="social-links">
                                {alumni.linkedIn && (
                                  <a
                                    href={alumni.linkedIn}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="social-link"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <FaLinkedin />
                                  </a>
                                )}
                                {alumni.github && (
                                  <a
                                    href={alumni.github}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="social-link"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <FaGithub />
                                  </a>
                                )}
                              </div>

                              <div className="profile-actions">
                                <button
                                  className={`btn ${isConnectionDisabled(alumni._id) ? "btn-secondary" : "btn-primary"}`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (!isConnectionDisabled(alumni._id)) {
                                      setSelectedAlumni(alumni);
                                      setShowConnectModal(true);
                                    }
                                  }}
                                  disabled={isConnectionDisabled(alumni._id)}
                                >
                                  {getConnectionButtonText(alumni._id)}
                                </button>

                                <button
                                  className="btn btn-secondary"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleSendMessage(alumni._id, alumni.name);
                                  }}
                                >
                                  <FaComments /> Message
                                </button>
                              </div>

                              {rec.conversationStarters &&
                                rec.conversationStarters.length > 0 && (
                                  <div className="conversation-starters">
                                    <strong>Suggested icebreakers:</strong>
                                    <p>{rec.conversationStarters[0]}</p>
                                  </div>
                                )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="manual-search-section">
                    <div
                      className="search-toggle"
                      onClick={() => setShowSmartRecs(false)}
                    >
                      <span>🔍 Looking for something specific?</span>
                      <span className="toggle-arrow">Browse all alumni →</span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="manual-search-interface">
                  <div className="network-filters">
                    <form onSubmit={handleSearch} className="search-form">
                      <div className="form-group">
                        <input
                          type="text"
                          placeholder="Search by name, company, or skills"
                          className="form-control search-input"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <button
                          type="submit"
                          className="btn btn-primary search-btn"
                        >
                          Search
                        </button>
                      </div>
                    </form>

                    <div className="filter-group">
                      <select
                        className="form-control department-select"
                        value={selectedDepartment}
                        onChange={handleDepartmentChange}
                      >
                        <option>All Departments</option>
                        <option>Computer Science</option>
                        <option>Electronics</option>
                        <option>Mechanical</option>
                        <option>Civil</option>
                        <option>Electrical</option>
                      </select>
                      <button
                        className="btn btn-secondary filter-btn"
                        onClick={fetchAlumniProfiles}
                      >
                        Filter
                      </button>
                    </div>
                  </div>

                  {alumniProfiles.length === 0 ? (
                    <div className="empty-state">
                      <p>No alumni profiles found.</p>
                      <button
                        className="btn btn-primary"
                        onClick={fetchAlumniProfiles}
                      >
                        Refresh
                      </button>
                    </div>
                  ) : (
                    <div className="alumni-profiles-grid">
                      {alumniProfiles.map((alumni) => (
                        <div
                          key={alumni._id}
                          className="alumni-profile-card card"
                          onClick={() =>
                            trackInteraction(alumni._id, "profile_view")
                          }
                        >
                          <div className="profile-header">
                            <div className="profile-avatar">
                              {alumni.name?.charAt(0).toUpperCase() || "A"}
                            </div>
                            <div className="profile-info">
                              <h3>{alumni.name || "Alumni"}</h3>
                              <div className="profile-meta">
                                <span className="alumni-batch">
                                  <FaGraduationCap /> Batch:{" "}
                                  {alumni.batch || "N/A"}
                                </span>
                                <span className="alumni-dept">
                                  {alumni.department || "N/A"}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="profile-details">
                            <div className="detail-item">
                              <FaBuilding className="detail-icon" />
                              <div>
                                <strong>Company:</strong>
                                <p>{alumni.company || "Not specified"}</p>
                              </div>
                            </div>

                            <div className="detail-item">
                              <FaBriefcase className="detail-icon" />
                              <div>
                                <strong>Position:</strong>
                                <p>{alumni.position || "Not specified"}</p>
                              </div>
                            </div>

                            <div className="detail-item">
                              <FaBriefcase className="detail-icon" />
                              <div>
                                <strong>Experience:</strong>
                                <p>{alumni.experience || 0} years</p>
                              </div>
                            </div>

                            {alumni.location?.city && (
                              <div className="detail-item">
                                <FaMapMarkerAlt className="detail-icon" />
                                <div>
                                  <strong>Location:</strong>
                                  <p>
                                    {alumni.location.city},{" "}
                                    {alumni.location.country}
                                  </p>
                                </div>
                              </div>
                            )}

                            {alumni.skills && alumni.skills.length > 0 && (
                              <div className="skills-section">
                                <strong>Skills:</strong>
                                <div className="skill-tags">
                                  {alumni.skills.slice(0, 5).map((skill, i) => (
                                    <span key={i} className="skill-tag">
                                      {typeof skill === "object"
                                        ? skill.name
                                        : skill}
                                      {typeof skill === "object" &&
                                        skill.level && (
                                          <span className="skill-level-badge">
                                            {renderSkillLevel(skill.level)}
                                          </span>
                                        )}
                                    </span>
                                  ))}
                                  {alumni.skills.length > 5 && (
                                    <span className="skill-tag more">
                                      +{alumni.skills.length - 5}
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="social-links">
                            {alumni.linkedIn && (
                              <a
                                href={alumni.linkedIn}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="social-link"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <FaLinkedin />
                              </a>
                            )}
                            {alumni.github && (
                              <a
                                href={alumni.github}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="social-link"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <FaGithub />
                              </a>
                            )}
                          </div>

                          <div className="profile-actions">
                            <button
                              className={`btn ${isConnectionDisabled(alumni._id) ? "btn-secondary" : "btn-primary"}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (!isConnectionDisabled(alumni._id)) {
                                  setSelectedAlumni(alumni);
                                  setShowConnectModal(true);
                                }
                              }}
                              disabled={isConnectionDisabled(alumni._id)}
                            >
                              {getConnectionButtonText(alumni._id)}
                            </button>

                            <button
                              className="btn btn-secondary"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSendMessage(alumni._id, alumni.name);
                              }}
                            >
                              <FaComments /> Message
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* <div className="smart-search-toggle">
                    <div
                      className="ai-toggle-card"
                      onClick={() => setShowSmartRecs(true)}
                    >
                      <FaRobot className="ai-toggle-icon" />
                    </div>
                  </div> */}
                </div>
              )}
            </div>
          )}

          {activeTab === "opportunities" && (
            <div className="opportunities-section">
              <div className="section-header-with-controls">
                <div>
                  <h2>Opportunities</h2>
                  <p className="section-description">
                    {activeOpportunityTab === "recommended"
                      ? "🤖 AI-recommended opportunities based on your skills and interests"
                      : "Browse all available opportunities"}
                  </p>
                </div>

                <div className="opportunity-tabs">
                  <button
                    className={`tab-btn ${activeOpportunityTab === "recommended" ? "active" : ""}`}
                    onClick={() => setActiveOpportunityTab("recommended")}
                  >
                    <FaRobot /> Recommended for You
                  </button>
                  <button
                    className={`tab-btn ${activeOpportunityTab === "all" ? "active" : ""}`}
                    onClick={() => setActiveOpportunityTab("all")}
                  >
                    <FaBriefcase /> All Opportunities
                  </button>
                </div>
              </div>

              {activeOpportunityTab === "recommended" ? (
                <div className="personalized-opportunities">
                  <div className="recommendation-header">
                    <div className="recommendation-badge">
                      <FaRobot /> AI Recommended •{" "}
                      {personalizedOpportunities.length} matches found
                    </div>
                    <button
                      className="btn btn-outline-primary refresh-btn"
                      onClick={refreshOpportunityRecommendations}
                      disabled={opportunityLoading}
                    >
                      <FaSync />{" "}
                      {opportunityLoading ? "Refreshing..." : "Refresh"}
                    </button>
                  </div>

                  {opportunityLoading ? (
                    <div className="loading-ai">
                      <FaRobot /> Analyzing opportunities for the best
                      matches...
                    </div>
                  ) : personalizedOpportunities.length === 0 ? (
                    <div className="empty-state">
                      <div className="ai-recommendation-empty">
                        <FaRobot className="ai-icon" />
                        <h3>No personalized opportunities found</h3>
                        <p>
                          Complete your profile with skills and interests for
                          better recommendations
                        </p>
                        <div className="action-buttons">
                          <button
                            className="btn btn-primary"
                            onClick={() => setActiveOpportunityTab("all")}
                          >
                            Browse All Opportunities
                          </button>
                          <button
                            className="btn btn-outline-secondary"
                            onClick={refreshOpportunityRecommendations}
                          >
                            Try Again
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="opportunities-list">
                      {personalizedOpportunities.map((item) => {
                        const opp = item.opportunity;
                        const hasApplied = appliedOpportunities.some(
                          (app) => app.opportunity === opp._id,
                        );

                        return (
                          <div
                            key={opp._id}
                            className="opportunity-card card recommended"
                          >
                            <div className="recommendation-score">
                              <div
                                className={`match-score ${getOpportunityMatchColor(item.matchPercentage)}`}
                              >
                                <span className="score-value">
                                  {item.matchPercentage}%
                                </span>
                                <span className="score-label">
                                  {getOpportunityMatchLevel(
                                    item.matchPercentage,
                                  )}
                                </span>
                              </div>
                            </div>

                            <div className="opportunity-header">
                              <div>
                                <h3>{opp.title}</h3>
                                <div className="opportunity-meta">
                                  <span
                                    className={`opportunity-type ${opp.type}`}
                                  >
                                    {opp.type.toUpperCase()}
                                  </span>
                                  <span className="company-name">
                                    {opp.company}
                                  </span>
                                </div>
                              </div>
                              {hasApplied && (
                                <span className="application-status applied">
                                  Applied ✓
                                </span>
                              )}
                            </div>

                            <div className="opportunity-details">
                              <div className="detail-row">
                                <div className="detail-item">
                                  <strong>Location:</strong>
                                  <span>{opp.location || "Remote"}</span>
                                </div>
                                <div className="detail-item">
                                  <strong>Posted by:</strong>
                                  <span>{opp.postedBy?.name || "Alumni"}</span>
                                </div>
                              </div>

                              <div className="opportunity-description">
                                <p>{opp.description}</p>
                              </div>

                              {item.matchedSkills &&
                                item.matchedSkills.length > 0 && (
                                  <div className="matched-skills">
                                    <strong>
                                      <FaLightbulb /> Matched Skills:
                                    </strong>
                                    <div className="skill-tags">
                                      {item.matchedSkills.map((skill, i) => (
                                        <span
                                          key={i}
                                          className="skill-tag highlighted"
                                        >
                                          {skill.skill}
                                          <span className="skill-match-badge">
                                            {skill.matchType === "exact"
                                              ? "✓"
                                              : "~"}
                                          </span>
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}

                              {item.matchedInterests &&
                                item.matchedInterests.length > 0 && (
                                  <div className="matched-interests">
                                    <strong>
                                      <FaFire /> Matched Interests:
                                    </strong>
                                    <div className="interest-tags">
                                      {item.matchedInterests.map(
                                        (interest, i) => (
                                          <span
                                            key={i}
                                            className="interest-tag"
                                          >
                                            {interest.interest}
                                          </span>
                                        ),
                                      )}
                                    </div>
                                  </div>
                                )}

                              {opp.skillsRequired &&
                                opp.skillsRequired.length > 0 && (
                                  <div className="skill-tags">
                                    <strong>Required Skills:</strong>
                                    {opp.skillsRequired.map((skill, i) => (
                                      <span key={i} className="skill-tag">
                                        {skill}
                                      </span>
                                    ))}
                                  </div>
                                )}

                              {item.breakdown && (
                                <div className="score-breakdown">
                                  <strong>
                                     Match Breakdown:
                                  </strong>
                                  <div className="breakdown-bars">
                                    <div className="breakdown-item">
                                      <span className="breakdown-label">
                                        Skills:{" "}
                                        {Math.round(
                                          item.breakdown.skillMatch.score * 100,
                                        )}
                                        %
                                      </span>
                                      <div className="breakdown-bar">
                                        <div
                                          className="breakdown-fill"
                                          style={{
                                            width: `${item.breakdown.skillMatch.score * 100}%`,
                                          }}
                                        ></div>
                                      </div>
                                    </div>
                                    <div className="breakdown-item">
                                      <span className="breakdown-label">
                                        Interests:{" "}
                                        {Math.round(
                                          item.breakdown.interestMatch.score *
                                            100,
                                        )}
                                        %
                                      </span>
                                      <div className="breakdown-bar">
                                        <div
                                          className="breakdown-fill"
                                          style={{
                                            width: `${item.breakdown.interestMatch.score * 100}%`,
                                          }}
                                        ></div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>

                            <div className="opportunity-actions">
                              {!hasApplied ? (
                                <button
                                  className="btn btn-primary"
                                  onClick={() =>
                                    handleApplyOpportunity(opp._id)
                                  }
                                >
                                  Apply Now
                                </button>
                              ) : (
                                <button className="btn btn-success" disabled>
                                  ✓ Applied
                                </button>
                              )}
                              <span className="deadline">
                                <FaClock /> Deadline:{" "}
                                {new Date(opp.deadline).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Suggestions Section */}
                  {opportunitySuggestions.length > 0 && (
                    <div className="suggestions-section">
                      <h4>Other opportunities you might like:</h4>
                      <div className="suggestions-grid">
                        {opportunitySuggestions
                          .slice(0, 3)
                          .map((suggestion, index) => {
                            const hasApplied = appliedOpportunities.some(
                              (app) => app.opportunity === suggestion._id,
                            );

                            return (
                              <div key={index} className="suggestion-card">
                                <h5>{suggestion.title}</h5>
                                <p className="company">{suggestion.company}</p>
                                <p className={`type ${suggestion.type}`}>
                                  {suggestion.type}
                                </p>
                                <div className="suggestion-actions">
                                  <button
                                    className="btn btn-sm btn-outline-primary"
                                    onClick={() => {
                                      // You could implement a view details modal here
                                      setActiveOpportunityTab("all");
                                    }}
                                  >
                                    View Details
                                  </button>
                                  {!hasApplied ? (
                                    <button
                                      className="btn btn-sm btn-primary"
                                      onClick={() =>
                                        handleApplyOpportunity(suggestion._id)
                                      }
                                    >
                                      Apply
                                    </button>
                                  ) : (
                                    <button
                                      className="btn btn-sm btn-success"
                                      disabled
                                    >
                                      ✓ Applied
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="all-opportunities">
                  <div className="network-filters">
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        fetchDashboardData();
                      }}
                      className="search-form"
                    >
                      <div className="form-group">
                        <input
                          type="text"
                          placeholder="Search opportunities..."
                          className="form-control search-input"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <button
                          type="submit"
                          className="btn btn-primary search-btn"
                        >
                          Search
                        </button>
                      </div>
                    </form>
                  </div>

                  <div className="opportunities-list">
                    {opportunities.length === 0 ? (
                      <div className="empty-state">
                        <p>No opportunities available at the moment.</p>
                      </div>
                    ) : (
                      opportunities.map((opp) => {
                        const hasApplied = appliedOpportunities.some(
                          (app) => app.opportunity === opp._id,
                        );

                        return (
                          <div key={opp._id} className="opportunity-card card">
                            <div className="opportunity-header">
                              <div>
                                <h3>{opp.title}</h3>
                                <div className="opportunity-meta">
                                  <span
                                    className={`opportunity-type ${opp.type}`}
                                  >
                                    {opp.type.toUpperCase()}
                                  </span>
                                  <span className="company-name">
                                    {opp.company}
                                  </span>
                                </div>
                              </div>
                              {hasApplied && (
                                <span className="application-status applied">
                                  Applied ✓
                                </span>
                              )}
                            </div>

                            <div className="opportunity-details">
                              <div className="detail-row">
                                <div className="detail-item">
                                  <strong>Location:</strong>
                                  <span>{opp.location || "Remote"}</span>
                                </div>
                                <div className="detail-item">
                                  <strong>Posted by:</strong>
                                  <span>{opp.postedBy?.name || "Alumni"}</span>
                                </div>
                              </div>

                              <div className="opportunity-description">
                                <p>{opp.description}</p>
                              </div>

                              {opp.requirements &&
                                opp.requirements.length > 0 && (
                                  <div className="requirements">
                                    <strong>Requirements:</strong>
                                    <ul>
                                      {opp.requirements.map((req, i) => (
                                        <li key={i}>{req}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}

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

                            <div className="opportunity-actions">
                              {!hasApplied ? (
                                <button
                                  className="btn btn-primary"
                                  onClick={() =>
                                    handleApplyOpportunity(opp._id)
                                  }
                                >
                                  Apply Now
                                </button>
                              ) : (
                                <button className="btn btn-success" disabled>
                                  ✓ Applied
                                </button>
                              )}
                              <span className="deadline">
                                <FaClock /> Deadline:{" "}
                                {new Date(opp.deadline).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  <div
                    className="smart-toggle-card"
                    onClick={() => setActiveOpportunityTab("recommended")}
                  >
                    <FaRobot className="ai-toggle-icon" />
                    <div>
                      <h4>🤖 Want personalized recommendations?</h4>
                      <p>
                        Get opportunities matched to your skills and interests
                      </p>
                    </div>
                    <span className="toggle-arrow">
                      Try Smart Recommendations →
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "messages" && (
            <div className="messages-section">
              <div className="messages-container">
                <div className="conversations-list">
                  <div className="conversations-header">
                    <h3>Messages</h3>
                  </div>
                  <div className="conversations-items">
                    {conversations.length === 0 ? (
                      <div className="empty-conversations">
                        <p>No conversations yet</p>
                        <p className="text-muted">
                          Start a conversation with alumni from the Alumni
                          Network tab
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
                              {conv.lastMessage || "Start a conversation..."}
                            </p>
                          </div>
                          <div className="conversation-time">
                            {conv.timestamp ? formatTime(conv.timestamp) : ""}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

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
                            <p className="chat-user-status">Online</p>
                          </div>
                        </div>
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
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === "connections" && (
            <div className="connections-section">
              <h2>My Connections</h2>
              <p className="section-description">
                Alumni you are connected with
              </p>
              <div className="connections-list">
                {/* Connections will be loaded here */}
                <p>Connections feature coming soon...</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Connection Modal */}
      {showConnectModal && selectedAlumni && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Connect with {selectedAlumni.name}</h3>
              <button
                className="btn-close"
                onClick={() => {
                  setShowConnectModal(false);
                  setConnectionRequest("");
                  setSelectedAlumni(null);
                }}
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              <div className="alumni-info">
                <p>
                  <strong>Company:</strong>{" "}
                  {selectedAlumni.company || "Not specified"}
                </p>
                <p>
                  <strong>Position:</strong>{" "}
                  {selectedAlumni.position || "Not specified"}
                </p>
                <p>
                  <strong>Department:</strong> {selectedAlumni.department}
                </p>
              </div>

              <div className="form-group">
                <label>Your Introduction Message:</label>
                <textarea
                  className="form-control"
                  rows="4"
                  value={connectionRequest}
                  onChange={(e) => setConnectionRequest(e.target.value)}
                  placeholder={`Hi ${selectedAlumni.name}, I'm ${user.name} from ${user.department} department. I'd like to connect with you because...`}
                />
                <small className="form-text">
                  Mention why you want to connect and what you hope to learn.
                </small>
              </div>
            </div>

            <div className="modal-actions">
              <button
                className="btn btn-primary"
                onClick={handleConnectRequest}
              >
                Send Connection Request
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setShowConnectModal(false);
                  setConnectionRequest("");
                  setSelectedAlumni(null);
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Match Explanation Modal */}
      {showExplanationModal && matchExplanation && (
        <div className="modal-overlay">
          <div className="modal match-explanation-modal">
            <div className="modal-header">
              <h3>🤖 Match Explanation</h3>
              <button
                className="btn-close"
                onClick={() => {
                  setShowExplanationModal(false);
                  setMatchExplanation(null);
                }}
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              <div className="match-summary">
                <div className="match-score-large">
                  <div className="score-circle">
                    {Math.round(
                      matchExplanation.recommendation.totalScore * 100,
                    )}
                    %
                  </div>
                  <p>Overall Match Score</p>
                  <div className="match-quality-badge">
                    {getMatchQualityIcon(
                      matchExplanation.recommendation.matchQuality,
                    )}
                    <span>
                      {matchExplanation.recommendation.matchQuality.toUpperCase()}
                    </span>
                  </div>
                </div>

                <div className="match-breakdown">
                  <h4>Why this match?</h4>
                  {matchExplanation.recommendation.strengths?.map(
                    (strength, i) => (
                      <div key={i} className="reason-item">
                        <div className="reason-header">
                          <span className="reason-title">
                            {strength.replace("_", " ").toUpperCase()}
                          </span>
                        </div>
                        <p className="reason-details">
                          {strength === "same_department" &&
                            `Both from ${matchExplanation.student.department} department`}
                          {strength === "skill_match" &&
                            `Shared skills and expertise`}
                          {strength === "career_path" &&
                            `Career interests and goals alignment`}
                          {strength === "location" && `Geographic proximity`}
                          {strength === "company_prestige" &&
                            `Works at a reputable company`}
                          {strength === "mentoring_experience" &&
                            `Open to mentoring students`}
                          {strength === "recent_graduate" &&
                            `Recent graduate with current industry insights`}
                          {strength === "industry_expert" &&
                            `Seasoned industry professional`}
                        </p>
                      </div>
                    ),
                  )}
                </div>
              </div>

              <div className="comparison-table">
                <h4>Comparison Details</h4>
                <table>
                  <thead>
                    <tr>
                      <th>Attribute</th>
                      <th>You</th>
                      <th>Alumni</th>
                      <th>Match Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Department</td>
                      <td>{matchExplanation.student.department}</td>
                      <td>{matchExplanation.alumni.department}</td>
                      <td>
                        <span className="score-badge">
                          {Math.round(
                            matchExplanation.recommendation.breakdown
                              ?.department || 0,
                          )}
                          %
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td>Skills</td>
                      <td>
                        {matchExplanation.student.skills
                          ?.slice(0, 3)
                          .map((s) => (typeof s === "object" ? s.name : s))
                          .join(", ") || "None"}
                      </td>
                      <td>
                        {matchExplanation.alumni.skills
                          ?.slice(0, 3)
                          .map((s) => (typeof s === "object" ? s.name : s))
                          .join(", ") || "None"}
                      </td>
                      <td>
                        <span className="score-badge">
                          {Math.round(
                            matchExplanation.recommendation.breakdown?.skills ||
                              0,
                          )}
                          %
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td>Graduation Year</td>
                      <td>{matchExplanation.student.batch + 4}</td>
                      <td>{matchExplanation.alumni.batch + 4}</td>
                      <td>
                        <span className="score-badge">
                          {Math.round(
                            matchExplanation.recommendation.breakdown
                              ?.yearGap || 0,
                          )}
                          %
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td>Career Path</td>
                      <td>
                        {matchExplanation.student.careerGoals
                          ?.slice(0, 3)
                          .join(", ") || "Not specified"}
                      </td>
                      <td>
                        {matchExplanation.alumni.position || "Not specified"}
                      </td>
                      <td>
                        <span className="score-badge">
                          {Math.round(
                            matchExplanation.recommendation.breakdown?.career ||
                              0,
                          )}
                          %
                        </span>
                      </td>
                    </tr>
                    {matchExplanation.alumni.location?.city && (
                      <tr>
                        <td>Location</td>
                        <td>
                          {matchExplanation.student.location?.city ||
                            "Not specified"}
                        </td>
                        <td>
                          {matchExplanation.alumni.location.city ||
                            "Not specified"}
                        </td>
                        <td>
                          <span className="score-badge">
                            {Math.round(
                              matchExplanation.recommendation.breakdown
                                ?.location || 0,
                            )}
                            %
                          </span>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {matchExplanation.recommendation.conversationStarters && (
                <div className="conversation-starters-modal">
                  <h4>Suggested Conversation Starters</h4>
                  <div className="starter-list">
                    {matchExplanation.recommendation.conversationStarters.map(
                      (starter, i) => (
                        <div key={i} className="starter-item">
                          <p>{starter}</p>
                        </div>
                      ),
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="modal-actions">
              <button
                className="btn btn-primary"
                onClick={() => {
                  setSelectedAlumni({
                    _id: matchExplanation.alumni.id,
                    name: matchExplanation.alumni.name,
                  });
                  setShowConnectModal(true);
                  setShowExplanationModal(false);
                }}
              >
                Connect Now
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setShowExplanationModal(false);
                  setMatchExplanation(null);
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;
