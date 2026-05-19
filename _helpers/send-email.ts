import nodemailer from "nodemailer";

export default async function sendEmail({ to, subject, html, from = process.env.EMAIL_FROM || "noreply@example.com" }: any) {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.ethereal.email",
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER || "",
      pass: process.env.SMTP_PASS || ""
    },
    tls: { rejectUnauthorized: false }
  });

  const info = await transporter.sendMail({ from, to, subject, html });
  console.log("Email sent to:", to, "Message ID:", info.messageId);
  console.log("Preview URL:", nodemailer.getTestMessageUrl(info));
}
