/**
 * One-time (safe to re-run) setup script.
 *
 * Run with: npm run seed
 *
 * Creates, if they don't already exist:
 *  - the first admin account (from SEED_ADMIN_* in .env)
 *  - a demo customer account (for testing the customer-side flow)
 *  - a couple of demo categories (only if none exist yet)
 *
 * Safe to re-run any time — every step checks for existing data first,
 * so this will never duplicate the admin user or wipe your catalog.
 */

require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');
const Category = require('../models/Category');

async function seed() {
  await connectDB();

  // ---------------------------------------------------------------
  // 1. Admin user
  // ---------------------------------------------------------------
  const adminEmail = (process.env.SEED_ADMIN_EMAIL || '').toLowerCase().trim();
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;
  const adminName = process.env.SEED_ADMIN_NAME || 'Admin';

  if (!adminEmail || !adminPassword) {
    console.error(
      '\n  SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD are missing from .env — cannot create the admin account.\n'
    );
  } else if (adminPassword.length < 8) {
    console.error('\n  SEED_ADMIN_PASSWORD must be at least 8 characters. Update .env and re-run.\n');
  } else {
    const existingAdmin = await User.findOne({ email: adminEmail }).select('+password');
    if (existingAdmin) {
      // IMPORTANT: this used to just skip here, which meant changing
      // SEED_ADMIN_PASSWORD in .env and re-running `npm run seed` had NO
      // effect — the account kept its original password forever, and
      // logging in with the "new" .env password would fail with no clue
      // why. Now we sync name/password/role to whatever .env currently
      // says, every time, so .env is always the source of truth.
      existingAdmin.name = adminName;
      existingAdmin.password = adminPassword; // re-hashed by the pre-save hook only if changed
      existingAdmin.role = 'admin';
      await existingAdmin.save();
      console.log(`  Admin already existed: ${adminEmail} — synced name/password/role from .env.`);
    } else {
      await User.create({
        name: adminName,
        email: adminEmail,
        password: adminPassword, // hashed automatically by the User model's pre-save hook
        role: 'admin',
      });
      console.log(`  Admin created: ${adminEmail}`);
    }
  }

  // ---------------------------------------------------------------
  // 2. Demo customer (handy for testing the storefront/checkout flow
  //    without needing to register a throwaway account every time)
  // ---------------------------------------------------------------
  const demoCustomerEmail = 'customer@saraclothing.pk';
  const existingCustomer = await User.findOne({ email: demoCustomerEmail });
  if (existingCustomer) {
    console.log(`  Demo customer already exists: ${demoCustomerEmail} — skipped.`);
  } else {
    await User.create({
      name: 'Demo Customer',
      email: demoCustomerEmail,
      password: 'customer123',
      role: 'customer',
    });
    console.log(`  Demo customer created: ${demoCustomerEmail} / customer123`);
  }

  // ---------------------------------------------------------------
  // 3. A couple of starter categories, only if the catalog is empty
  // ---------------------------------------------------------------
  const categoryCount = await Category.countDocuments();
  if (categoryCount === 0) {
    await Category.create([{ name: 'New Arrivals' }, { name: 'Kurtas' }, { name: 'Stitched Suits' }]);
    console.log('  3 starter categories created (New Arrivals, Kurtas, Stitched Suits).');
  } else {
    console.log(`  Categories already exist (${categoryCount}) — skipped.`);
  }

  console.log('\n  Seed complete.\n');
  await mongoose.connection.close();
  process.exit(0);
}

seed().catch(function (err) {
  console.error('Seed failed:', err);
  process.exit(1);
});