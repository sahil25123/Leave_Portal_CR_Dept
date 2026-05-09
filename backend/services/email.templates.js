const COMPANY_NAME = "Leave Management Portal - Corporate Relations";
const COMPANY_LOGO_URL =
  process.env.COMPANY_LOGO_URL ||
  "https://upload.wikimedia.org/wikipedia/en/thumb/e/e3/Indian_Institute_of_Technology_Delhi_Logo.svg/120px-Indian_Institute_of_Technology_Delhi_Logo.svg.png";

const STATUS_META = {
  pending_dean: {
    label: "Pending",
    textColor: "#9a6700",
    backgroundColor: "#fff8c5",
  },
  approved: {
    label: "Approved",
    textColor: "#166534",
    backgroundColor: "#dcfce7",
  },
  rejected: {
    label: "Rejected",
    textColor: "#991b1b",
    backgroundColor: "#fee2e2",
  },
  cancelled: {
    label: "Cancelled",
    textColor: "#0f172a",
    backgroundColor: "#f1f5f9",
  },
};

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatDateValue(value) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

function formatDays(value) {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return "-";
  }

  if (Number.isInteger(numericValue)) {
    return String(numericValue);
  }

  return String(Number(numericValue.toFixed(2)));
}

function getStatusMeta(status) {
  return (
    STATUS_META[status] || {
      label: "Pending",
      textColor: "#9a6700",
      backgroundColor: "#fff8c5",
    }
  );
}

function buildDetailsRows(leave, options = {}) {
  const rows = [
    {
      label: "From Date",
      value: formatDateValue(leave?.fromDate),
    },
    {
      label: "To Date",
      value: formatDateValue(leave?.toDate),
    },
    {
      label: "Total Days",
      value: formatDays(leave?.totalDays),
    },
    {
      label: "Reason",
      value: escapeHtml(leave?.reason || "-"),
      isHtml: true,
    },
  ];

  if (leave?.isHalfDay) {
    const halfDayLabel =
      leave?.halfDayType === "second_half" ? "Second Half" : "First Half";
    rows.push({
      label: "Leave Type",
      value: "Half Day (" + halfDayLabel + ")",
    });
  } else {
    rows.push({
      label: "Leave Type",
      value: "Full Day",
    });
  }

  if (options.approvedBy) {
    rows.push({
      label: "Approved By",
      value: escapeHtml(options.approvedBy),
      isHtml: true,
    });
  }

  if (options.rejectedBy) {
    rows.push({
      label: "Reviewed By",
      value: escapeHtml(options.rejectedBy),
      isHtml: true,
    });
  }

  if (options.remarks) {
    rows.push({
      label: "Remarks",
      value: escapeHtml(options.remarks),
      isHtml: true,
    });
  }

  if (options.attachmentUrl) {
    rows.push({
      label: "Attachment",
      value:
        '<a href="' +
        escapeHtml(options.attachmentUrl) +
        '" style="color:#1d4ed8;text-decoration:none;">View Attached Document</a>',
      isHtml: true,
    });
  }

  return rows
    .map((row) => {
      const value = row.isHtml ? row.value : escapeHtml(row.value);

      return (
        "<tr>" +
        '<td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;font-weight:600;color:#334155;width:38%;">' +
        escapeHtml(row.label) +
        "</td>" +
        '<td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;color:#0f172a;">' +
        value +
        "</td>" +
        "</tr>"
      );
    })
    .join("");
}

function buildEmailLayout({
  title,
  intro,
  recipientName,
  status,
  detailsRows,
  buttonLabel,
  buttonUrl,
}) {
  const statusMeta = getStatusMeta(status);

  return (
    '<!doctype html><html><head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head>' +
    '<body style="margin:0;padding:24px 12px;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif;color:#0f172a;">' +
    '<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:680px;margin:0 auto;border-collapse:collapse;">' +
    "<tr><td>" +
    '<div style="background:#ffffff;border:1px solid #dbe4ee;border-radius:14px;overflow:hidden;">' +
    '<div style="padding:18px 20px;background:#0f172a;color:#ffffff;">' +
    '<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;">' +
    "<tr>" +
    '<td style="vertical-align:middle;">' +
    '<img src="' +
    escapeHtml(COMPANY_LOGO_URL) +
    '" alt="IIT Delhi Logo" style="height:48px;width:48px;border-radius:999px;display:block;background:#ffffff;" />' +
    "</td>" +
    '<td style="vertical-align:middle;padding-left:12px;">' +
    '<p style="margin:0;font-size:18px;font-weight:700;line-height:1.3;">' +
    escapeHtml(COMPANY_NAME) +
    "</p>" +
    '<p style="margin:2px 0 0 0;font-size:12px;color:#cbd5e1;">Leave Management Notification</p>' +
    "</td>" +
    "</tr>" +
    "</table>" +
    "</div>" +
    '<div style="padding:20px;">' +
    '<p style="margin:0 0 8px 0;font-size:14px;color:#334155;">Hello ' +
    escapeHtml(recipientName || "there") +
    ",</p>" +
    '<h2 style="margin:0 0 10px 0;font-size:22px;line-height:1.25;color:#0f172a;">' +
    escapeHtml(title) +
    "</h2>" +
    '<p style="margin:0 0 14px 0;font-size:14px;line-height:1.55;color:#475569;">' +
    escapeHtml(intro) +
    "</p>" +
    '<span style="display:inline-block;padding:6px 12px;border-radius:999px;font-size:12px;font-weight:700;color:' +
    statusMeta.textColor +
    ";background:" +
    statusMeta.backgroundColor +
    ';">Status: ' +
    escapeHtml(statusMeta.label) +
    "</span>" +
    '<div style="margin-top:16px;border:1px solid #dbe4ee;border-radius:10px;overflow:hidden;">' +
    '<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;background:#ffffff;">' +
    detailsRows +
    "</table>" +
    "</div>" +
    '<div style="padding-top:18px;">' +
    '<a href="' +
    escapeHtml(buttonUrl) +
    '" style="display:inline-block;background:#0f172a;color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;border-radius:8px;padding:11px 18px;">' +
    escapeHtml(buttonLabel) +
    "</a>" +
    "</div>" +
    "</div>" +
    '<div style="padding:14px 20px;border-top:1px solid #e2e8f0;background:#f8fafc;color:#64748b;font-size:12px;line-height:1.5;">' +
    "Corporate Relations, IIT Delhi" +
    "<br />This is an automated message. Please do not reply directly to this email." +
    "</div>" +
    "</div>" +
    "</td></tr></table>" +
    "</body></html>"
  );
}

function buildTextBody({ title, intro, statusLabel, leave, extras = [] }) {
  const lines = [
    COMPANY_NAME,
    "",
    title,
    intro,
    "",
    "Status: " + statusLabel,
    "From Date: " + formatDateValue(leave?.fromDate),
    "To Date: " + formatDateValue(leave?.toDate),
    "Total Days: " + formatDays(leave?.totalDays),
    "Reason: " + String(leave?.reason || "-"),
  ];

  for (const extra of extras) {
    lines.push(extra.label + ": " + String(extra.value || "-"));
  }

  lines.push("", "Corporate Relations, IIT Delhi");
  return lines.join("\n");
}

function buildEmailTemplate({
  subject,
  title,
  intro,
  recipientName,
  status,
  leave,
  buttonLabel,
  buttonUrl,
  approvedBy,
  rejectedBy,
  remarks,
  attachmentUrl,
}) {
  const detailsRows = buildDetailsRows(leave, {
    approvedBy,
    rejectedBy,
    remarks,
    attachmentUrl,
  });
  const statusMeta = getStatusMeta(status);

  const extras = [];
  if (approvedBy) {
    extras.push({ label: "Approved By", value: approvedBy });
  }
  if (rejectedBy) {
    extras.push({ label: "Reviewed By", value: rejectedBy });
  }
  if (remarks) {
    extras.push({ label: "Remarks", value: remarks });
  }
  if (attachmentUrl) {
    extras.push({ label: "Attachment", value: attachmentUrl });
  }

  return {
    subject,
    html: buildEmailLayout({
      title,
      intro,
      recipientName,
      status,
      detailsRows,
      buttonLabel,
      buttonUrl,
    }),
    text: buildTextBody({
      title,
      intro,
      statusLabel: statusMeta.label,
      leave,
      extras,
    }),
  };
}

export function buildLeaveAppliedForDeanTemplate({
  deanName,
  applicantName,
  leave,
  portalUrl,
  attachmentUrl,
}) {
  return buildEmailTemplate({
    subject: "New Leave Application: " + formatDateValue(leave?.fromDate),
    title: "New Leave Application Submitted",
    intro:
      escapeHtml(applicantName || "A staff member") +
      " has submitted a leave request that needs your review.",
    recipientName: deanName,
    status: "pending_dean",
    leave,
    buttonLabel: "View in Portal",
    buttonUrl: portalUrl,
    attachmentUrl,
  });
}

export function buildLeaveAppliedForApplicantTemplate({
  applicantName,
  leave,
  portalUrl,
  deanName,
  attachmentUrl,
}) {
  return buildEmailTemplate({
    subject: "Leave Request Submitted Successfully",
    title: "Leave Application Received",
    intro:
      "Your leave request has been submitted" +
      (deanName ? " and shared with " + deanName + " for review." : "."),
    recipientName: applicantName,
    status: "pending_dean",
    leave,
    buttonLabel: "View My Leave",
    buttonUrl: portalUrl,
    attachmentUrl,
  });
}

export function buildLeaveApprovedTemplate({
  applicantName,
  leave,
  approvedBy,
  portalUrl,
  attachmentUrl,
}) {
  return buildEmailTemplate({
    subject: "Leave Request Approved",
    title: "Your Leave Has Been Approved",
    intro:
      "Good news. Your leave request has been approved" +
      (approvedBy ? " by " + approvedBy + "." : "."),
    recipientName: applicantName,
    status: "approved",
    leave,
    buttonLabel: "View My Leave",
    buttonUrl: portalUrl,
    approvedBy,
    attachmentUrl,
  });
}

export function buildLeaveRejectedTemplate({
  applicantName,
  leave,
  rejectedBy,
  remarks,
  portalUrl,
  attachmentUrl,
}) {
  return buildEmailTemplate({
    subject: "Leave Request Rejected",
    title: "Your Leave Request Was Rejected",
    intro:
      "Your leave request could not be approved at this time. Please review the remarks and apply again if needed.",
    recipientName: applicantName,
    status: "rejected",
    leave,
    buttonLabel: "View My Leave",
    buttonUrl: portalUrl,
    rejectedBy,
    remarks,
    attachmentUrl,
  });
}

export function buildLeaveCancelledTemplate({
  recipientName,
  leave,
  portalUrl,
  cancelledByMessage,
  attachmentUrl,
}) {
  return buildEmailTemplate({
    subject: "Leave Request Cancelled",
    title: "Leave Request Cancelled",
    intro:
      "This is to inform you that the leave request has been cancelled." +
      (cancelledByMessage ? " " + cancelledByMessage : ""),
    recipientName: recipientName,
    status: "cancelled",
    leave,
    buttonLabel: "View My Leave",
    buttonUrl: portalUrl,
    remarks: cancelledByMessage,
    attachmentUrl,
  });
}

function buildSimpleEmailLayout({
  title,
  intro,
  recipientName,
  buttonLabel,
  buttonUrl,
}) {
  return (
    '<!doctype html><html><head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head>' +
    '<body style="margin:0;padding:24px 12px;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif;color:#0f172a;">' +
    '<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:680px;margin:0 auto;border-collapse:collapse;">' +
    "<tr><td>" +
    '<div style="background:#ffffff;border:1px solid #dbe4ee;border-radius:14px;overflow:hidden;">' +
    '<div style="padding:18px 20px;background:#0f172a;color:#ffffff;">' +
    '<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;">' +
    "<tr>" +
    '<td style="vertical-align:middle;">' +
    '<img src="' +
    escapeHtml(COMPANY_LOGO_URL) +
    '" alt="IIT Delhi Logo" style="height:48px;width:48px;border-radius:999px;display:block;background:#ffffff;" />' +
    "</td>" +
    '<td style="vertical-align:middle;padding-left:12px;">' +
    '<p style="margin:0;font-size:18px;font-weight:700;line-height:1.3;">' +
    escapeHtml(COMPANY_NAME) +
    "</p>" +
    '<p style="margin:2px 0 0 0;font-size:12px;color:#cbd5e1;">Account Security Notification</p>' +
    "</td>" +
    "</tr>" +
    "</table>" +
    "</div>" +
    '<div style="padding:20px;">' +
    '<p style="margin:0 0 8px 0;font-size:14px;color:#334155;">Hello ' +
    escapeHtml(recipientName || "there") +
    ",</p>" +
    '<h2 style="margin:0 0 10px 0;font-size:22px;line-height:1.25;color:#0f172a;">' +
    escapeHtml(title) +
    "</h2>" +
    '<p style="margin:0 0 14px 0;font-size:14px;line-height:1.55;color:#475569;">' +
    escapeHtml(intro) +
    "</p>" +
    '<div style="padding-top:6px;">' +
    '<a href="' +
    escapeHtml(buttonUrl) +
    '" style="display:inline-block;background:#0f172a;color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;border-radius:8px;padding:11px 18px;">' +
    escapeHtml(buttonLabel) +
    "</a>" +
    "</div>" +
    "</div>" +
    '<div style="padding:14px 20px;border-top:1px solid #e2e8f0;background:#f8fafc;color:#64748b;font-size:12px;line-height:1.5;">' +
    "Corporate Relations, IIT Delhi" +
    "<br />This is an automated message. Please do not reply directly to this email." +
    "</div>" +
    "</div>" +
    "</td></tr></table>" +
    "</body></html>"
  );
}

function buildSimpleTextBody({ title, intro }) {
  return [
    COMPANY_NAME,
    "",
    title,
    intro,
    "",
    "Corporate Relations, IIT Delhi",
  ].join("\n");
}

export function buildAdminPasswordResetTemplate({ recipientName, portalUrl }) {
  const title = "Your Password Has Been Reset";
  const intro =
    "Your password has been reset by an administrator. Please sign in and change it if prompted.";

  return {
    subject: title,
    html: buildSimpleEmailLayout({
      title,
      intro,
      recipientName,
      buttonLabel: "Sign In",
      buttonUrl: portalUrl,
    }),
    text: buildSimpleTextBody({
      title,
      intro,
    }),
  };
}

export function buildAdminEmailUpdatedTemplate({ recipientName, portalUrl }) {
  const title = "Your Account Email Was Updated";
  const intro =
    "An administrator updated the email address linked to your account. If you did not expect this change, please contact support.";

  return {
    subject: title,
    html: buildSimpleEmailLayout({
      title,
      intro,
      recipientName,
      buttonLabel: "Sign In",
      buttonUrl: portalUrl,
    }),
    text: buildSimpleTextBody({
      title,
      intro,
    }),
  };
}
