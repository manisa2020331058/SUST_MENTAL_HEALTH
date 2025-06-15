const nodemailer = require("nodemailer")

// Create transporter with extensive debugging
const createTransporter = () => {
  console.log("🔍 Email Service Debug:")
  console.log("EMAIL_USER from env:", process.env.EMAIL_USER)
  console.log("EMAIL_PASSWORD exists:", !!process.env.EMAIL_PASSWORD)
  console.log("EMAIL_PASSWORD length:", process.env.EMAIL_PASSWORD?.length || 0)

  if (!process.env.EMAIL_USER) {
    throw new Error("EMAIL_USER environment variable is not set")
  }

  if (!process.env.EMAIL_PASSWORD) {
    throw new Error("EMAIL_PASSWORD environment variable is not set")
  }

  const transportConfig = {
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
    debug: true,
    logger: true,
  }

  console.log("📧 Creating transporter with config:", {
    service: transportConfig.service,
    user: transportConfig.auth.user,
    passwordSet: !!transportConfig.auth.pass,
  })

  return nodemailer.createTransport(transportConfig)
}

// Send email to multiple recipients
const sendBulkEmail = async (recipients, subject, htmlContent, textContent) => {
  try {
    console.log("📨 Starting bulk email send...")
    console.log("Recipients:", recipients)
    console.log("Subject:", subject)

    const transporter = createTransporter()

    // Test the connection first
    console.log("🔗 Testing SMTP connection...")
    await transporter.verify()
    console.log("✅ SMTP connection verified successfully")

    const mailOptions = {
      from: process.env.EMAIL_USER,
      bcc: recipients, // Use BCC to hide recipient list
      subject: subject,
      text: textContent,
      html: htmlContent || `<p>${textContent}</p>`,
    }

    console.log("📤 Sending email with options:", {
      from: mailOptions.from,
      recipientCount: recipients.length,
      subject: mailOptions.subject,
    })

    const result = await transporter.sendMail(mailOptions)
    console.log("✅ Email sent successfully:", result.messageId)

    return { success: true, messageId: result.messageId }
  } catch (error) {
    console.error("❌ Email sending error:", error)
    console.error("Error details:", {
      message: error.message,
      code: error.code,
      command: error.command,
    })
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

// NEW: Send welcome email with login credentials
const sendWelcomeEmail = async ({ recipientEmail, recipientName, password, specialization }) => {
  try {
    console.log(`📧 Sending welcome email to ${recipientEmail}`)

    const transporter = createTransporter()

    // Test the connection first
    await transporter.verify()

    const subject = "Welcome to SUST Psychology Department - Your Account Details"

    const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to SUST Psychology Department</title>
        <style>
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f4f4f4;
            }
            .container {
                background-color: #ffffff;
                padding: 30px;
                border-radius: 10px;
                box-shadow: 0 0 20px rgba(0,0,0,0.1);
            }
            .header {
                text-align: center;
                margin-bottom: 30px;
                padding-bottom: 20px;
                border-bottom: 3px solid #87ceeb;
            }
            .logo {
                font-size: 28px;
                font-weight: bold;
                color: #2f4f4f;
                margin-bottom: 10px;
            }
            .subtitle {
                color: #5f9ea0;
                font-size: 16px;
            }
            .welcome-message {
                background: linear-gradient(135deg, #87ceeb, #9caf88);
                color: white;
                padding: 20px;
                border-radius: 8px;
                text-align: center;
                margin: 20px 0;
            }
            .credentials-box {
                background-color: #f8f9fa;
                border: 2px solid #87ceeb;
                border-radius: 8px;
                padding: 20px;
                margin: 20px 0;
            }
            .credential-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin: 10px 0;
                padding: 10px;
                background-color: white;
                border-radius: 5px;
                border-left: 4px solid #5f9ea0;
            }
            .credential-label {
                font-weight: bold;
                color: #2f4f4f;
            }
            .credential-value {
                font-family: 'Courier New', monospace;
                background-color: #e6e9ec;
                padding: 5px 10px;
                border-radius: 4px;
                color: #2f4f4f;
            }
            .password-warning {
                background-color: #fff5f5;
                border: 1px solid #fed7d7;
                color: #c53030;
                padding: 15px;
                border-radius: 8px;
                margin: 20px 0;
            }
            .next-steps {
                background-color: #f0f8ff;
                border-left: 4px solid #87ceeb;
                padding: 20px;
                margin: 20px 0;
            }
            .step {
                margin: 10px 0;
                padding-left: 20px;
                position: relative;
            }
            .step::before {
                content: "✓";
                position: absolute;
                left: 0;
                color: #5f9ea0;
                font-weight: bold;
            }
            .footer {
                text-align: center;
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #e6e9ec;
                color: #666;
                font-size: 14px;
            }
            .contact-info {
                background-color: #f8f9fa;
                padding: 15px;
                border-radius: 8px;
                margin: 20px 0;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">🧠 SUST Psychology Department</div>
                <div class="subtitle">Mental Health Portal</div>
            </div>

            <div class="welcome-message">
                <h2>Welcome to Our Team, Dr. ${recipientName}!</h2>
                <p>We're excited to have you join our psychology department as a ${specialization} specialist.</p>
            </div>

            <p>Dear Dr. ${recipientName},</p>
            
            <p>Your account has been successfully created in our Psychology Department Management System. You can now access the platform to manage your sessions, view student assignments, and collaborate with our team.</p>

            <div class="credentials-box">
                <h3 style="color: #2f4f4f; margin-top: 0;">🔐 Your Login Credentials</h3>
                
                <div class="credential-item">
                    <span class="credential-label">Email Address:</span>
                    <span class="credential-value">${recipientEmail}</span>
                </div>
                
                <div class="credential-item">
                    <span class="credential-label">Temporary Password:</span>
                    <span class="credential-value">${password}</span>
                </div>
                
                <div class="credential-item">
                    <span class="credential-label">Role:</span>
                    <span class="credential-value">Psychologist</span>
                </div>
                
                <div class="credential-item">
                    <span class="credential-label">Specialization:</span>
                    <span class="credential-value">${specialization}</span>
                </div>
            </div>

            <div class="password-warning">
                <strong>🔒 Important Security Notice:</strong><br>
                This is a temporary password generated for your initial login. For security reasons, please change your password immediately after your first login.
            </div>

            <div class="next-steps">
                <h3 style="color: #2f4f4f; margin-top: 0;">📋 Next Steps</h3>
                <div class="step">Log in to the system using the credentials above</div>
                <div class="step">Complete your profile information</div>
                <div class="step">Set up your availability schedule</div>
                <div class="step">Change your password to something secure and memorable</div>
                <div class="step">Explore the platform features and familiarize yourself with the interface</div>
            </div>

            <div class="contact-info">
                <h3 style="color: #2f4f4f; margin-top: 0;">📞 Need Help?</h3>
                <p>If you have any questions or need assistance getting started, please don't hesitate to contact our support team or the system administrator.</p>
                <p><strong>Support Email:</strong> support@sust-psychology.edu</p>
                <p><strong>Admin Contact:</strong> admin@sust-psychology.edu</p>
            </div>

            <p>We look forward to working with you and appreciate your contribution to our students' mental health and well-being.</p>

            <div class="footer">
                <p><strong>SUST Psychology Department</strong><br>
                Mental Health Portal System<br>
                This email was sent automatically by the system.</p>
                <p style="font-size: 12px; color: #999;">
                    Please do not reply to this email. For support, use the contact information provided above.
                </p>
            </div>
        </div>
    </body>
    </html>
    `

    const textContent = `
Welcome to SUST Psychology Department - Dr. ${recipientName}

Your account has been successfully created in our Psychology Department Management System.

LOGIN CREDENTIALS:
Email: ${recipientEmail}
Temporary Password: ${password}
Role: Psychologist
Specialization: ${specialization}

IMPORTANT: This is a temporary password. Please change it immediately after your first login for security reasons.

NEXT STEPS:
1. Log in to the system using the credentials above
2. Complete your profile information
3. Set up your availability schedule
4. Change your password to something secure
5. Explore the platform features

For support, contact:
Support Email: support@sust-psychology.edu
Admin Contact: admin@sust-psychology.edu

Best regards,
SUST Psychology Department
    `

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: recipientEmail,
      subject: subject,
      text: textContent,
      html: htmlContent,
    }

    console.log("📤 Sending welcome email...")
    const result = await transporter.sendMail(mailOptions)
    console.log("✅ Welcome email sent successfully:", result.messageId)

    return { success: true, messageId: result.messageId }
  } catch (error) {
    console.error("❌ Welcome email sending error:", error)
    throw new Error("Failed to send welcome email: " + error.message)
  }
}

const sendWelcomeEmailToStudent = async ({ recipientEmail, recipientName, password, registrationNumber }) => {
  try {
    console.log(`📧 Sending welcome email to student ${recipientEmail}`)

    const transporter = createTransporter()
    await transporter.verify()

    const subject = "Welcome to SUST Mental Health Portal - Your Student Account Details"

    const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome Student</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background-color: #f4f4f4;
          padding: 20px;
          color: #333;
        }
        .container {
          background: #fff;
          border-radius: 10px;
          padding: 30px;
          max-width: 600px;
          margin: auto;
          box-shadow: 0 0 20px rgba(0,0,0,0.1);
        }
        .header {
          text-align: center;
          border-bottom: 3px solid #87ceeb;
          margin-bottom: 30px;
        }
        .logo {
          font-size: 26px;
          font-weight: bold;
          color: #2f4f4f;
        }
        .message {
          background: linear-gradient(135deg, #87ceeb, #9caf88);
          color: white;
          padding: 20px;
          border-radius: 8px;
          text-align: center;
          margin: 20px 0;
        }
        .credentials-box {
          background-color: #f8f9fa;
          padding: 20px;
          border-radius: 8px;
          border: 2px solid #87ceeb;
          margin: 20px 0;
        }
        .credential {
          display: flex;
          justify-content: space-between;
          margin: 10px 0;
          padding: 10px;
          background: #fff;
          border-left: 4px solid #5f9ea0;
          border-radius: 5px;
        }
        .label {
          font-weight: bold;
        }
        .value {
          font-family: monospace;
        }
        .notice {
          background: #fff3cd;
          padding: 15px;
          margin: 20px 0;
          border-left: 4px solid #ffeeba;
          border-radius: 5px;
        }
        .footer {
          font-size: 14px;
          color: #666;
          text-align: center;
          border-top: 1px solid #ddd;
          padding-top: 20px;
          margin-top: 30px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">🎓 SUST Mental Health Portal</div>
        </div>

        <div class="message">
          <h2>Welcome, ${recipientName}!</h2>
          <p>We’re glad to have you as part of the SUST mental wellness journey.</p>
        </div>

        <p>Dear ${recipientName},</p>
        <p>Your student account has been created in the SUST Psychology Department's Mental Health Portal.</p>
        <p>Here are your login details:</p>

        <div class="credentials-box">
          <div class="credential">
            <span class="label">Email:</span>
            <span class="value">${recipientEmail}</span>
          </div>
          <div class="credential">
            <span class="label">Password:</span>
            <span class="value">${password}</span>
          </div>
          <div class="credential">
            <span class="label">Registration No:</span>
            <span class="value">${registrationNumber}</span>
          </div>
          <div class="credential">
            <span class="label">Role:</span>
            <span class="value">Student</span>
          </div>
        </div>

        <div class="notice">
          <strong>Note:</strong> Please change your password after your first login for security purposes.
        </div>

        <p>Once logged in, you can:</p>
        <ul>
          <li>Explore mental health resources</li>
          <li>Book appointments with psychologists</li>
          <li>Attend sessions and track your progress</li>
          <li>Get motivational quotes tailored to your needs</li>
        </ul>

        <div class="footer">
          <p>Need help? Contact us:</p>
          <p><strong>Support:</strong> support@sust-psychology.edu</p>
          <p><strong>Admin:</strong> admin@sust-psychology.edu</p>
          <p>This email was sent automatically. Please do not reply.</p>
        </div>
      </div>
    </body>
    </html>
    `

    const textContent = `
Welcome ${recipientName} to SUST Mental Health Portal!

Your student account has been created.

LOGIN DETAILS:
Email: ${recipientEmail}
Password: ${password}
Registration No: ${registrationNumber}
Role: Student

IMPORTANT: Please change your password after logging in for the first time.

You can now:
- Explore resources
- Book psychologist appointments
- Track your mental health progress

Need help?
Support: support@sust-psychology.edu
Admin: admin@sust-psychology.edu

This is an automated email. Please do not reply.
    `

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: recipientEmail,
      subject: subject,
      text: textContent,
      html: htmlContent,
    }

    console.log("📤 Sending welcome email to student...")
    const result = await transporter.sendMail(mailOptions)
    console.log("✅ Student welcome email sent:", result.messageId)

    return { success: true, messageId: result.messageId }
  } catch (error) {
    console.error("❌ Error sending student welcome email:", error)
    throw new Error("Failed to send welcome email to student: " + error.message)
  }
}

module.exports = {
  sendBulkEmail,
  sendIndividualEmails,
  sendWelcomeEmail,
  sendWelcomeEmailToStudent,
}
