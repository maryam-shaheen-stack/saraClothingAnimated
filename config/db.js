const mongoose = require('mongoose');

/**
 * Connects to MongoDB using MONGO_URI from .env.
 *
 * IMPORTANT — this app runs on Vercel (see vercel.json), which is
 * serverless: every request can spin up a fresh function instance, and
 * that instance's whole process gets frozen/killed between requests
 * (not restarted like a normal long-running server). Two things had to
 * change to work correctly there:
 *
 * 1. We cache the connection promise on `global`, so a warm serverless
 *    instance reuses its existing connection instead of opening a new
 *    one on every single request (which would quickly exhaust MongoDB
 *    Atlas's connection limit).
 * 2. We never call process.exit() on failure. On a normal server that's
 *    a reasonable "fail fast" choice, but on Vercel it kills the whole
 *    function invocation for that one request, and Vercel logs it as a
 *    crash — it does not "restart" anything useful. We throw instead,
 *    so the error handler in server.js can return a proper error page.
 */

let cachedConnectionPromise = null;

async function connectDB() {
  if (!process.env.MONGO_URI) {
    throw new Error(
      'MONGO_URI is not set. On Vercel, this must be added under Project → Settings → Environment Variables (it is not read from .env in production).'
    );
  }

  if (mongoose.connection.readyState === 1) {
    return mongoose.connection; // already connected on this warm instance
  }

  if (!cachedConnectionPromise) {
    cachedConnectionPromise = mongoose
      .connect(process.env.MONGO_URI)
      .then(function (conn) {
        console.log(`MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);
        return conn;
      })
      .catch(function (err) {
        cachedConnectionPromise = null; // let the next request retry instead of staying broken forever
        console.error('MongoDB connection error:', err.message);
        throw err;
      });
  }

  return cachedConnectionPromise;
}

module.exports = connectDB;
