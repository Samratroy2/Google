import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_EMAIL,
    pass: process.env.GMAIL_PASS,
  },
});

const sendEmail = async (toEmail, needTitle) => {
  try {
    const info = await transporter.sendMail({
      from: `SmartAid <${process.env.GMAIL_EMAIL}>`,
      to: toEmail,
      subject: "⭐ Rate Volunteers",
      html: `
        <h2>Task Completed</h2>
        <p>Your need "<b>${needTitle}</b>" is completed.</p>
        <p>Please login and rate volunteers.</p>
      `,
    });

    console.log("✅ EMAIL SUCCESS:", info.response);

  } catch (err) {
    console.error("❌ EMAIL FAILED:", err.message);
    throw err;
  }
};

export default sendEmail;