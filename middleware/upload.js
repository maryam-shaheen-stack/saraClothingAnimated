const cloudinaryModule = require('cloudinary');
const cloudinary = cloudinaryModule.v2;
const CloudinaryStorage = require('multer-storage-cloudinary');
const multer = require('multer');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

function buildUploader(folder) {
  const storage = new CloudinaryStorage({
    // multer-storage-cloudinary internally calls `this.cloudinary.v2.uploader...`,
    // so it needs the WHOLE cloudinary module here (which has a .v2 property),
    // not the already-unwrapped v2 namespace — passing `cloudinary` (v2) directly
    // caused "Cannot read properties of undefined (reading 'uploader')".
    cloudinary: cloudinaryModule,
    params: { folder: `sara-clothing/${folder}`, allowed_formats: ['jpg','png','webp','gif'] },
  });
  const uploader = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

  // multer-storage-cloudinary (v2.x) merges Cloudinary's raw upload API
  // response onto req.file — which has `secure_url` / `public_id`, but
  // NOT `.path`. Every controller in this project reads req.file.path
  // (the usual multer convention), so normalize it here in one place
  // instead of changing every controller.
  return function (fieldName) {
    const single = uploader.single(fieldName);
    return function (req, res, next) {
      single(req, res, function (err) {
        if (err) return next(err);
        if (req.file && !req.file.path && req.file.secure_url) {
          req.file.path = req.file.secure_url;
        }
        next();
      });
    };
  };
}

const uploadProductImage = buildUploader('products')('image');
const uploadCategoryImage = buildUploader('categories')('image');
const uploadHeroImage = buildUploader('hero')('image');
const uploadStoryImage = buildUploader('story')('image');

// Products need MORE than one photo (a main image + a gallery of extras),
// so this uses multer's .fields() instead of .single(): the admin form
// sends one "image" file and 0-5 "gallery" files in the same submission.
// Cloudinary storage still handles each file the same way underneath —
// this just accepts more than one file field at once.
function buildProductGalleryUploader() {
  const storage = new CloudinaryStorage({
    cloudinary: cloudinaryModule,
    params: { folder: 'sara-clothing/products', allowed_formats: ['jpg', 'png', 'webp', 'gif'] },
  });
  const uploader = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });
  const fields = uploader.fields([
    { name: 'image', maxCount: 1 },
    { name: 'gallery', maxCount: 5 },
  ]);

  return function (req, res, next) {
    fields(req, res, function (err) {
      if (err) return next(err);
      // Same secure_url normalization as buildUploader, just applied to
      // every file in both arrays instead of a single req.file.
      ['image', 'gallery'].forEach(function (field) {
        if (req.files && req.files[field]) {
          req.files[field].forEach(function (file) {
            if (!file.path && file.secure_url) file.path = file.secure_url;
          });
        }
      });
      next();
    });
  };
}

const uploadProductImages = buildProductGalleryUploader();

// Every controller stores the full Cloudinary secure_url (req.file.path) as
// the image field. To delete that image later (replacing/removing it), we
// need Cloudinary's public_id, which isn't the URL — this pulls it back out
// of the URL so controllers don't each reimplement (and mis-implement) it.
// Only touches Cloudinary URLs; silently ignores anything else (blank, or
// a path from some other source) so it's always safe to call.
async function deleteCloudinaryImage(secureUrl) {
  if (!secureUrl || !secureUrl.includes('res.cloudinary.com')) return;
  try {
    const afterUpload = secureUrl.split('/upload/')[1]; // e.g. "v123456/sara-clothing/products/abc123.jpg"
    if (!afterUpload) return;
    const withoutVersion = afterUpload.replace(/^v\d+\//, '');
    const publicId = withoutVersion.replace(/\.[a-zA-Z0-9]+$/, ''); // strip extension
    await cloudinary.uploader.destroy(publicId);
  } catch (err) {
    console.error('Could not delete Cloudinary image:', secureUrl, err.message);
  }
}

module.exports = {
  uploadProductImage,
  uploadProductImages,
  uploadCategoryImage,
  uploadHeroImage,
  uploadStoryImage,
  deleteCloudinaryImage,
};