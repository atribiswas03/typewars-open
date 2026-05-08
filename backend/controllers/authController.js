const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const sendEmail = require('../utils/sendEmail');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const sendOTPEmail = async (email, username, otp) => {
  const htmlContent = `
    <div style="background-color: #050505; color: #ffffff; font-family: 'Courier New', Courier, monospace; padding: 40px; border: 2px solid #00f3ff; border-radius: 10px; max-width: 600px; margin: 0 auto;">
      <div style="text-align: center; border-bottom: 1px solid #333; padding-bottom: 20px; margin-bottom: 30px;">
        <h1 style="color: #00f3ff; text-transform: uppercase; letter-spacing: 5px; margin: 0;">Type<span style="color: #bc00ff;">Wars</span></h1>
        <p style="color: #666; font-size: 10px; margin-top: 5px;">NEURAL_GRID_ACCESS_PROTOCOL</p>
      </div>
      
      <div style="padding: 20px; background: rgba(0, 243, 255, 0.05); border-left: 4px solid #00f3ff;">
        <p style="margin: 0 0 15px 0; color: #00f3ff; font-size: 14px;">[IDENT_RECOGNIZED]: ${username}</p>
        <p style="margin: 0 0 25px 0; color: #cccccc; line-height: 1.6;">A neural link request has been initiated for your account. Use the encryption key below to verify your identity and synchronize with the grid.</p>
        
        <div style="background: #000; border: 1px dashed #00f3ff; padding: 20px; text-align: center; margin: 30px 0;">
          <span style="color: #00f3ff; font-size: 32px; font-weight: bold; letter-spacing: 10px;">${otp}</span>
        </div>
        
        <p style="color: #bc00ff; font-size: 12px; margin: 0;">[WARNING]: THIS_KEY_EXPIRES_IN_120_SECONDS</p>
      </div>
      
      <div style="margin-top: 40px; border-top: 1px solid #333; padding-top: 20px; font-size: 10px; color: #444;">
        <p style="margin: 5px 0;">V.1.2.0_STABLE // SYNC_TIMESTAMP: ${new Date().toISOString()}</p>
        <p style="margin: 5px 0;">DO_NOT_SHARE_THIS_ENCRYPTION_KEY_WITH_UNAUTHORIZED_UNITS.</p>
      </div>
    </div>
  `;

  await sendEmail({
    email,
    subject: 'TypeWars: NEURAL_LINK_ENCRYPTION_KEY',
    html: htmlContent,
  });
};

exports.register = async (req, res) => {
  const { username, email, password } = req.body;

  try {
    // Check if user already exists by email OR username
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });

    if (existingUser) {
      // If user exists and is either verified OR has a password (legacy user)
      if (existingUser.isVerified || existingUser.password) {
        const isEmailMatch = existingUser.email === email;
        return res.status(400).json({ 
          message: isEmailMatch ? 'EMAIL_ALREADY_REGISTERED_PLEASE_LOGIN' : 'USERNAME_TAKEN_PLEASE_CHOOSE_ANOTHER', 
          redirect: isEmailMatch 
        });
      }
      
      // If they exist but aren't verified/complete (Guest or pending reg), update them
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      const otpCode = generateOTP();
      
      existingUser.email = email;
      existingUser.password = hashedPassword;
      existingUser.otp = { 
        code: otpCode, 
        expiresAt: new Date(Date.now() + 2 * 60 * 1000), 
        attempts: 0 
      };
      
      await existingUser.save();
      
      await sendOTPEmail(email, otpCode);
      return res.status(200).json({ message: 'OTP_SENT_TO_EMAIL', email });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const otpCode = generateOTP();
    const otpExpiresAt = new Date(Date.now() + 2 * 60 * 1000); // 2 minutes

    const user = await User.create({
      username,
      email,
      password: hashedPassword,
      otp: { code: otpCode, expiresAt: otpExpiresAt, attempts: 0 }
    });

    try {
      await sendOTPEmail(email, username, otpCode);
      res.status(201).json({
        message: 'OTP_SENT_SUCCESSFULLY',
        email: user.email
      });
    } catch (err) {
      console.error('Email send failed:', err);
      res.status(500).json({ message: 'EMAIL_SEND_FAILED' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.verifyOTP = async (req, res) => {
  const { email, otp } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user || !user.otp || user.otp.expiresAt < new Date()) {
      return res.status(400).json({ message: 'INVALID_OR_EXPIRED_OTP' });
    }

    if (user.otp.code !== otp) {
      user.otp.attempts += 1;
      const remaining = 3 - user.otp.attempts;
      
      if (remaining <= 0) {
        user.otp = undefined;
        await user.save();
        return res.status(403).json({ message: 'ATTEMPTS_EXCEEDED_REDIRECTING', redirect: true });
      }
      
      await user.save();
      return res.status(400).json({ message: `INVALID_OTP_REMAINING_${remaining}`, remainingAttempts: remaining });
    }

    user.isVerified = true;
    user.otp = undefined;
    await user.save();

    res.json({
      _id: user._id,
      username: user.username,
      email: user.email,
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'USER_NOT_FOUND' });

    const otpCode = generateOTP();
    user.otp = {
      code: otpCode,
      expiresAt: new Date(Date.now() + 2 * 60 * 1000), // 2 minutes
      attempts: 0
    };
    await user.save();

    try {
      await sendOTPEmail(email, user.username, otpCode);
      res.json({ message: 'RESET_OTP_SENT' });
    } catch (err) {
      console.error('Email send failed:', err);
      res.status(500).json({ message: 'EMAIL_SEND_FAILED' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.resetPassword = async (req, res) => {
  const { email, otp, newPassword } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user || !user.otp || user.otp.expiresAt < new Date()) {
      return res.status(400).json({ message: 'INVALID_OR_EXPIRED_OTP' });
    }

    if (user.otp.code !== otp) {
      user.otp.attempts += 1;
      const remaining = 3 - user.otp.attempts;
      
      if (remaining <= 0) {
        user.otp = undefined;
        await user.save();
        return res.status(403).json({ message: 'ATTEMPTS_EXCEEDED_REDIRECTING', redirect: true });
      }
      
      await user.save();
      return res.status(400).json({ message: `INVALID_OTP_REMAINING_${remaining}`, remainingAttempts: remaining });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    user.otp = undefined;
    user.isVerified = true;
    await user.save();

    res.json({ message: 'PASSWORD_RESET_SUCCESS' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user || !user.isVerified) {
      return res.status(401).json({ message: 'USER_NOT_VERIFIED_OR_NOT_FOUND' });
    }

    if (await bcrypt.compare(password, user.password)) {
      res.json({
        _id: user._id,
        username: user.username,
        email: user.email,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: 'INVALID_CREDENTIALS' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.guestLogin = async (req, res) => {
  const { username } = req.body;

  try {
    const userExists = await User.findOne({ username });
    if (userExists && userExists.email) {
      return res.status(400).json({ message: 'USERNAME_TAKEN_BY_REGISTERED_USER' });
    }

    let user = await User.findOne({ username });
    if (!user) {
      user = await User.create({ username });
    }

    res.json({
      _id: user._id,
      username: user.username,
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
