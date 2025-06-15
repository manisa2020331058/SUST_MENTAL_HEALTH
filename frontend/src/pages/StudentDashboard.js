"use client"

import { useState, useEffect, useRef, Suspense } from "react"
import {
  FaCommentDots,
  FaPaperPlane,
  FaTimes,
  FaEdit,
  FaCalendarPlus,
  FaChartLine,
  FaBook,
  FaClipboardList,
  FaRobot,
  FaPodcast,
  FaNewspaper,
  FaExternalLinkAlt,
  FaSearch,
  FaQuoteLeft,
  FaGamepad,
  FaCube,
  FaPuzzlePiece,
  FaSignOutAlt,
  FaKey,
} from "react-icons/fa"
import api from "../utils/api"
import "../styles/studentDashboard.css"
import { toast } from "react-toastify"
import { useChat } from "../contexts/ChatContext"

// Import images for services
import individualCounselingIcon from "../images/counseling.jpeg"
import workshopsIcon from "../images/seminar.jpeg"
import stressManagementIcon from "../images/resource.jpg"

const SeminarCard = ({ title, date, time, speaker, location, description }) => {
  const [isExpanded, setIsExpanded] = useState(false)

  const formatDate = (dateString) => {
    const options = {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }
    return new Date(dateString).toLocaleDateString("en-US", options)
  }

  return (
    <div className="seminar-card" onMouseEnter={() => setIsExpanded(true)} onMouseLeave={() => setIsExpanded(false)}>
      <div className="seminar-date">
        <span className="day">{new Date(date).getDate()}</span>
        <span className="month">{new Date(date).toLocaleString("default", { month: "short" })}</span>
      </div>
      <div className="seminar-content">
        <h3>{title}</h3>
        <div className="seminar-details">
          <p className="seminar-full-date">{formatDate(date)}</p>
          <div className="seminar-meta">
            <p>
              <i className="icon-clock"></i> {time}
            </p>
            <p>
              <i className="icon-user"></i> {speaker}
            </p>
            <p>
              <i className="icon-location"></i> {location}
            </p>
          </div>
          {isExpanded && (
            <div className="seminar-description">
              <p>{description}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const PsychologistCard = ({ name, specialization, image }) => {
  const fullImageUrl = image ? `http://localhost:5000/${image}` : "../image/default-avatar.png"

  return (
    <div className="psychologist-card">
      <img
        src={fullImageUrl || "/placeholder.svg"}
        alt={`${name}'s profile`}
        onError={(e) => {
          console.error("Image load error:", fullImageUrl)
          e.target.src = "../image/default-avatar.png"
        }}
      />
      <div className="psychologist-card-info">
        <h3>{name}</h3>
        <p>{specialization}</p>
      </div>
    </div>
  )
}

// Spline 3D Component
const SplineViewer = ({ url, className = "spline-viewer", modelType = "" }) => {
  const splineRef = useRef(null)
  const [key, setKey] = useState(0) // Force re-render key

  useEffect(() => {
    const script = document.createElement("script")
    script.type = "module"
    script.src = "https://unpkg.com/@splinetool/viewer@1.10.4/build/spline-viewer.js"
    script.async = true

    document.body.appendChild(script)

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script)
      }
    }
  }, [])

  // Force re-render when URL changes
  useEffect(() => {
    setKey((prev) => prev + 1)
  }, [url])

  return (
    <div className={`spline-container ${className} ${modelType ? `model-${modelType}` : ""}`} ref={splineRef}>
      <spline-viewer
        key={key} // This forces a complete re-render
        className="robot"
        url={url || "https://prod.spline.design/dIhHNXIIQy-bipak/scene.splinecode"}
      />
    </div>
  )
}

// Add state for articles and podcasts
const StudentDashboard = () => {

  const handleLogout = () => {
    // Remove the token from local storage.
    // The token might be stored under different keys, so we'll clear the most common ones.
    localStorage.removeItem("token")
    localStorage.removeItem("userInfo") // If you store user info separately

    // Redirect to the login page
    window.location.href = "http://localhost:3000/login"
  }


  // UI State
  const [activeSection, setActiveSection] = useState("dashboard")
  const [selectedGame, setSelectedGame] = useState("3d-robot")

  const [userId, setUserId] = useState(null)

  // Existing dashboard state
  const [dashboardData, setDashboardData] = useState({
    studentProfile: {
      studentId: null,
      userId: null,
      personalInfo: {},
      academicInfo: {},
      contactInfo: {},
      status: "",
    },
    createdBy: null,
    pastSessions: [],
    upcomingSessions: [],
  })
  const [sessionNotifications, setSessionNotifications] = useState([])
  const [showNotification, setShowNotification] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [hasPsychologist, setHasPsychologist] = useState(false)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState("")
  const [isChatOpen, setIsChatOpen] = useState(false)
  const messagesEndRef = useRef(null)
  const { socket, messages: chatMessages, sendMessage: socketSendMessage } = useChat()

  // New state for resources and seminars
  const [psychologists, setPsychologists] = useState([])
  const [seminars, setSeminars] = useState([])
  const [showAllSeminars, setShowAllSeminars] = useState(false)
  const [loading, setLoading] = useState(false)

  // New state for articles and podcasts
  const [articles, setArticles] = useState([])
  const [podcasts, setPodcasts] = useState([])
  const [searchTerm, setSearchTerm] = useState("")

  // Chat with MINDMATE state
  const [isMindmateOpen, setIsMindmateOpen] = useState(false)

  const [aiInputMessage, setAiInputMessage] = useState("")
  const [aiChatHistory, setAiChatHistory] = useState([])

  const [quote, setQuote] = useState("")
  const [quoteLoading, setQuoteLoading] = useState(true)

  const chatEndRef = useRef(null)
  const [profile, setProfile] = useState(null);
  const psychId = dashboardData.createdBy?.userId
  // Game options for Playzone
  const gameOptions = [
    {
      id: "3d-robot",
      name: "3D Robot",
      icon: FaRobot,
      description: "Interactive 3D robot companion for relaxation",
      splineUrl: "https://prod.spline.design/dIhHNXIIQy-bipak/scene.splinecode",
    },
    {
      id: "fidget-cube",
      name: "Fidget Cube",
      icon: FaCube,
      description: "Interactive fidget cube for stress relief",
      splineUrl: "https://prod.spline.design/rWUEDH1r6GObOYkj/scene.splinecode",
    },
    {
      id: "whac-a-thief",
      name: "Whac-a-Thief",
      icon: FaPuzzlePiece,
      description: "Fun interactive game to distract from stress",
      splineUrl: "https://prod.spline.design/w2QvmcPB3wyoy3oP/scene.splinecode",
    },
  ]

// At the top of your component:

useEffect(() => {
  if (!psychId) return;
  api.messages.getMessagesWithStudent(psychId)
    .then(res => setMessages(res.data))
    .catch(err => {
      console.error("Could not load chat", err);
      toast.error("Could not load chat");
    });
}, [psychId]);
  // 3) Auto-scroll to bottom
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendAiMessage = async () => {
    if (!aiInputMessage.trim()) return

    const userText = aiInputMessage
    setAiChatHistory([...aiChatHistory, { role: "user", text: userText }])
    setAiInputMessage("")

    try {
      const response = await fetch("http://localhost:5000/api/ai/aiChat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, message: userText }),
      })

      const data = await response.json()

      if (data.reply) {
        setAiChatHistory((prev) => [...prev, { role: "bot", text: data.reply }])
      } else {
        setAiChatHistory((prev) => [...prev, { role: "bot", text: "Sorry, something went wrong." }])
      }

      // Here call the update-summery api
      await fetch(`http://localhost:5000/api/ai/update-summary/${userId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ latestMessage: userText }),
      })
    } catch (err) {
      console.error(err)
      setAiChatHistory((prev) => [...prev, { role: "bot", text: "Error connecting to MindMate." }])
    }
  }

   // inside StudentDashboard()
const markAllRead = () => {
  if (!psychId) return;
  api.messages.markAsRead(psychId)
    .catch(console.error)
    .then(() => {
      setMessages(msgs => msgs.map(m => ({ ...m, read: true })));
    });
};

const handleToggleChat = () => {
  setIsChatOpen(open => {
    const next = !open;
    if (next) markAllRead();
    return next;
  });
};
  // Add useEffect to fetch articles and podcasts
  useEffect(() => {
    const fetchArticlesAndPodcasts = async () => {
      if (activeSection === "resources") {
        try {
          setLoading(true)

          // Fetch articles
          const articlesResponse = await fetch("http://localhost:5000/api/ai/getArticles")
          const articlesData = await articlesResponse.json()
          setArticles(articlesData)

          // Fetch podcasts
          const podcastsResponse = await fetch("http://localhost:5000/api/ai/podcasts")
          const podcastsData = await podcastsResponse.json()
          setPodcasts(podcastsData)

          setLoading(false)
        } catch (error) {
          console.error("Error fetching articles or podcasts:", error)
          setLoading(false)
        }
      }
    }

    fetchArticlesAndPodcasts()
  }, [activeSection])

  const addToGoogleCalendar = (session) => {
    const title = `Counseling Session with ${session.psychologist?.name || "Psychologist"}`
    const startDate = new Date(session.sessionDetails?.date || session.date)
    const [startHours, startMinutes] = (session.sessionDetails?.startTime || session.time).split(":")
    startDate.setHours(Number.parseInt(startHours), Number.parseInt(startMinutes))

    const endDate = new Date(startDate)
    endDate.setMinutes(endDate.getMinutes() + (session.duration || 60))

    const formatDate = (date) => {
      return date.toISOString().replace(/-|:|\.\d+/g, "")
    }

    const googleCalendarUrl = `https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${formatDate(startDate)}/${formatDate(endDate)}&details=${encodeURIComponent("Counseling session appointment")}&location=${encodeURIComponent(session.location || "University Counseling Center")}`

    window.open(googleCalendarUrl, "_blank")
  }

  const handleProfilePictureUpdate = async (event) => {
    const file = event.target.files[0]

    if (!file) {
      toast.error("No file selected")
      return
    }

    try {
      const base64Image = await convertFileToBase64(file)

      await api.post("/students/profile-picture", {
        personalInfo: { profileImage: base64Image },
      })

      const updatedDashboardResponse = await api.get("/students/dashboard-info")
      setDashboardData(updatedDashboardResponse.data)

      toast.success("Profile picture updated successfully")
    } catch (error) {
      console.error("Profile Picture Upload Error:", error)
      toast.error(error.response?.data?.error || "Failed to upload profile picture")
    }
  }

  const handleRemoveProfilePicture = async () => {
    try {
      await api.delete("/students/profile-picture")

      const updatedDashboardResponse = await api.get("/students/dashboard-info")
      setDashboardData(updatedDashboardResponse.data)

      toast.success("Profile picture removed successfully")
    } catch (error) {
      console.error("Profile Picture Remove Error:", error)
      toast.error(error.response?.data?.error || "Failed to remove profile picture")
    }
  }

  // Fetch Dashboard Data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true)
        const dashboardResponse = await api.get("/students/dashboard-info")

        console.log(dashboardResponse.data.studentProfile.userId)

        console.log("Dashboard Data:", dashboardResponse.data)

        setUserId(dashboardResponse.data.studentProfile.userId)

        if (dashboardResponse.data.studentProfile.personalInfo.profileImage) {
          const profileImage = dashboardResponse.data.studentProfile.personalInfo.profileImage
          dashboardResponse.data.studentProfile.personalInfo.profileImage = `http://localhost:5000/${profileImage.replace(/^\/+/, "")}`
        }
        setDashboardData(dashboardResponse.data)
        setIsLoading(false)
      } catch (error) {
        console.error("Dashboard Fetch Error:", error)
        setError({
          message: error.response?.data?.message || "An unexpected error occurred",
          status: error.response?.status || 500,
        })
        setIsLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  useEffect(() => {
    const fetchQuote = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/ai/getQuote/${userId}`)
        const data = await res.json()
        setQuote(data.quote)
        console.log("Fetched Quote:", data.quote)
      } catch (err) {
        console.error("Error fetching quote:", err)
        setQuote("Stay strong. You're doing better than you think.")
      } finally {
        setQuoteLoading(false)
      }
    }

    if (userId) {
      fetchQuote()
    }
  }, [userId])

  // Fetch psychologists and seminars for resources section
  useEffect(() => {
    const fetchPsychologists = async () => {
      try {
        setLoading(true)
        const response = await api.admin.getPsychologists()
        setPsychologists(response.data)
      } catch (error) {
        console.error("Error fetching psychologists:", error.message)
      } finally {
        setLoading(false)
      }
    }

    const fetchSeminars = async () => {
      try {
        const response = await api.get("/seminars")
        setSeminars(response.data)
      } catch (error) {
        console.error("Failed to fetch seminars:", error)
      }
    }

    if (activeSection === "resources" || activeSection === "seminars") {
      fetchPsychologists()
      fetchSeminars()
    }
  }, [activeSection])

  useEffect(() => {
    if (socket) {
      socket.on("message", (message) => {
        setMessages((prev) => [...prev, message])
        if (messagesEndRef.current) {
          messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
        }
      })

      return () => {
        socket.off("message")
      }
    }
  }, [socket])




  useEffect(() => {
    if ("Notification" in window) {
      Notification.requestPermission()
    }
  }, [])

  const showBrowserNotification = (title, body) => {
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(title, {
        body: body,
        icon: "/logo.png",
      })
    }
  }

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await api.get("/students/session-notifications")
        setSessionNotifications(response.data.notifications)

        if (response.data.notifications.length > 0) {
          setShowNotification(true)

          const soonSessions = response.data.notifications.filter(
            (notification) => notification.timeUntil.hours === 0 && notification.timeUntil.minutes <= 30,
          )

          soonSessions.forEach((session) => {
            showBrowserNotification(
              "Session Starting Soon",
              `Your session with ${session.psychologistName} starts in ${session.timeUntil.text}.`,
            )
          })
        }
      } catch (error) {
        console.error("Error fetching notifications:", error)
      }
    }

    fetchNotifications()

    const notificationInterval = setInterval(fetchNotifications, 5 * 60 * 1000)

    return () => clearInterval(notificationInterval)
  }, [])

  const convertFileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result)
      reader.onerror = (error) => reject(error)
    })
  }

  const SessionNotificationBanner = () => {
    if (!showNotification || sessionNotifications.length === 0) return null

    return (
      <div className="session-notification-banner">
        <div className="notification-content">
          <h3>Upcoming Session Reminder</h3>
          <p>You have {sessionNotifications.length} upcoming session(s) in the next 24 hours</p>
          {sessionNotifications.map((notification, index) => (
            <div key={index} className="notification-item">
              <p>
                <strong>{notification.title}</strong>
              </p>
              <p>
                Date: {notification.date} at {notification.time}
              </p>
              <p>Time remaining: {notification.timeUntil.text}</p>
            </div>
          ))}
        </div>
        <button className="close-notification" onClick={() => setShowNotification(false)}>
          <FaTimes />
        </button>
      </div>
    )
  }

  const handleSendMessage = async () => {
  console.log('Clicked Send', { psychId, newMessage });
  const text = newMessage.trim();
  if (!psychId) return console.warn('no psychId');
  if (!text   ) return console.warn('empty message');

  try {
    setSending(true);
    const res = await api.messages.sendMessage({
      recipient: psychId,
      content:   text
    });
    console.log('POST /messages ⇒', res.data);
    setMessages(ms => [...ms, res.data]);
    socketSendMessage(res.data);
    setNewMessage('');
  } catch (err) {
    console.error('Send failed:', err.response || err);
    toast.error('Failed to send message');
  } finally {
    setSending(false);
  }
};
  // Update the renderDashboard function to consolidate student information into one box
  const renderDashboard = () => (
    <div className="dashboard-main-content">
      <SessionNotificationBanner />

      {/* Chat with MINDMATE Button */}
      <div className="mindmate-section">
        {/* <button className="mindmate-chat-btn" onClick={() => setIsMindmateOpen(true)}>
          <FaRobot />
          <span>Chat with MINDMATE</span>
        </button> */}
        <div className="dashboard">
          {/* Other dashboard sections */}

          <div className="daily-motivation-section">
            <div className="motivation-header">
              <div className="quote-icon-wrapper">
                <FaQuoteLeft className="quote-icon" />
              </div>
              <h3 className="motivation-title">Daily Motivation</h3>
            </div>
            <div className="quote-container">
              {quoteLoading ? (
                <div className="quote-loading">
                  <div className="loading-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                  <p>Fetching your daily inspiration...</p>
                </div>
              ) : (
                <blockquote className="motivational-quote">
                  <span className="quote-text">{quote}</span>
                  <div className="quote-decoration">
                    <div className="quote-line"></div>
                    <div className="quote-heart">💙</div>
                    <div className="quote-line"></div>
                  </div>
                </blockquote>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Profile Section */}
      <div className="dashboard-section profile-section">
        <div className="profile-container">
          <div className="profile-picture-upload">
            <label className="profile-picture-label">Profile Picture</label>

            {dashboardData.studentProfile.personalInfo.profileImage ? (
              <div className="profile-picture-preview">
                <img
                  src={dashboardData.studentProfile.personalInfo.profileImage || "/placeholder.svg"}
                  alt="Profile"
                  className="preview-image"
                />
                <div className="profile-picture-actions">
                  <label htmlFor="profilePictureUpload" className="edit-profile-picture">
                    <FaEdit />
                  </label>

                  <button onClick={handleRemoveProfilePicture} className="remove-profile-picture">
                    <FaTimes />
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => document.getElementById("profilePictureUpload").click()}
                className="upload-placeholder"
              >
                <div className="upload-icon">+</div>
                Upload Profile Picture
              </button>
            )}

            <input
              type="file"
              accept="image/*"
              className="profile-picture-input"
              id="profilePictureUpload"
              onChange={handleProfilePictureUpdate}
              style={{ display: "none" }}
            />
          </div>

          <div className="profile-details">
            <h2>{dashboardData.studentProfile.personalInfo.name}</h2>
            <div className="student-info-card">
              <div className="student-info-content">
                <div className="info-section">
                  <h3>Personal Information</h3>
                  <p>
                    <strong>Gender:</strong> {dashboardData.studentProfile.personalInfo.gender}
                  </p>
                  <p>
                    <strong>Date of Birth:</strong>{" "}
                    {new Date(dashboardData.studentProfile.personalInfo.dateOfBirth).toLocaleDateString()}
                  </p>
                </div>

                <div className="info-section">
                  <h3>Academic Information</h3>
                  <p>
                    <strong>Department:</strong> {dashboardData.studentProfile.academicInfo.department}
                  </p>
                  <p>
                    <strong>Registration:</strong> {dashboardData.studentProfile.academicInfo.registrationNumber}
                  </p>
                  <p>
                    <strong>Current Year:</strong> {dashboardData.studentProfile.academicInfo.currentYear}
                  </p>
                </div>

                <div className="info-section">
                  <h3>Contact Information</h3>
                  <p>
                    <strong>Email:</strong> {dashboardData.studentProfile.contactInfo.email}
                  </p>
                  <p>
                    <strong>Phone:</strong> {dashboardData.studentProfile.contactInfo.phoneNumber}
                  </p>
                  <p>
                    <strong>Address:</strong> {dashboardData.studentProfile.contactInfo.address}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Rest of the dashboard content remains the same */}
      {/* Chat Widget */}
      {dashboardData.createdBy && (
        <div className="chat-widget">
          <div className="chat-trigger" onClick={() => setIsChatOpen(!isChatOpen)}>
            <FaCommentDots />
            {!isChatOpen && messages.filter((m) => !m.read).length > 0 && (
              <span className="chat-notification-badge">{messages.filter((m) => !m.read).length}</span>
            )}
          </div>

    {/* Modal */}
    {isChatOpen && (
      <div className="chat-modal">
        {/* Header */}
        <div className="chat-header">
          <h3>Chat with {dashboardData.createdBy?.name || "Psychologist"}</h3>
          <button className="close-chat" onClick={() => setIsChatOpen(false)}>
            <FaTimes />
          </button>
        </div>

        {/* Messages */}
        <div className="chat-messages">
          {messages.map((msg) => {
            const fromMe = msg.sender.toString() === dashboardData.studentProfile.userId
            return (
              <div key={msg._id} className={`message ${fromMe ? 'sent' : 'received'}`}>
                <div className="message-header">{fromMe ? 'You' : dashboardData.createdBy.name}</div>
                <div className="message-content">{msg.content}</div>
                <div className="message-time">
                  {new Date(msg.timestamp).toLocaleTimeString()}
                </div>
              </div>
            )
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="chat-input">
          <textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message…"
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSendMessage()
              }
            }}
          />
          <button onClick={handleSendMessage} disabled={sending || !newMessage.trim()}>
            
            <FaPaperPlane />
          </button>
          
        </div>
      </div>
    )}
  </div>
)}


      {/* Psychologist Section */}
      <div className="dashboard-section psychologist-section">
        <h2>My Psychologist</h2>
        {dashboardData.createdBy ? (
          <div className="psychologist-details">
            <div className="psychologist-info">
              <p>
                <strong>Name:</strong> {dashboardData.createdBy.name}
              </p>
              <p>
                <strong>Specialization:</strong> {dashboardData.createdBy.specialization}
              </p>
              <p>
                <strong>Contact:</strong> {dashboardData.createdBy.email}
              </p>
            </div>
          </div>
        ) : (
          <p>No psychologist has been assigned yet.</p>
        )}
      </div>

      {/* Sessions Section */}
      <div className="dashboard-section upcoming-sessions-section">
        <h2>Upcoming Sessions</h2>
        {dashboardData.upcomingSessions && dashboardData.upcomingSessions.length > 0 ? (
          <div className="sessions-grid">
            {dashboardData.upcomingSessions.map((session) => (
              <div key={session.sessionId} className="session-card">
                <div className="session-header">
                  <h3>{session.psychologist?.name || "Unknown Psychologist"}</h3>
                  <span className={`status-badge ${session.status || "scheduled"}`}>
                    {session.status || "Scheduled"}
                  </span>
                </div>

                <div className="session-details">
                  <p>
                    <strong>Date:</strong>{" "}
                    {session.sessionDetails?.date
                      ? new Date(session.sessionDetails.date).toLocaleDateString()
                      : session.date
                        ? new Date(session.date).toLocaleDateString()
                        : "Not specified"}
                  </p>
                  <p>
                    <strong>Time:</strong> {session.sessionDetails?.startTime || session.time || "Not specified"}
                    {(session.sessionDetails?.endTime || session.endTime) &&
                      ` - ${session.sessionDetails?.endTime || session.endTime}`}
                  </p>
                </div>

                <div className="session-actions">
                  <button className="session-action-btn" onClick={() => addToGoogleCalendar(session)}>
                    <FaCalendarPlus /> Add to Calendar
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p>No upcoming sessions scheduled.</p>
        )}
      </div>

      <div className="dashboard-section past-sessions-section">
        <h2>Past Sessions</h2>
        {dashboardData.pastSessions && dashboardData.pastSessions.length > 0 ? (
          <div className="sessions-grid">
            {dashboardData.pastSessions.map((session, index) => (
              <div key={session.sessionId || index} className="session-card">
                <div className="session-header">
                  <h3>{session.psychologist?.name || "Unknown Psychologist"}</h3>
                  <span className={`status-badge ${session.status || "unknown"}`}>{session.status || "Unknown"}</span>
                </div>
                <div className="session-details">
                  {session.sessionDetails?.date && (
                    <p>
                      <strong>Date:</strong> {new Date(session.sessionDetails.date).toLocaleDateString()}
                    </p>
                  )}
                  {session.sessionDetails?.startTime && (
                    <p>
                      <strong>Time:</strong> {session.sessionDetails.startTime}
                      {session.sessionDetails.endTime && ` - ${session.sessionDetails.endTime}`}
                    </p>
                  )}
                  {session.sessionDetails?.type && (
                    <p>
                      <strong>Type:</strong> {session.sessionDetails.type}
                    </p>
                  )}
                  {session.notes && (
                    <div className="session-notes">
                      <strong>Notes:</strong>
                      <p>{session.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p>No past sessions found.</p>
        )}
      </div>

      {/* MINDMATE Chat Modal */}
      {isMindmateOpen && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div className="chat-header">
              <h3>
                <FaRobot /> Chat with MINDMATE
              </h3>
              <button className="close-chat" onClick={() => setIsMindmateOpen(false)}>
                <FaTimes />
              </button>
            </div>

            <div className="mindmate-chat-area">
              {/* Chat Messages */}
              <div className="chat-messages" ref={chatEndRef}>
                {aiChatHistory.map((msg, idx) => (
                  <div key={idx} className={`chat-bubble ${msg.role === "user" ? "user-msg" : "bot-msg"}`}>
                    <p>{msg.text}</p>
                  </div>
                ))}
              </div>

              {/* Input Area */}
              <div className="chat-input-area">
                <input
                  type="text"
                  placeholder="Type your message..."
                  value={aiInputMessage}
                  onChange={(e) => setAiInputMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") sendAiMessage()
                  }}
                />
                <button onClick={sendAiMessage}>
                  <FaPaperPlane />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )

  const renderPlayzone = () => (
    <div className="playzone-section">
      <div className="playzone-header">
        <h2>
          <FaGamepad /> Playzone
        </h2>
        <p>Interactive games and activities for relaxation and stress relief</p>
      </div>

      <div className="game-selector">
        <h3>Choose Your Activity</h3>
        <div className="game-options">
          {gameOptions.map((game) => (
            <button
              key={game.id}
              className={`game-option ${selectedGame === game.id ? "active" : ""}`}
              onClick={() => {
                console.log("Selected game:", game.name, "URL:", game.splineUrl) // Debug log
                setSelectedGame(game.id)
              }}
            >
              <game.icon className="game-icon" />
              <div className="game-info">
                <h4>{game.name}</h4>
                <p>{game.description}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="game-canvas-container">
        <div className="game-canvas">
          {(() => {
            const selectedGameData = gameOptions.find((g) => g.id === selectedGame)
            console.log("Rendering SplineViewer with URL:", selectedGameData?.splineUrl) // Debug log
            return (
              <SplineViewer url={selectedGameData?.splineUrl} className="playzone-spline" modelType={selectedGame} />
            )
          })()}
        </div>
        <div className="game-instructions">
          <h4>How to Play</h4>
          <p>
            Interact with the 3D object using your mouse or touch. Let the gentle movements help you relax and focus.
          </p>
          <div className="relaxation-tips">
            <h5>Relaxation Tips:</h5>
            <ul>
              <li>Take deep breaths while interacting</li>
              <li>Focus on the smooth movements</li>
              <li>Let your mind wander freely</li>
              <li>Take breaks when needed</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )

  const renderResources = () => {
    const serviceDetails = [
      {
        image: individualCounselingIcon,
        title: "Individual Counseling",
        description: "Personalized one-on-one support for students",
        category: "Support",
      },
      {
        image: workshopsIcon,
        title: "Mental Health Seminars",
        description: "Educational workshops and awareness programs",
        category: "Education",
      },
      {
        image: stressManagementIcon,
        title: "Mental Wellness Resources",
        description: "Comprehensive support materials and guides",
        category: "Information",
      },
    ]

    // Filter articles based on search term
    const filteredArticles = articles.filter(
      (article) =>
        article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        article.summary.toLowerCase().includes(searchTerm.toLowerCase()),
    )

    return (
      <div className="resources-section">
        <h2>Mental Health Resources</h2>

        <div className="services-content">
          <div className="services-grid">
            {serviceDetails.map((service, index) => (
              <div key={index} className="service-card">
                <div className="service-image-wrapper">
                  <img src={service.image || "/placeholder.svg"} alt={service.title} className="service-image" />
                  <div className="service-overlay">
                    <h3>{service.title}</h3>
                    <p>{service.description}</p>
                    <span className="service-category">{service.category}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="psychologists-section">
          <h2>Meet Our Psychologists</h2>
          <Suspense fallback={<div className="loading-grid">Loading...</div>}>
            <div className="psychologist-grid">
              {psychologists.map((psych) => (
                <PsychologistCard
                  key={psych._id}
                  name={psych.personalInfo.name}
                  specialization={psych.professionalInfo.specialization}
                  image={psych.personalInfo.profileImage}
                />
              ))}
            </div>
          </Suspense>
        </div>

        {/* Articles Section */}
        <div className="articles-section">
          <h2>Mental Health Articles</h2>
          <div className="resources-search-container">
            <div className="search-input-wrapper">
              <FaSearch className="search-icon" />
              <input
                type="text"
                placeholder="Search articles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
          </div>

          <div className="resources-grid">
            {loading ? (
              <div className="loading-grid">Loading articles...</div>
            ) : filteredArticles.length > 0 ? (
              filteredArticles.map((article, index) => (
                <div key={index} className="resource-card">
                  <div className="resource-card-header">
                    <div className="resource-icon">
                      <FaNewspaper />
                    </div>
                    <span className="resource-type">Article</span>
                  </div>
                  <div className="resource-content">
                    <h3>{article.title}</h3>
                    <p>{article.summary}</p>
                    <a href={article.link} target="_blank" rel="noopener noreferrer" className="resource-button-link">
                      <button className="resource-button">
                        Start Reading <FaExternalLinkAlt className="external-icon" />
                      </button>
                    </a>
                  </div>
                </div>
              ))
            ) : (
              <div className="no-resources">
                <p>No articles found matching your search</p>
              </div>
            )}
          </div>
        </div>

        {/* Podcasts Section */}
        <div className="podcasts-section">
          <h2>Mental Health Podcasts</h2>
          <div className="featured-grid">
            {loading ? (
              <div className="loading-grid">Loading podcasts...</div>
            ) : podcasts.length > 0 ? (
              podcasts.map((podcast, index) => (
                <div key={index} className="featured-card">
                  <FaPodcast className="featured-icon" />
                  <h3>{podcast.title}</h3>
                  <p>{podcast.summary.split("\n")[0]}</p>
                  {podcast.link && (
                    <a href={podcast.link} target="_blank" rel="noopener noreferrer" className="podcast-link">
                      <button className="podcast-button">
                        Listen Now <FaExternalLinkAlt className="external-icon" />
                      </button>
                    </a>
                  )}
                </div>
              ))
            ) : (
              <div className="no-resources">
                <p>No podcast episodes available</p>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  const renderSeminars = () => (
    <div className="seminars-section">
      <h2>Upcoming Mental Health Seminars</h2>
      <div className="seminars-grid">
        {(showAllSeminars ? seminars : seminars.slice(0, 6)).map((seminar, index) => (
          <SeminarCard key={index} {...seminar} />
        ))}
      </div>
      {seminars.length > 6 && (
        <div className="see-more-container">
          <button className="see-more-button" onClick={() => setShowAllSeminars(!showAllSeminars)}>
            {showAllSeminars ? "See Less" : "See More"}
          </button>
        </div>
      )}
    </div>
  )

  const handlePasswordReset = async () => {
    if (newPassword !== confirmPassword) {
      setMessage("❌ Passwords do not match.")
      return
    }

    try {

      const response = await fetch("http://localhost:5000/api/reset-password/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: userId,
          newPassword: newPassword
        }),
      });
      

      if (response.ok) {
        setMessage("✅ Password updated successfully.")
      } else {
        const data = await response.json()
        setMessage("❌ " + (data.message || "Failed to update password."))
      }
    } catch (error) {
      setMessage("❌ Error: " + error.message)
    }
  }


  // ResetPasswordComponent.jsx

  const renderResetPassword = () => (
    <div className="reset-password-container">
      <h2>🔐 Reset Your Password</h2>

      <div className="form-group">
        <label>New Password:</label>
        <div className="password-input">
          <input
            type={showNewPassword ? "text" : "password"}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Enter new password"
          />
          <button
            type="button"
            className="toggle-btn"
            onClick={() => setShowNewPassword((prev) => !prev)}
          >
            {showNewPassword ? "🙈" : "👁️"}
          </button>
        </div>
      </div>

      <div className="form-group">
        <label>Confirm Password:</label>
        <div className="password-input">
          <input
            type={showConfirmPassword ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Re-enter new password"
          />
          <button
            type="button"
            className="toggle-btn"
            onClick={() => setShowConfirmPassword((prev) => !prev)}
          >
            {showConfirmPassword ? "🙈" : "👁️"}
          </button>
        </div>
      </div>

      <button className="submit-btn" onClick={handlePasswordReset}>
        🔄 Update Password
      </button>

      {message && <p className={`message ${message.startsWith("✅") ? "success" : "error"}`}>{message}</p>}
    </div>
  );


  const renderContent = () => {
    switch (activeSection) {
      case "dashboard":
        return renderDashboard()
      case "playzone":
        return renderPlayzone()
      case "resources":
        return renderResources()
      case "seminars":
        return renderSeminars()
      case "resetPassword":
        return renderResetPassword()
      default:
        return renderDashboard()
    }
  }

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="error-container">
        <h2>Dashboard Loading Error</h2>
        <p>Status: {error.status}</p>
        <p>Message: {error.message}</p>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    )
  }

  return (
    <div className="student-dashboard">
      {/* Sidebar Navigation */}
      <nav className="dashboard-nav">
        <ul>
          <li className={activeSection === "dashboard" ? "active" : ""}>
            <button onClick={() => setActiveSection("dashboard")}>
              <FaChartLine /> Dashboard
            </button>
          </li>
          <li className={activeSection === "playzone" ? "active" : ""}>
            <button onClick={() => setActiveSection("playzone")}>
              <FaGamepad /> Playzone
            </button>
          </li>
          <li className={activeSection === "resources" ? "active" : ""}>
            <button onClick={() => setActiveSection("resources")}>
              <FaBook /> Resources
            </button>
          </li>
          <li className={activeSection === "seminars" ? "active" : ""}>
            <button onClick={() => setActiveSection("seminars")}>
              <FaClipboardList /> Seminars
            </button>
          </li>
          <li className={activeSection === "resetPassword" ? "active" : ""}>
            <button onClick={() => setActiveSection("resetPassword")}>
              <FaKey /> Reset Password
            </button>
          </li>
          <li className="logout-butto">
            <button onClick={handleLogout}>
              <FaSignOutAlt /> Logout
            </button>
          </li>
        </ul>
      </nav>

      {/* Main Content */}
      <main className="dashboard-content">{renderContent()}</main>
    </div>
  )
}

export default StudentDashboard;
