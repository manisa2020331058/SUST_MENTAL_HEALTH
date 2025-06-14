// controllers/adminController.js
const asyncHandler = require("express-async-handler")
const User = require("../models/User")
const Admin = require("../models/Admin")
const Psychologist = require("../models/Psychologist")
const Student = require("../models/Student")
const { psychologistProfilePicUpload } = require("../middleware/multerMiddleware")
const { sendBulkEmail, sendIndividualEmails } = require("../config/emailService")

// Create Initial Admin (One-time setup)
exports.createInitialAdmin = asyncHandler(async (req, res) => {
  const { email, password, name } = req.body

  // Check if first admin already exists
  const existingAdmin = await User.findOne({ role: "admin" })
  if (existingAdmin) {
    res.status(400)
    throw new Error("Initial admin already exists")
  }

  // Create user
  const user = new User({
    email,
    password,
    role: "admin",
    status: "active",
  })
  await user.save()

  // Assign all permissions to the first admin
  const admin = new Admin({
    user: user._id,
    name,
    permissions: ["user_management", "psychologist_management", "report_generation"], // Full permissions
  })
  await admin.save()

  res.status(201).json({ message: "Initial admin created successfully" })
})

// Create Additional Admin
exports.createAdmin = asyncHandler(async (req, res) => {
  const { email, password, name } = req.body

  // Check if the user already exists
  const existingUser = await User.findOne({ email })
  if (existingUser) {
    res.status(400)
    throw new Error("User with this email already exists")
  }

  // Create user with admin role
  const user = new User({
    email,
    password,
    role: "admin",
    status: "active",
    createdBy: req.user._id,
    creatorModel: "Admin",
  })
  await user.save()

  // Assign limited permissions by default
  const admin = new Admin({
    user: user._id,
    name,
    permissions: [], // No permissions by default
  })
  await admin.save()

  res.status(201).json({ message: "New admin created successfully with limited permissions" })
})

exports.hasPermission = (requiredPermission) => {
  return asyncHandler(async (req, res, next) => {
    // Check if the user is an admin
    if (req.user.role !== "admin") {
      res.status(403)
      throw new Error("Access denied. Only admins can perform this action.")
    }

    // Get admin details
    const admin = await Admin.findOne({ user: req.user._id })

    if (!admin) {
      res.status(403)
      throw new Error("Admin profile not found.")
    }

    // Check if the admin has the required permission
    if (!admin.permissions.includes(requiredPermission)) {
      res.status(403)
      throw new Error("You do not have permission to perform this action.")
    }

    next() // Proceed to the next middleware
  })
}

// Enroll Psychologist - FIXED RESPONSE FORMAT
exports.enrollPsychologist = asyncHandler(async (req, res) => {
  const { personalInfo, professionalInfo, contactInfo } = req.body

  if (!contactInfo || !contactInfo.email) {
    return res.status(400).json({ error: "Contact information with an email is required" })
  }

  // Check if user already exists
  const existingUser = await User.findOne({ email: contactInfo.email })
  if (existingUser) {
    res.status(400)
    throw new Error("User with this email already exists")
  }

  const profilePicPath = personalInfo.profileImage
    ? psychologistProfilePicUpload.uploadBase64Image(personalInfo.profileImage)
    : null

  // Create user
  const user = new User({
    email: contactInfo.email,
    password: "123456",
    role: "psychologist",
    status: "active",
    createdBy: req.user._id, // Admin who created the psychologist
    creatorModel: "Admin",
    profileImage: profilePicPath,
  })
  await user.save()

  // Create psychologist profile
  const psychologist = new Psychologist({
    user: user._id,
    personalInfo: {
      ...personalInfo,
      profileImage: profilePicPath, // Save profile picture path to psychologist
    },
    professionalInfo,
    contactInfo,
    profileImage: profilePicPath,
  })
  await psychologist.save()

  // FIXED: Return the same format as getPsychologists
  const formattedResponse = {
    _id: psychologist._id,
    personalInfo: {
      ...psychologist.personalInfo,
      profileImage: profilePicPath ? profilePicPath.replace(/\\/g, "/") : null,
    },
    professionalInfo: psychologist.professionalInfo,
    contactInfo: {
      ...psychologist.contactInfo,
      email: user.email, // Use the user's email
    },
    status: user.status, // Use the user's status
    availabilitySchedule: psychologist.availabilitySchedule,
  }

  res.status(201).json({
    message: "Psychologist enrolled successfully",
    psychologist: formattedResponse, // Return formatted response
  })
})

// Get Admin Profile
exports.getAdminProfile = asyncHandler(async (req, res) => {
  const admin = await Admin.findOne({ user: req.user._id }).populate("user", "-password")

  if (!admin) {
    res.status(404)
    throw new Error("Admin profile not found")
  }

  res.json({
    name: admin.name,
    email: admin.user.email,
    role: admin.user.role,
    permissions: admin.permissions,
  })
})

// Get All Users
exports.getAllUsers = asyncHandler(async (req, res) => {
  const users = await User.find({}, "-password")

  const formattedUsers = await Promise.all(
    users.map(async (user) => {
      let profile
      switch (user.role) {
        case "admin":
          profile = await Admin.findOne({ user: user._id })
          break
        case "psychologist":
          profile = await Psychologist.findOne({ user: user._id })
          break
        case "student":
          profile = await Student.findOne({ user: user._id })
          break
      }

      return {
        _id: user._id,
        email: user.email,
        role: user.role,
        status: user.status,
        name: profile?.name || profile?.personalInfo?.name || "N/A",
        createdAt: user.createdAt,
      }
    }),
  )

  res.json(formattedUsers)
})

// Get All Psychologists
exports.getPsychologists = asyncHandler(async (req, res) => {
  try {
    const psychologists = await Psychologist.find().populate("user", "email status")

    console.log(
      "Raw Psychologists:",
      psychologists.map((p) => ({
        _id: p._id,
        personalInfoImage: p.personalInfo?.profileImage,
        userEmail: p.user?.email,
      })),
    )

    const formattedPsychologists = psychologists
      .map((psych) => {
        try {
          // Ensure user exists
          if (!psych.user) {
            console.error("Psychologist without user:", psych._id)
            return null
          }

          // Safe access to profileImage
          const profileImagePath = psych.personalInfo?.profileImage
            ? psych.personalInfo.profileImage.replace(/\\/g, "/")
            : null

          return {
            _id: psych._id,
            personalInfo: {
              ...psych.personalInfo,
              profileImage: profileImagePath,
            },
            professionalInfo: psych.professionalInfo,
            contactInfo: {
              ...psych.contactInfo,
              email: psych.user.email,
            },
            status: psych.user.status,
            availabilitySchedule: psych.availabilitySchedule,
          }
        } catch (formatError) {
          console.error("Error formatting psychologist:", formatError)
          return null
        }
      })
      .filter((p) => p !== null) // Remove any null entries

    res.json(formattedPsychologists)
  } catch (error) {
    console.error("Full getPsychologists Error:", error)
    res.status(500).json({
      message: "Error retrieving psychologists",
      error: error.message,
      stack: error.stack,
    })
  }
})

// Update User Status
exports.updateUserStatus = asyncHandler(async (req, res) => {
  const { userId, status } = req.body

  if (!["active", "suspended"].includes(status)) {
    res.status(400)
    throw new Error("Invalid status value")
  }

  const user = await User.findById(userId)
  if (!user) {
    res.status(404)
    throw new Error("User not found")
  }

  user.status = status
  await user.save()

  res.json({
    message: "User status updated successfully",
    user: {
      _id: user._id,
      email: user.email,
      role: user.role,
      status: user.status,
    },
  })
})

// Update Admin Permissions
exports.updateAdminPermissions = asyncHandler(async (req, res) => {
  const { adminId, permissions } = req.body

  const admin = await Admin.findById(adminId)
  if (!admin) {
    res.status(404)
    throw new Error("Admin not found")
  }

  admin.permissions = permissions
  await admin.save()

  res.json({
    message: "Admin permissions updated successfully",
    admin: {
      _id: admin._id,
      permissions: admin.permissions,
    },
  })
})

// Update Psychologist Profile (Admin only) - FIXED
exports.updatePsychologistProfile = asyncHandler(async (req, res) => {
  const { psychologistId } = req.params
  const { personalInfo, professionalInfo, contactInfo, availabilitySchedule, status } = req.body

  // Find psychologist by ID, not by email
  const psychologist = await Psychologist.findById(psychologistId).populate("user")

  if (!psychologist) {
    res.status(404)
    throw new Error("Psychologist not found")
  }

  // Update the fields if provided
  if (personalInfo) psychologist.personalInfo = personalInfo
  if (professionalInfo) psychologist.professionalInfo = professionalInfo
  if (contactInfo) psychologist.contactInfo = contactInfo
  if (availabilitySchedule) psychologist.availabilitySchedule = availabilitySchedule

  // Update user status if provided
  if (status && psychologist.user) {
    psychologist.user.status = status
    await psychologist.user.save()
  }

  // Save the updated profile
  await psychologist.save()

  res.json({
    message: "Psychologist profile updated successfully",
    psychologist: {
      psychologistId: psychologist._id,
      userId: psychologist.user._id,
      personalInfo: psychologist.personalInfo,
      professionalInfo: psychologist.professionalInfo,
      contactInfo: psychologist.contactInfo,
      availabilitySchedule: psychologist.availabilitySchedule,
      status: psychologist.user.status,
    },
  })
})

// Delete Psychologist (Admin only)
exports.deletePsychologist = asyncHandler(async (req, res) => {
  const { psychologistId } = req.params

  try {
    // Find the psychologist first
    const psychologist = await Psychologist.findById(psychologistId).populate("user")

    if (!psychologist) {
      res.status(404)
      throw new Error("Psychologist not found")
    }

    // Check if psychologist has active sessions
    const Session = require("../models/Session")
    const activeSessions = await Session.find({
      psychologist: psychologistId,
      status: "scheduled",
      date: { $gte: new Date() },
    })

    if (activeSessions.length > 0) {
      res.status(400)
      throw new Error(
        `Cannot delete psychologist. They have ${activeSessions.length} active/scheduled sessions. Please cancel or reassign these sessions first.`,
      )
    }

    // Delete the user account first (this will cascade)
    if (psychologist.user) {
      await User.findByIdAndDelete(psychologist.user._id)
    }

    // Delete the psychologist profile
    await Psychologist.findByIdAndDelete(psychologistId)

    res.json({
      success: true,
      message: "Psychologist deleted successfully",
      deletedPsychologist: {
        id: psychologistId,
        name: psychologist.personalInfo?.name,
        email: psychologist.contactInfo?.email,
      },
    })
  } catch (error) {
    res.status(500)
    throw new Error("Failed to delete psychologist: " + error.message)
  }
})

// EMAIL ALERT FUNCTIONALITY - NEW FUNCTIONS

// Get all user emails for bulk operations
exports.getAllUserEmails = asyncHandler(async (req, res) => {
  const { roles } = req.query // Optional: filter by roles

  const query = { status: "active" } // Only get active users
  if (roles) {
    const roleArray = roles.split(",")
    query.role = { $in: roleArray }
  }

  const users = await User.find(query, "email role status")

  const emailList = users.map((user) => ({
    email: user.email,
    role: user.role,
  }))

  res.json({
    totalUsers: emailList.length,
    emails: emailList,
  })
})

// Send bulk email alert
exports.sendBulkEmailAlert = asyncHandler(async (req, res) => {
  const { subject, message, htmlMessage, recipients, targetRoles } = req.body

  if (!subject || !message) {
    res.status(400)
    throw new Error("Subject and message are required")
  }

  let emailList = []

  if (recipients && recipients.length > 0) {
    // Use specific recipients
    emailList = recipients
  } else if (targetRoles && targetRoles.length > 0) {
    // Get users by roles
    const users = await User.find(
      {
        role: { $in: targetRoles },
        status: "active",
      },
      "email role",
    )

    emailList = users.map((user) => user.email)
  } else {
    // Send to all active users
    const users = await User.find({ status: "active" }, "email")
    emailList = users.map((user) => user.email)
  }

  if (emailList.length === 0) {
    res.status(400)
    throw new Error("No recipients found")
  }

  try {
    const result = await sendBulkEmail(emailList, subject, htmlMessage || `<p>${message}</p>`, message)

    // Log the email activity
    const admin = await Admin.findOne({ user: req.user._id })
    if (admin) {
      // You can add email activity logging here if needed
      console.log(`Admin ${admin.name} sent email to ${emailList.length} recipients`)
    }

    res.json({
      success: true,
      message: "Email sent successfully",
      recipientCount: emailList.length,
      messageId: result.messageId,
    })
  } catch (error) {
    res.status(500)
    throw new Error("Failed to send email: " + error.message)
  }
})

// Send personalized emails
exports.sendPersonalizedEmails = asyncHandler(async (req, res) => {
  const { emailData } = req.body // Array of { recipient, subject, message, htmlMessage }

  if (!emailData || !Array.isArray(emailData) || emailData.length === 0) {
    res.status(400)
    throw new Error("Email data array is required")
  }

  // Validate each email data
  for (const email of emailData) {
    if (!email.recipient || !email.subject || !email.message) {
      res.status(400)
      throw new Error("Each email must have recipient, subject, and message")
    }
  }

  try {
    const formattedEmailData = emailData.map((email) => ({
      recipient: email.recipient,
      subject: email.subject,
      textContent: email.message,
      htmlContent: email.htmlMessage || `<p>${email.message}</p>`,
    }))

    const results = await sendIndividualEmails(formattedEmailData)

    const successCount = results.filter((r) => r.success).length
    const failureCount = results.filter((r) => !r.success).length

    res.json({
      success: true,
      message: "Personalized emails processed",
      totalSent: emailData.length,
      successCount,
      failureCount,
      results,
    })
  } catch (error) {
    res.status(500)
    throw new Error("Failed to send personalized emails: " + error.message)
  }
})

// Get email templates
exports.getEmailTemplates = asyncHandler(async (req, res) => {
  const templates = [
    {
      id: "welcome",
      name: "Welcome Message",
      subject: "Welcome to Psychology Department",
      content: "Welcome to our psychology department platform. We are excited to have you on board!",
    },
    {
      id: "maintenance",
      name: "System Maintenance",
      subject: "Scheduled System Maintenance",
      content:
        "We will be performing scheduled maintenance on [DATE] from [TIME] to [TIME]. The system will be temporarily unavailable during this period.",
    },
    {
      id: "announcement",
      name: "General Announcement",
      subject: "Important Announcement",
      content: "We have an important announcement to share with you. Please read the details below.",
    },
    {
      id: "session_reminder",
      name: "Session Reminder",
      subject: "Upcoming Session Reminder",
      content: "This is a reminder about your upcoming session scheduled for [DATE] at [TIME].",
    },
    {
      id: "emergency",
      name: "Emergency Alert",
      subject: "Emergency Alert - Psychology Department",
      content:
        "This is an emergency alert from the Psychology Department. Please read the following information carefully.",
    },
  ]

  res.json(templates)
})
