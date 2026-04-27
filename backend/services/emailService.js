import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

export async function sendCompletionEmail(email, need) {
  try {
    await transporter.sendMail({
      from: `"SmartAid" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "✅ Task Completed",
      html: `
        <h2>Task Completed 🎉</h2>
        <p><b>${need.title}</b></p>
        <p>Location: ${need.location}</p>
      `
    });

    console.log("📧 Email sent:", email);
  } catch (err) {
    console.error("❌ Email error:", err);
  }
}