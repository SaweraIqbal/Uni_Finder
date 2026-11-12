import "dotenv/config";
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});

console.log("User:", process.env.SMTP_USER, "| Pass loaded:", !!process.env.SMTP_PASS);

try {
  await transporter.verify();
  console.log("SMTP OK");
  const info = await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: "hamzahamza898901@gmail.com",
    subject: "Test",
    text: "Hello",
  });
  console.log("Sent:", info.response);
} catch (err) {
  console.error("MAIL ERROR:", err.message);
}