// src/components/Chatbot.js
import React, { useState, useEffect, useRef, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import axios from "axios";
import "./Chatbot.css";
import {
  FaRobot,
  FaTimes,
  FaPaperPlane,
  FaHistory,
  FaTrash,
  FaUser,
  FaBriefcase,
  FaCalendarAlt,
  FaGraduationCap,
  FaCog,
  FaLightbulb,
  FaChevronUp,
  FaChevronDown,
  FaRegSmile,
  FaRegClock,
} from "react-icons/fa";

const API_URL = "http://localhost:5000/api";

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [chatHistory, setChatHistory] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const messagesEndRef = useRef(null);
  const { user } = useContext(AuthContext);

  // Role-based suggestions
  const getRoleBasedSuggestions = () => {
    if (!user) return [];

    const baseSuggestions = [
      { text: "How does this platform work?", icon: <FaLightbulb /> },
      { text: "Find alumni in my department", icon: <FaUser /> },
      { text: "What opportunities are available?", icon: <FaBriefcase /> },
      { text: "Upcoming events", icon: <FaCalendarAlt /> },
    ];

    if (user.role === "student") {
      return [
        ...baseSuggestions,
        { text: "Show me AI recommendations", icon: <FaRobot /> },
        { text: "Check my applications", icon: <FaBriefcase /> },
        { text: "Graduation process", icon: <FaGraduationCap /> },
        { text: "Update my profile", icon: <FaCog /> },
      ];
    } else if (user.role === "alumni") {
      return [
        ...baseSuggestions,
        { text: "Connection requests", icon: <FaUser /> },
        { text: "Post an opportunity", icon: <FaBriefcase /> },
        { text: "Update alumni profile", icon: <FaCog /> },
      ];
    } else if (user.role === "admin") {
      return [
        ...baseSuggestions,
        { text: "Pending approvals", icon: <FaUser /> },
        { text: "System statistics", icon: <FaLightbulb /> },
        { text: "Graduation management", icon: <FaGraduationCap /> },
      ];
    }

    return baseSuggestions;
  };

  useEffect(() => {
    if (isOpen && user) {
      loadChatHistory();
      setSuggestions(getRoleBasedSuggestions());

      // Add welcome message if no messages exist
      if (messages.length === 0) {
        addSystemMessage(getWelcomeMessage());
      }
    }
  }, [isOpen, user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const getWelcomeMessage = () => {
    if (!user) return "Hello! I'm AlumniBot. How can I help you today?";

    let roleSpecific = "";
    switch (user.role) {
      case "student":
        roleSpecific =
          "I can help you find alumni, get recommendations, check opportunities, and more!";
        break;
      case "alumni":
        roleSpecific =
          "I can help you manage connections, post opportunities, and stay updated with events!";
        break;
      case "admin":
        roleSpecific =
          "I can help you manage the platform, view statistics, and handle approvals!";
        break;
      default:
        roleSpecific = "I can help you navigate the alumni platform!";
    }

    return `Hello ${user.name}! 👋 I'm AlumniBot, your AI assistant for the Alumni Management System. ${roleSpecific} What would you like to know?`;
  };

  const addSystemMessage = (text) => {
    const newMessage = {
      id: Date.now(),
      type: "system",
      text,
      timestamp: new Date(),
      sender: "AlumniBot",
      avatar: <FaRobot />,
    };
    setMessages((prev) => [...prev, newMessage]);
  };

  const addUserMessage = (text) => {
    const newMessage = {
      id: Date.now(),
      type: "user",
      text,
      timestamp: new Date(),
      sender: user?.name || "You",
      avatar: <FaUser />,
    };
    setMessages((prev) => [...prev, newMessage]);
  };

  const addBotMessage = (text, data = null) => {
    const newMessage = {
      id: Date.now(),
      type: "bot",
      text,
      timestamp: new Date(),
      sender: "AlumniBot",
      avatar: <FaRobot />,
      data,
    };
    setMessages((prev) => [...prev, newMessage]);
  };

  const loadChatHistory = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API_URL}/chatbot/history`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { limit: 20 },
      });

      if (response.data.success && response.data.history.length > 0) {
        const formattedMessages = response.data.history.map((msg) => ({
          id: msg._id || Date.now(),
          type: msg.role === "user" ? "user" : "bot",
          text: msg.content,
          timestamp: new Date(msg.timestamp),
          sender: msg.role === "user" ? user?.name || "You" : "AlumniBot",
          avatar: msg.role === "user" ? <FaUser /> : <FaRobot />,
        }));
        setMessages(formattedMessages);
      }
    } catch (error) {
      console.error("Error loading chat history:", error);
    }
  };

  const handleSendMessage = async (text = null) => {
    const messageToSend = text || inputMessage.trim();
    if (!messageToSend) return;

    // Add user message
    addUserMessage(messageToSend);

    if (!text) {
      setInputMessage("");
    }

    // Show typing indicator
    setIsTyping(true);

    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `${API_URL}/chatbot/message`,
        { message: messageToSend },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (response.data.success) {
        // Add bot response
        addBotMessage(response.data.response, response.data.data);
      } else {
        addBotMessage(
          "I'm sorry, I couldn't process your request. Please try again.",
        );
      }
    } catch (error) {
      console.error("Error sending message to chatbot:", error);
      addBotMessage(
        "I'm having trouble connecting to the server. Please try again later.",
      );
    } finally {
      setIsTyping(false);
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestionText) => {
    handleSendMessage(suggestionText);
  };

  const handleClearHistory = async () => {
    if (window.confirm("Are you sure you want to clear chat history?")) {
      try {
        const token = localStorage.getItem("token");
        await axios.delete(`${API_URL}/chatbot/history`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        setMessages([]);
        addSystemMessage(getWelcomeMessage());
        setShowSuggestions(true);
      } catch (error) {
        console.error("Error clearing chat history:", error);
        alert("Failed to clear chat history");
      }
    }
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const renderMessageContent = (message) => {
    // Check if message contains markdown-like formatting
    const lines = message.text.split("\n");

    return lines.map((line, index) => {
      // Handle bold text
      if (line.includes("**")) {
        const parts = line.split("**");
        return (
          <p key={index} className="message-line">
            {parts.map((part, i) =>
              i % 2 === 1 ? (
                <strong key={i}>{part}</strong>
              ) : (
                <span key={i}>{part}</span>
              ),
            )}
          </p>
        );
      }

      // Handle lists
      if (line.match(/^\d+\.\s/) || line.match(/^•\s/) || line.match(/^-\s/)) {
        return (
          <p key={index} className="message-line list-item">
            {line}
          </p>
        );
      }

      // Regular text
      return (
        <p key={index} className="message-line">
          {line}
        </p>
      );
    });
  };

  const toggleChat = () => {
    if (isMinimized) {
      setIsMinimized(false);
    } else {
      setIsOpen(!isOpen);
    }
  };

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  if (!isOpen && !isMinimized) {
    return (
      <button className="chatbot-launcher" onClick={toggleChat}>
        <FaRobot />
        <span className="launcher-text">AlumniBot</span>
      </button>
    );
  }

  return (
    <div className={`chatbot-container ${isMinimized ? "minimized" : ""}`}>
      {/* Chat Header */}
      <div className="chatbot-header">
        <div className="header-left">
          <div className="bot-avatar">
            <FaRobot />
          </div>
          <div className="header-info">
            <h3>AlumniBot</h3>
            <p className="bot-status">{isTyping ? "Typing..." : "Online"}</p>
          </div>
        </div>

        <div className="header-actions">
          <button
            className="icon-btn"
            onClick={toggleMinimize}
            title={isMinimized ? "Expand" : "Minimize"}
          >
            {isMinimized ? <FaChevronUp /> : <FaChevronDown />}
          </button>
          <button className="icon-btn" onClick={toggleChat} title="Close">
            <FaTimes />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Chat Body */}
          <div className="chatbot-body">
            {/* Messages */}
            <div className="messages-container">
              {messages.map((message) => (
                <div key={message.id} className={`message ${message.type}`}>
                  <div className="message-avatar">{message.avatar}</div>
                  <div className="message-content">
                    <div className="message-header">
                      <span className="message-sender">{message.sender}</span>
                      <span className="message-time">
                        <FaRegClock /> {formatTime(message.timestamp)}
                      </span>
                    </div>
                    <div className="message-text">
                      {renderMessageContent(message)}
                    </div>
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="message bot">
                  <div className="message-avatar">
                    <FaRobot />
                  </div>
                  <div className="message-content">
                    <div className="typing-indicator">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Suggestions */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="suggestions-container">
                <div className="suggestions-header">
                  <span>Quick suggestions</span>
                  <button
                    className="btn-link"
                    onClick={() => setShowSuggestions(false)}
                  >
                    Hide
                  </button>
                </div>
                <div className="suggestions-grid">
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      className="suggestion-btn"
                      onClick={() => handleSuggestionClick(suggestion.text)}
                    >
                      {suggestion.icon}
                      <span>{suggestion.text}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Chat Footer */}
          <div className="chatbot-footer">
            <div className="input-container">
              <input
                type="text"
                className="chat-input"
                placeholder="Type your message here..."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
              />
              <button
                className="send-btn"
                onClick={() => handleSendMessage()}
                disabled={!inputMessage.trim()}
              >
                <FaPaperPlane />
              </button>
            </div>

            <div className="footer-actions">
              <button
                className="icon-btn"
                onClick={() => setShowSuggestions(!showSuggestions)}
                title="Toggle suggestions"
              >
                <FaLightbulb />
              </button>
              <button
                className="icon-btn"
                onClick={handleClearHistory}
                title="Clear chat history"
              >
                <FaTrash />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Chatbot;
