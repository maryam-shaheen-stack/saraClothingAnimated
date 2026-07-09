const mongoose = require('mongoose');

/**
 * SiteContent is a SINGLETON — there is only ever one document in this
 * collection. It holds homepage content that used to be hardcoded in
 * home.ejs (hero slides + the "Our Story" image/text), so the admin can
 * edit it from the dashboard instead of editing code and redeploying.
 *
 * Why a singleton instead of separate collections per section? There's
 * only ever one homepage, so there's no need for admins to create/delete
 * "homepage" records — just one doc they continually update. getSingleton()
 * below creates it on first use so the app never has to null-check it.
 */

const heroSlideSchema = new mongoose.Schema(
  {
    image: { type: String, required: true }, // Cloudinary secure_url
    headline: { type: String, trim: true, default: '' },
    subtext: { type: String, trim: true, default: '' },
    buttonText: { type: String, trim: true, default: '' },
    buttonLink: { type: String, trim: true, default: '' },
    order: { type: Number, default: 0 }, // controls carousel position, lowest first
  },
  { timestamps: true }
);

const siteContentSchema = new mongoose.Schema(
  {
    heroSlides: {
      type: [heroSlideSchema],
      default: [],
    },
    story: {
      image: { type: String, default: '' },
      heading: { type: String, trim: true, default: 'Our Story' },
      text: {
        type: String,
        trim: true,
        default:
          "Sara Clothing began as a small boutique with a simple belief — that clothing should feel personal.",
      },
    },
  },
  { timestamps: true }
);

// Always return the one-and-only SiteContent document, creating it with
// sensible defaults the very first time anything asks for it.
siteContentSchema.statics.getSingleton = async function () {
  let content = await this.findOne();
  if (!content) {
    content = await this.create({});
  }
  return content;
};

module.exports = mongoose.model('SiteContent', siteContentSchema);
