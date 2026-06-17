
import express from 'express';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import jwt from 'jsonwebtoken';
import { db } from '../services/db';
import { requireAuth } from '../middleware/auth.middleware';

const router = express.Router();

function hasGoogleOAuthConfig() {
  return Boolean(
    process.env.GOOGLE_CLIENT_ID &&
    process.env.GOOGLE_CLIENT_SECRET &&
    process.env.GOOGLE_CALLBACK_URL &&
    !process.env.GOOGLE_CLIENT_ID.includes('your-google-client-id') &&
    !process.env.GOOGLE_CLIENT_SECRET.includes('your-google-client-secret')
  );
}

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID!,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  callbackURL: process.env.GOOGLE_CALLBACK_URL!,
}, async (_accessToken: any, _refreshToken: any, profile: any, done: any) => {
  try {
    const user = await db.user.upsert({
      where: { googleId: profile.id },
      update: {
        name: profile.displayName,
        avatar: profile.photos?.[0]?.value,
      },
      create: {
        googleId: profile.id,
        email: profile.emails![0].value,
        name: profile.displayName,
        avatar: profile.photos?.[0]?.value,
      },
    });
    return done(null, user);
  } catch (err) {
    return done(err);
  }
}));

// Step 1: Redirect user to Google
router.get('/google',
  (req, res, next) => {
    if (!hasGoogleOAuthConfig()) {
      return res.status(500).json({
        error: 'Google OAuth is not configured',
        details: 'Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_CALLBACK_URL in server/.env.',
      });
    }
    next();
  },
  passport.authenticate('google', { scope: ['profile', 'email'], session: false })
);

// Step 2: Google sends user back here
router.get('/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/login' }),
  (req, res) => {
    const user = req.user as any;
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      return res.status(500).json({ error: 'JWT_SECRET is not configured' });
    }

    const token = jwt.sign(
      { userId: user.id },
      jwtSecret,
      { expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as any }
    );
    res.redirect(`${process.env.CLIENT_URL}/auth/callback?token=${token}`);
  }
);

// Returns the logged-in user's profile
router.get('/me', requireAuth, (req, res) => {
  res.json(req.user);
});

export default router;
