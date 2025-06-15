// routes/adminRoutes.js
const express = require("express")
const {
  createInitialAdmin,
  enrollPsychologist,
  getAllUsers,
  getPsychologists,
  updateUserStatus,
  createAdmin,
  updateAdminPermissions,
  hasPermission,
  updatePsychologistProfile,
  deletePsychologist, // Add this line
  getAdminProfile,
  getAllUserEmails,
  sendBulkEmailAlert,
  sendPersonalizedEmails,
  getEmailTemplates,
} = require("../controllers/adminController")
const { loginUser, changePassword } = require("../controllers/userController")
const { protect, adminOnly } = require("../middleware/authMiddleware")

const router = express.Router()

// Authentication Routes
router.post("/initial-setup", createInitialAdmin)
router.post("/login", loginUser)

// Admin Management Routes
router.post("/create-admin", protect, adminOnly, hasPermission("user_management"), createAdmin)
router.get("/profile", protect, adminOnly, getAdminProfile)
router.put("/change-password", protect, adminOnly, changePassword)
router.put("/admin-permissions", protect, adminOnly, hasPermission("user_management"), updateAdminPermissions)

// User Management Routes
router.get("/users", protect, adminOnly, hasPermission("user_management"), getAllUsers)
router.put("/user-status", protect, adminOnly, hasPermission("user_management"), updateUserStatus)

// Psychologist Management Routes
router.get("/psychologists", getPsychologists)
router.post("/psychologists", protect, adminOnly, hasPermission("psychologist_management"), enrollPsychologist)
router.put(
  "/psychologists/:psychologistId",
  protect,
  adminOnly,
  hasPermission("psychologist_management"),
  updatePsychologistProfile,
)

// Add this line after the existing psychologist routes
router.delete(
  "/psychologists/:psychologistId",
  protect,
  adminOnly,
  hasPermission("psychologist_management"),
  deletePsychologist,
)

// EMAIL MANAGEMENT ROUTES - NEW
router.get("/emails", protect, adminOnly, hasPermission("user_management"), getAllUserEmails)
router.post("/send-bulk-email", protect, adminOnly, hasPermission("user_management"), sendBulkEmailAlert)
router.post("/send-personalized-emails", protect, adminOnly, hasPermission("user_management"), sendPersonalizedEmails)
router.get("/email-templates", protect, adminOnly, getEmailTemplates)

module.exports = router
