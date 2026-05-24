const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const app = express();



// Middleware
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  }),
);
app.use(express.json());

// MongoDB Connection
mongoose.connect(
  process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/alumni_db",
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  },
);

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
  console.log("✅ Connected to MongoDB");
});

// Updated User Schema with recommendation fields
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: { type: String, required: true },
  registerNumber: { type: String, unique: true },
  department: { type: String, required: true },
  batch: { type: Number, required: true },
  phone: { type: String },

  // Extended fields for better recommendations
  skills: [
    {
      name: { type: String },
      level: {
        type: String,
        enum: ["beginner", "intermediate", "advanced", "expert"],
        default: "intermediate",
      },
    },
  ],

  interests: [
    {
      category: { type: String },
      topics: [{ type: String }],
    },
  ],

  role: {
    type: String,
    enum: ["admin", "student", "alumni"],
    default: "student",
  },
  status: {
    type: String,
    enum: [
      "active",
      "inactive",
      "pending",
      "approved",
      "rejected",
      "graduated",
    ],
    default: "pending",
  },

  // Career information
  graduationDate: { type: Date },
  currentJob: { type: String },
  company: { type: String },
  position: { type: String },
  experience: { type: Number, default: 0 },

  // Location information
  location: {
    city: { type: String },
    country: { type: String, default: "India" },
  },

  // Education information
  cgpa: { type: Number, min: 0, max: 10 },

  // Social links
  linkedIn: { type: String },
  github: { type: String },
  portfolio: { type: String },

  // AI and recommendation fields
  aiConfidence: { type: Number, default: 0 },
  recommendationScore: { type: Number, default: 0 },

  // Bio and preferences
  bio: { type: String },
  careerGoals: [{ type: String }],
  preferredIndustries: [{ type: String }],

  // Connection preferences
  openToMentoring: { type: Boolean, default: true },
  mentoringCapacity: { type: Number, default: 2, min: 0, max: 5 },

  // Statistics
  profileViews: { type: Number, default: 0 },
  connectionRequestsSent: { type: Number, default: 0 },
  connectionRequestsReceived: { type: Number, default: 0 },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },

  connections: [
    {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      connectedAt: { type: Date, default: Date.now },
      connectionType: {
        type: String,
        enum: ["mentor", "peer", "alumni"],
        default: "alumni",
      },
      relationshipStrength: { type: Number, min: 0, max: 5, default: 1 },
      tags: [{ type: String }],
    },
  ],
});

// Notification Schema
const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  type: {
    type: String,
    enum: ["message", "application", "event", "system", "connection"],
    required: true,
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  relatedTo: { type: mongoose.Schema.Types.ObjectId },
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

// Message Schema
const messageSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  read: { type: Boolean, default: false },
});

// Archived User Schema
const archivedUserSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId },
  name: { type: String },
  email: { type: String },
  department: { type: String },
  batch: { type: Number },
  removedAt: { type: Date, default: Date.now },
  removedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
});

// Connection Request Schema
const connectionSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  alumni: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  message: { type: String },
  status: {
    type: String,
    enum: ["pending", "accepted", "rejected", "cancelled"],
    default: "pending",
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Opportunity Schema
const opportunitySchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  type: { type: String, enum: ["job", "internship"], required: true },
  company: { type: String, required: true },
  location: { type: String },
  postedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  requirements: [{ type: String }],
  skillsRequired: [{ type: String }],
  salary: { type: String },
  deadline: { type: Date },
  status: { type: String, enum: ["open", "closed"], default: "open" },

  // NEW FIELDS FOR OPPORTUNITY RECOMMENDATION
  industry: { type: String }, // Industry classification
  tags: [{ type: String }], // For content-based matching
  experienceLevel: {
    // Entry level, Mid level, Senior
    type: String,
    enum: ["entry", "mid", "senior"],
    default: "entry",
  },
  remote: { type: Boolean, default: false }, // Remote work availability

  applications: [
    {
      applicant: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      appliedAt: { type: Date, default: Date.now },
      status: {
        type: String,
        enum: ["pending", "reviewed", "accepted", "rejected"],
        default: "pending",
      },
      resume: { type: String },
    },
  ],
  createdAt: { type: Date, default: Date.now },
});

// Add indexes for better performance
opportunitySchema.index({ tags: 1 });
opportunitySchema.index({ skillsRequired: 1 });
opportunitySchema.index({ industry: 1 });
opportunitySchema.index({ postedBy: 1 });
opportunitySchema.index({ createdAt: -1 });

// Event Schema
const eventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  type: {
    type: String,
    enum: ["webinar", "workshop", "conference", "networking", "career-fair"],
    required: true,
  },
  date: { type: Date, required: true },
  time: { type: String, required: true },
  speaker: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  maxAttendees: { type: Number },
  registrations: [
    {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      registeredAt: { type: Date, default: Date.now },
    },
  ],
  createdAt: { type: Date, default: Date.now },
});

// Interaction Tracking Schema
const interactionSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  alumni: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  type: {
    type: String,
    enum: [
      "profile_view",
      "connection_request",
      "message_sent",
      "message_received",
      "recommendation_view",
      "application_submitted",
      "event_attended",
    ],
    required: true,
  },
  details: mongoose.Schema.Types.Mixed,
  timestamp: { type: Date, default: Date.now },
  weight: { type: Number, default: 1 },
});

// Enhanced Recommendation Schema
const recommendationSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  alumni: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },

  // Detailed scoring breakdown
  scores: {
    departmentMatch: {
      score: { type: Number, default: 0 },
      weight: { type: Number, default: 0.25 },
      details: { type: mongoose.Schema.Types.Mixed },
    },
    skillsMatch: {
      score: { type: Number, default: 0 },
      weight: { type: Number, default: 0.3 },
      details: {
        commonSkills: [
          {
            name: String,
            studentLevel: String,
            alumniLevel: String,
            matchScore: Number,
          },
        ],
        skillGap: [{ name: String, studentNeeds: Boolean }],
      },
    },
    yearGapScore: {
      score: { type: Number, default: 0 },
      weight: { type: Number, default: 0.2 },
      details: {
        studentGraduationYear: Number,
        alumniGraduationYear: Number,
        gap: Number,
      },
    },
    careerRelevance: {
      score: { type: Number, default: 0 },
      weight: { type: Number, default: 0.15 },
      details: {
        studentInterests: [String],
        alumniPosition: String,
        alumniCompany: String,
        industryMatch: Boolean,
      },
    },
    locationMatch: {
      score: { type: Number, default: 0 },
      weight: { type: Number, default: 0.1 },
      details: {
        studentLocation: String,
        alumniLocation: String,
        sameCity: Boolean,
        sameCountry: Boolean,
      },
    },
    opportunityScore: {
      score: { type: Number, default: 0 },
      weight: { type: Number, default: 0.05 },
      details: {
        companySize: String,
        industryGrowth: String,
        alumniGrowthInCompany: Number,
      },
    },
  },

  totalScore: { type: Number, default: 0 },

  // Match quality indicators
  matchQuality: {
    type: String,
    enum: ["excellent", "good", "fair", "poor"],
    default: "fair",
  },

  // Reasons for recommendation
  strengths: [
    {
      type: String,
      enum: [
        "same_department",
        "skill_match",
        "career_path",
        "location",
        "company_prestige",
        "mentoring_experience",
        "recent_graduate",
        "industry_expert",
      ],
    },
  ],

  // Suggested talking points
  conversationStarters: [String],

  // Connection history
  connectionHistory: {
    views: { type: Number, default: 0 },
    connectionRequests: { type: Number, default: 0 },
    messagesExchanged: { type: Number, default: 0 },
    lastInteraction: Date,
  },

  // Timestamps
  createdAt: { type: Date, default: Date.now },
  lastCalculated: { type: Date, default: Date.now },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  },

  // Ranking
  rank: { type: Number, default: 0 },

  // Metadata
  algorithmVersion: { type: String, default: "2.0" },
  notes: String,
});

// AI Verification Logic
userSchema.statics.aiVerifyStudent = async function (studentData) {
  const { email, registerNumber, name, batch } = studentData;

  // Rule 1: College email validation
  if (!email.endsWith("@college.edu")) {
    return { verified: false, reason: "Invalid college email", confidence: 0 };
  }

  // Rule 2: Register number format validation
  const regNumRegex = /^\d{4}[A-Z]{2}\d{3}$/;
  if (!regNumRegex.test(registerNumber)) {
    return {
      verified: false,
      reason: "Invalid register number format. Use format: 2021CS001",
      confidence: 0,
    };
  }

  // Rule 3: Duplicate detection
  const existingEmail = await this.findOne({ email });
  if (existingEmail) {
    return {
      verified: false,
      reason: "Email already registered",
      requiresManual: true,
      confidence: 30,
    };
  }

  const existingRegNum = await this.findOne({ registerNumber });
  if (existingRegNum) {
    return {
      verified: false,
      reason: "Register number already exists",
      requiresManual: true,
      confidence: 30,
    };
  }

  // Rule 4: Batch consistency
  const currentYear = new Date().getFullYear();
  if (batch < currentYear - 6 || batch > currentYear) {
    return {
      verified: false,
      reason: "Invalid batch year",
      requiresManual: true,
      confidence: 40,
    };
  }

  // Rule 5: Name validation
  if (name.length < 2) {
    return { verified: false, reason: "Invalid name", confidence: 0 };
  }

  // Calculate confidence score
  let confidence = 95;
  const batchDiff = Math.abs(currentYear - batch);
  if (batchDiff > 4) confidence -= 20;
  if (!email.includes(name.split(" ")[0].toLowerCase())) confidence -= 10;

  return { verified: true, confidence: Math.max(50, confidence) };
};

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Create indexes
recommendationSchema.index({ student: 1, totalScore: -1 });
recommendationSchema.index({ student: 1, alumni: 1 }, { unique: true });
recommendationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
interactionSchema.index({ student: 1, alumni: 1, type: 1 });
interactionSchema.index({ timestamp: 1 });

// Create models
const User = mongoose.model("User", userSchema);
const Notification = mongoose.model("Notification", notificationSchema);
const Message = mongoose.model("Message", messageSchema);
const ArchivedUser = mongoose.model("ArchivedUser", archivedUserSchema);
const Connection = mongoose.model("Connection", connectionSchema);
const Opportunity = mongoose.model("Opportunity", opportunitySchema);
const Event = mongoose.model("Event", eventSchema);
const Interaction = mongoose.model("Interaction", interactionSchema);
const Recommendation = mongoose.model("Recommendation", recommendationSchema);

// Helper function for event success prediction
function getEventSuccessPrediction(event) {
  const now = new Date();
  const daysUntilEvent = Math.ceil((event.date - now) / (1000 * 60 * 60 * 24));

  let baseScore = 70;

  if (daysUntilEvent < 7) baseScore += 15;
  if (daysUntilEvent > 30) baseScore -= 10;

  if (event.type === "webinar") baseScore += 10;
  if (event.type === "career-fair") baseScore += 20;

  if (event.speaker) baseScore += 15;

  return baseScore >= 85
    ? "Very High"
    : baseScore >= 70
      ? "High"
      : baseScore >= 55
        ? "Medium"
        : "Low";
}

// Authentication Middleware
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "Access token required" });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "your-secret-key",
    );
    req.user = await User.findById(decoded.userId).select("-password");

    if (!req.user) {
      return res.status(401).json({ message: "User not found" });
    }

    next();
  } catch (error) {
    return res.status(403).json({ message: "Invalid token" });
  }
};

// Enhanced Smart Recommendation Engine Class
class EnhancedRecommendationEngine {
  constructor() {
    this.config = {
      weights: {
        department: 0.25,
        skills: 0.3,
        yearGap: 0.2,
        career: 0.15,
        location: 0.07,
        opportunity: 0.03,
      },
      thresholds: {
        minScore: 0.3,
        maxRecommendations: 15,
        cacheTTL: 24 * 60 * 60 * 1000,
        refreshThreshold: 0.8,
      },
      scoring: {
        departmentExactMatch: 1.0,
        departmentRelatedMatch: 0.7,
        skillLevelMultipliers: {
          beginner: 0.5,
          intermediate: 0.8,
          advanced: 1.0,
          expert: 1.2,
        },
        yearGapPenalty: 0.15,
        maxYearGap: 15,
        locationBonus: {
          sameCity: 0.8,
          sameCountry: 0.5,
          sameRegion: 0.3,
        },
        companyPrestige: {
          faang: 1.3,
          unicorn: 1.2,
          fortune500: 1.1,
          startup: 0.9,
          msme: 0.8,
        },
      },
      departments: {
        computerScience: [
          "Computer Science",
          "IT",
          "Software Engineering",
          "Computer Engineering",
        ],
        electronics: ["Electronics", "ECE", "Electronics Engineering"],
        mechanical: ["Mechanical", "Automobile", "Production"],
        civil: ["Civil", "Architecture"],
        electrical: ["Electrical", "EEE"],
      },
    };
  }

  // Calculate department similarity
  calculateDepartmentScore(studentDept, alumniDept) {
    if (!studentDept || !alumniDept) return { score: 0, details: {} };

    if (studentDept === alumniDept) {
      return {
        score: this.config.scoring.departmentExactMatch,
        details: { type: "exact_match" },
      };
    }

    for (const [category, depts] of Object.entries(this.config.departments)) {
      if (depts.includes(studentDept) && depts.includes(alumniDept)) {
        return {
          score: this.config.scoring.departmentRelatedMatch,
          details: { type: "related_department", category },
        };
      }
    }

    return { score: 0, details: { type: "no_match" } };
  }

  // Calculate skills match with levels
  calculateSkillsScore(studentSkills = [], alumniSkills = []) {
    if (!studentSkills?.length || !alumniSkills?.length) {
      return { score: 0, details: { commonSkills: [], skillGap: [] } };
    }

    const studentSkillMap = new Map();
    const alumniSkillMap = new Map();

    studentSkills.forEach((skill) => {
      if (typeof skill === "object") {
        studentSkillMap.set(
          skill.name?.toLowerCase() || skill,
          skill.level || "intermediate",
        );
      } else {
        studentSkillMap.set(skill.toLowerCase(), "intermediate");
      }
    });

    alumniSkills.forEach((skill) => {
      if (typeof skill === "object") {
        alumniSkillMap.set(
          skill.name?.toLowerCase() || skill,
          skill.level || "intermediate",
        );
      } else {
        alumniSkillMap.set(skill.toLowerCase(), "intermediate");
      }
    });

    const commonSkills = [];
    let totalScore = 0;

    for (const [skill, studentLevel] of studentSkillMap.entries()) {
      if (alumniSkillMap.has(skill)) {
        const alumniLevel = alumniSkillMap.get(skill);
        const studentMultiplier =
          this.config.scoring.skillLevelMultipliers[studentLevel] || 0.8;
        const alumniMultiplier =
          this.config.scoring.skillLevelMultipliers[alumniLevel] || 0.8;

        let skillScore = 0;
        if (alumniLevel === "expert" && studentLevel === "beginner")
          skillScore = 0.9;
        else if (alumniLevel === "advanced" && studentLevel === "beginner")
          skillScore = 0.8;
        else if (alumniLevel === "intermediate" && studentLevel === "beginner")
          skillScore = 0.7;
        else if (alumniLevel === studentLevel) skillScore = 0.6;
        else skillScore = 0.4;

        totalScore += skillScore;

        commonSkills.push({
          name: skill,
          studentLevel,
          alumniLevel,
          matchScore: skillScore,
        });
      }
    }

    const skillGap = [];
    for (const [skill, alumniLevel] of alumniSkillMap.entries()) {
      if (!studentSkillMap.has(skill) && alumniLevel !== "beginner") {
        skillGap.push({
          name: skill,
          alumniLevel,
          studentNeeds: true,
        });
      }
    }

    const normalizedScore =
      commonSkills.length > 0 ? totalScore / (commonSkills.length * 1.0) : 0;

    return {
      score: Math.min(1.0, normalizedScore),
      details: { commonSkills, skillGap: skillGap.slice(0, 5) },
    };
  }

  // Calculate year gap score
  calculateYearGapScore(studentBatch, alumniBatch) {
    if (!studentBatch || !alumniBatch) {
      return { score: 0, details: { gap: null } };
    }

    const studentGradYear = studentBatch + 4;
    const alumniGradYear = alumniBatch + 4;
    const gap = Math.abs(alumniGradYear - studentGradYear);

    if (gap > this.config.scoring.maxYearGap) {
      return { score: 0, details: { gap, studentGradYear, alumniGradYear } };
    }

    const score = Math.max(0, 1 - gap * this.config.scoring.yearGapPenalty);

    return {
      score,
      details: { gap, studentGradYear, alumniGradYear },
    };
  }

  // Calculate career relevance
  calculateCareerScore(studentData, alumniData) {
    const score = {
      base: 0,
      details: {
        studentInterests: studentData.interests || [],
        alumniPosition: alumniData.position,
        alumniCompany: alumniData.company,
        matches: [],
      },
    };

    if (studentData.interests && alumniData.position) {
      const studentInterests = studentData.interests
        .map((i) => (typeof i === "object" ? i.category : i))
        .map((i) => i?.toLowerCase() || "");

      const alumniPosition = alumniData.position?.toLowerCase() || "";

      studentInterests.forEach((interest) => {
        if (alumniPosition.includes(interest)) {
          score.base += 0.3;
          score.details.matches.push(`Position matches interest: ${interest}`);
        }
      });
    }

    if (studentData.careerGoals && alumniData.position) {
      studentData.careerGoals.forEach((goal) => {
        if (
          goal.toLowerCase().includes(alumniData.position.toLowerCase()) ||
          alumniData.position.toLowerCase().includes(goal.toLowerCase())
        ) {
          score.base += 0.2;
          score.details.matches.push(`Career goal alignment: ${goal}`);
        }
      });
    }

    if (studentData.preferredIndustries && alumniData.company) {
      const company = alumniData.company.toLowerCase();
      studentData.preferredIndustries.forEach((industry) => {
        if (company.includes(industry.toLowerCase())) {
          score.base += 0.2;
          score.details.matches.push(`Industry match: ${industry}`);
        }
      });
    }

    return {
      score: Math.min(1.0, score.base),
      details: score.details,
    };
  }

  // Calculate location score
  calculateLocationScore(studentLocation, alumniLocation) {
    if (!studentLocation || !alumniLocation) {
      return { score: 0, details: {} };
    }

    const normalize = (loc) => {
      if (typeof loc === "object") {
        return {
          city: loc.city?.toLowerCase() || "",
          country: loc.country?.toLowerCase() || "india",
        };
      }
      return { city: loc.toLowerCase(), country: "india" };
    };

    const student = normalize(studentLocation);
    const alumni = normalize(alumniLocation);

    if (student.city === alumni.city) {
      return {
        score: this.config.scoring.locationBonus.sameCity,
        details: { match: "same_city", city: student.city },
      };
    }

    if (student.country === alumni.country) {
      return {
        score: this.config.scoring.locationBonus.sameCountry,
        details: { match: "same_country", country: student.country },
      };
    }

    const indianRegions = {
      north: ["delhi", "noida", "gurgaon", "chandigarh"],
      south: ["bangalore", "chennai", "hyderabad", "kochi"],
      west: ["mumbai", "pune", "ahmedabad"],
      east: ["kolkata", "bhubaneswar", "guwahati"],
    };

    for (const [region, cities] of Object.entries(indianRegions)) {
      if (cities.includes(student.city) && cities.includes(alumni.city)) {
        return {
          score: this.config.scoring.locationBonus.sameRegion,
          details: { match: "same_region", region },
        };
      }
    }

    return { score: 0, details: {} };
  }

  // Calculate opportunity/company score
  calculateOpportunityScore(alumniData) {
    let score = 0.5;
    const details = {
      companySize: "medium",
      industryGrowth: "average",
      alumniGrowth: 0,
    };

    if (!alumniData.company) return { score, details };

    const company = alumniData.company.toLowerCase();

    const faang = [
      "google",
      "facebook",
      "amazon",
      "apple",
      "netflix",
      "microsoft",
    ];
    const unicorns = ["flipkart", "ola", "paytm", "zomato", "swiggy", "byju"];
    const fortune500 = ["tcs", "infosys", "wipro", "hcl", "tech mahindra"];

    if (faang.some((f) => company.includes(f))) {
      score = this.config.scoring.companyPrestige.faang;
      details.companySize = "large";
      details.industryGrowth = "high";
    } else if (unicorns.some((u) => company.includes(u))) {
      score = this.config.scoring.companyPrestige.unicorn;
      details.companySize = "large";
      details.industryGrowth = "high";
    } else if (fortune500.some((f) => company.includes(f))) {
      score = this.config.scoring.companyPrestige.fortune500;
      details.companySize = "large";
      details.industryGrowth = "medium";
    } else if (company.includes("startup") || company.length < 15) {
      score = this.config.scoring.companyPrestige.startup;
      details.companySize = "small";
      details.industryGrowth = "high";
    } else {
      score = this.config.scoring.companyPrestige.msme;
      details.companySize = "small";
      details.industryGrowth = "medium";
    }

    if (alumniData.experience && alumniData.position) {
      const position = alumniData.position.toLowerCase();
      if (
        position.includes("senior") ||
        position.includes("lead") ||
        position.includes("director")
      ) {
        details.alumniGrowth = 1;
        score += 0.1;
      }
    }

    return {
      score: Math.min(1.0, score),
      details,
    };
  }

  // Get interaction-based score
  async getInteractionScore(studentId, alumniId) {
    try {
      const interactions = await Interaction.find({
        student: studentId,
        alumni: alumniId,
      })
        .sort({ timestamp: -1 })
        .limit(20);

      if (interactions.length === 0) return 0;

      let score = 0;
      const weights = {
        profile_view: 0.1,
        recommendation_view: 0.2,
        connection_request: 0.5,
        message_sent: 0.3,
        message_received: 0.4,
        application_submitted: 0.6,
        event_attended: 0.4,
      };

      const now = Date.now();
      interactions.forEach((interaction) => {
        const recency = Math.max(
          0,
          1 -
            (now - interaction.timestamp.getTime()) /
              (30 * 24 * 60 * 60 * 1000),
        );
        score += (weights[interaction.type] || 0.1) * recency;
      });

      return Math.min(1.0, score / 3);
    } catch (error) {
      console.error("Error calculating interaction score:", error);
      return 0;
    }
  }

  // Generate strengths list
  generateStrengths(scores, student, alumni) {
    const strengths = [];

    if (scores.departmentMatch.score > 0.8) {
      strengths.push("same_department");
    }

    if (scores.skillsMatch.score > 0.6) {
      strengths.push("skill_match");
    }

    if (scores.careerRelevance.score > 0.5) {
      strengths.push("career_path");
    }

    if (scores.locationMatch.score > 0.5) {
      strengths.push("location");
    }

    if (scores.opportunityScore.score > 0.7) {
      strengths.push("company_prestige");
    }

    if (alumni.openToMentoring && alumni.mentoringCapacity > 0) {
      strengths.push("mentoring_experience");
    }

    const currentYear = new Date().getFullYear();
    if (alumni.batch && currentYear - alumni.batch <= 5) {
      strengths.push("recent_graduate");
    }

    if (alumni.experience && alumni.experience >= 5) {
      strengths.push("industry_expert");
    }

    return strengths;
  }

  // Generate conversation starters
  generateConversationStarters(student, alumni, scores) {
    const starters = [];

    if (scores.departmentMatch.details.type === "exact_match") {
      starters.push(
        `Hi! I noticed we're both from the ${student.department} department. I'd love to hear about your experience at ${alumni.company}.`,
      );
    }

    if (scores.skillsMatch.details.commonSkills?.length > 0) {
      const skill = scores.skillsMatch.details.commonSkills[0];
      starters.push(
        `I saw you're skilled in ${skill.name}. I'm currently learning this and would appreciate any advice!`,
      );
    }

    if (alumni.company && alumni.position) {
      starters.push(
        `Your role as ${alumni.position} at ${alumni.company} aligns perfectly with my career goals. Could you share how you got started?`,
      );
    }

    if (scores.locationMatch.details.match === "same_city") {
      starters.push(
        `I see we're both based in ${scores.locationMatch.details.city}. Would you be open to connecting locally?`,
      );
    }

    if (scores.yearGapScore.details.gap <= 2) {
      starters.push(
        `We graduated around the same time! How has your journey been since ${scores.yearGapScore.details.alumniGradYear}?`,
      );
    }

    starters.push(
      `I'm a ${student.department} student interested in ${student.interests?.[0] || "tech"}. Would love to connect and learn from your experience!`,
    );

    return starters.slice(0, 3);
  }

  // Calculate total weighted score
  calculateTotalScore(scores, interactionScore = 0) {
    const weights = this.config.weights;

    let total = 0;
    total += scores.departmentMatch.score * weights.department;
    total += scores.skillsMatch.score * weights.skills;
    total += scores.yearGapScore.score * weights.yearGap;
    total += scores.careerRelevance.score * weights.career;
    total += scores.locationMatch.score * weights.location;
    total += scores.opportunityScore.score * weights.opportunity;

    total += interactionScore * 0.1;

    return Math.min(1.0, Math.max(0, total));
  }

  // Determine match quality
  getMatchQuality(score) {
    if (score >= 0.8) return "excellent";
    if (score >= 0.6) return "good";
    if (score >= 0.4) return "fair";
    return "poor";
  }

  // Main recommendation calculation
  async calculateRecommendation(student, alumni) {
    const departmentScore = this.calculateDepartmentScore(
      student.department,
      alumni.department,
    );
    const skillsScore = this.calculateSkillsScore(
      student.skills,
      alumni.skills,
    );
    const yearGapScore = this.calculateYearGapScore(
      student.batch,
      alumni.batch,
    );
    const careerScore = this.calculateCareerScore(student, alumni);
    const locationScore = this.calculateLocationScore(
      student.location,
      alumni.location,
    );
    const opportunityScore = this.calculateOpportunityScore(alumni);

    const interactionScore = await this.getInteractionScore(
      student._id,
      alumni._id,
    );

    const totalScore = this.calculateTotalScore(
      {
        departmentMatch: departmentScore,
        skillsMatch: skillsScore,
        yearGapScore,
        careerRelevance: careerScore,
        locationMatch: locationScore,
        opportunityScore,
      },
      interactionScore,
    );

    const strengths = this.generateStrengths(
      {
        departmentMatch: departmentScore,
        skillsMatch: skillsScore,
        careerRelevance: careerScore,
        locationMatch: locationScore,
        opportunityScore,
      },
      student,
      alumni,
    );

    const conversationStarters = this.generateConversationStarters(
      student,
      alumni,
      {
        departmentMatch: departmentScore,
        skillsMatch: skillsScore,
        yearGapScore,
        locationMatch: locationScore,
      },
    );

    return {
      scores: {
        departmentMatch: {
          score: departmentScore.score,
          weight: this.config.weights.department,
          details: departmentScore.details,
        },
        skillsMatch: {
          score: skillsScore.score,
          weight: this.config.weights.skills,
          details: skillsScore.details,
        },
        yearGapScore: {
          score: yearGapScore.score,
          weight: this.config.weights.yearGap,
          details: yearGapScore.details,
        },
        careerRelevance: {
          score: careerScore.score,
          weight: this.config.weights.career,
          details: careerScore.details,
        },
        locationMatch: {
          score: locationScore.score,
          weight: this.config.weights.location,
          details: locationScore.details,
        },
        opportunityScore: {
          score: opportunityScore.score,
          weight: this.config.weights.opportunity,
          details: opportunityScore.details,
        },
        interactionScore: {
          score: interactionScore,
          weight: 0.1,
          details: {},
        },
      },
      totalScore,
      matchQuality: this.getMatchQuality(totalScore),
      strengths,
      conversationStarters,
      student: student._id,
      alumni: alumni._id,
      lastCalculated: new Date(),
    };
  }

  // Get recommendations for student
  async getRecommendationsForStudent(studentId, limit = 10, refresh = false) {
    try {
      const student = await User.findById(studentId);
      if (!student) throw new Error("Student not found");

      let cachedRecs = [];
      if (!refresh) {
        cachedRecs = await Recommendation.find({
          student: studentId,
          expiresAt: { $gt: new Date() },
        })
          .populate(
            "alumni",
            "name email department batch company position experience skills location linkedIn github bio openToMentoring mentoringCapacity",
          )
          .sort({ totalScore: -1 })
          .limit(limit * 2);
      }

      if (cachedRecs.length >= limit && !refresh) {
        return this.formatRecommendations(student, cachedRecs.slice(0, limit));
      }

      const allAlumni = await User.find({
        role: "alumni",
        status: { $in: ["active", "graduated"] },
        _id: { $ne: studentId },
      }).select("-password");

      const scoredAlumni = [];
      for (const alumni of allAlumni) {
        const recommendation = await this.calculateRecommendation(
          student,
          alumni,
        );
        scoredAlumni.push({
          alumni: {
            _id: alumni._id,
            name: alumni.name,
            email: alumni.email,
            department: alumni.department,
            batch: alumni.batch,
            company: alumni.company,
            position: alumni.position,
            experience: alumni.experience,
            skills: alumni.skills,
            location: alumni.location,
            linkedIn: alumni.linkedIn,
            github: alumni.github,
            bio: alumni.bio,
            openToMentoring: alumni.openToMentoring,
            mentoringCapacity: alumni.mentoringCapacity,
          },
          recommendation,
        });
      }

      scoredAlumni.sort(
        (a, b) => b.recommendation.totalScore - a.recommendation.totalScore,
      );

      const filteredAlumni = scoredAlumni
        .filter(
          (item) =>
            item.recommendation.totalScore >= this.config.thresholds.minScore,
        )
        .slice(0, limit);

      await this.cacheRecommendations(studentId, filteredAlumni);

      return this.formatRecommendations(student, filteredAlumni);
    } catch (error) {
      console.error("Error generating recommendations:", error);
      throw error;
    }
  }

  // Cache recommendations
  async cacheRecommendations(studentId, recommendations) {
    try {
      await Recommendation.deleteMany({
        student: studentId,
        expiresAt: { $lt: new Date() },
      });

      const recommendationDocs = recommendations.map((rec, index) => ({
        student: studentId,
        alumni: rec.alumni._id,
        scores: rec.recommendation.scores,
        totalScore: rec.recommendation.totalScore,
        matchQuality: rec.recommendation.matchQuality,
        strengths: rec.recommendation.strengths,
        conversationStarters: rec.recommendation.conversationStarters,
        rank: index + 1,
        lastCalculated: new Date(),
        expiresAt: new Date(Date.now() + this.config.thresholds.cacheTTL),
      }));

      if (recommendationDocs.length > 0) {
        await Recommendation.insertMany(recommendationDocs);
      }
    } catch (error) {
      console.error("Error caching recommendations:", error);
    }
  }

  // Format recommendations for response
  formatRecommendations(student, recommendations) {
    return {
      student: {
        id: student._id,
        name: student.name,
        department: student.department,
        batch: student.batch,
        skills: student.skills,
        interests: student.interests,
        careerGoals: student.careerGoals,
      },
      recommendations: recommendations.map((item, index) => ({
        alumni: item.alumni,
        similarity: item.recommendation.totalScore,
        matchQuality: item.recommendation.matchQuality,
        strengths: item.recommendation.strengths,
        conversationStarters: item.recommendation.conversationStarters,
        breakdown: {
          department: item.recommendation.scores.departmentMatch.score * 100,
          skills: item.recommendation.scores.skillsMatch.score * 100,
          yearGap: item.recommendation.scores.yearGapScore.score * 100,
          career: item.recommendation.scores.careerRelevance.score * 100,
          location: item.recommendation.scores.locationMatch.score * 100,
          opportunity: item.recommendation.scores.opportunityScore.score * 100,
        },
        matchReasons: item.recommendation.strengths,
        rank: index + 1,
      })),
      config: this.config,
      generatedAt: new Date(),
    };
  }

  // Track interaction
  async trackInteraction(studentId, alumniId, type, details = {}) {
    try {
      const interaction = new Interaction({
        student: studentId,
        alumni: alumniId,
        type,
        details,
        timestamp: new Date(),
      });

      await interaction.save();
      await this.updateRecommendationScore(studentId, alumniId);

      return interaction;
    } catch (error) {
      console.error("Error tracking interaction:", error);
    }
  }

  // Update recommendation score based on interaction
  async updateRecommendationScore(studentId, alumniId) {
    try {
      const recommendation = await Recommendation.findOne({
        student: studentId,
        alumni: alumniId,
      });

      if (recommendation) {
        const student = await User.findById(studentId);
        const alumni = await User.findById(alumniId);

        if (student && alumni) {
          const newRec = await this.calculateRecommendation(student, alumni);

          if (
            Math.abs(newRec.totalScore - recommendation.totalScore) >
            this.config.thresholds.refreshThreshold
          ) {
            recommendation.scores = newRec.scores;
            recommendation.totalScore = newRec.totalScore;
            recommendation.matchQuality = newRec.matchQuality;
            recommendation.strengths = newRec.strengths;
            recommendation.conversationStarters = newRec.conversationStarters;
            recommendation.lastCalculated = new Date();
            await recommendation.save();
          }
        }
      }
    } catch (error) {
      console.error("Error updating recommendation score:", error);
    }
  }

  // Get cached recommendations (for compatibility)
  async getCachedRecommendations(studentId, limit = 10) {
    try {
      const cachedRecs = await Recommendation.find({ student: studentId })
        .populate(
          "alumni",
          "name email department batch company position experience skills location linkedIn github bio openToMentoring mentoringCapacity",
        )
        .sort({ totalScore: -1 })
        .limit(limit);

      return cachedRecs.map((doc) => ({
        alumni: doc.alumni,
        similarity: doc.totalScore,
        breakdown: doc.scores,
        lastCalculated: doc.lastCalculated,
        matchReasons: doc.strengths || [],
      }));
    } catch (error) {
      console.error("Error fetching cached recommendations:", error);
      return [];
    }
  }
}

// Initialize enhanced recommendation engine
const enhancedRecommendationEngine = new EnhancedRecommendationEngine();

// Opportunity Recommendation Engine (Content-Based Filtering)
class OpportunityRecommendationEngine {
  constructor() {
    this.config = {
      weights: {
        skillMatch: 0.5, // 50% weight for skill match
        interestMatch: 0.3, // 30% weight for interest match
        pastInteraction: 0.2, // 20% weight for past interaction
      },
      scoring: {
        exactSkillMatch: 1.0,
        relatedSkillMatch: 0.7,
        skillLevelBonus: {
          expert: 0.3,
          advanced: 0.2,
          intermediate: 0.1,
          beginner: 0,
        },
        interestExactMatch: 1.0,
        interestCategoryMatch: 0.6,
        applicationPenalty: 0.8, // Reduce score if already applied
        alumniConnectionBonus: 0.15,
        recentPostBonus: 0.1, // Bonus for opportunities posted in last 7 days
      },
      thresholds: {
        minScore: 0.2,
        maxRecommendations: 10,
        skillMatchThreshold: 0.3,
      },
      industryMapping: {
        tech: [
          "Software",
          "IT",
          "Technology",
          "Computer",
          "Developer",
          "Engineer",
        ],
        finance: ["Finance", "Banking", "Investment", "Accounting"],
        healthcare: ["Medical", "Health", "Pharma", "Hospital"],
        education: ["Education", "Teaching", "University", "School"],
        engineering: [
          "Mechanical",
          "Civil",
          "Electrical",
          "Chemical",
          "Manufacturing",
        ],
        business: ["Marketing", "Sales", "Business", "Management", "HR"],
      },
    };
  }

  // Extract skills from student
  extractStudentSkills(student) {
    const skills = [];

    if (student.skills && Array.isArray(student.skills)) {
      student.skills.forEach((skill) => {
        if (typeof skill === "object") {
          skills.push({
            name: skill.name.toLowerCase(),
            level: skill.level || "intermediate",
          });
        } else {
          skills.push({
            name: skill.toLowerCase(),
            level: "intermediate",
          });
        }
      });
    }

    return skills;
  }

  // Extract interests from student
  extractStudentInterests(student) {
    const interests = [];

    if (student.interests && Array.isArray(student.interests)) {
      student.interests.forEach((interest) => {
        if (typeof interest === "object") {
          interests.push(interest.category.toLowerCase());
        } else {
          interests.push(interest.toLowerCase());
        }
      });
    }

    return interests;
  }

  // Calculate skill match score
  calculateSkillMatch(studentSkills, opportunitySkills) {
    if (!studentSkills.length || !opportunitySkills.length) {
      return { score: 0, matchedSkills: [] };
    }

    const matchedSkills = [];
    let totalScore = 0;
    let maxPossibleScore = 0;

    studentSkills.forEach((studentSkill) => {
      opportunitySkills.forEach((oppSkill) => {
        const studentSkillName = studentSkill.name.toLowerCase();
        const oppSkillName = oppSkill.toLowerCase();

        // Exact match
        if (studentSkillName === oppSkillName) {
          let skillScore = this.config.scoring.exactSkillMatch;
          // Add level bonus
          skillScore +=
            this.config.scoring.skillLevelBonus[studentSkill.level] || 0;

          totalScore += skillScore;
          maxPossibleScore +=
            1.0 + this.config.scoring.skillLevelBonus[studentSkill.level];

          matchedSkills.push({
            skill: studentSkillName,
            studentLevel: studentSkill.level,
            score: skillScore,
            matchType: "exact",
          });
        }
        // Partial match (contains check)
        else if (
          studentSkillName.includes(oppSkillName) ||
          oppSkillName.includes(studentSkillName)
        ) {
          let skillScore = this.config.scoring.relatedSkillMatch;
          skillScore +=
            this.config.scoring.skillLevelBonus[studentSkill.level] || 0;

          totalScore += skillScore;
          maxPossibleScore +=
            1.0 + this.config.scoring.skillLevelBonus[studentSkill.level];

          matchedSkills.push({
            skill: studentSkillName,
            oppSkill: oppSkillName,
            studentLevel: studentSkill.level,
            score: skillScore,
            matchType: "partial",
          });
        }
      });
    });

    const normalizedScore =
      maxPossibleScore > 0 ? totalScore / maxPossibleScore : 0;

    return {
      score: Math.min(1.0, normalizedScore),
      matchedSkills: matchedSkills.slice(0, 5),
    };
  }

  // Calculate interest match score
  calculateInterestMatch(studentInterests, opportunity) {
    if (!studentInterests.length) {
      return { score: 0, matchedInterests: [] };
    }

    const matchedInterests = [];
    let totalScore = 0;
    const opportunityText =
      `${opportunity.title} ${opportunity.description} ${opportunity.industry || ""} ${opportunity.tags?.join(" ") || ""}`.toLowerCase();

    studentInterests.forEach((interest) => {
      // Check if interest appears in opportunity text
      if (opportunityText.includes(interest)) {
        totalScore += this.config.scoring.interestExactMatch;
        matchedInterests.push({
          interest,
          matchType: "exact",
        });
      }
      // Check industry mapping
      else {
        for (const [industry, keywords] of Object.entries(
          this.config.industryMapping,
        )) {
          if (
            keywords.some(
              (keyword) =>
                keyword.toLowerCase().includes(interest) ||
                interest.includes(keyword.toLowerCase()),
            )
          ) {
            totalScore += this.config.scoring.interestCategoryMatch;
            matchedInterests.push({
              interest,
              industry,
              matchType: "category",
            });
            break;
          }
        }
      }
    });

    const normalizedScore =
      studentInterests.length > 0 ? totalScore / studentInterests.length : 0;

    return {
      score: Math.min(1.0, normalizedScore),
      matchedInterests: matchedInterests.slice(0, 3),
    };
  }

  // Calculate past interaction score
  async calculatePastInteractionScore(studentId, opportunity) {
    try {
      let score = 0;
      const details = {};

      // Check if student already applied (penalty)
      const alreadyApplied = opportunity.applications?.some(
        (app) => app.applicant.toString() === studentId.toString(),
      );

      if (alreadyApplied) {
        return {
          score: 0,
          details: { alreadyApplied: true, message: "Already applied" },
        };
      }

      // Check alumni connection bonus
      const connection = await Connection.findOne({
        student: studentId,
        alumni: opportunity.postedBy,
        status: "accepted",
      });

      if (connection) {
        score += this.config.scoring.alumniConnectionBonus;
        details.hasConnection = true;
      }

      // Recent post bonus (within 7 days)
      const daysSincePost = opportunity.createdAt
        ? (Date.now() - new Date(opportunity.createdAt).getTime()) /
          (1000 * 60 * 60 * 24)
        : 30;

      if (daysSincePost <= 7) {
        score += this.config.scoring.recentPostBonus * (1 - daysSincePost / 7);
        details.isRecent = true;
      }

      details.daysSincePost = Math.floor(daysSincePost);

      return {
        score: Math.min(1.0, score),
        details,
      };
    } catch (error) {
      console.error("Error calculating past interaction score:", error);
      return { score: 0, details: {} };
    }
  }

  // Calculate total opportunity relevance score
  async calculateOpportunityRelevance(student, opportunity) {
    const studentSkills = this.extractStudentSkills(student);
    const studentInterests = this.extractStudentInterests(student);

    const skillMatch = this.calculateSkillMatch(
      studentSkills,
      opportunity.skillsRequired || [],
    );
    const interestMatch = this.calculateInterestMatch(
      studentInterests,
      opportunity,
    );
    const pastInteraction = await this.calculatePastInteractionScore(
      student._id,
      opportunity,
    );

    // Apply formula: Relevance Score = (Skill Match × 50) + (Interest Match × 30) + (Past Interaction × 20)
    const totalScore =
      skillMatch.score * this.config.weights.skillMatch +
      interestMatch.score * this.config.weights.interestMatch +
      pastInteraction.score * this.config.weights.pastInteraction;

    return {
      totalScore: Math.min(1.0, totalScore),
      breakdown: {
        skillMatch: {
          score: skillMatch.score,
          weight: this.config.weights.skillMatch,
          details: skillMatch.matchedSkills,
        },
        interestMatch: {
          score: interestMatch.score,
          weight: this.config.weights.interestMatch,
          details: interestMatch.matchedInterests,
        },
        pastInteraction: {
          score: pastInteraction.score,
          weight: this.config.weights.pastInteraction,
          details: pastInteraction.details,
        },
      },
      matchedSkills: skillMatch.matchedSkills,
      matchedInterests: interestMatch.matchedInterests,
      opportunity: opportunity._id,
      student: student._id,
    };
  }

  // Get personalized opportunity recommendations for student
  async getPersonalizedOpportunities(studentId, limit = 10) {
    try {
      const student = await User.findById(studentId);
      if (!student) throw new Error("Student not found");

      // Get all open opportunities
      const opportunities = await Opportunity.find({
        status: "open",
        deadline: { $gt: new Date() },
      })
        .populate("postedBy", "name company")
        .sort({ createdAt: -1 });

      // Calculate relevance scores for each opportunity
      const scoredOpportunities = [];

      for (const opportunity of opportunities) {
        const relevance = await this.calculateOpportunityRelevance(
          student,
          opportunity,
        );

        if (relevance.totalScore >= this.config.thresholds.minScore) {
          scoredOpportunities.push({
            opportunity,
            relevance,
            totalScore: relevance.totalScore,
          });
        }
      }

      // Sort by relevance score
      scoredOpportunities.sort((a, b) => b.totalScore - a.totalScore);

      // Limit results
      const recommendations = scoredOpportunities.slice(0, limit);

      return {
        student: {
          id: student._id,
          name: student.name,
          skills: student.skills,
          interests: student.interests,
        },
        recommendations: recommendations.map((item) => ({
          opportunity: item.opportunity,
          relevanceScore: item.totalScore,
          breakdown: item.relevance.breakdown,
          matchedSkills: item.relevance.matchedSkills,
          matchedInterests: item.relevance.matchedInterests,
          matchPercentage: Math.round(item.totalScore * 100),
        })),
        totalOpportunities: opportunities.length,
        recommendedCount: recommendations.length,
        generatedAt: new Date(),
      };
    } catch (error) {
      console.error("Error generating opportunity recommendations:", error);
      throw error;
    }
  }

  // Get opportunity suggestions based on student profile
  async getOpportunitySuggestions(studentId, type = "skills") {
    try {
      const student = await User.findById(studentId);
      if (!student) throw new Error("Student not found");

      let query = { status: "open", deadline: { $gt: new Date() } };

      if (type === "skills" && student.skills?.length > 0) {
        const skillNames = student.skills.map((s) =>
          typeof s === "object" ? s.name : s,
        );
        query["skillsRequired"] = {
          $in: skillNames.map((s) => new RegExp(s, "i")),
        };
      } else if (type === "department") {
        // Find opportunities from alumni in same department
        const alumniInSameDept = await User.find({
          role: "alumni",
          department: student.department,
        }).select("_id");

        const alumniIds = alumniInSameDept.map((a) => a._id);
        query["postedBy"] = { $in: alumniIds };
      } else if (type === "recent") {
        // Recent opportunities (last 30 days)
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        query["createdAt"] = { $gte: thirtyDaysAgo };
      }

      const suggestions = await Opportunity.find(query)
        .populate("postedBy", "name company department")
        .sort({ createdAt: -1 })
        .limit(5);

      return suggestions;
    } catch (error) {
      console.error("Error getting opportunity suggestions:", error);
      return [];
    }
  }
}

// Initialize opportunity recommendation engine
const opportunityRecommendationEngine = new OpportunityRecommendationEngine();

// Routes
// Test Route
app.get("/", (req, res) => {
  res.json({ message: "Alumni Management System API is running" });
});

// Register Route with AI Verification
app.post("/api/auth/register", async (req, res) => {
  try {
    const userData = req.body;

    // Parse skills and interests
    if (userData.skills) {
      userData.skills = userData.skills
        .split(",")
        .map((skill) => ({ name: skill.trim(), level: "intermediate" }))
        .filter((skill) => skill.name);
    }
    if (userData.interests) {
      userData.interests = userData.interests
        .split(",")
        .map((interest) => ({ category: interest.trim(), topics: [] }))
        .filter((interest) => interest.category);
    }

    // AI Verification
    const verification = await User.aiVerifyStudent(userData);

    if (!verification.verified) {
      return res.status(400).json({
        message: verification.reason,
        requiresManual: verification.requiresManual || false,
      });
    }

    // Set AI confidence score
    userData.aiConfidence = verification.confidence;

    // Check if manual approval needed
    if (verification.confidence < 80) {
      userData.status = "pending";
      userData.requiresManual = true;
    } else {
      userData.status = "approved";
    }

    const user = new User(userData);
    await user.save();

    res.status(201).json({
      message: "Registration successful",
      status: user.status,
      requiresApproval: user.status === "pending",
      aiConfidence: verification.confidence,
    });
  } catch (error) {
    console.error("Registration error:", error);
    if (error.code === 11000) {
      return res
        .status(400)
        .json({ message: "Email or register number already exists" });
    }
    res.status(500).json({ message: "Server error" });
  }
});

// Login Route
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Check if account is approved
    if (
      user.role === "student" &&
      user.status !== "approved" &&
      user.status !== "graduated"
    ) {
      return res.status(400).json({
        message: "Account pending admin approval",
      });
    }

    // Check if account is inactive
    if (user.status === "inactive") {
      return res.status(400).json({
        message: "Account is deactivated. Please contact admin.",
      });
    }

    // Check if student trying to login after graduation
    if (user.role === "student" && user.status === "graduated") {
      return res.status(400).json({
        message: "Student account graduated. Please contact admin.",
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET || "your-secret-key",
      { expiresIn: "7d" },
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        batch: user.batch,
        company: user.company,
        status: user.status,
        skills: user.skills,
        interests: user.interests,
        careerGoals: user.careerGoals,
        location: user.location,
        openToMentoring: user.openToMentoring,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get current user
app.get("/api/auth/me", authenticateToken, async (req, res) => {
  res.json(req.user);
});

// Get smart recommendations for student
app.get("/api/student/recommendations", authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== "student") {
      return res.status(403).json({ message: "Access denied" });
    }

    const { refresh = "false", limit = 10, filter = "all" } = req.query;

    const recommendations =
      await enhancedRecommendationEngine.getRecommendationsForStudent(
        req.user._id,
        parseInt(limit),
        refresh === "true",
      );

    // Apply client-side filter if needed
    if (filter !== "all") {
      recommendations.recommendations = recommendations.recommendations.filter(
        (rec) => {
          if (filter === "high") return rec.similarity >= 0.8;
          if (filter === "medium")
            return rec.similarity >= 0.5 && rec.similarity < 0.8;
          if (filter === "low") return rec.similarity < 0.5;
          return true;
        },
      );
    }

    res.json(recommendations);
  } catch (error) {
    console.error("Error getting recommendations:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get recommendation explanations
app.get(
  "/api/student/recommendations/:alumniId/explain",
  authenticateToken,
  async (req, res) => {
    try {
      if (req.user.role !== "student") {
        return res.status(403).json({ message: "Access denied" });
      }

      const student = req.user;
      const alumni = await User.findById(req.params.alumniId);

      if (!alumni || alumni.role !== "alumni") {
        return res.status(404).json({ message: "Alumni not found" });
      }

      const recommendation =
        await enhancedRecommendationEngine.calculateRecommendation(
          student,
          alumni,
        );

      // Track this view
      await enhancedRecommendationEngine.trackInteraction(
        student._id,
        alumni._id,
        "recommendation_view",
        { score: recommendation.totalScore },
      );

      res.json({
        student: {
          id: student._id,
          name: student.name,
          department: student.department,
          batch: student.batch,
          skills: student.skills,
          interests: student.interests,
          careerGoals: student.careerGoals,
          location: student.location,
        },
        alumni: {
          id: alumni._id,
          name: alumni.name,
          department: alumni.department,
          batch: alumni.batch,
          company: alumni.company,
          position: alumni.position,
          experience: alumni.experience,
          skills: alumni.skills,
          location: alumni.location,
          openToMentoring: alumni.openToMentoring,
          mentoringCapacity: alumni.mentoringCapacity,
        },
        recommendation: {
          totalScore: recommendation.totalScore,
          matchQuality: recommendation.matchQuality,
          breakdown: recommendation.scores,
          strengths: recommendation.strengths,
          conversationStarters: recommendation.conversationStarters,
        },
      });
    } catch (error) {
      console.error("Error explaining recommendation:", error);
      res.status(500).json({ message: "Server error" });
    }
  },
);

// Track interaction
app.post("/api/student/interaction", authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== "student") {
      return res.status(403).json({ message: "Access denied" });
    }

    const { alumniId, type, details } = req.body;

    const alumni = await User.findById(alumniId);
    if (!alumni || alumni.role !== "alumni") {
      return res.status(404).json({ message: "Alumni not found" });
    }

    const interaction = await enhancedRecommendationEngine.trackInteraction(
      req.user._id,
      alumniId,
      type,
      details,
    );

    res.json({
      message: "Interaction tracked",
      interaction,
    });
  } catch (error) {
    console.error("Error tracking interaction:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get personalized opportunity recommendations
app.get(
  "/api/student/opportunities/recommended",
  authenticateToken,
  async (req, res) => {
    try {
      if (req.user.role !== "student") {
        return res.status(403).json({ message: "Access denied" });
      }

      const { limit = 10 } = req.query;

      const recommendations =
        await opportunityRecommendationEngine.getPersonalizedOpportunities(
          req.user._id,
          parseInt(limit),
        );

      res.json(recommendations);
    } catch (error) {
      console.error("Error getting opportunity recommendations:", error);
      res.status(500).json({ message: "Server error" });
    }
  },
);

// Get opportunity suggestions by type
app.get(
  "/api/student/opportunities/suggestions",
  authenticateToken,
  async (req, res) => {
    try {
      if (req.user.role !== "student") {
        return res.status(403).json({ message: "Access denied" });
      }

      const { type = "skills" } = req.query;

      const suggestions =
        await opportunityRecommendationEngine.getOpportunitySuggestions(
          req.user._id,
          type,
        );

      res.json({
        type,
        suggestions,
        student: {
          name: req.user.name,
          department: req.user.department,
          skills: req.user.skills,
        },
      });
    } catch (error) {
      console.error("Error getting opportunity suggestions:", error);
      res.status(500).json({ message: "Server error" });
    }
  },
);

// Enhanced student dashboard with opportunity recommendations
app.get("/api/student/dashboard/v2", authenticateToken, async (req, res) => {
  if (req.user.role !== "student") {
    return res.status(403).json({ message: "Access denied" });
  }

  try {
    // Get regular opportunities
    const opportunities = await Opportunity.find({
      deadline: { $gt: new Date() },
      status: "open",
    })
      .populate("postedBy", "name company")
      .sort({ createdAt: -1 })
      .limit(10);

    // Get AI-powered personalized recommendations
    const personalizedOpportunities =
      await opportunityRecommendationEngine.getPersonalizedOpportunities(
        req.user._id,
        5,
      );

    // Get upcoming events
    const upcomingEvents = await Event.find({
      date: { $gte: new Date() },
    })
      .populate("speaker", "name company")
      .sort({ date: 1 })
      .limit(5);

    // Get alumni recommendations
    const alumniRecommendations =
      await enhancedRecommendationEngine.getRecommendationsForStudent(
        req.user._id,
        5,
        false,
      );

    res.json({
      opportunities,
      personalizedOpportunities: personalizedOpportunities.recommendations,
      upcomingEvents,
      alumniRecommendations: alumniRecommendations.recommendations,
      stats: {
        totalOpportunities: await Opportunity.countDocuments({
          status: "open",
        }),
        personalizedOpportunitiesCount:
          personalizedOpportunities.recommendations.length,
        upcomingEventsCount: upcomingEvents.length,
        totalAlumni: await User.countDocuments({
          role: "alumni",
          status: "active",
        }),
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// Update user profile for better recommendations
app.put(
  "/api/student/profile/recommendation-data",
  authenticateToken,
  async (req, res) => {
    try {
      if (req.user.role !== "student") {
        return res.status(403).json({ message: "Access denied" });
      }

      const { skills, interests, careerGoals, preferredIndustries, location } =
        req.body;

      const updateData = {};

      if (skills) {
        updateData.skills = skills.map((skill) =>
          typeof skill === "string"
            ? { name: skill, level: "intermediate" }
            : skill,
        );
      }

      if (interests) {
        updateData.interests = interests.map((interest) =>
          typeof interest === "string"
            ? { category: interest, topics: [] }
            : interest,
        );
      }

      if (careerGoals) updateData.careerGoals = careerGoals;
      if (preferredIndustries)
        updateData.preferredIndustries = preferredIndustries;
      if (location) updateData.location = location;

      updateData.updatedAt = new Date();

      const updatedUser = await User.findByIdAndUpdate(
        req.user._id,
        { $set: updateData },
        { new: true, select: "-password" },
      );

      // Invalidate cached recommendations
      await Recommendation.deleteMany({ student: req.user._id });

      res.json({
        message: "Profile updated for better recommendations",
        user: updatedUser,
      });
    } catch (error) {
      console.error("Error updating recommendation data:", error);
      res.status(500).json({ message: "Server error" });
    }
  },
);

// Get alumni suggestions
app.get("/api/student/suggestions", authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== "student") {
      return res.status(403).json({ message: "Access denied" });
    }

    const { type = "mentors" } = req.query;
    const student = req.user;

    let query = {
      role: "alumni",
      status: "active",
      _id: { $ne: student._id },
    };

    if (type === "mentors") {
      query.openToMentoring = true;
      query.mentoringCapacity = { $gt: 0 };
    } else if (type === "same_department") {
      query.department = student.department;
    } else if (type === "recent_graduates") {
      const currentYear = new Date().getFullYear();
      query.batch = { $gte: currentYear - 5 };
    }

    const suggestions = await User.find(query)
      .select(
        "name department batch company position experience skills location linkedIn openToMentoring mentoringCapacity",
      )
      .limit(10)
      .sort({ experience: -1 });

    const suggestionsWithScores = await Promise.all(
      suggestions.map(async (alumni) => {
        const score =
          await enhancedRecommendationEngine.calculateRecommendation(
            student,
            alumni,
          );
        return {
          alumni,
          quickScore: score.totalScore,
          matchQuality: score.matchQuality,
        };
      }),
    );

    suggestionsWithScores.sort((a, b) => b.quickScore - a.quickScore);

    res.json({
      type,
      suggestions: suggestionsWithScores.slice(0, 5),
      student: {
        name: student.name,
        department: student.department,
        batch: student.batch,
      },
    });
  } catch (error) {
    console.error("Error getting suggestions:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get alumni profiles for students
app.get("/api/alumni/profiles", authenticateToken, async (req, res) => {
  try {
    const { department, company, skills, page = 1, limit = 20 } = req.query;

    const query = {
      role: "alumni",
      status: { $in: ["active", "graduated"] },
    };

    if (department && department !== "All Departments") {
      query.department = department;
    }
    if (company) {
      query.company = { $regex: company, $options: "i" };
    }
    if (skills) {
      const skillsArray = skills.split(",").map((s) => s.trim());
      query["skills.name"] = { $in: skillsArray };
    }

    const total = await User.countDocuments(query);

    const alumni = await User.find(query)
      .select(
        "name email department batch company experience skills position bio linkedIn github location openToMentoring mentoringCapacity",
      )
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ experience: -1, createdAt: -1 });

    res.json({
      alumni,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Error fetching alumni profiles:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Send connection request
app.post("/api/connections/request", authenticateToken, async (req, res) => {
  try {
    const { alumniId, message } = req.body;

    const existingConnection = await Connection.findOne({
      student: req.user._id,
      alumni: alumniId,
    });

    if (existingConnection) {
      return res.status(400).json({
        message:
          existingConnection.status === "pending"
            ? "Connection request already sent"
            : "Already connected",
      });
    }

    const connection = new Connection({
      student: req.user._id,
      alumni: alumniId,
      message,
      status: "pending",
    });

    await connection.save();

    // Track interaction
    await enhancedRecommendationEngine.trackInteraction(
      req.user._id,
      alumniId,
      "connection_request",
      { message },
    );

    const notification = new Notification({
      recipient: alumniId,
      sender: req.user._id,
      type: "connection",
      title: "New Connection Request",
      message: `${req.user.name} wants to connect with you`,
      relatedTo: connection._id,
    });
    await notification.save();

    res.json({
      message: "Connection request sent successfully",
      connection,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// Check connection status
app.get(
  "/api/connections/status/:alumniId",
  authenticateToken,
  async (req, res) => {
    try {
      const connection = await Connection.findOne({
        student: req.user._id,
        alumni: req.params.alumniId,
      });

      res.json({
        exists: !!connection,
        status: connection?.status || null,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error" });
    }
  },
);

// Student apply for opportunity
app.post(
  "/api/opportunities/:id/apply",
  authenticateToken,
  async (req, res) => {
    try {
      const opportunity = await Opportunity.findById(req.params.id);

      if (!opportunity) {
        return res.status(404).json({ message: "Opportunity not found" });
      }

      const alreadyApplied = opportunity.applications?.some(
        (app) => app.applicant.toString() === req.user._id.toString(),
      );

      if (alreadyApplied) {
        return res
          .status(400)
          .json({ message: "Already applied for this opportunity" });
      }

      opportunity.applications.push({
        applicant: req.user._id,
        status: "pending",
        appliedAt: new Date(),
        resume: req.body.resume || "",
      });

      await opportunity.save();

      const notification = new Notification({
        recipient: opportunity.postedBy,
        sender: req.user._id,
        type: "application",
        title: "New Application Received",
        message: `${req.user.name} applied for your opportunity: ${opportunity.title}`,
        relatedTo: opportunity._id,
      });
      await notification.save();

      // Track interaction
      if (req.user.role === "student") {
        await enhancedRecommendationEngine.trackInteraction(
          req.user._id,
          opportunity.postedBy,
          "application_submitted",
          {
            opportunityId: opportunity._id,
            opportunityTitle: opportunity.title,
          },
        );
      }

      res.json({
        message: "Application submitted successfully",
        application:
          opportunity.applications[opportunity.applications.length - 1],
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error" });
    }
  },
);

// Student Dashboard Data
app.get("/api/student/dashboard", authenticateToken, async (req, res) => {
  if (req.user.role !== "student") {
    return res.status(403).json({ message: "Access denied" });
  }

  try {
    const opportunities = await Opportunity.find({
      deadline: { $gt: new Date() },
      status: "open",
    })
      .populate("postedBy", "name company")
      .sort({ createdAt: -1 })
      .limit(10);

    const upcomingEvents = await Event.find({
      date: { $gte: new Date() },
    })
      .populate("speaker", "name company")
      .sort({ date: 1 })
      .limit(5);

    // Get AI recommendations
    const recommendations =
      await enhancedRecommendationEngine.getRecommendationsForStudent(
        req.user._id,
        5,
        false,
      );

    res.json({
      opportunities,
      recommendations: recommendations.recommendations,
      upcomingEvents,
      stats: {
        totalOpportunities: await Opportunity.countDocuments({
          status: "open",
        }),
        upcomingEventsCount: upcomingEvents.length,
        totalAlumni: await User.countDocuments({
          role: "alumni",
          status: "active",
        }),
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get student's connections
app.get("/api/student/connections", authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== "student") {
      return res.status(403).json({ message: "Access denied" });
    }

    const connections = await Connection.find({
      student: req.user._id,
      status: "accepted",
    })
      .populate(
        "alumni",
        "name email company department batch experience skills position linkedIn github",
      )
      .sort({ updatedAt: -1 });

    res.json(connections);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// Send message
app.post("/api/messages/send", authenticateToken, async (req, res) => {
  try {
    const { recipientId, content } = req.body;

    const message = new Message({
      sender: req.user._id,
      recipient: recipientId,
      content,
      timestamp: new Date(),
    });

    await message.save();

    // Track interaction if sending to alumni
    const recipient = await User.findById(recipientId);
    if (
      recipient &&
      recipient.role === "alumni" &&
      req.user.role === "student"
    ) {
      await enhancedRecommendationEngine.trackInteraction(
        req.user._id,
        recipientId,
        "message_sent",
        { contentLength: content.length },
      );
    }

    const notification = new Notification({
      recipient: recipientId,
      sender: req.user._id,
      type: "message",
      title: "New Message",
      message: `New message from ${req.user.name}`,
      relatedTo: message._id,
    });
    await notification.save();

    res.json({
      message: "Message sent successfully",
      messageData: message,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get messages between two users
app.get("/api/messages", authenticateToken, async (req, res) => {
  try {
    const { recipientId } = req.query;

    let query = {
      $or: [
        { sender: req.user._id, recipient: recipientId },
        { sender: recipientId, recipient: req.user._id },
      ],
    };

    const messages = await Message.find(query)
      .populate("sender", "name")
      .populate("recipient", "name")
      .sort({ timestamp: 1 });

    await Message.updateMany(
      {
        sender: recipientId,
        recipient: req.user._id,
        read: false,
      },
      { $set: { read: true } },
    );

    res.json(messages);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get conversations for a user
app.get("/api/messages/conversations", authenticateToken, async (req, res) => {
  try {
    const messages = await Message.find({
      $or: [{ sender: req.user._id }, { recipient: req.user._id }],
    })
      .populate("sender", "name")
      .populate("recipient", "name")
      .sort({ timestamp: -1 });

    const conversationsMap = new Map();

    messages.forEach((message) => {
      const otherUser =
        message.sender._id.toString() === req.user._id.toString()
          ? message.recipient
          : message.sender;

      if (!conversationsMap.has(otherUser._id.toString())) {
        conversationsMap.set(otherUser._id.toString(), {
          _id: otherUser._id,
          name: otherUser.name,
          lastMessage: message.content,
          timestamp: message.timestamp,
          unread:
            message.recipient.toString() === req.user._id.toString() &&
            !message.read,
        });
      }
    });

    const conversations = Array.from(conversationsMap.values()).sort(
      (a, b) => new Date(b.timestamp) - new Date(a.timestamp),
    );

    res.json(conversations);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// Create initial admin if not exists
async function createInitialAdmin() {
  try {
    const adminExists = await User.findOne({ email: "admin@college.edu" });

    if (!adminExists) {
      const adminPassword = await bcrypt.hash("admin123", 10);

      const admin = new User({
        name: "System Admin",
        email: "admin@college.edu",
        password: adminPassword,
        registerNumber: "2000AD001",
        department: "Administration",
        batch: 2000,
        role: "admin",
        status: "approved",
        phone: "1234567890",
        skills: [
          { name: "Administration", level: "expert" },
          { name: "Management", level: "expert" },
        ],
        interests: [
          { category: "Education", topics: [] },
          { category: "Technology", topics: [] },
        ],
        openToMentoring: false,
      });

      await admin.save();
      console.log("✅ Initial admin user created");
      console.log("📧 Email: admin@college.edu");
      console.log("🔑 Password: admin123");
    }
  } catch (error) {
    console.error("Error creating admin:", error);
  }
}

// Get notifications for user
app.get("/api/notifications", authenticateToken, async (req, res) => {
  try {
    const notifications = await Notification.find({
      recipient: req.user._id,
    })
      .populate("sender", "name")
      .sort({ createdAt: -1 })
      .limit(20);

    // Mark as read if specified
    if (req.query.markRead === "true") {
      await Notification.updateMany(
        { recipient: req.user._id, read: false },
        { $set: { read: true } },
      );
    }

    res.json(notifications);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// Mark notification as read
app.put("/api/notifications/:id/read", authenticateToken, async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user._id },
      { $set: { read: true } },
      { new: true },
    );

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    res.json({ message: "Notification marked as read", notification });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get unread notification count
app.get(
  "/api/notifications/unread-count",
  authenticateToken,
  async (req, res) => {
    try {
      const count = await Notification.countDocuments({
        recipient: req.user._id,
        read: false,
      });

      res.json({ count });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error" });
    }
  },
);

// ========== ADMIN ROUTES ==========
// Admin stats
app.get("/api/admin/stats", authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    const totalStudents = await User.countDocuments({ role: "student" });
    const totalAlumni = await User.countDocuments({ role: "alumni" });
    const pendingVerifications = await User.countDocuments({ 
      role: "student", 
      status: "pending" 
    });
    const graduatedThisYear = await User.countDocuments({
      role: "alumni",
      status: "graduated",
      updatedAt: { $gte: new Date(new Date().getFullYear(), 0, 1) }
    });
    
    // Count active mentors (alumni open to mentoring with capacity)
    const activeMentorships = await User.countDocuments({
      role: "alumni",
      openToMentoring: true,
      mentoringCapacity: { $gt: 0 }
    });

    const opportunitiesPosted = await Opportunity.countDocuments();

    res.json({
      totalStudents,
      totalAlumni,
      pendingVerifications,
      graduatedThisYear,
      activeMentorships,
      opportunitiesPosted
    });
  } catch (error) {
    console.error("Error fetching admin stats:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get pending approvals
app.get("/api/admin/pending-approvals", authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    const { department, confidence } = req.query;
    let query = { role: "student", status: "pending" };

    if (department && department !== "all") {
      query.department = department;
    }

    const users = await User.find(query).select("-password");

    // Filter by confidence if needed
    let filteredUsers = users;
    if (confidence && confidence !== "all") {
      filteredUsers = users.filter(user => {
        const score = user.aiConfidence || 0;
        if (confidence === "high") return score >= 80;
        if (confidence === "medium") return score >= 60 && score < 80;
        if (confidence === "low") return score < 60;
        return true;
      });
    }

    res.json(filteredUsers);
  } catch (error) {
    console.error("Error fetching pending approvals:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Approve/reject student
app.post("/api/admin/approve-student/:userId", authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    const { action } = req.body;
    const { userId } = req.params;

    const status = action === "approve" ? "approved" : "rejected";
    
    const user = await User.findByIdAndUpdate(
      userId,
      { status },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Create notification
    const notification = new Notification({
      recipient: userId,
      type: "system",
      title: `Account ${action === "approve" ? "Approved" : "Rejected"}`,
      message: `Your account has been ${action === "approve" ? "approved" : "rejected"} by the admin.`,
    });
    await notification.save();

    res.json({ 
      message: `Student ${action}ed successfully`,
      user 
    });
  } catch (error) {
    console.error("Error updating student approval:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get all students
app.get("/api/admin/students", authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    const students = await User.find({ role: "student" })
      .select("-password")
      .sort({ createdAt: -1 });

    res.json(students);
  } catch (error) {
    console.error("Error fetching students:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get all alumni
app.get("/api/admin/alumni", authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    const alumni = await User.find({ role: "alumni" })
      .select("-password")
      .sort({ createdAt: -1 });

    res.json(alumni);
  } catch (error) {
    console.error("Error fetching alumni:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get final year students for graduation
app.get("/api/admin/final-year-students", authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    const { department, batch = "2024" } = req.query;
    const currentYear = new Date().getFullYear();
    
    let query = { 
      role: "student", 
      status: "approved",
      batch: parseInt(batch)
    };

    if (department && department !== "all") {
      query.department = department;
    }

    const students = await User.find(query)
      .select("-password")
      .sort({ name: 1 });

    // Add eligibility for graduation (simple logic)
    const studentsWithEligibility = students.map(student => ({
      ...student.toObject(),
      eligibleForGraduation: true, // Simple logic - in reality would check CGPA, dues, etc.
      selected: false
    }));

    res.json(studentsWithEligibility);
  } catch (error) {
    console.error("Error fetching final year students:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Graduate a student
app.post("/api/admin/graduate-student/:studentId", authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    const student = await User.findById(req.params.studentId);
    if (!student || student.role !== "student") {
      return res.status(404).json({ message: "Student not found" });
    }

    // Update student to alumni
    student.role = "alumni";
    student.status = "graduated";
    student.graduationDate = new Date();
    await student.save();

    res.json({ 
      message: "Student graduated successfully",
      alumni: student 
    });
  } catch (error) {
    console.error("Error graduating student:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Bulk graduation
app.post("/api/admin/bulk-graduate", authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    const { studentIds } = req.body;

    if (!studentIds || !Array.isArray(studentIds)) {
      return res.status(400).json({ message: "Invalid student IDs" });
    }

    const results = await Promise.all(
      studentIds.map(async (studentId) => {
        try {
          const student = await User.findById(studentId);
          if (student && student.role === "student") {
            student.role = "alumni";
            student.status = "graduated";
            student.graduationDate = new Date();
            await student.save();
            return { success: true, studentId, name: student.name };
          }
          return { success: false, studentId, error: "Not found or not a student" };
        } catch (error) {
          return { success: false, studentId, error: error.message };
        }
      })
    );

    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);

    res.json({
      message: `Graduated ${successful.length} students successfully`,
      successful,
      failed
    });
  } catch (error) {
    console.error("Error in bulk graduation:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get duplicate detection (simplified version)
app.get("/api/admin/duplicates", authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    // Simple duplicate detection based on email patterns
    const users = await User.find().select("-password");
    
    const duplicates = [];
    const processedEmails = new Set();

    users.forEach(user => {
      if (!processedEmails.has(user.email)) {
        const similarUsers = users.filter(u => 
          u._id.toString() !== user._id.toString() && 
          (u.email === user.email || 
           u.registerNumber === user.registerNumber ||
           u.name.toLowerCase() === user.name.toLowerCase())
        );

        if (similarUsers.length > 0) {
          duplicates.push({
            similarity: 85, // Mock similarity score
            matchingFields: ["email", "registerNumber", "name"],
            accounts: [user, ...similarUsers]
          });
          
          similarUsers.forEach(u => processedEmails.add(u.email));
        }
        processedEmails.add(user.email);
      }
    });

    res.json(duplicates);
  } catch (error) {
    console.error("Error fetching duplicates:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Merge accounts
app.post("/api/admin/merge-accounts", authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    const { primaryId, duplicateId } = req.body;

    // This is a simplified version - in reality, you'd need to handle:
    // 1. Transfer connections
    // 2. Transfer opportunities
    // 3. Transfer messages
    // 4. Delete duplicate account

    const primaryUser = await User.findById(primaryId);
    const duplicateUser = await User.findById(duplicateId);

    if (!primaryUser || !duplicateUser) {
      return res.status(404).json({ message: "One or both users not found" });
    }

    // Archive duplicate user
    const archivedUser = new ArchivedUser({
      userId: duplicateUser._id,
      name: duplicateUser.name,
      email: duplicateUser.email,
      department: duplicateUser.department,
      batch: duplicateUser.batch,
      removedBy: req.user._id
    });
    await archivedUser.save();

    // Delete duplicate user
    await User.findByIdAndDelete(duplicateId);

    res.json({ 
      message: "Accounts merged successfully",
      primaryUser,
      archivedUser 
    });
  } catch (error) {
    console.error("Error merging accounts:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get admin events
app.get("/api/admin/events", authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    const events = await Event.find()
      .populate("speaker", "name company")
      .sort({ date: -1 });

    res.json(events);
  } catch (error) {
    console.error("Error fetching events:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Create event (admin)
app.post("/api/admin/events", authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    const eventData = {
      ...req.body,
      postedBy: req.user._id
    };

    const event = new Event(eventData);
    await event.save();

    res.json({ 
      message: "Event created successfully",
      event 
    });
  } catch (error) {
    console.error("Error creating event:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Update event
app.put("/api/admin/events/:eventId", authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    const event = await Event.findByIdAndUpdate(
      req.params.eventId,
      req.body,
      { new: true }
    );

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    res.json({ 
      message: "Event updated successfully",
      event 
    });
  } catch (error) {
    console.error("Error updating event:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Delete event
app.delete("/api/admin/events/:eventId", authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    const event = await Event.findByIdAndDelete(req.params.eventId);

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    res.json({ 
      message: "Event deleted successfully" 
    });
  } catch (error) {
    console.error("Error deleting event:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get AI insights
app.get("/api/admin/insights", authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    // Mock insights data - in reality, you'd analyze user data
    const insights = {
      topDomains: [
        { name: "Software Development", percentage: 35 },
        { name: "Data Science", percentage: 25 },
        { name: "Product Management", percentage: 15 },
        { name: "UX/UI Design", percentage: 10 },
        { name: "DevOps", percentage: 8 },
        { name: "Cybersecurity", percentage: 7 }
      ],
      topSkills: [
        { name: "React", demand: 85, trend: "up", growth: 12 },
        { name: "Node.js", demand: 78, trend: "up", growth: 8 },
        { name: "Python", demand: 92, trend: "up", growth: 15 },
        { name: "AWS", demand: 65, trend: "up", growth: 20 },
        { name: "Machine Learning", demand: 45, trend: "up", growth: 25 }
      ],
      activeDepartments: [
        { name: "Computer Science", alumniCount: 150, mentorshipCount: 45, opportunitiesPosted: 32 },
        { name: "Electronics", alumniCount: 85, mentorshipCount: 22, opportunitiesPosted: 18 },
        { name: "Mechanical", alumniCount: 75, mentorshipCount: 18, opportunitiesPosted: 12 },
        { name: "Civil", alumniCount: 60, mentorshipCount: 12, opportunitiesPosted: 8 }
      ],
      studentInterests: [
        { name: "Web Development", count: 120 },
        { name: "AI/ML", count: 85 },
        { name: "Mobile Development", count: 65 },
        { name: "Cloud Computing", count: 45 },
        { name: "Cybersecurity", count: 32 }
      ]
    };

    res.json(insights);
  } catch (error) {
    console.error("Error fetching insights:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Deactivate/Remove alumni
app.post("/api/admin/alumni/:alumniId/:action", authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    const { alumniId, action } = req.params;
    const alumni = await User.findById(alumniId);

    if (!alumni || alumni.role !== "alumni") {
      return res.status(404).json({ message: "Alumni not found" });
    }

    if (action === "deactivate") {
      alumni.status = "inactive";
      await alumni.save();
      res.json({ message: "Alumni deactivated successfully" });
    } else if (action === "remove") {
      // Archive before deletion
      const archivedUser = new ArchivedUser({
        userId: alumni._id,
        name: alumni.name,
        email: alumni.email,
        department: alumni.department,
        batch: alumni.batch,
        removedBy: req.user._id
      });
      await archivedUser.save();
      
      await User.findByIdAndDelete(alumniId);
      res.json({ message: "Alumni removed successfully" });
    } else {
      res.status(400).json({ message: "Invalid action" });
    }
  } catch (error) {
    console.error("Error managing alumni:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Download reports
app.get("/api/admin/reports/:type", authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    const { type } = req.params;
    let data;

    switch (type) {
      case "overview":
        data = await User.find().select("-password");
        break;
      case "event":
        data = await Event.find().populate("speaker", "name");
        break;
      case "insights":
        // Reuse insights endpoint data
        const insightsRes = await axios.get(`${API_URL}/admin/insights`, {
          headers: { Authorization: req.headers.authorization }
        });
        data = insightsRes.data;
        break;
      default:
        return res.status(400).json({ message: "Invalid report type" });
    }

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=${type}-report-${Date.now()}.json`);
    res.send(JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("Error generating report:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// ========== ALUMNI DASHBOARD ROUTES ==========
// Alumni dashboard
app.get("/api/alumni/dashboard", authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== "alumni") {
      return res.status(403).json({ message: "Access denied" });
    }

    // Get opportunities posted by this alumni
    const postedOpportunities = await Opportunity.find({ 
      postedBy: req.user._id 
    }).sort({ createdAt: -1 });

    // Get connection requests
    const connectionRequests = await Connection.find({ 
      alumni: req.user._id,
      status: "pending"
    }).populate("student", "name email department batch cgpa skills");

    res.json({
      postedOpportunities,
      connectionRequests
    });
  } catch (error) {
    console.error("Error fetching alumni dashboard:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get connection requests for alumni
app.get("/api/connections/requests", authenticateToken, async (req, res) => {
  try {
    const connectionRequests = await Connection.find({ 
      alumni: req.user._id,
      status: "pending"
    }).populate("student", "name email department batch cgpa skills location bio");

    res.json(connectionRequests);
  } catch (error) {
    console.error("Error fetching connection requests:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Respond to connection request
app.post("/api/connections/:connectionId/respond", authenticateToken, async (req, res) => {
  try {
    const { action } = req.body;
    const connection = await Connection.findById(req.params.connectionId);

    if (!connection) {
      return res.status(404).json({ message: "Connection request not found" });
    }

    // Verify alumni owns this request
    if (connection.alumni.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Access denied" });
    }

    if (action === "accept") {
      connection.status = "accepted";
      
      // Add to user connections
      await User.findByIdAndUpdate(connection.student, {
        $push: {
          connections: {
            userId: connection.alumni,
            connectedAt: new Date(),
            connectionType: "alumni"
          }
        }
      });

      await User.findByIdAndUpdate(connection.alumni, {
        $push: {
          connections: {
            userId: connection.student,
            connectedAt: new Date(),
            connectionType: "student"
          }
        }
      });

      // Create notification for student
      const notification = new Notification({
        recipient: connection.student,
        sender: connection.alumni,
        type: "connection",
        title: "Connection Request Accepted",
        message: `${req.user.name} accepted your connection request`,
        relatedTo: connection._id
      });
      await notification.save();

    } else if (action === "reject") {
      connection.status = "rejected";

      // Create notification for student
      const notification = new Notification({
        recipient: connection.student,
        sender: connection.alumni,
        type: "connection",
        title: "Connection Request Rejected",
        message: `${req.user.name} rejected your connection request`,
        relatedTo: connection._id
      });
      await notification.save();
    }

    await connection.save();

    res.json({ 
      message: `Connection request ${action}ed successfully`,
      connection 
    });
  } catch (error) {
    console.error("Error responding to connection:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Create opportunity (alumni)
app.post("/api/opportunities", authenticateToken, async (req, res) => {
  try {
    const opportunityData = {
      ...req.body,
      postedBy: req.user._id
    };

    const opportunity = new Opportunity(opportunityData);
    await opportunity.save();

    res.json({ 
      message: "Opportunity posted successfully",
      opportunity 
    });
  } catch (error) {
    console.error("Error posting opportunity:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Delete opportunity
app.delete("/api/opportunities/:id", authenticateToken, async (req, res) => {
  try {
    const opportunity = await Opportunity.findById(req.params.id);

    if (!opportunity) {
      return res.status(404).json({ message: "Opportunity not found" });
    }

    // Check if user owns this opportunity
    if (opportunity.postedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Access denied" });
    }

    await Opportunity.findByIdAndDelete(req.params.id);

    res.json({ 
      message: "Opportunity deleted successfully" 
    });
  } catch (error) {
    console.error("Error deleting opportunity:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get all events
app.get("/api/events", async (req, res) => {
  try {
    const { type, upcoming = "true" } = req.query;

    const query = {};
    if (type && type !== "all") query.type = type;
    if (upcoming === "true") query.date = { $gte: new Date() };

    const events = await Event.find(query)
      .populate("speaker", "name company position")
      .sort({ date: 1 })
      .limit(50);

    const eventsWithPredictions = events.map((event) => ({
      ...event.toObject(),
      successPrediction: getEventSuccessPrediction(event),
      registrationCount: event.registrations?.length || 0,
      isUpcoming: event.date > new Date(),
    }));

    res.json(eventsWithPredictions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// Register for event
app.post("/api/events/:id/register", authenticateToken, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Check if already registered
    const alreadyRegistered = event.registrations.some(
      (reg) => reg.userId.toString() === req.user._id.toString(),
    );

    if (alreadyRegistered) {
      return res
        .status(400)
        .json({ message: "Already registered for this event" });
    }

    // Check if event is full
    if (
      event.maxAttendees &&
      event.registrations.length >= event.maxAttendees
    ) {
      return res.status(400).json({ message: "Event is full" });
    }

    event.registrations.push({
      userId: req.user._id,
      registeredAt: new Date(),
    });

    await event.save();

    const notification = new Notification({
      recipient: event.speaker || event.postedBy,
      sender: req.user._id,
      type: "event",
      title: "New Event Registration",
      message: `${req.user.name} registered for your event: ${event.title}`,
      relatedTo: event._id,
    });
    await notification.save();

    res.json({
      message: "Registered for event successfully",
      registration: event.registrations[event.registrations.length - 1],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// ========== CHATBOT ROUTES ==========

// Chatbot message endpoint
app.post('/api/chatbot/message', authenticateToken, async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || message.trim() === '') {
      return res.status(400).json({ 
        error: 'Message is required' 
      });
    }

    const response = await alumniChatbot.getResponse(
      req.user._id, 
      message, 
      req.user.role
    );
    
    res.json({
      success: true,
      ...response,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Chatbot error:', error);
    res.status(500).json({ 
      error: 'Failed to process chat message',
      message: error.message 
    });
  }
});

// Get chat history
app.get('/api/chatbot/history', authenticateToken, async (req, res) => {
  try {
    const { limit = 20 } = req.query;
    const history = await alumniChatbot.getChatHistory(
      req.user._id, 
      parseInt(limit)
    );
    
    res.json({
      success: true,
      history,
      count: history.length
    });
  } catch (error) {
    console.error('Error fetching chat history:', error);
    res.status(500).json({ 
      error: 'Failed to fetch chat history',
      message: error.message 
    });
  }
});

// Clear chat history
app.delete('/api/chatbot/history', authenticateToken, async (req, res) => {
  try {
    const success = await alumniChatbot.clearChatHistory(req.user._id);
    
    if (success) {
      res.json({ 
        success: true, 
        message: 'Chat history cleared successfully' 
      });
    } else {
      res.status(500).json({ 
        error: 'Failed to clear chat history' 
      });
    }
  } catch (error) {
    console.error('Error clearing chat history:', error);
    res.status(500).json({ 
      error: 'Failed to clear chat history',
      message: error.message 
    });
  }
});

// Get chatbot intents (for debugging/analytics)
app.get('/api/chatbot/intents', authenticateToken, async (req, res) => {
  try {
    const intents = Object.keys(CHATBOT_CONFIG.intents);
    
    res.json({
      success: true,
      intents,
      config: {
        name: CHATBOT_CONFIG.name,
        version: CHATBOT_CONFIG.version
      }
    });
  } catch (error) {
    console.error('Error fetching intents:', error);
    res.status(500).json({ 
      error: 'Failed to fetch intents',
      message: error.message 
    });
  }
});

// ========== CHATBOT INTEGRATION ==========
const natural = require('natural');
const { WordTokenizer, PorterStemmer } = natural;
const tokenizer = new WordTokenizer();

// Chatbot Configuration
const CHATBOT_CONFIG = {
  name: "AlumniBot",
  version: "1.0",
  systemPrompt: "You are AlumniBot, a helpful assistant for the Alumni Management System. Help users navigate alumni connections, opportunities, events, account management, and graduation processes.",
  
  // Intent categories (same as in chatbot.js)
  intents: {
    GREETING: ['hello', 'hi', 'hey', 'greetings', 'good morning', 'good afternoon'],
    FAREWELL: ['bye', 'goodbye', 'see you', 'farewell', 'exit', 'quit'],
    HELP: ['help', 'assist', 'support', 'guide', 'how to', 'what can'],
    ALUMNI_SEARCH: ['find alumni', 'search alumni', 'alumni directory', 'connect with alumni'],
    RECOMMENDATIONS: ['recommendations', 'suggest alumni', 'who should I connect', 'best matches'],
    OPPORTUNITIES: ['jobs', 'internships', 'opportunities', 'career opportunities', 'openings'],
    EVENTS: ['events', 'webinars', 'workshops', 'networking', 'career fair'],
    CONNECTIONS: ['my connections', 'connection requests', 'sent requests', 'connection status'],
    GRADUATION: ['graduation', 'graduating', 'final year', 'graduate process'],
    PROFILE: ['my profile', 'update profile', 'edit skills', 'change interests'],
    APPLICATIONS: ['my applications', 'applied opportunities', 'application status'],
    ADMIN_TASKS: ['pending approvals', 'manage users', 'system reports', 'admin tasks'],
    PLATFORM_INFO: ['what is this', 'about platform', 'features', 'how it works'],
    CONTACT_SUPPORT: ['contact admin', 'help desk', 'report issue', 'technical support']
  },
  
  responses: {
    GREETING: [
      "Hello! I'm AlumniBot, your AI assistant for the Alumni Management System. How can I help you today?",
      "Hi there! I'm here to help you navigate the alumni platform. What would you like to know?",
      "Welcome! I'm AlumniBot. How can I assist you with alumni connections, opportunities, or events?"
    ],
    FAREWELL: [
      "Goodbye! Feel free to reach out if you need more help.",
      "See you later! Don't hesitate to ask if you have more questions.",
      "Take care! Remember I'm here to help whenever you need assistance."
    ],
    DEFAULT: "I understand you're asking about {query}. Let me help you with that. Can you provide more details?"
  }
};

// Chat Session Schema
const chatSessionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  sessionId: { type: String, required: true, unique: true },
  messages: [{
    role: { type: String, enum: ["user", "assistant", "system"], required: true },
    content: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    intent: { type: String },
    confidence: { type: Number },
    entities: { type: Map, of: mongoose.Schema.Types.Mixed }
  }],
  context: {
    lastIntent: { type: String },
    conversationHistory: [{ type: String }],
    userPreferences: { type: Map, of: mongoose.Schema.Types.Mixed }
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) }
});

const ChatSession = mongoose.model("ChatSession", chatSessionSchema);

// Chatbot Engine Class
class AlumniChatbot {
  constructor() {
    this.classifier = new natural.BayesClassifier();
    this.initializeClassifier();
  }

  initializeClassifier() {
    for (const [intent, phrases] of Object.entries(CHATBOT_CONFIG.intents)) {
      phrases.forEach(phrase => {
        this.classifier.addDocument(this.preprocessText(phrase), intent);
      });
    }
    this.classifier.train();
    console.log("✅ Chatbot classifier trained");
  }

  preprocessText(text) {
    return text.toLowerCase()
      .replace(/[^\w\s]/g, "")
      .trim();
  }

  extractEntities(text) {
    const entities = {};
    const tokens = tokenizer.tokenize(text.toLowerCase());
    
    // Extract skills
    const skillKeywords = ["skill", "skills", "know", "proficient", "expert"];
    if (tokens.some(token => skillKeywords.includes(token))) {
      entities.skills = tokens.filter(token => 
        !skillKeywords.includes(token) && token.length > 3
      );
    }

    // Extract department
    const departments = ["computer science", "electronics", "mechanical", "civil", "electrical", "it"];
    const foundDept = departments.find(dept => text.toLowerCase().includes(dept));
    if (foundDept) entities.department = foundDept;

    // Extract batch/year
    const yearMatch = text.match(/\b(20\d{2})\b/);
    if (yearMatch) entities.year = yearMatch[1];

    return entities;
  }

  async detectIntent(text) {
    const preprocessedText = this.preprocessText(text);
    const classification = this.classifier.classify(preprocessedText);
    const classifications = this.classifier.getClassifications(preprocessedText);
    
    const confidence = classifications.reduce((max, curr) => 
      curr.value > max ? curr.value : max, 0
    );

    return {
      intent: classification || "UNKNOWN",
      confidence: confidence,
      entities: this.extractEntities(text)
    };
  }

  async getResponse(userId, query, userRole = "student") {
    try {
      const intentDetection = await this.detectIntent(query);
      
      let response = "";
      
      // Handle different intents
      switch(intentDetection.intent) {
        case "GREETING":
          response = this.getRandomResponse("GREETING");
          break;
          
        case "FAREWELL":
          response = this.getRandomResponse("FAREWELL");
          break;
          
        case "ALUMNI_SEARCH":
          response = await this.handleAlumniSearch(intentDetection, userId, userRole);
          break;
          
        case "RECOMMENDATIONS":
          response = await this.handleRecommendations(intentDetection, userId, userRole);
          break;
          
        case "OPPORTUNITIES":
          response = await this.handleOpportunities(intentDetection, userId, userRole);
          break;
          
        case "EVENTS":
          response = await this.handleEvents(intentDetection, userId, userRole);
          break;
          
        default:
          response = CHATBOT_CONFIG.responses.DEFAULT.replace("{query}", query);
      }

      // Store interaction
      await this.storeInteraction(userId, query, response, intentDetection);
      
      return {
        response,
        intent: intentDetection.intent,
        confidence: intentDetection.confidence,
        entities: intentDetection.entities
      };
    } catch (error) {
      console.error("Chatbot error:", error);
      return {
        response: "I'm having trouble processing your request. Please try again or contact support.",
        intent: "ERROR",
        confidence: 0,
        entities: {}
      };
    }
  }

  async handleAlumniSearch(intentDetection, userId, userRole) {
    const { entities } = intentDetection;
    let query = {};
    
    if (entities.department) {
      query.department = entities.department;
    }
    if (entities.skills && entities.skills.length > 0) {
      query["skills.name"] = { $in: entities.skills };
    }
    if (entities.year) {
      query.batch = parseInt(entities.year);
    }

    try {
      const alumni = await User.find({
        ...query,
        role: "alumni",
        status: "active"
      }).limit(5).select("name department batch company position skills");

      if (alumni.length === 0) {
        return "I couldn't find any alumni matching your criteria. Try searching with different keywords or browse all alumni profiles.";
      }

      let response = `I found ${alumni.length} alumni matching your search:\n\n`;
      alumni.forEach((alum, index) => {
        response += `${index + 1}. **${alum.name}**\n`;
        response += `   Department: ${alum.department}\n`;
        response += `   Batch: ${alum.batch}\n`;
        if (alum.company) response += `   Company: ${alum.company}\n`;
        if (alum.position) response += `   Position: ${alum.position}\n`;
        if (alum.skills && alum.skills.length > 0) {
          response += `   Skills: ${alum.skills.slice(0, 3).map(s => typeof s === "object" ? s.name : s).join(", ")}\n`;
        }
        response += "\n";
      });

      response += "You can connect with them from the Alumni Network tab or ask me for more details about a specific alumni.";
      return response;
    } catch (error) {
      console.error("Error searching alumni:", error);
      return "I encountered an error while searching for alumni. Please try again or contact support.";
    }
  }

  async handleRecommendations(intentDetection, userId, userRole) {
    if (userRole !== "student") {
      return "Personalized recommendations are available for students. Alumni and admins can browse profiles directly.";
    }

    try {
      const student = await User.findById(userId);
      if (!student) return "I couldn't find your student profile. Please make sure you're logged in.";

      // Get AI recommendations
      const recommendations = await Recommendation
        .find({ student: userId })
        .populate("alumni", "name department batch company position skills")
        .sort({ totalScore: -1 })
        .limit(3);

      if (recommendations.length === 0) {
        return "I couldn't find any recommendations for you yet. Please make sure your profile is complete with skills and interests for better matches.";
      }

      let response = `Based on your profile, here are your top ${recommendations.length} alumni recommendations:\n\n`;
      recommendations.forEach((rec, index) => {
        const alumni = rec.alumni;
        const score = Math.round(rec.totalScore * 100);
        response += `${index + 1}. **${alumni.name}** (${score}% match)\n`;
        response += `   Department: ${alumni.department}\n`;
        response += `   Batch: ${alumni.batch}\n`;
        if (alumni.company) response += `   Company: ${alumni.company}\n`;
        if (alumni.position) response += `   Position: ${alumni.position}\n`;
        response += `   Match quality: ${rec.matchQuality}\n`;
        response += "\n";
      });

      response += "You can connect with them directly or ask me for more details about a specific recommendation.";
      return response;
    } catch (error) {
      console.error("Error getting recommendations:", error);
      return "I encountered an error while fetching your recommendations. Please try again or check your profile completion.";
    }
  }

  async handleOpportunities(intentDetection, userId, userRole) {
    try {
      const opportunities = await Opportunity
        .find({ 
          status: "open",
          deadline: { $gt: new Date() }
        })
        .populate("postedBy", "name company")
        .sort({ createdAt: -1 })
        .limit(5);

      if (opportunities.length === 0) {
        return "There are no open opportunities at the moment. Check back later or ask me to notify you when new opportunities are posted.";
      }

      let response = `Here are the latest ${opportunities.length} opportunities:\n\n`;
      opportunities.forEach((opp, index) => {
        response += `${index + 1}. **${opp.title}**\n`;
        response += `   Company: ${opp.company}\n`;
        response += `   Type: ${opp.type}\n`;
        if (opp.location) response += `   Location: ${opp.location}\n`;
        if (opp.salary) response += `   Salary: ${opp.salary}\n`;
        response += `   Posted by: ${opp.postedBy?.name || "Alumni"}\n`;
        response += `   Deadline: ${new Date(opp.deadline).toLocaleDateString()}\n`;
        response += "\n";
      });

      response += "You can apply to these opportunities from the Opportunities tab.";
      return response;
    } catch (error) {
      console.error("Error fetching opportunities:", error);
      return "I encountered an error while fetching opportunities. Please try again.";
    }
  }

  async handleEvents(intentDetection, userId, userRole) {
    try {
      const events = await Event
        .find({ 
          date: { $gte: new Date() }
        })
        .populate("speaker", "name company")
        .sort({ date: 1 })
        .limit(5);

      if (events.length === 0) {
        return "There are no upcoming events scheduled. Check back later for new events.";
      }

      let response = `Here are the upcoming ${events.length} events:\n\n`;
      events.forEach((event, index) => {
        response += `${index + 1}. **${event.title}**\n`;
        response += `   Type: ${event.type}\n`;
        response += `   Date: ${new Date(event.date).toLocaleDateString()}\n`;
        response += `   Time: ${event.time}\n`;
        if (event.speaker) response += `   Speaker: ${event.speaker.name} (${event.speaker.company || "Alumni"})\n`;
        response += "\n";
      });

      return response;
    } catch (error) {
      console.error("Error fetching events:", error);
      return "I encountered an error while fetching events. Please try again.";
    }
  }

  getRandomResponse(intent) {
    const responses = CHATBOT_CONFIG.responses[intent];
    return responses[Math.floor(Math.random() * responses.length)];
  }

  async storeInteraction(userId, query, response, intentDetection) {
    try {
      let session = await ChatSession.findOne({ userId });
      
      if (!session) {
        session = new ChatSession({
          userId,
          sessionId: `chat_${Date.now()}_${userId}`,
          messages: []
        });
      }

      session.messages.push({
        role: "user",
        content: query,
        timestamp: new Date(),
        intent: intentDetection.intent,
        confidence: intentDetection.confidence,
        entities: intentDetection.entities
      });

      session.messages.push({
        role: "assistant",
        content: response,
        timestamp: new Date(),
        intent: intentDetection.intent
      });

      session.context.lastIntent = intentDetection.intent;
      session.updatedAt = new Date();
      
      await session.save();
    } catch (error) {
      console.error("Error storing chat interaction:", error);
    }
  }

  async getChatHistory(userId, limit = 10) {
    try {
      const session = await ChatSession.findOne({ userId });
      if (!session) return [];

      return session.messages
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, limit)
        .reverse();
    } catch (error) {
      console.error("Error fetching chat history:", error);
      return [];
    }
  }

  async clearChatHistory(userId) {
    try {
      await ChatSession.deleteMany({ userId });
      return true;
    } catch (error) {
      console.error("Error clearing chat history:", error);
      return false;
    }
  }
}

// Initialize chatbot
const alumniChatbot = new AlumniChatbot();

// ========== CHATBOT API ROUTES ==========
// Chatbot message endpoint
app.post("/api/chatbot/message", authenticateToken, async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || message.trim() === "") {
      return res.status(400).json({ 
        error: "Message is required" 
      });
    }

    const response = await alumniChatbot.getResponse(
      req.user._id, 
      message, 
      req.user.role
    );
    
    res.json({
      success: true,
      ...response,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Chatbot error:", error);
    res.status(500).json({ 
      error: "Failed to process chat message",
      message: error.message 
    });
  }
});

// Get chat history
app.get("/api/chatbot/history", authenticateToken, async (req, res) => {
  try {
    const { limit = 20 } = req.query;
    const history = await alumniChatbot.getChatHistory(
      req.user._id, 
      parseInt(limit)
    );
    
    res.json({
      success: true,
      history,
      count: history.length
    });
  } catch (error) {
    console.error("Error fetching chat history:", error);
    res.status(500).json({ 
      error: "Failed to fetch chat history",
      message: error.message 
    });
  }
});

// Clear chat history
app.delete("/api/chatbot/history", authenticateToken, async (req, res) => {
  try {
    const success = await alumniChatbot.clearChatHistory(req.user._id);
    
    if (success) {
      res.json({ 
        success: true, 
        message: "Chat history cleared successfully" 
      });
    } else {
      res.status(500).json({ 
        error: "Failed to clear chat history" 
      });
    }
  } catch (error) {
    console.error("Error clearing chat history:", error);
    res.status(500).json({ 
      error: "Failed to clear chat history",
      message: error.message 
    });
  }
});

// Get chatbot intents
app.get("/api/chatbot/intents", authenticateToken, async (req, res) => {
  try {
    const intents = Object.keys(CHATBOT_CONFIG.intents);
    
    res.json({
      success: true,
      intents,
      config: {
        name: CHATBOT_CONFIG.name,
        version: CHATBOT_CONFIG.version
      }
    });
  } catch (error) {
    console.error("Error fetching intents:", error);
    res.status(500).json({ 
      error: "Failed to fetch intents",
      message: error.message 
    });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, async () => {
  console.log(`✅ Backend server running on port ${PORT}`);
  console.log(`🌐 API Base URL: http://localhost:${PORT}`);
  await createInitialAdmin();
});

// Export for testing
module.exports = {
  app,
  User,
  Recommendation,
  Interaction,
  enhancedRecommendationEngine,
  opportunityRecommendationEngine,
};
