// src/components/Registration.js
import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import axios from "axios";

const API_URL = "http://localhost:5000/api";

const Registration = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    registerNumber: "",
    department: "",
    batch: new Date().getFullYear(),
    phone: "",
    skills: "",
    interests: "",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const { register } = useContext(AuthContext);
  const navigate = useNavigate();

  const departments = [
    "Computer Science",
    "Information Technology",
    "Electronics",
    "Mechanical",
    "Civil",
    "Electrical",
    "MBA",
    "MCA",
  ];

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    // Check email domain for college email
    if (!formData.email.endsWith("@college.edu")) {
      setError("Please use your college email (@college.edu)");
      return;
    }

    const result = await register({
      ...formData,
      role: "student", // Default role
      status: "pending", // Awaiting verification
    });

    if (result.success) {
      setSuccess(
        "Registration successful! Your account is pending admin approval.",
      );
      setTimeout(() => {
        navigate("/login");
      }, 3000);
    } else {
      setError(result.message);
    }
  };

  return (
    <div className="card">
      <h2>Student Registration</h2>
      <form onSubmit={handleSubmit}>
        <div className="row">
          <div className="form-group">
            <label>Full Name</label>
            <input
              type="text"
              name="name"
              className="form-control"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>College Email</label>
            <input
              type="email"
              name="email"
              className="form-control"
              value={formData.email}
              onChange={handleChange}
              placeholder="name@college.edu"
              required
            />
            <small className="text-muted">Must end with @college.edu</small>
          </div>
        </div>

        <div className="row">
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              name="password"
              className="form-control"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Confirm Password</label>
            <input
              type="password"
              name="confirmPassword"
              className="form-control"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div className="row">
          <div className="form-group">
            <label>Register Number</label>
            <input
              type="text"
              name="registerNumber"
              className="form-control"
              value={formData.registerNumber}
              onChange={handleChange}
              placeholder="e.g., 2021CS001"
              required
            />
          </div>

          <div className="form-group">
            <label>Department</label>
            <select
              name="department"
              className="form-control"
              value={formData.department}
              onChange={handleChange}
              required
            >
              <option value="">Select Department</option>
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="row">
          <div className="form-group">
            <label>Batch Year</label>
            <input
              type="number"
              name="batch"
              className="form-control"
              value={formData.batch}
              onChange={handleChange}
              min="2000"
              max={new Date().getFullYear()}
              required
            />
          </div>

          <div className="form-group">
            <label>Phone Number</label>
            <input
              type="tel"
              name="phone"
              className="form-control"
              value={formData.phone}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label>Skills (comma separated)</label>
          <input
            type="text"
            name="skills"
            className="form-control"
            value={formData.skills}
            onChange={handleChange}
            placeholder="e.g., React, Node.js, Python"
          />
        </div>

        <div className="form-group">
          <label>Career Interests</label>
          <input
            type="text"
            name="interests"
            className="form-control"
            value={formData.interests}
            onChange={handleChange}
            placeholder="e.g., Web Development, Data Science"
          />
        </div>

        {error && <div className="alert alert-danger">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <button type="submit" className="btn btn-primary btn-block">
          Register
        </button>
      </form>
    </div>
  );
};

export default Registration;
