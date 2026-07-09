const express = require('express');
const router = express.Router();

const { showLoginPage, login, showRegisterPage, register, logout } = require('../controllers/authController');
const { redirectIfAuthenticated } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

/**
 * Mounted at '/' in server.js — this is the ONE public login/register
 * flow for the whole site (customers and staff both use POST /login;
 * role-based redirect happens in authController.login via dashboardPathFor).
 */

// GET /login
router.get('/login', redirectIfAuthenticated, showLoginPage);

// POST /login (application/json: { email, password })
router.post(
  '/login',
  redirectIfAuthenticated,
  validate({
    email: { required: true, email: true, label: 'Email' },
    password: { required: true, label: 'Password' },
  }),
  login
);

// GET /register
router.get('/register', redirectIfAuthenticated, showRegisterPage);

// POST /register (application/json: { name, email, password, confirmPassword })
router.post(
  '/register',
  redirectIfAuthenticated,
  validate({
    name: { required: true, label: 'Name' },
    email: { required: true, email: true, label: 'Email' },
    password: { required: true, minLength: 8, label: 'Password' },
    confirmPassword: { required: true, label: 'Confirm password' },
  }),
  register
);

// POST /logout
router.post('/logout', logout);

module.exports = router;