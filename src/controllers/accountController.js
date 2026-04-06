import * as User from '../models/User.js';
import pool from '../config/db.js';
import { recordOptOut, recordOptIn } from '../services/smsService.js';

/** @param {import('express').Request} req @param {import('express').Response} res */
export async function showEdit(req, res) {
  const user = await User.findById(req.session.userId);

  // Resolve current SMS opt-out state
  const [rows] = await pool.query(
    'SELECT opted_out_at, opted_in_at FROM sms_opt_outs WHERE user_id = ? ORDER BY opted_out_at DESC LIMIT 1',
    [user.id],
  );
  let smsEnabled = true;
  if (rows.length) {
    const { opted_out_at, opted_in_at } = rows[0];
    if (!opted_in_at || new Date(opted_out_at) > new Date(opted_in_at)) smsEnabled = false;
  }

  res.render('account/edit', { title: 'Edit Account', user, smsEnabled });
}

/** @param {import('express').Request} req @param {import('express').Response} res */
export async function submitEdit(req, res) {
  try {
    const user = await User.findById(req.session.userId);
    const { first_name, last_name, sms_enabled } = req.body;

    if (!first_name?.trim() || !last_name?.trim()) {
      return res.render('account/edit', {
        title: 'Edit Account',
        user,
        error: 'First and last name are required.',
        smsEnabled: sms_enabled === 'on',
      });
    }

    await User.update(user.id, { first_name: first_name.trim(), last_name: last_name.trim() });

    // Handle SMS toggle
    const wantsEnabled = sms_enabled === 'on';
    const [rows] = await pool.query(
      'SELECT opted_out_at, opted_in_at FROM sms_opt_outs WHERE user_id = ? ORDER BY opted_out_at DESC LIMIT 1',
      [user.id],
    );
    const currentlyOptedOut = rows.length
      ? (!rows[0].opted_in_at || new Date(rows[0].opted_out_at) > new Date(rows[0].opted_in_at))
      : false;

    if (!wantsEnabled && !currentlyOptedOut) {
      await recordOptOut(user.id, user.phone_number, 'account_settings');
    } else if (wantsEnabled && currentlyOptedOut) {
      await recordOptIn(user.phone_number);
    }

    res.redirect('/');
  } catch (err) {
    console.error(err);
    const user = await User.findById(req.session.userId);
    res.render('account/edit', { title: 'Edit Account', user, error: 'Something went wrong. Please try again.' });
  }
}
