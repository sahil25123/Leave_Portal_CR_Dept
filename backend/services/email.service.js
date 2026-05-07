import fs from "fs";
import path from "path";
import nodemailer from "nodemailer";
import {
  buildAdminPasswordResetTemplate,
  buildLeaveAppliedForApplicantTemplate,
  buildLeaveAppliedForDeanTemplate,
  buildLeaveApprovedTemplate,
  buildLeaveRejectedTemplate,
} from "./email.templates.js";

const SMTP_HOST = process.env.EMAIL_SMTP_HOST || "smtp.gmail.com";
const SMTP_PORT = Number(process.env.EMAIL_SMTP_PORT || 465);
const SMTP_SECURE =
  String(process.env.EMAIL_SMTP_SECURE || "true").toLowerCase() !== "false";
const EMAIL_USER = process.env.EMAIL_USER || "";
const EMAIL_PASS = process.env.EMAIL_PASS || "";
const EMAIL_FROM = process.env.EMAIL_FROM || "";
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
const BACKEND_URL =
  process.env.BACKEND_URL ||
  process.env.API_BASE_URL ||
  "http://localhost:5000";

let transporter;

function isEmailConfigured() {
  return Boolean(EMAIL_USER && EMAIL_PASS);
}

function getTransporter() {
  if (!isEmailConfigured()) {
    return null;
  }

  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_SECURE,
      auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASS,
      },
    });
  }

  return transporter;
}

function getFromAddress() {
  if (EMAIL_FROM) {
    return EMAIL_FROM;
  }

  if (EMAIL_USER) {
    return '"Corporate Relations, IIT Delhi" <' + EMAIL_USER + ">";
  }

  return "Corporate Relations, IIT Delhi";
}

function normalizePath(filePath) {
  return String(filePath || "")
    .trim()
    .replace(/\\/g, "/")
    .replace(/^\/+/, "");
}

function resolvePortalUrl(pathname) {
  const baseUrl = String(FRONTEND_URL || "http://localhost:5173").replace(
    /\/+$/,
    "",
  );
  const cleanPath = pathname && pathname.startsWith("/") ? pathname : "/";

  return baseUrl + cleanPath;
}

function resolveAttachmentPublicUrl(attachmentPath) {
  const normalizedPath = normalizePath(attachmentPath);

  if (!normalizedPath) {
    return "";
  }

  if (/^https?:\/\//i.test(normalizedPath)) {
    return normalizedPath;
  }

  const apiBase = String(BACKEND_URL || "http://localhost:5000").replace(
    /\/+$/,
    "",
  );

  if (normalizedPath.startsWith("uploads/")) {
    return apiBase + "/" + normalizedPath;
  }

  return apiBase + "/uploads/" + normalizedPath;
}

function buildMailAttachments(attachmentPath) {
  const normalizedPath = normalizePath(attachmentPath);

  if (!normalizedPath || /^https?:\/\//i.test(normalizedPath)) {
    return [];
  }

  const absolutePath = path.resolve(process.cwd(), normalizedPath);

  if (!fs.existsSync(absolutePath)) {
    return [];
  }

  return [
    {
      filename: path.basename(normalizedPath),
      path: absolutePath,
    },
  ];
}

async function sendMail({ to, subject, html, text, attachments = [] }) {
  const transport = getTransporter();

  if (!transport) {
    console.warn(
      "[email] Skipping send because EMAIL_USER/EMAIL_PASS are not configured.",
    );
    return;
  }

  if (!to) {
    return;
  }

  await transport.sendMail({
    from: getFromAddress(),
    to,
    subject,
    html,
    text,
    attachments,
  });
}

async function sendMailSafe(payload, contextLabel) {
  try {
    await sendMail(payload);
  } catch (error) {
    console.error(
      "[email] Failed to send " + contextLabel + ":",
      error?.message || error,
    );
  }
}

export async function sendLeaveApplicationSubmittedEmails({
  dean,
  applicant,
  leave,
}) {
  try {
    const attachmentUrl = resolveAttachmentPublicUrl(leave?.attachment);
    const attachments = buildMailAttachments(leave?.attachment);

    const deanTemplate = buildLeaveAppliedForDeanTemplate({
      deanName: dean?.name || "Dean",
      applicantName: applicant?.name || "Staff Member",
      leave,
      portalUrl: resolvePortalUrl("/approvals"),
      attachmentUrl,
    });

    const applicantTemplate = buildLeaveAppliedForApplicantTemplate({
      applicantName: applicant?.name || "Staff Member",
      leave,
      portalUrl: resolvePortalUrl("/dashboard"),
      deanName: dean?.name || "Dean",
      attachmentUrl,
    });

    await Promise.allSettled([
      sendMailSafe(
        {
          to: dean?.email,
          ...deanTemplate,
          attachments,
        },
        "leave application email to dean",
      ),
      sendMailSafe(
        {
          to: applicant?.email,
          ...applicantTemplate,
          attachments,
        },
        "leave application confirmation to applicant",
      ),
    ]);
  } catch (error) {
    console.error(
      "[email] Unexpected error in sendLeaveApplicationSubmittedEmails:",
      error?.message || error,
    );
  }
}

export async function sendLeaveApprovedEmail({ dean, applicant, leave }) {
  try {
    const attachmentUrl = resolveAttachmentPublicUrl(leave?.attachment);
    const attachments = buildMailAttachments(leave?.attachment);

    const template = buildLeaveApprovedTemplate({
      applicantName: applicant?.name || "Staff Member",
      leave,
      approvedBy: dean?.name || "Dean",
      portalUrl: resolvePortalUrl("/dashboard"),
      attachmentUrl,
    });

    await sendMailSafe(
      {
        to: applicant?.email,
        ...template,
        attachments,
      },
      "leave approved notification",
    );
  } catch (error) {
    console.error(
      "[email] Unexpected error in sendLeaveApprovedEmail:",
      error?.message || error,
    );
  }
}

export async function sendLeaveRejectedEmail({
  dean,
  applicant,
  leave,
  remarks,
}) {
  try {
    const attachmentUrl = resolveAttachmentPublicUrl(leave?.attachment);
    const attachments = buildMailAttachments(leave?.attachment);

    const template = buildLeaveRejectedTemplate({
      applicantName: applicant?.name || "Staff Member",
      leave,
      rejectedBy: dean?.name || "Dean",
      remarks,
      portalUrl: resolvePortalUrl("/dashboard"),
      attachmentUrl,
    });

    await sendMailSafe(
      {
        to: applicant?.email,
        ...template,
        attachments,
      },
      "leave rejected notification",
    );
  } catch (error) {
    console.error(
      "[email] Unexpected error in sendLeaveRejectedEmail:",
      error?.message || error,
    );
  }
}

export async function sendLeaveCancelledEmail({
  dean,
  applicant,
  leave,
  cancelledByMessage,
}) {
  try {
    const attachmentUrl = resolveAttachmentPublicUrl(leave?.attachment);
    const attachments = buildMailAttachments(leave?.attachment);

    const applicantTemplate = buildLeaveCancelledTemplate({
      recipientName: applicant?.name || "Staff Member",
      leave,
      portalUrl: resolvePortalUrl("/dashboard"),
      cancelledByMessage,
      attachmentUrl,
    });

    await Promise.allSettled([
      sendMailSafe(
        {
          to: applicant?.email,
          ...applicantTemplate,
          attachments,
        },
        "leave cancelled notification to applicant",
      ),
      sendMailSafe(
        {
          to: dean?.email,
          ...applicantTemplate,
          attachments,
        },
        "leave cancelled notification to dean",
      ),
    ]);
  } catch (error) {
    console.error(
      "[email] Unexpected error in sendLeaveCancelledEmail:",
      error?.message || error,
    );
  }
}

export async function sendAdminPasswordResetEmail({ user }) {
  try {
    const template = buildAdminPasswordResetTemplate({
      recipientName: user?.name || "Staff Member",
      portalUrl: resolvePortalUrl("/login"),
    });

    await sendMailSafe(
      {
        to: user?.email,
        ...template,
      },
      "admin password reset notification",
    );
  } catch (error) {
    console.error(
      "[email] Unexpected error in sendAdminPasswordResetEmail:",
      error?.message || error,
    );
  }
}
