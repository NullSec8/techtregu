const GoogleStrategy = require('passport-google-oauth20').Strategy;
const passport = require('passport');
const jwt = require('jsonwebtoken');
const userRepository = require('../database/userRepository');
const { mapUser } = require('../database/mappers');

function setupGoogleAuth(passportInstance, pool) {
  const googleClientID = process.env.GOOGLE_CLIENT_ID;
  const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const googleCallbackURL = process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback';
  const jwtSecret = process.env.JWT_SECRET;

  if (!googleClientID || !googleClientSecret) {
    console.log('[GoogleAuth] Not configured - set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env');
    return;
  }

  async function findOrCreateUser(profile) {
    const email = profile.emails?.[0]?.value;
    if (!email) throw new Error('No email from Google');

    let [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    
    if (rows[0]) {
      return rows[0];
    }

    const username = profile.displayName || email.split('@')[0];
    const firstName = profile.name?.givenName || '';
    const lastName = profile.name?.familyName || '';
    const avatar = profile.photos?.[0]?.value || '';

    const [result] = await pool.query(
      `INSERT INTO users (username, email, password, first_name, last_name, avatar, is_verified)
       VALUES (?, ?, 'google_oauth', ?, ?, ?, 1)`,
      [username, email, firstName, lastName, avatar]
    );

    return { id: result.insertId, username, email, first_name: firstName, last_name: lastName, avatar, is_verified: 1 };
  }

  const strategy = new GoogleStrategy(
    {
      clientID: googleClientID,
      clientSecret: googleClientSecret,
      callbackURL: googleCallbackURL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const user = await findOrCreateUser(profile);
        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    }
  );

  passportInstance.use(strategy);

  passportInstance.serializeUser((user, done) => {
    done(null, user.id);
  });

  passportInstance.deserializeUser(async (id, done) => {
    try {
      const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [id]);
      done(null, rows[0] || null);
    } catch (err) {
      done(err, null);
    }
  });

  return {
    generateToken: (user) => {
      return jwt.sign(
        { user: { id: user.id, isAdmin: user.is_admin } },
        jwtSecret,
        { expiresIn: '7d' }
      );
    },
    strategy,
  };
}

module.exports = { setupGoogleAuth };