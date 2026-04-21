import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "samratroy721121@gmail.com",
    pass: "YOUR_APP_PASSWORD",
  },
});

const sendEmail = async (toEmail, needTitle) => {
  const mailOptions = {
    from: `SmartAid <samratroy721121@gmail.com>`,
    to: toEmail,
    subject: "⭐ Rate Volunteers",
    html: `
      <h2>Task Completed</h2>
      <p>Your need "<b>${needTitle}</b>" is completed.</p>
      <p>Please login and rate volunteers.</p>
    `,
  };

  await transporter.sendMail(mailOptions);
};

export default sendEmail;