const session = require('express-session');
const MongoStore = require('connect-mongo');

const FOURTEEN_DAYS_MS = 14 * 24 * 60 * 60 * 1000;

/**
 * Session store lives in MongoDB (not memory), so admin logins survive
 * a server restart/deploy instead of everyone getting logged out.
 * Used by middleware/auth.js to check req.session.userId on /admin/*.
 */
const sessionMiddleware = session({
  name: 'sara.sid',
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGO_URI,
    collectionName: 'sessions',
    ttl: FOURTEEN_DAYS_MS / 1000, // connect-mongo wants seconds
  }),
  cookie: {
    httpOnly: true,
    // Only require HTTPS-only cookies in production — localhost dev
    // over plain http would otherwise silently never set the cookie.
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: FOURTEEN_DAYS_MS,
  },
});

module.exports = sessionMiddleware;
