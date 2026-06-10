import nodemailer from "nodemailer";

type ContactMessage = {
  email: string;
  message: string;
  name: string;
  phone?: string;
  subject: string;
};

function getTransport() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT ?? 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    throw new Error("SMTP_HOST, SMTP_USER, and SMTP_PASS are required");
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass,
    },
  });
}

export async function sendContactMessage(message: ContactMessage) {
  const to = process.env.CONTACT_TO_EMAIL ?? process.env.SMTP_USER;

  if (!to) {
    throw new Error("CONTACT_TO_EMAIL or SMTP_USER is required");
  }

  const from = process.env.MAIL_FROM ?? process.env.SMTP_USER;

  await getTransport().sendMail({
    from,
    to,
    replyTo: message.email,
    subject: `Mama's Kitchen: ${message.subject}`,
    text: [
      `Name: ${message.name}`,
      `Email: ${message.email}`,
      `Phone: ${message.phone || "Not provided"}`,
      "",
      message.message,
    ].join("\n"),
  });
}
