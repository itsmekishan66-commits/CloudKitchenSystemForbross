import nodemailer from "nodemailer";

type SiteInfo = {
  name: string;
  logo: string | null;
  url: string;
};

let cachedSiteInfo: SiteInfo | null = null;

async function getSiteInfo(): Promise<SiteInfo> {
  if (cachedSiteInfo) return cachedSiteInfo;
  try {
    const { getSiteSettings } = await import("@/db/services/site-settings");
    const settings = await getSiteSettings();
    cachedSiteInfo = {
      name: settings?.siteName ?? "Cloud Kitchen",
      logo: settings?.logo ?? null,
      url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
    };
  } catch {
    cachedSiteInfo = {
      name: "Cloud Kitchen",
      logo: null,
      url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
    };
  }
  return cachedSiteInfo;
}

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

function getLogoHtml(logo: string | null, siteUrl: string, siteName: string): string {
  if (logo) {
    const logoUrl = logo.startsWith("http") ? logo : `${siteUrl}${logo}`;
    return `<img src="${logoUrl}" alt="${siteName}" style="display:block;width:auto;height:48px;max-width:200px;object-fit:contain" />`;
  }
  return `<h1 style="margin:0;font-size:24px;font-weight:700;color:#1f2937">${siteName}</h1>`;
}

function baseHtml(content: string, siteName: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background-color:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f3f4f6;padding:24px 0">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.08)">
          ${content}
          <tr>
            <td style="padding:32px 40px;background-color:#f9fafb;border-top:1px solid #e5e7eb;text-align:center">
              <p style="margin:0 0 4px;font-size:13px;color:#9ca3af">${siteName} &mdash; made with love &amp; fresh ingredients</p>
              <p style="margin:0;font-size:12px;color:#d1d5db">If you didn&rsquo;t request this email, you can safely ignore it.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export async function sendOtpEmail(name: string, email: string, otp: string) {
  const from = process.env.MAIL_FROM ?? process.env.SMTP_USER;
  const { name: siteName, logo, url: siteUrl } = await getSiteInfo();

  const html = baseHtml(`
    <tr>
      <td style="padding:40px 40px 0">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td align="center">
              <a href="${siteUrl}" style="text-decoration:none">${getLogoHtml(logo, siteUrl, siteName)}</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td style="padding:32px 40px">
        <h2 style="margin:0 0 8px;font-size:22px;font-weight:600;color:#111827">Hey ${name} 👋</h2>
        <p style="margin:0 0 20px;font-size:16px;line-height:1.6;color:#4b5563">Ready to roll? Here&rsquo;s your verification code:</p>
        <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 24px">
          <tr>
            <td style="background-color:#f3f4f6;border-radius:8px;padding:16px 32px;letter-spacing:8px;font-size:32px;font-weight:700;color:#111827;font-family:monospace">${otp}</td>
          </tr>
        </table>
        <p style="margin:0 0 4px;font-size:14px;color:#6b7280">Use it within the next <strong>10 minutes</strong>.</p>
        <p style="margin:0;font-size:14px;color:#9ca3af">Didn&rsquo;t ask for this? Just ignore this message — nothing will happen.</p>
      </td>
    </tr>
    <tr>
      <td style="padding:0 40px 32px;text-align:center">
        <p style="margin:0;font-size:14px;color:#6b7280">Welcome aboard!<br /><span style="font-weight:600;color:#111827">${siteName} Team</span></p>
      </td>
    </tr>
  `, siteName);

  await getTransport().sendMail({
    from,
    to: email,
    subject: `Your ${siteName} verification code`,
    html,
    text: [
      `Hey ${name} 👋`,
      "",
      "Ready to roll? Here's your access code:",
      "",
      `OTP: ${otp}`,
      "",
      "Use it within the next 10 minutes.",
      "",
      "Didn't ask for this? Just ignore this message — nothing will happen.",
      "",
      "Welcome aboard!",
      `${siteName} Team`,
    ].join("\n"),
  });
}

export async function sendPasswordResetEmail(
  name: string,
  email: string,
  token: string,
) {
  const from = process.env.MAIL_FROM ?? process.env.SMTP_USER;
  const { name: siteName, logo, url: siteUrl } = await getSiteInfo();
  const resetLink = `${siteUrl}/reset-password?token=${token}`;

  const html = baseHtml(`
    <tr>
      <td style="padding:40px 40px 0">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td align="center">
              <a href="${siteUrl}" style="text-decoration:none">${getLogoHtml(logo, siteUrl, siteName)}</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td style="padding:32px 40px">
        <h2 style="margin:0 0 8px;font-size:22px;font-weight:600;color:#111827">Hey ${name},</h2>
        <p style="margin:0 0 24px;font-size:16px;line-height:1.6;color:#4b5563">We received a request to reset your <strong>${siteName}</strong> password.</p>
        <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 24px">
          <tr>
            <td align="center">
              <a href="${resetLink}" style="display:inline-block;background-color:#111827;color:#ffffff;font-size:16px;font-weight:600;text-decoration:none;padding:14px 36px;border-radius:8px">Reset Password</a>
            </td>
          </tr>
        </table>
        <p style="margin:0 0 4px;font-size:14px;color:#6b7280">This link will expire in <strong>1 hour</strong>.</p>
        <p style="margin:0;font-size:14px;color:#9ca3af">If you didn&rsquo;t request this, you can safely ignore this email.</p>
      </td>
    </tr>
    <tr>
      <td style="padding:0 40px 32px;text-align:center">
        <p style="margin:0;font-size:14px;color:#6b7280">Thanks,<br /><span style="font-weight:600;color:#111827">${siteName} Team</span></p>
      </td>
    </tr>
  `, siteName);

  await getTransport().sendMail({
    from,
    to: email,
    subject: `Reset your ${siteName} password`,
    html,
    text: [
      `Hey ${name},`,
      "",
      `We received a request to reset your ${siteName} password.`,
      "",
      "Click the link below to set a new password:",
      "",
      resetLink,
      "",
      "This link will expire in 1 hour.",
      "",
      "If you didn't request this, you can safely ignore this email.",
      "",
      "Thanks,",
      `${siteName} Team`,
    ].join("\n"),
  });
}

export async function sendContactMessage(message: ContactMessage) {
  const to = process.env.CONTACT_TO_EMAIL ?? process.env.SMTP_USER;

  if (!to) {
    throw new Error("CONTACT_TO_EMAIL or SMTP_USER is required");
  }

  const from = process.env.MAIL_FROM ?? process.env.SMTP_USER;
  const { name: siteName, logo, url: siteUrl } = await getSiteInfo();

  const html = baseHtml(`
    <tr>
      <td style="padding:40px 40px 0">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td align="center">
              <a href="${siteUrl}" style="text-decoration:none">${getLogoHtml(logo, siteUrl, siteName)}</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td style="padding:32px 40px">
        <h2 style="margin:0 0 20px;font-size:20px;font-weight:600;color:#111827">New Contact Message</h2>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px">
          <tr>
            <td style="padding:8px 0;font-size:14px;color:#6b7280;width:80px;vertical-align:top">Name</td>
            <td style="padding:8px 0;font-size:14px;color:#111827;font-weight:500">${message.name}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;font-size:14px;color:#6b7280;vertical-align:top">Email</td>
            <td style="padding:8px 0;font-size:14px;color:#111827;font-weight:500">${message.email}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;font-size:14px;color:#6b7280;vertical-align:top">Phone</td>
            <td style="padding:8px 0;font-size:14px;color:#111827;font-weight:500">${message.phone || "Not provided"}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;font-size:14px;color:#6b7280;vertical-align:top">Subject</td>
            <td style="padding:8px 0;font-size:14px;color:#111827;font-weight:500">${message.subject}</td>
          </tr>
        </table>
        <div style="background-color:#f9fafb;border-radius:8px;padding:16px 20px;font-size:14px;line-height:1.6;color:#4b5563;white-space:pre-wrap">${message.message}</div>
      </td>
    </tr>
  `, siteName);

  await getTransport().sendMail({
    from,
    to,
    replyTo: message.email,
    subject: `${siteName}: ${message.subject}`,
    html,
    text: [
      `Name: ${message.name}`,
      `Email: ${message.email}`,
      `Phone: ${message.phone || "Not provided"}`,
      `Subject: ${message.subject}`,
      "",
      message.message,
    ].join("\n"),
  });
}
