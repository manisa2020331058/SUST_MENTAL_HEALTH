const nodemailer = require("nodemailer")

// Create transporter (fixed method name)
const createTransporter = () => {
  return nodemailer.createTransport({
    // Changed from createTransporter to createTransport
    service: "gmail", // or your email service
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD, // Use app password for Gmail
    },
  })
}

// Send email to multiple recipients
const sendBulkEmail = async (recipients, subject, htmlContent, textContent) => {
  try {
    const transporter = createTransporter()

    const mailOptions = {
      from: process.env.EMAIL_USER,
      bcc: recipients, // Use BCC to hide recipient list
      subject: subject,
      text: textContent,
      html: htmlContent,
    }

    const result = await transporter.sendMail(mailOptions)
    return { success: true, messageId: result.messageId }
  } catch (error) {
    console.error("Email sending error:", error)
    throw new Error("Failed to send email: " + error.message)
  }
}

// Send individual emails (for personalized content)
const sendIndividualEmails = async (emailData) => {
  try {
    const transporter = createTransporter()
    const results = []

    for (const email of emailData) {
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email.recipient,
        subject: email.subject,
        text: email.textContent,
        html: email.htmlContent,
      }

      try {
        const result = await transporter.sendMail(mailOptions)
        results.push({
          recipient: email.recipient,
          success: true,
          messageId: result.messageId,
        })
      } catch (error) {
        results.push({
          recipient: email.recipient,
          success: false,
          error: error.message,
        })
      }
    }

    return results
  } catch (error) {
    throw new Error("Failed to send individual emails: " + error.message)
  }
}

module.exports = {
  sendBulkEmail,
  sendIndividualEmails,
}
