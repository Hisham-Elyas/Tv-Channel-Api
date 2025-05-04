const nodemailer = require("nodemailer");
require("dotenv").config();

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: 465, // Secure SSL SMTP
  secure: true, // Use SSL
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

exports.sendOtpEmail = async (email, otp) => {
  await transporter.sendMail({
    from: `"TV Plus" <${process.env.EMAIL_PASS}>'`,
    to: email,
    subject: "🔐 Your OTP for Password Reset",
    text: `Hello! Here's your OTP code: ${otp}\n\nIf you didn't request this, please ignore.`,
    html: `
      <div style="font-family: sans-serif; font-size: 16px;">
        <p>Hello,</p>
        <p>Your OTP code is: <strong>${otp}</strong></p>
        <p>It will expire in 10 minutes.</p>
        <p>If you didn't request this, you can safely ignore it.</p>
        <p>Thanks,<br/>TV Plus Team</p>
      </div>
    `,
  });
};
