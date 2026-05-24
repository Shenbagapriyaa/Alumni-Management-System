// src/components/AdminDashboard.js
import React, { useState, useEffect, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import axios from "axios";
import "./AdminDashboard.css";
import {
  FaUsers,
  FaUserGraduate,
  FaClock,
  FaChartLine,
  FaCalendarAlt,
  FaGraduationCap,
  FaUserCheck,
  FaUserTimes,
  FaBriefcase,
  FaHandshake,
  FaChartBar,
  FaCalendarCheck,
  FaDownload,
  FaSync,
  FaEdit,
  FaTrash,
  FaEye,
  FaFilter,
} from "react-icons/fa";

const API_URL = "http://localhost:5000/api";

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [pendingUsers, setPendingUsers] = useState([]);
  const [students, setStudents] = useState([]);
  const [alumni, setAlumni] = useState([]);
  const [duplicates, setDuplicates] = useState([]);
  const [finalYearStudents, setFinalYearStudents] = useState([]);
  const [events, setEvents] = useState([]);
  const [insights, setInsights] = useState(null);
  const [cachedInsights, setCachedInsights] = useState(null);
  const [editingEvent, setEditingEvent] = useState(null);
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalAlumni: 0,
    pendingVerifications: 0,
    graduatedThisYear: 0,
    activeMentorships: 0,
    opportunitiesPosted: 0,
  });
  const [loading, setLoading] = useState(true);
  const [eventForm, setEventForm] = useState({
    title: "",
    description: "",
    date: "",
    time: "",
    type: "webinar",
    speakerId: "",
    maxAttendees: "",
  });
  const [filters, setFilters] = useState({
    department: "all",
    batch: "2024",
    confidence: "all",
  });
  const { user } = useContext(AuthContext);

  useEffect(() => {
    if (user && user.role === "admin") {
      fetchData();
    }
  }, [user, activeTab, filters]);

  useEffect(() => {
    if (activeTab === "insights" && !cachedInsights) {
      fetchInsights();
    }
  }, [activeTab]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      // Fetch stats
      const statsRes = await axios.get(`${API_URL}/admin/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStats(statsRes.data);

      let response;
      if (activeTab === "pending") {
        response = await axios.get(`${API_URL}/admin/pending-approvals`, {
          headers: { Authorization: `Bearer ${token}` },
          params: {
            department:
              filters.department !== "all" ? filters.department : undefined,
            confidence:
              filters.confidence !== "all" ? filters.confidence : undefined,
          },
        });
        setPendingUsers(response.data);
      } else if (activeTab === "students") {
        response = await axios.get(`${API_URL}/admin/students`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setStudents(response.data);
      } else if (activeTab === "alumni") {
        response = await axios.get(`${API_URL}/admin/alumni`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setAlumni(response.data);
      } else if (activeTab === "duplicates") {
        response = await axios.get(`${API_URL}/admin/duplicates`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setDuplicates(response.data);
      } else if (activeTab === "graduation") {
        response = await axios.get(`${API_URL}/admin/final-year-students`, {
          headers: { Authorization: `Bearer ${token}` },
          params: {
            department:
              filters.department !== "all" ? filters.department : undefined,
            batch: filters.batch,
          },
        });
        setFinalYearStudents(response.data);
      } else if (activeTab === "events") {
        response = await axios.get(`${API_URL}/admin/events`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setEvents(response.data);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchInsights = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API_URL}/admin/insights`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setInsights(response.data);
      setCachedInsights(response.data);
    } catch (error) {
      console.error("Error fetching insights:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (userId, action) => {
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `${API_URL}/admin/approve-student/${userId}`,
        { action },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      fetchData();
      alert(
        `Student ${action === "approve" ? "approved" : "rejected"} successfully!`,
      );
    } catch (error) {
      console.error("Error updating approval:", error);
      alert("Error: " + (error.response?.data?.message || error.message));
    }
  };

  const handleGraduate = async (studentId) => {
    if (
      window.confirm("Are you sure you want to mark this student as graduated?")
    ) {
      try {
        const token = localStorage.getItem("token");
        await axios.post(
          `${API_URL}/admin/graduate-student/${studentId}`,
          {},
          { headers: { Authorization: `Bearer ${token}` } },
        );
        alert("Student marked as graduated successfully!");
        fetchData();
      } catch (error) {
        console.error("Error graduating student:", error);
        alert("Error: " + error.response?.data?.message);
      }
    }
  };

  const handleBulkGraduation = async () => {
    const selectedStudents = finalYearStudents.filter(
      (student) => student.selected && student.eligibleForGraduation,
    );

    if (selectedStudents.length === 0) {
      alert("Please select at least one eligible student.");
      return;
    }

    if (
      window.confirm(`Graduate ${selectedStudents.length} selected students?`)
    ) {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.post(
          `${API_URL}/admin/bulk-graduate`,
          { studentIds: selectedStudents.map((s) => s._id) },
          { headers: { Authorization: `Bearer ${token}` } },
        );

        const successfulCount = response.data.successful?.length || 0;
        alert(`${successfulCount} students graduated successfully!`);
        fetchData();
      } catch (error) {
        console.error("Error in bulk graduation:", error);
        alert("Error: " + (error.response?.data?.message || error.message));
      }
    }
  };

  const handleMergeAccounts = async (primaryId, duplicateId) => {
    if (window.confirm("Merge these accounts? This cannot be undone.")) {
      try {
        const token = localStorage.getItem("token");
        await axios.post(
          `${API_URL}/admin/merge-accounts`,
          { primaryId, duplicateId },
          { headers: { Authorization: `Bearer ${token}` } },
        );
        alert("Accounts merged successfully!");
        fetchData();
      } catch (error) {
        console.error("Error merging accounts:", error);
        alert("Error: " + (error.response?.data?.message || error.message));
      }
    }
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      await axios.post(`${API_URL}/admin/events`, eventForm, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert("Event created successfully!");
      setEventForm({
        title: "",
        description: "",
        date: "",
        time: "",
        type: "webinar",
        speakerId: "",
        maxAttendees: "",
      });
      fetchData();
    } catch (error) {
      console.error("Error creating event:", error);
      alert("Error: " + (error.response?.data?.message || error.message));
    }
  };

  const handleUpdateEvent = async (eventId, updatedData) => {
    try {
      const token = localStorage.getItem("token");
      await axios.put(`${API_URL}/admin/events/${eventId}`, updatedData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert("Event updated successfully!");
      setEditingEvent(null);
      fetchData();
    } catch (error) {
      alert("Error: " + (error.response?.data?.message || error.message));
    }
  };

  const handleDeleteEvent = async (eventId) => {
    if (window.confirm("Are you sure you want to delete this event?")) {
      try {
        const token = localStorage.getItem("token");
        await axios.delete(`${API_URL}/admin/events/${eventId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        alert("Event deleted successfully!");
        fetchData();
      } catch (error) {
        alert("Error: " + (error.response?.data?.message || error.message));
      }
    }
  };

  const handleDeactivateAlumni = async (alumniId, action) => {
    if (window.confirm(`Are you sure you want to ${action} this alumni?`)) {
      try {
        const token = localStorage.getItem("token");
        await axios.post(
          `${API_URL}/admin/alumni/${alumniId}/${action}`,
          {},
          { headers: { Authorization: `Bearer ${token}` } },
        );
        alert(`Alumni ${action}d successfully!`);
        fetchData();
      } catch (error) {
        alert("Error: " + (error.response?.data?.message || error.message));
      }
    }
  };

  const handleDownloadReport = async (type) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API_URL}/admin/reports/${type}`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: "blob",
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${type}-report-${Date.now()}.json`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      alert("Error downloading report: " + error.message);
    }
  };

  const handleSelectAllStudents = (checked) => {
    setFinalYearStudents(
      finalYearStudents.map((student) => ({
        ...student,
        selected: checked,
      })),
    );
  };

  const handleStudentSelection = (studentId) => {
    setFinalYearStudents(
      finalYearStudents.map((student) =>
        student._id === studentId
          ? { ...student, selected: !student.selected }
          : student,
      ),
    );
  };

  const handleFilterChange = (filterName, value) => {
    setFilters((prev) => ({
      ...prev,
      [filterName]: value,
    }));
  };

  if (!user || user.role !== "admin") {
    return <div className="card">Access Denied. Admin only.</div>;
  }

  const getConfidenceColor = (score) => {
    if (score >= 80) return "success";
    if (score >= 60) return "warning";
    return "danger";
  };

  const getStatusClass = (status) => {
    if (!status) return "status-active";
    switch (status.toLowerCase()) {
      case "active":
        return "status-active";
      case "inactive":
        return "status-inactive";
      case "pending":
        return "status-pending";
      case "graduated":
        return "status-graduated";
      case "rejected":
        return "status-rejected";
      default:
        return "status-active";
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="admin-dashboard">
      <h1>Admin Dashboard</h1>

      <div className="tabs">
        <button
          className={`tab-btn ${activeTab === "overview" ? "active" : ""}`}
          onClick={() => setActiveTab("overview")}
        >
          <FaChartBar /> Overview
        </button>
        <button
          className={`tab-btn ${activeTab === "pending" ? "active" : ""}`}
          onClick={() => setActiveTab("pending")}
        >
          <FaClock /> Pending Approvals ({stats.pendingVerifications})
        </button>
        <button
          className={`tab-btn ${activeTab === "duplicates" ? "active" : ""}`}
          onClick={() => setActiveTab("duplicates")}
        >
          <FaUserCheck /> Duplicate Detection
        </button>
        <button
          className={`tab-btn ${activeTab === "graduation" ? "active" : ""}`}
          onClick={() => setActiveTab("graduation")}
        >
          <FaGraduationCap /> Graduation Management
        </button>
        <button
          className={`tab-btn ${activeTab === "students" ? "active" : ""}`}
          onClick={() => setActiveTab("students")}
        >
          <FaUsers /> Students ({stats.totalStudents})
        </button>
        <button
          className={`tab-btn ${activeTab === "alumni" ? "active" : ""}`}
          onClick={() => setActiveTab("alumni")}
        >
          <FaUserGraduate /> Alumni ({stats.totalAlumni})
        </button>
        <button
          className={`tab-btn ${activeTab === "events" ? "active" : ""}`}
          onClick={() => setActiveTab("events")}
        >
          <FaCalendarAlt /> Event Management
        </button>
        {/* <button
          className={`tab-btn ${activeTab === "insights" ? "active" : ""}`}
          onClick={() => setActiveTab("insights")}
        >
          <FaChartLine /> AI Insights
        </button> */}
      </div>

      {loading ? (
        <div className="loading">Loading...</div>
      ) : (
        <div className="tab-content">
          {activeTab === "overview" && (
            <div className="overview">
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-icon">
                    <FaUsers />
                  </div>
                  <div className="stat-info">
                    <h3>Total Students</h3>
                    <p className="stat-number">{stats.totalStudents}</p>
                    <span className="stat-trend up">↑ 12%</span>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">
                    <FaUserGraduate />
                  </div>
                  <div className="stat-info">
                    <h3>Total Alumni</h3>
                    <p className="stat-number">{stats.totalAlumni}</p>
                    <span className="stat-trend up">↑ 8%</span>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">
                    <FaClock />
                  </div>
                  <div className="stat-info">
                    <h3>Pending Verifications</h3>
                    <p className="stat-number">{stats.pendingVerifications}</p>
                    <span className="stat-trend down">↓ 5%</span>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">
                    <FaGraduationCap />
                  </div>
                  <div className="stat-info">
                    <h3>Graduated This Year</h3>
                    <p className="stat-number">{stats.graduatedThisYear}</p>
                    <span className="stat-trend up">↑ 15%</span>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">
                    <FaHandshake />
                  </div>
                  <div className="stat-info">
                    <h3>Active Mentorships</h3>
                    <p className="stat-number">{stats.activeMentorships}</p>
                    <span className="stat-trend up">↑ 20%</span>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">
                    <FaBriefcase />
                  </div>
                  <div className="stat-info">
                    <h3>Opportunities Posted</h3>
                    <p className="stat-number">{stats.opportunitiesPosted}</p>
                    <span className="stat-trend up">↑ 18%</span>
                  </div>
                </div>
              </div>

              <div className="quick-actions">
                <h2>Quick Actions</h2>
                <div className="action-buttons">
                  <button
                    className="btn btn-primary"
                    onClick={() => setActiveTab("pending")}
                  >
                    <FaUserCheck /> Review Pending Approvals
                  </button>
                  <button
                    className="btn btn-secondary"
                    onClick={() => setActiveTab("graduation")}
                  >
                    <FaGraduationCap /> Process Graduations
                  </button>
                  <button
                    className="btn btn-success"
                    onClick={() => setActiveTab("events")}
                  >
                    <FaCalendarAlt /> Create New Event
                  </button>
                  <button
                    className="btn btn-info"
                    onClick={() => setActiveTab("insights")}
                  >
                    <FaChartLine /> View AI Insights
                  </button>
                  <button
                    className="btn btn-warning"
                    onClick={() => handleDownloadReport("overview")}
                  >
                    <FaDownload /> Download Report
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "pending" && (
            <div className="pending-approvals">
              <h2>Pending Student Approvals</h2>
              <div className="filters">
                <div className="filter-group">
                  <FaFilter />
                  <select
                    value={filters.department}
                    onChange={(e) =>
                      handleFilterChange("department", e.target.value)
                    }
                  >
                    <option value="all">All Departments</option>
                    <option value="Computer Science">Computer Science</option>
                    <option value="Electronics">Electronics</option>
                    <option value="Mechanical">Mechanical</option>
                    <option value="Civil">Civil</option>
                    <option value="Electrical">Electrical</option>
                  </select>
                </div>
                <div className="filter-group">
                  <FaFilter />
                  <select
                    value={filters.confidence}
                    onChange={(e) =>
                      handleFilterChange("confidence", e.target.value)
                    }
                  >
                    <option value="all">All Confidence Levels</option>
                    <option value="high">High (80-100%)</option>
                    <option value="medium">Medium (60-79%)</option>
                    <option value="low">Low (Below 60%)</option>
                  </select>
                </div>
              </div>
              {pendingUsers.length === 0 ? (
                <div className="no-data">
                  <p>No pending approvals</p>
                </div>
              ) : (
                <div className="approval-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Register No</th>
                        <th>Email</th>
                        <th>Department</th>
                        <th>AI Confidence</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingUsers.map((user) => (
                        <tr
                          key={user._id}
                          className={`confidence-${getConfidenceColor(
                            user.aiConfidence || 0,
                          )}`}
                        >
                          <td>{user.name}</td>
                          <td>{user.registerNumber}</td>
                          <td>{user.email}</td>
                          <td>{user.department}</td>
                          <td>
                            <div
                              className={`confidence-badge ${getConfidenceColor(
                                user.aiConfidence || 0,
                              )}`}
                            >
                              {user.aiConfidence || "N/A"}%
                            </div>
                          </td>
                          <td>
                            <span className="status-pending">Pending</span>
                          </td>
                          <td>
                            <div className="action-buttons">
                              <button
                                className="btn btn-sm btn-success"
                                onClick={() =>
                                  handleApprove(user._id, "approve")
                                }
                              >
                                ✅ Approve
                              </button>
                              <button
                                className="btn btn-sm btn-danger"
                                onClick={() =>
                                  handleApprove(user._id, "reject")
                                }
                              >
                                ❌ Reject
                              </button>
                              <button className="btn btn-sm btn-info">
                                <FaEye /> View
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === "duplicates" && (
            <div className="duplicate-detection">
              <h2>AI Duplicate Detection</h2>
              <div className="ai-info">
                <div className="ai-badge">
                  <FaUserCheck /> AI-Powered Detection
                </div>
                <p>
                  The AI has detected potential duplicate accounts based on
                  email patterns, register numbers, and names.
                </p>
              </div>
              {duplicates.length === 0 ? (
                <div className="no-data">
                  <p>No duplicate accounts detected</p>
                </div>
              ) : (
                <div className="duplicates-list">
                  {duplicates.map((dup, index) => (
                    <div key={index} className="duplicate-item card">
                      <div className="duplicate-header">
                        <h3>
                          Duplicate Group #{index + 1} -{" "}
                          {dup.similarity.toFixed(1)}% Similarity
                        </h3>
                        <span className="duplicate-count">
                          {dup.accounts.length} accounts
                        </span>
                      </div>
                      <div className="matching-fields">
                        <strong>Matching Fields:</strong>{" "}
                        {dup.matchingFields.join(", ")}
                      </div>
                      <div className="accounts-grid">
                        {dup.accounts.map((account, accIndex) => (
                          <div key={accIndex} className="account-card">
                            <h4>{account.name}</h4>
                            <p>
                              <strong>Email:</strong> {account.email}
                            </p>
                            <p>
                              <strong>Reg No:</strong> {account.registerNumber}
                            </p>
                            <p>
                              <strong>Department:</strong> {account.department}
                            </p>
                            <p>
                              <strong>Batch:</strong> {account.batch}
                            </p>
                            <div className="account-actions">
                              {accIndex === 0 ? (
                                <span className="primary-account">Primary</span>
                              ) : (
                                <button
                                  className="btn btn-sm btn-primary"
                                  onClick={() =>
                                    handleMergeAccounts(
                                      dup.accounts[0]._id,
                                      account._id,
                                    )
                                  }
                                >
                                  Merge
                                </button>
                              )}
                              <button
                                className="btn btn-sm btn-danger"
                                onClick={() =>
                                  handleApprove(account._id, "reject")
                                }
                              >
                                Delete
                              </button>
                              <button className="btn btn-sm btn-info">
                                <FaEye /> View
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "graduation" && (
            <div className="graduation-management">
              <h2>Graduation Management</h2>
              <div className="graduation-header">
                <div className="ai-suggestion">
                  <FaChartLine /> AI suggests{" "}
                  {
                    finalYearStudents.filter((s) => s.eligibleForGraduation)
                      .length
                  }{" "}
                  students are eligible for graduation
                </div>
                <div className="filters">
                  <div className="filter-group">
                    <FaFilter />
                    <select
                      value={filters.department}
                      onChange={(e) =>
                        handleFilterChange("department", e.target.value)
                      }
                    >
                      <option value="all">All Departments</option>
                      <option value="Computer Science">Computer Science</option>
                      <option value="Electronics">Electronics</option>
                      <option value="Mechanical">Mechanical</option>
                      <option value="Civil">Civil</option>
                      <option value="Electrical">Electrical</option>
                    </select>
                  </div>
                  <div className="filter-group">
                    <FaFilter />
                    <select
                      value={filters.batch}
                      onChange={(e) =>
                        handleFilterChange("batch", e.target.value)
                      }
                    >
                      <option value="2024">Batch 2024</option>
                      <option value="2023">Batch 2023</option>
                      <option value="2022">Batch 2022</option>
                      <option value="2021">Batch 2021</option>
                    </select>
                  </div>
                  <button
                    className="btn btn-primary"
                    onClick={handleBulkGraduation}
                  >
                    <FaGraduationCap /> Bulk Graduation
                  </button>
                  <button className="btn btn-secondary" onClick={fetchData}>
                    <FaSync /> Refresh
                  </button>
                </div>
              </div>

              <div className="students-table">
                <table>
                  <thead>
                    <tr>
                      <th>
                        <input
                          type="checkbox"
                          onChange={(e) =>
                            handleSelectAllStudents(e.target.checked)
                          }
                        />{" "}
                        Select All
                      </th>
                      <th>Name</th>
                      <th>Register No</th>
                      <th>Department</th>
                      <th>Batch</th>
                      <th>Status</th>
                      <th>AI Eligibility</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {finalYearStudents.map((student) => (
                      <tr key={student._id}>
                        <td>
                          <input
                            type="checkbox"
                            checked={student.selected || false}
                            onChange={() => handleStudentSelection(student._id)}
                            disabled={!student.eligibleForGraduation}
                          />
                        </td>
                        <td>{student.name}</td>
                        <td>{student.registerNumber}</td>
                        <td>{student.department}</td>
                        <td>{student.batch}</td>
                        <td>
                          <span className={getStatusClass(student.status)}>
                            {student.status}
                          </span>
                        </td>
                        <td>
                          <div
                            className={`eligibility-badge ${
                              student.eligibleForGraduation
                                ? "eligible"
                                : "not-eligible"
                            }`}
                          >
                            {student.eligibleForGraduation
                              ? "✅ Eligible"
                              : "⚠️ Check Required"}
                          </div>
                        </td>
                        <td>
                          <button
                            className="btn btn-sm btn-success"
                            onClick={() => handleGraduate(student._id)}
                            disabled={!student.eligibleForGraduation}
                          >
                            🎓 Graduate
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "events" && (
            <div className="event-management">
              <div className="event-section">
                <h2>{editingEvent ? "Edit Event" : "Create New Event"}</h2>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (editingEvent) {
                      handleUpdateEvent(editingEvent._id, eventForm);
                    } else {
                      handleCreateEvent(e);
                    }
                  }}
                  className="event-form"
                >
                  <div className="form-row">
                    <div className="form-group">
                      <label>Event Title</label>
                      <input
                        type="text"
                        value={eventForm.title}
                        onChange={(e) =>
                          setEventForm({ ...eventForm, title: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Event Type</label>
                      <select
                        value={eventForm.type}
                        onChange={(e) =>
                          setEventForm({ ...eventForm, type: e.target.value })
                        }
                      >
                        <option value="webinar">Webinar</option>
                        <option value="workshop">Workshop</option>
                        <option value="conference">Conference</option>
                        <option value="networking">Networking</option>
                        <option value="career-fair">Career Fair</option>
                      </select>
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Description</label>
                    <textarea
                      value={eventForm.description}
                      onChange={(e) =>
                        setEventForm({
                          ...eventForm,
                          description: e.target.value,
                        })
                      }
                      rows="3"
                      required
                    />
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Date</label>
                      <input
                        type="date"
                        value={eventForm.date}
                        onChange={(e) =>
                          setEventForm({ ...eventForm, date: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Time</label>
                      <input
                        type="time"
                        value={eventForm.time}
                        onChange={(e) =>
                          setEventForm({ ...eventForm, time: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Max Attendees</label>
                      <input
                        type="number"
                        value={eventForm.maxAttendees}
                        onChange={(e) =>
                          setEventForm({
                            ...eventForm,
                            maxAttendees: e.target.value,
                          })
                        }
                        min="1"
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Select Alumni Speaker (Optional)</label>
                    <select
                      value={eventForm.speakerId}
                      onChange={(e) =>
                        setEventForm({
                          ...eventForm,
                          speakerId: e.target.value,
                        })
                      }
                    >
                      <option value="">No Speaker</option>
                      {alumni.slice(0, 10).map((alumnus) => (
                        <option key={alumnus._id} value={alumnus._id}>
                          {alumnus.name} (
                          {alumnus.company || alumnus.position || "Alumni"})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-actions">
                    <button type="submit" className="btn btn-primary">
                      <FaCalendarCheck />{" "}
                      {editingEvent ? "Update Event" : "Create Event"}
                    </button>
                    {editingEvent && (
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => {
                          setEditingEvent(null);
                          setEventForm({
                            title: "",
                            description: "",
                            date: "",
                            time: "",
                            type: "webinar",
                            speakerId: "",
                            maxAttendees: "",
                          });
                        }}
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </form>
              </div>

              <div className="event-section">
                <h2>Upcoming Events</h2>
                <div className="events-grid">
                  {events.map((event) => (
                    <div key={event._id} className="event-card">
                      <div className="event-header">
                        <div className="event-title-section">
                          <h3>{event.title}</h3>
                          <span className={`event-type ${event.type}`}>
                            {event.type}
                          </span>
                        </div>
                        <div className="event-header-actions">
                          <button
                            className="btn btn-sm btn-warning"
                            onClick={() => {
                              setEditingEvent(event);
                              setEventForm({
                                title: event.title,
                                description: event.description,
                                date: event.date.split("T")[0],
                                time: event.time,
                                type: event.type,
                                speakerId: event.speaker?._id || "",
                                maxAttendees: event.maxAttendees || "",
                              });
                            }}
                          >
                            <FaEdit /> Edit
                          </button>
                          <button
                            className="btn btn-sm btn-danger"
                            onClick={() => handleDeleteEvent(event._id)}
                          >
                            <FaTrash /> Delete
                          </button>
                        </div>
                      </div>
                      <p className="event-description">{event.description}</p>
                      <div className="event-details">
                        <p>
                          <FaCalendarAlt /> {formatDate(event.date)} |{" "}
                          {event.time}
                        </p>
                        <p>
                          <strong>Registrations:</strong>{" "}
                          {event.registrations?.length || 0} /{" "}
                          {event.maxAttendees || "Unlimited"}
                        </p>
                        <p>
                          <strong>AI Prediction:</strong>{" "}
                          {/* <span className="prediction-high">
                            {getEventSuccessPrediction(event)}
                          </span> */}
                        </p>
                        {event.speaker && (
                          <p>
                            <strong>Speaker:</strong> {event.speaker.name} (
                            {event.speaker.company || "Alumni"})
                          </p>
                        )}
                      </div>
                      <div className="event-actions">
                        <button className="btn btn-sm btn-info">
                          <FaEye /> View Registrations
                        </button>
                        <button
                          className="btn btn-sm btn-secondary"
                          onClick={() => handleDownloadReport("event")}
                        >
                          <FaDownload /> Download Report
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* {activeTab === "insights" && (
            <div className="ai-insights">
              <h2>AI Insights & Analytics</h2>
              <div className="insights-header">
                <div className="ai-badge">
                  <FaChartLine /> Powered by AI Analytics
                </div>
                <div className="insight-actions">
                  <button
                    className="btn btn-primary"
                    onClick={() => handleDownloadReport("insights")}
                  >
                    <FaDownload /> Download Report
                  </button>
                  <button className="btn btn-secondary" onClick={fetchInsights}>
                    <FaSync /> Refresh Insights
                  </button>
                </div>
              </div>

              {insights && (
                <div className="insights-grid">
                  <div className="insight-card">
                    <h3>Top Career Domains</h3>
                    <div className="domain-list">
                      {insights.topDomains?.map((domain, index) => (
                        <div key={index} className="domain-item">
                          <span className="domain-name">{domain.name}</span>
                          <div className="domain-bar">
                            <div
                              className="domain-fill"
                              style={{ width: `${domain.percentage}%` }}
                            ></div>
                          </div>
                          <span className="domain-percentage">
                            {domain.percentage}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="insight-card">
                    <h3>Skill Demand Trends</h3>
                    <div className="skills-list">
                      {insights.topSkills?.map((skill, index) => (
                        <div key={index} className="skill-item">
                          <span className="skill-name">{skill.name}</span>
                          <span className="skill-demand">
                            {skill.demand}% demand
                          </span>
                          <span
                            className={`skill-trend ${
                              skill.trend === "up" ? "up" : "down"
                            }`}
                          >
                            {skill.trend === "up" ? "↑" : "↓"} {skill.growth}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="insight-card">
                    <h3>Most Active Alumni Departments</h3>
                    <div className="department-list">
                      {insights.activeDepartments?.map((dept, index) => (
                        <div key={index} className="department-item">
                          <span className="dept-name">{dept.name}</span>
                          <div className="dept-stats">
                            <span>{dept.alumniCount} alumni</span>
                            <span>{dept.mentorshipCount} mentorships</span>
                            <span>
                              {dept.opportunitiesPosted} opportunities
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="insight-card">
                    <h3>Student Interest Analysis</h3>
                    <div className="interest-list">
                      {insights.studentInterests?.map((interest, index) => (
                        <div key={index} className="interest-item">
                          <span className="interest-name">{interest.name}</span>
                          <span className="interest-count">
                            {interest.count} students
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )} */}

          {activeTab === "students" && (
            <div className="students-list">
              <h2>All Students</h2>
              <div className="students-grid">
                {students.map((student) => (
                  <div key={student._id} className="student-card card">
                    <h3>{student.name}</h3>
                    <p>
                      <strong>Email:</strong> {student.email}
                    </p>
                    <p>
                      <strong>Register No:</strong> {student.registerNumber}
                    </p>
                    <p>
                      <strong>Department:</strong> {student.department}
                    </p>
                    <p>
                      <strong>Batch:</strong> {student.batch}
                    </p>
                    <p>
                      <strong>Status:</strong>{" "}
                      <span className={getStatusClass(student.status)}>
                        {student.status}
                      </span>
                    </p>
                    <div className="student-actions">
                      <button
                        className="btn btn-primary"
                        onClick={() => handleGraduate(student._id)}
                      >
                        <FaGraduationCap /> Mark as Graduated
                      </button>
                      <button className="btn btn-info">
                        <FaEye /> View Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "alumni" && (
            <div className="alumni-list">
              <h2>All Alumni</h2>
              <div className="alumni-grid">
                {alumni.map((alumnus) => (
                  <div key={alumnus._id} className="alumni-card card">
                    <h3>{alumnus.name}</h3>
                    <p>
                      <strong>Email:</strong> {alumnus.email}
                    </p>
                    <p>
                      <strong>Department:</strong> {alumnus.department}
                    </p>
                    <p>
                      <strong>Batch:</strong> {alumnus.batch}
                    </p>
                    <p>
                      <strong>Company:</strong>{" "}
                      {alumnus.company || "Not specified"}
                    </p>
                    <p>
                      <strong>Experience:</strong> {alumnus.experience || 0}{" "}
                      years
                    </p>
                    <p>
                      <strong>Status:</strong>{" "}
                      <span className={getStatusClass(alumnus.status)}>
                        {alumnus.status || "Active"}
                      </span>
                    </p>
                    <div className="alumni-actions">
                      <button
                        className="btn btn-warning btn-sm"
                        onClick={() =>
                          handleDeactivateAlumni(alumnus._id, "deactivate")
                        }
                      >
                        Deactivate
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() =>
                          handleDeactivateAlumni(alumnus._id, "remove")
                        }
                      >
                        Remove
                      </button>
                      <button className="btn btn-info btn-sm">
                        <FaEye /> View Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
