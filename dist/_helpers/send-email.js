"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = sendEmail;
const nodemailer_1 = __importDefault(require("nodemailer"));
async function sendEmail({ to, subject, html, from = process.env.EMAIL_FROM || "noreply@example.com" }) {
    const transporter = nodemailer_1.default.createTransport({
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
    console.log("Preview URL:", nodemailer_1.default.getTestMessageUrl(info));
}
