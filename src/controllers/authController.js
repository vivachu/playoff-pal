import * as User from '../models/User.js';
import * as OtpCode from '../models/OtpCode.js';
import * as smsService from '../services/smsService.js';

const OTP_EXPIRY_MINUTES = 10;
const MAX_ATTEMPTS = 3;

/** @param {import('express').Request} req @param {import('express').Response} res */
export function showLogin(req, res) {
  if (req.session.userId) return res.redirect('/');
  res.render('auth/login', { layout: 'main', title: 'Sign In' });
}

/**
 * POST /auth/login — receive phone number; send OTP if user exists, redirect to register if not.
 * @param {import('express').Request} req @param {import('express').Response} res
 */
export async function submitPhone(req, res) {
  try {
    const phone = (req.body.phone_number || '').trim();
    if (!phone) return res.render('auth/login', { title: 'Sign In', error: 'Phone number is required.' });

    const user = await User.findByPhone(phone);
    if (!user) {
      // New user — store phone and redirect to collect name
      req.session.pendingPhone = phone;
      return res.redirect('/auth/register');
    }

    await issueOtp(user, res, req);
  } catch (err) {
    console.error(err);
    res.render('auth/login', { title: 'Sign In', error: 'Something went wrong. Please try again.' });
  }
}

/** @param {import('express').Request} req @param {import('express').Response} res */
export function showRegister(req, res) {
  if (!req.session.pendingPhone) return res.redirect('/auth/login');
  res.render('auth/register', { title: 'Create Account', phone: req.session.pendingPhone });
}

/**
 * POST /auth/register — create user then issue OTP.
 * @param {import('express').Request} req @param {import('express').Response} res
 */
export async function submitRegister(req, res) {
  try {
    const phone = req.session.pendingPhone;
    if (!phone) return res.redirect('/auth/login');

    const firstName = (req.body.first_name || '').trim();
    const lastName  = (req.body.last_name  || '').trim();
    if (!firstName || !lastName) {
      return res.render('auth/register', {
        title: 'Create Account',
        phone,
        error: 'First and last name are required.',
      });
    }

    const userId = await User.create({ phone_number: phone, first_name: firstName, last_name: lastName });
    const user = await User.findById(userId);
    await issueOtp(user, res, req);
  } catch (err) {
    console.error(err);
    res.render('auth/register', {
      title: 'Create Account',
      phone: req.session.pendingPhone,
      error: 'Something went wrong. Please try again.',
    });
  }
}

/** @param {import('express').Request} req @param {import('express').Response} res */
export function showVerify(req, res) {
  if (!req.session.pendingUserId) return res.redirect('/auth/login');
  res.render('auth/verify', { title: 'Enter Code' });
}

/**
 * POST /auth/verify — validate OTP; open session on success.
 * @param {import('express').Request} req @param {import('express').Response} res
 */
export async function submitVerify(req, res) {
  try {
    const userId = req.session.pendingUserId;
    if (!userId) return res.redirect('/auth/login');

    const code = (req.body.code || '').trim();
    const otp  = await OtpCode.findLatestByUserId(userId);

    if (!otp) {
      return res.render('auth/verify', { title: 'Enter Code', error: 'Code expired. Please request a new one.' });
    }
    if (otp.attempts >= MAX_ATTEMPTS) {
      return res.render('auth/verify', { title: 'Enter Code', error: 'Too many incorrect attempts. Please request a new code.' });
    }
    if (otp.code !== code) {
      await OtpCode.incrementAttempts(otp.id);
      const remaining = MAX_ATTEMPTS - otp.attempts - 1;
      return res.render('auth/verify', { title: 'Enter Code', error: `Incorrect code. ${remaining} attempt(s) remaining.` });
    }

    await OtpCode.markUsed(otp.id);
    req.session.userId = userId;
    delete req.session.pendingUserId;
    delete req.session.pendingPhone;

    const returnTo = req.session.returnTo || '/';
    delete req.session.returnTo;
    res.redirect(returnTo);
  } catch (err) {
    console.error(err);
    res.render('auth/verify', { title: 'Enter Code', error: 'Something went wrong. Please try again.' });
  }
}

/**
 * POST /auth/logout — destroy session.
 * @param {import('express').Request} req @param {import('express').Response} res
 */
export function logout(req, res) {
  req.session.destroy(() => res.redirect('/auth/login'));
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Generate and send an OTP, then redirect to the verify screen.
 * @param {object} user
 * @param {import('express').Response} res
 * @param {import('express').Request} req
 */
async function issueOtp(user, res, req) {
  const code = String(Math.floor(100000 + Math.random() * 900000));
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  await OtpCode.create({ user_id: user.id, code, expires_at: expiresAt });
  await smsService.sendOtp(user.phone_number, code);

  req.session.pendingUserId = user.id;
  res.redirect('/auth/verify');
}
