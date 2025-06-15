// server.js
const express = require("express")
const dotenv = require("dotenv")
const cors = require("cors")
const mongoose = require("mongoose")
const connectDB = require("./config/db")
const { errorHandler, notFound } = require("./middleware/errorMiddleware")
const path = require("path")
const socketio = require("socket.io")
const http = require("http")
const Message = require("./models/Message") // Add this line
const Parser = require("rss-parser")
const aiRoutes = require("./routes/aiRoutes")

// Load environment variables FIRST - VERY IMPORTANT!
dotenv.config()

// DEBUG: Check if environment variables are loaded immediately
console.log("🔍 Environment Variables Check:")
console.log("EMAIL_USER:", process.env.EMAIL_USER || "❌ NOT SET")
console.log("EMAIL_PASSWORD:", process.env.EMAIL_PASSWORD ? "✅ SET" : "❌ NOT SET")
console.log("NODE_ENV:", process.env.NODE_ENV || "❌ NOT SET")
console.log("PORT:", process.env.PORT || "❌ NOT SET")

// Connect to MongoDB
connectDB()

// Create Express app
const app = express()

// Create HTTP server
const server = http.createServer(app)

// Initialize Socket.IO
const io = socketio(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
})

// Socket.IO connection handling
io.on("connection", (socket) => {
  console.log("New WebSocket connection")

  // Join personal room
  socket.on("join", (userId) => {
    socket.join(userId)
  })

  // Handle new message
  socket.on("sendMessage", async (data) => {
    try {
      const { sender, recipient, content } = data

      if (!sender || !recipient || !content) {
        console.error("Missing required fields:", { sender, recipient, content })
        return
      }

      // Create new message
      const message = new Message({
        sender,
        recipient,
        content,
      })

      await message.save()
      console.log("Message saved:", message)

      // Emit to recipient
      io.to(recipient).emit("message", {
        _id: message._id,
        sender,
        recipient,
        content,
        timestamp: message.createdAt,
      })

      // Also emit back to sender
      socket.emit("message", {
        _id: message._id,
        sender,
        recipient,
        content,
        timestamp: message.createdAt,
      })
    } catch (error) {
      console.error("Message error:", error)
      socket.emit("messageError", { error: error.message })
    }
  })

  // Handle typing
  socket.on("typing", ({ sender, recipient }) => {
    socket.to(recipient).emit("typing", { sender })
  })

  socket.on("disconnect", () => {
    console.log("User disconnected")
  })
})

// Middleware
app.use(cors())

// Remove deprecated warnings
mongoose.set("strictQuery", true)
app.use(express.json({ limit: "50mb" }))
app.use(express.urlencoded({ limit: "50mb", extended: true }))

// Root route
app.get("/", (req, res) => {
  res.json({
    message: "Welcome to SUST Mental Health Portal API",
    status: "Running",
    endpoints: [
      "/api/admin",
      "/api/students",
      "/api/psychologists",
      "/api/sessions",
      "/api/seminars",
      "api/users",
      "/api/ai",
      "api/reset-password",
    ],
  })
})

// Serve uploads folder statically
app.use("/uploads", express.static(path.join(__dirname, "uploads")))

// Routes
app.use("/api/ai", require("./routes/aiRoutes"))
app.use("/api/reset-password", require("./routes/resetPasswordRoutes"))
app.use("/api/admin", require("./routes/adminRoutes"))
app.use("/api/users", require("./routes/userRoutes"))
app.use("/api/students", require("./routes/studentRoutes"))
app.use("/api/psychologists", require("./routes/psychologistRoutes"))
app.use("/api/sessions", require("./routes/sessionRoutes"))
app.use("/api/seminars", require("./routes/seminarRoutes"))
app.use("/uploads", express.static(path.join(__dirname, "uploads")))
app.use("/api/messages", require("./routes/messageRoutes"))

// Favicon and unknown route handler
app.use((req, res, next) => {
  if (req.path === "/favicon.ico") {
    return res.status(204).end()
  }
  next()
})

// 404 Handler
app.use(notFound)

// Error Middleware
app.use(errorHandler)

// Port configuration
const PORT = process.env.PORT || 5000

// Start server using the HTTP server instance
server.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on http://localhost:${PORT}`)
})

// Handle unhandled promise rejections
process.on("unhandledRejection", (err, promise) => {
  console.log(`Error: ${err.message}`)
  server.close(() => process.exit(1))
})
