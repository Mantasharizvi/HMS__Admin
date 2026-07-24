const Notification = require('../models/Notification');
const User = require('../models/User');
const sendEmail = require('./sendEmail');

/**
 * Creates an in-app Notification and emails only the active, registered
 * Admin account(s) that have opted in (via notificationPrefs) to this
 * alert category. Non-admin users never receive these emails.
 *
 * @param {Object} opts
 * @param {'info'|'success'|'warning'|'danger'} opts.type
 * @param {string} opts.title
 * @param {string} opts.message
 * @param {'lowStock'|'appointments'|'billing'|'critical'} opts.category
 */
async function notify({ type = 'info', title, message, category }) {
  // Always log the in-app notification, regardless of email outcome.
  const notification = await Notification.create({ type, title, message });

  const admins = await User.find({ status: 'Active', role: 'Admin' }).select('email name notificationPrefs');
  const optedIn = admins.filter((u) => {
    const prefs = u.notificationPrefs || {};
    const catPrefs = category ? prefs[category] : null;
    // Default to emailing when no explicit preference is stored.
    return catPrefs ? catPrefs.email !== false : true;
  });

  if (optedIn.length > 0) {
    await sendEmail({
      to: optedIn.map((u) => u.email),
      subject: `[MediCore HMS] ${title}`,
      text: message,
      html: `<h3>${title}</h3><p>${message}</p><p style="color:#94a3b8;font-size:12px;">Sent to your registered MediCore HMS admin account email.</p>`,
    });
  }

  return notification;
}

module.exports = notify;
