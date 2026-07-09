const mongoose = require('mongoose');

/**
 * Powers the dismissible banner at the top of every public page
 * (views/partials/announcement-bar.ejs), managed from
 * /admin/announcements. Not tied to Product/Order in any way — this is
 * a standalone "say anything to every visitor" tool (sales, shipping
 * delays, new-collection drops, etc.), matching the "any announcement
 * type" ask.
 */
const announcementSchema = new mongoose.Schema(
  {
    message: {
      type: String,
      required: [true, 'Announcement message is required'],
      trim: true,
    },
    type: {
      type: String,
      enum: ['sale', 'info', 'urgent'],
      default: 'sale',
    },
    link: {
      type: String,
      trim: true,
      default: '',
    },
    linkText: {
      type: String,
      trim: true,
      default: '',
    },
    // Only active announcements render on the public site
    active: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Announcement', announcementSchema);
