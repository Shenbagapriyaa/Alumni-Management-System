// fixAdmin.js
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

async function fixAdmin() {
  try {
    await mongoose.connect("mongodb://127.0.0.1:27017/alumni_db");

    // Delete ALL users with admin role or similar emails
    const result = await mongoose.connection.collection("users").deleteMany({
      $or: [
        { email: "admin@college.edu" },
        { email: "ad@college.edu" },
        { role: "admin" },
      ],
    });

    console.log("Deleted", result.deletedCount, "admin users");

    // Create fresh admin with CORRECT email
    const hashedPassword = await bcrypt.hash("admin123", 10);

    await mongoose.connection.collection("users").insertOne({
      name: "System Admin",
      email: "admin@college.edu", // ✅ CORRECT EMAIL
      password: hashedPassword,
      registerNumber: "2000AD001",
      department: "Administration",
      batch: 2000,
      role: "admin",
      status: "approved",
      phone: "1234567890",
      createdAt: new Date(),
    });

    console.log("\n✅ Admin created successfully!");
    console.log("📧 Email: admin@college.edu");
    console.log("🔑 Password: admin123");
    console.log("👑 Role: admin");
    console.log("✅ Status: approved");

    // Verify
    const admin = await mongoose.connection.collection("users").findOne({
      email: "admin@college.edu",
    });

    if (admin) {
      console.log("\n✅ Verification successful!");
      console.log("Email:", admin.email);
      console.log("Role:", admin.role);
      console.log("Status:", admin.status);
    }

    await mongoose.disconnect();
  } catch (error) {
    console.error("Error:", error.message);
  }
}

fixAdmin();
