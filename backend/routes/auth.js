const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { sendPasswordResetEmail } = require('../utils/mailer');
const rateLimit = require('express-rate-limit');
const multer = require('multer');
const prisma = require('../db');
const { authenticateToken, JWT_SECRET } = require('../middleware/auth');
const fs = require('fs');
const path = require('path');

const router = express.Router();

const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.pdf'];
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext) || !ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    return cb(new Error('Invalid file type. Only JPG, PNG, WEBP images and PDF documents are allowed.'));
  }
  cb(null, true);
};

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    const cleanExt = ALLOWED_EXTENSIONS.includes(ext) ? ext : '.bin';
    const cleanFieldName = file.fieldname.replace(/[^a-zA-Z0-9_-]/g, '');
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, cleanFieldName + '-' + uniqueSuffix + cleanExt);
  }
});

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
    files: 5,
  }
});

const handleUpload = (req, res, next) => {
  upload.fields([
    { name: 'govIdProof', maxCount: 1 },
    { name: 'addressProof', maxCount: 1 },
    { name: 'eduCertificate', maxCount: 1 },
    { name: 'workExperience', maxCount: 1 }
  ])(req, res, (err) => {
    if (err) {
      return res.status(400).json({ success: false, message: err.message || 'File upload failed' });
    }
    next();
  });
};

// Rate limiting for login (5 failed attempts per 15 minutes)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { success: false, message: 'Too many login attempts. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
});

// Rate limiting for user registration (10 accounts per hour per IP)
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Too many registration attempts from this IP. Please try again after an hour.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting for email availability checks (30 checks per 15 minutes per IP)
const checkEmailLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { success: false, message: 'Too many email checks from this IP. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting for password reset requests (5 requests per 15 minutes per IP)
const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { success: false, message: 'Too many password reset requests. Please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting for OTP verification (10 attempts per 15 minutes per IP)
const verifyOtpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Too many OTP verification attempts. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting for Date Feedback submission (15 per 15 minutes per IP)
const dateFeedbackLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: { success: false, message: 'Too many feedback submissions. Please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting for Generic Chat messages (30 messages per 5 minutes per IP)
const chatLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 30,
  message: { success: false, message: 'Too many chat messages sent. Please slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Helper: Calculate age from Date
function calculateAge(birthday) {
  const ageDifMs = Date.now() - birthday.getTime();
  const ageDate = new Date(ageDifMs);
  return Math.abs(ageDate.getUTCFullYear() - 1970);
}

// Helper: Determine redirect URL based on role
function getRoleRedirect(role) {
  switch (role) {
    case 'ADMIN':
      return '/admin';
    case 'MATCHMAKER':
      return '/matchmaker/dashboard';
    case 'BREAKUP_BUDDY':
      return '/breakup-buddy/dashboard';
    case 'HOST':
    case 'EVENT_MANAGER':
    case 'EVENT_HOST':
      return '/host/dashboard';
    case 'CAFE':
      return '/cafe/dashboard';
    case 'USER':
    default:
      return '/dashboard';
  }
}

// Helper: Cookie options
function getCookieOptions() {
  const isProd = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/',
  };
}

// 1. GET /api/auth/check-email
router.get('/check-email', checkEmailLimiter, async (req, res) => {
  try {
    const { email } = req.query;

    if (!email || typeof email !== 'string') {
      return res.status(400).json({ success: false, message: 'Email query parameter is required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return res.status(400).json({ success: false, message: 'Please enter a valid email address.' });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: cleanEmail },
      select: { id: true },
    });

    if (existingUser) {
      return res.json({
        available: false,
        message: 'This email is already registered. Please login instead.',
      });
    }

    return res.json({
      available: true,
      message: '✓ Email is available',
    });
  } catch (error) {
    console.error('Error in check-email:', error);
    return res.status(500).json({ success: false, message: 'Unable to check email availability.' });
  }
});

// 2. POST /api/auth/register
router.post('/register', registerLimiter, handleUpload, async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      password,
      confirmPassword,
      dateOfBirth,
      city,
      gender,
      relationshipIntent,
      role,
      idType,
      idDocument,
      profilePhoto,
    } = req.body;

    // Full name validation
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return res.status(400).json({ success: false, message: 'Please enter your full name (minimum 2 characters).' });
    }

    // Email validation
    if (!email || typeof email !== 'string') {
      return res.status(400).json({ success: false, message: 'Please enter a valid email address.' });
    }
    const cleanEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return res.status(400).json({ success: false, message: 'Please enter a valid email address.' });
    }

    // Phone validation
    if (!phone || typeof phone !== 'string') {
      return res.status(400).json({ success: false, message: 'Please enter a valid mobile number.' });
    }
    const cleanPhone = phone.trim().replace(/\s+/g, '');
    const phoneRegex = /^(?:\+91|0)?[6-9]\d{9}$/;
    if (!phoneRegex.test(cleanPhone)) {
      return res.status(400).json({ success: false, message: 'Please enter a valid 10-digit mobile number (+91 accepted).' });
    }

    // Password validation
    if (!password || typeof password !== 'string') {
      return res.status(400).json({ success: false, message: 'Password is required.' });
    }
    if (confirmPassword !== undefined && password !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'Passwords do not match.' });
    }

    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\/]/.test(password);
    if (password.length < 8 || !hasUpper || !hasLower || !hasNumber || !hasSpecial) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters and contain uppercase, lowercase, number, and special character.',
      });
    }

    // Normalize role
    let normalizedRole = 'USER';
    if (role === 'MATCHMAKER' || role === 'BREAKUP_BUDDY' || role === 'HOST' || role === 'CAFE') {
      normalizedRole = role;
    } else if (role === 'EVENT_MANAGER' || role === 'EVENT_HOST') {
      normalizedRole = 'HOST';
    }

    // Date of birth & Age validation (18+) - optional for Breakup Buddy, Matchmaker & Host
    let dob = null;
    if (dateOfBirth) {
      dob = new Date(dateOfBirth);
      if (isNaN(dob.getTime())) {
        return res.status(400).json({ success: false, message: 'Invalid date of birth.' });
      }
      if (dob > new Date()) {
        return res.status(400).json({ success: false, message: 'Date of birth cannot be in the future.' });
      }
      const age = calculateAge(dob);
      if (age < 18) {
        return res.status(400).json({ success: false, message: 'You must be at least 18 years old to join JabWeMeet.' });
      }
    } else if (normalizedRole !== 'BREAKUP_BUDDY' && normalizedRole !== 'MATCHMAKER' && normalizedRole !== 'HOST' && normalizedRole !== 'CAFE') {
      return res.status(400).json({ success: false, message: 'Date of birth is required.' });
    }

    // City validation - optional for Breakup Buddy, Matchmaker & Host
    let validCity = city && typeof city === 'string' ? city.trim() : null;
    if (normalizedRole !== 'BREAKUP_BUDDY' && normalizedRole !== 'MATCHMAKER' && normalizedRole !== 'HOST' && normalizedRole !== 'CAFE') {
      if (!validCity || validCity.length < 2) {
        return res.status(400).json({ success: false, message: 'City is required.' });
      }
    } else if (!validCity) {
      validCity = 'N/A';
    }

    // Duplicate email check
    const existingEmail = await prisma.user.findUnique({
      where: { email: cleanEmail },
      select: { id: true },
    });
    if (existingEmail) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists. Please login instead.',
      });
    }

    // Duplicate phone check
    const existingPhone = await prisma.user.findUnique({
      where: { phone: cleanPhone },
      select: { id: true },
    });
    if (existingPhone) {
      return res.status(409).json({
        success: false,
        message: 'An account with this mobile number already exists. Please login instead.',
      });
    }

    // Hash password with BCrypt
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Extract uploaded files if any
    const govIdProof = req.files?.govIdProof ? req.files.govIdProof[0].filename : null;
    const addressProof = req.files?.addressProof ? req.files.addressProof[0].filename : null;
    const eduCertificate = req.files?.eduCertificate ? req.files.eduCertificate[0].filename : null;
    const workExperience = req.files?.workExperience ? req.files.workExperience[0].filename : null;

    // Create user in PostgreSQL database
    const newUser = await prisma.user.create({
      data: {
        name: name.trim(),
        email: cleanEmail,
        phone: cleanPhone,
        password: passwordHash,
        dateOfBirth: dob,
        city: validCity,
        gender: gender ? String(gender).trim() : null,
        relationshipIntent: relationshipIntent ? String(relationshipIntent).trim() : null,

        role: normalizedRole,
        isVerified: false,
        isApproved: (normalizedRole !== 'MATCHMAKER' && normalizedRole !== 'BREAKUP_BUDDY' && normalizedRole !== 'HOST' && normalizedRole !== 'CAFE'),

        idType: idType ? String(idType).trim() : null,
        idDocument: idDocument ? String(idDocument).trim() : null,
        profilePhoto: profilePhoto ? String(profilePhoto).trim() : null,
        govIdProof,
        addressProof,
        eduCertificate,
        workExperience,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        city: true,
        gender: true,
        relationshipIntent: true,
        role: true,
        createdAt: true,
      },
    });

    // Create JWT token for immediate login (removed per requirement)
    // We now send OTP instead.
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    global.registrationOtpStore = global.registrationOtpStore || new Map();
    const now = Date.now();
    for (const [key, record] of global.registrationOtpStore.entries()) {
      if (!record || record.expiresAt < now) {
        global.registrationOtpStore.delete(key);
      }
    }
    if (global.registrationOtpStore.size > 1000) {
      const oldestKey = global.registrationOtpStore.keys().next().value;
      if (oldestKey) global.registrationOtpStore.delete(oldestKey);
    }
    global.registrationOtpStore.set(cleanEmail, { otp, userId: newUser.id, role: newUser.role, expiresAt: Date.now() + 10 * 60 * 1000 });

    const { sendRegistrationOTP } = require('../utils/mailer');
    await sendRegistrationOTP({ userEmail: cleanEmail, userName: newUser.name, otp });

    return res.status(200).json({
      success: true,
      requiresOtp: true,
      message: 'OTP sent to your email. Please verify to complete registration.',
      email: cleanEmail,
      role: newUser.role,
    });
  } catch (error) {
    console.error('Error during registration:', error);
    // Safety check for unique constraint violations
    if (error.code === 'P2002') {
      const field = error.meta?.target?.[0] || 'credential';
      return res.status(409).json({
        success: false,
        message: `An account already exists with this ${field}.`,
      });
    }
    return res.status(500).json({
      success: false,
      message: "We couldn't connect to JabWeMeet right now. Please try again.",
    });
  }
});

// 2.5. POST /api/auth/verify-registration-otp
router.post('/verify-registration-otp', verifyOtpLimiter, async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Email and OTP are required.' });
    }
    const cleanEmail = email.trim().toLowerCase();
    
    global.registrationOtpStore = global.registrationOtpStore || new Map();
    const stored = global.registrationOtpStore.get(cleanEmail);

    if (!stored || stored.otp !== otp) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP.' });
    }
    
    if (Date.now() > stored.expiresAt) {
      global.registrationOtpStore.delete(cleanEmail);
      return res.status(400).json({ success: false, message: 'OTP has expired. Please register again.' });
    }

    // OTP is valid
    global.registrationOtpStore.delete(cleanEmail);

    const user = await prisma.user.findUnique({ where: { email: cleanEmail } });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    
    // We can set some verified flag here if we want, but for now it's fine.
    
    const { sendRegistrationSuccessEmail } = require('../utils/mailer');
    await sendRegistrationSuccessEmail({ userEmail: cleanEmail, userName: user.name, role: user.role });

    const pendingApproval = (user.role === 'MATCHMAKER' || user.role === 'BREAKUP_BUDDY' || user.role === 'HOST' || user.role === 'CAFE');

    return res.status(200).json({
      success: true,
      message: 'Registration successful! 🎉',
      pendingApproval,
      redirectUrl: '/login'
    });
  } catch (error) {
    console.error('Error in verify-registration-otp:', error);
    return res.status(500).json({ success: false, message: 'Server error during verification.' });
  }
});

// 3. POST /api/auth/login
router.post('/login', loginLimiter, async (req, res) => {
  try {
    const { identifier, email, phone, password } = req.body;
    const loginTarget = identifier || email || phone;

    if (!loginTarget || typeof loginTarget !== 'string' || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide your email or mobile number, and password.',
      });
    }

    const cleanTarget = loginTarget.trim().toLowerCase();

    // Query user by email OR phone
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: cleanTarget },
          { phone: cleanTarget },
          { phone: cleanTarget.replace(/\s+/g, '') },
        ],
      },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Email/mobile or password is incorrect.',
      });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Email/mobile or password is incorrect.',
      });
    }

    // Block deactivated, suspended, or blocked accounts
    if (user.status && user.status !== 'ACTIVE') {
      return res.status(403).json({
        success: false,
        message: `Your account has been ${user.status.toLowerCase()}. Please contact platform administration.`,
      });
    }

    if ((user.role === 'MATCHMAKER' || user.role === 'BREAKUP_BUDDY' || user.role === 'HOST' || user.role === 'CAFE') && !user.isApproved) {
      return res.status(403).json({
        success: false,
        pendingApproval: true,
        message: 'Your account is pending admin approval. You will be notified once approved.',
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Set secure HTTP-only cookie
    res.cookie('token', token, getCookieOptions());

    const redirectUrl = getRoleRedirect(user.role);

    return res.json({
      success: true,
      message: 'Login successful! Welcome back.',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        city: user.city,
        gender: user.gender,
        relationshipIntent: user.relationshipIntent,
        role: user.role,
      },
      redirectUrl,
    });
  } catch (error) {
    console.error('Error during login:', error);
    return res.status(500).json({
      success: false,
      message: "We couldn't connect to JabWeMeet right now. Please try again.",
    });
  }
});

// 4. GET /api/auth/me - Clean session profile check
router.get('/me', async (req, res) => {
  try {
    let token = null;

    // Check HTTP-only cookie first
    if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }
    // Fallback to Authorization header
    else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.json({ success: false, authenticated: false, user: null });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return res.json({ success: false, authenticated: false, user: null });
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        city: true,
        gender: true,
        relationshipIntent: true,
        role: true,
        dateOfBirth: true,
        createdAt: true,
        idType: true,
        idDocument: true,
        profilePhoto: true,
        displayName: true,
        shortBio: true,
        languages: true,
        areasOfExpertise: true,
        sessionTypes: true,
        availableDays: true,
        availableTimeStart: true,
        availableTimeEnd: true,
        isAvailableForRequests: true,
        weeklySchedule: true,
        blockedDates: true,
      },
    });

    if (!user) {
      return res.json({ success: false, authenticated: false, user: null });
    }

    return res.json({
      success: true,
      authenticated: true,
      user,
      redirectUrl: getRoleRedirect(user.role),
    });
  } catch (error) {
    console.error('Error in /me:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve profile.' });
  }
});

// 4b. PUT /api/auth/profile - Update editable member profile fields
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const {
      city,
      gender,
      relationshipIntent,
      dateOfBirth,
      profilePhoto,
      displayName,
      shortBio,
      languages,
      areasOfExpertise,
      sessionTypes,
      availableDays,
      availableTimeStart,
      availableTimeEnd
    } = req.body;
    const updateData = {};

    if (city !== undefined && typeof city === 'string') updateData.city = city.trim();
    if (gender !== undefined && typeof gender === 'string') updateData.gender = gender.trim();
    if (relationshipIntent !== undefined && typeof relationshipIntent === 'string') {
      updateData.relationshipIntent = relationshipIntent.trim();
    }
    if (profilePhoto !== undefined) updateData.profilePhoto = profilePhoto;
    if (displayName !== undefined && typeof displayName === 'string') updateData.displayName = displayName.trim();
    if (shortBio !== undefined && typeof shortBio === 'string') updateData.shortBio = shortBio.trim();
    if (Array.isArray(languages)) updateData.languages = languages;
    if (Array.isArray(areasOfExpertise)) updateData.areasOfExpertise = areasOfExpertise;
    if (Array.isArray(sessionTypes)) updateData.sessionTypes = sessionTypes;
    if (Array.isArray(availableDays)) updateData.availableDays = availableDays;
    if (availableTimeStart !== undefined) updateData.availableTimeStart = availableTimeStart;
    if (availableTimeEnd !== undefined) updateData.availableTimeEnd = availableTimeEnd;

    if (dateOfBirth) {
      const parsedDate = new Date(dateOfBirth);
      if (!isNaN(parsedDate.getTime())) {
        updateData.dateOfBirth = parsedDate;
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.user.userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        displayName: true,
        email: true,
        phone: true,
        city: true,
        gender: true,
        relationshipIntent: true,
        role: true,
        profilePhoto: true,
        shortBio: true,
        languages: true,
        areasOfExpertise: true,
        sessionTypes: true,
        availableDays: true,
        isAvailableForRequests: true,
        weeklySchedule: true,
        blockedDates: true,
        dateOfBirth: true,
        createdAt: true,
      },
    });

    return res.json({
      success: true,
      user: updatedUser,
      message: 'Profile updated successfully.',
    });
  } catch (error) {
    console.error('Error in PUT /profile:', error);
    return res.status(500).json({ success: false, message: 'Failed to update profile.' });
  }
});

// 5. POST /api/auth/logout
router.post('/logout', (req, res) => {
  const isProd = process.env.NODE_ENV === 'production';
  res.clearCookie('token', {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    path: '/',
  });
  return res.json({ success: true, message: 'Logged out successfully.' });
});

// 6. POST /api/auth/forgot-password
router.post('/forgot-password', forgotPasswordLimiter, async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || typeof email !== 'string') {
      return res.status(400).json({ success: false, message: 'Please enter your email address.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = await prisma.user.findUnique({
      where: { email: cleanEmail },
      select: { id: true, email: true, name: true },
    });

    // To prevent account enumeration, return standard response even if email doesn't exist
    if (!user) {
      return res.json({
        success: true,
        message: 'If an account exists with this email, instructions have been prepared.',
      });
    }

    // Generate secure token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.passwordReset.create({
      data: {
        email: cleanEmail,
        token: resetToken,
        expiresAt,
      },
    });

    try {
      await sendPasswordResetEmail({
        userEmail: cleanEmail,
        userName: user.name || 'User',
        resetToken,
      });
    } catch (err) {
      console.warn('Failed to send password reset email:', err.message);
    }

    return res.json({
      success: true,
      message: 'If an account exists with this email, instructions have been sent to your email.',
    });
  } catch (error) {
    console.error('Error in forgot-password:', error);
    return res.status(500).json({ success: false, message: 'Password reset request failed.' });
  }
});

// 7. POST /api/auth/reset-password
router.post('/reset-password', forgotPasswordLimiter, async (req, res) => {
  try {
    const { token, newPassword, confirmPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ success: false, message: 'Reset token and new password are required.' });
    }
    if (confirmPassword !== undefined && newPassword !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'Passwords do not match.' });
    }

    const hasUpper = /[A-Z]/.test(newPassword);
    const hasLower = /[a-z]/.test(newPassword);
    const hasNumber = /[0-9]/.test(newPassword);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\/]/.test(newPassword);
    if (newPassword.length < 8 || !hasUpper || !hasLower || !hasNumber || !hasSpecial) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters and contain uppercase, lowercase, number, and special character.',
      });
    }

    const resetRecord = await prisma.passwordReset.findUnique({
      where: { token },
    });

    if (!resetRecord || resetRecord.used || resetRecord.expiresAt < new Date()) {
      return res.status(400).json({ success: false, message: 'Invalid or expired password reset token.' });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    // Update user password and mark token as used in transaction
    await prisma.$transaction([
      prisma.user.update({
        where: { email: resetRecord.email },
        data: { password: passwordHash },
      }),
      prisma.passwordReset.update({
        where: { id: resetRecord.id },
        data: { used: true },
      }),
    ]);

    return res.json({ success: true, message: 'Password reset successfully. You can now login.' });
  } catch (error) {
    console.error('Error in reset-password:', error);
    return res.status(500).json({ success: false, message: 'Failed to reset password.' });
  }
});

// 7b. POST /api/auth/change-password (Authenticated password change)
router.post('/change-password', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Current password and new password are required.' });
    }

    if (confirmPassword !== undefined && newPassword !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'New passwords do not match.' });
    }

    const hasUpper = /[A-Z]/.test(newPassword);
    const hasLower = /[a-z]/.test(newPassword);
    const hasNumber = /[0-9]/.test(newPassword);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\/]/.test(newPassword);
    if (newPassword.length < 8 || !hasUpper || !hasLower || !hasNumber || !hasSpecial) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 8 characters and contain uppercase, lowercase, number, and special character.',
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, password: true },
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Incorrect current password.' });
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({ success: false, message: 'New password cannot be the same as current password.' });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: userId },
      data: { password: passwordHash },
    });

    return res.json({ success: true, message: 'Password changed successfully.' });
  } catch (error) {
    console.error('Error changing password:', error);
    return res.status(500).json({ success: false, message: 'Failed to change password.' });
  }
});


// Get connections for the logged-in user
router.get('/connections', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const connections = await prisma.matchSuggestion.findMany({
      where: {
        OR: [
          { clientId: userId },
          { suggestedProfileId: userId }
        ]
      },
      include: {
        client: {
          select: { id: true, name: true, profileImage: true, gender: true, city: true, dateOfBirth: true }
        },
        suggestedProfile: {
          select: { id: true, name: true, profileImage: true, gender: true, city: true, dateOfBirth: true }
        },
        matchmaker: {
          select: { id: true, name: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ success: true, connections });
  } catch (error) {
    console.error('Error fetching connections:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch connections' });
  }
});

// Approve or reject a connection
router.put('/connections/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body; // 'Approve' or 'Reject'
    const userId = req.user.userId;

    const connection = await prisma.matchSuggestion.findUnique({ where: { id } });
    if (!connection) {
      return res.status(404).json({ success: false, message: 'Connection not found' });
    }

    const updateData = {};
    if (connection.clientId === userId) {
      updateData.clientStatus = action === 'Approve' ? 'Approved' : 'Rejected';
    } else if (connection.suggestedProfileId === userId) {
      updateData.suggestedStatus = action === 'Approve' ? 'Approved' : 'Rejected';
    } else {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    // Determine overall status
    let overallStatus = connection.status;
    if (action === 'Reject') {
      overallStatus = 'Rejected';
    } else if (action === 'Approve') {
      const otherStatus = connection.clientId === userId ? connection.suggestedStatus : connection.clientStatus;
      if (otherStatus === 'Approved') {
        overallStatus = 'BothApproved';
      } else {
        overallStatus = connection.clientId === userId ? 'ClientApproved' : 'SuggestedApproved';
      }
    }
    updateData.status = overallStatus;

    const updated = await prisma.matchSuggestion.update({
      where: { id },
      data: updateData
    });

    // Send email to opposite user about the status update
    try {
      const oppositeUserId = connection.clientId === userId ? connection.suggestedProfileId : connection.clientId;
      const currentUser = await prisma.user.findUnique({ where: { id: userId } });
      const oppositeUser = await prisma.user.findUnique({ where: { id: oppositeUserId } });
      const { sendMail, escapeHtml } = require('../services/emailService');

      if (oppositeUser && oppositeUser.email && currentUser) {
        let subject = '';
        let messageText = '';
        let messageHtml = '';

        const safeOppositeName = escapeHtml(oppositeUser.name || 'Member');
        const safeCurrentName = escapeHtml(currentUser.name || 'Member');

        if (action === 'Approve') {
          subject = 'Connection Request Accepted - JabWeMeet';
          messageText = `Hello ${oppositeUser.name},\n\nGreat news! ${currentUser.name} has accepted your connection request.\nLog into your dashboard to check it out.\n\nBest Regards,\nJabWeMeet Team`;
          messageHtml = `<p>Hello <strong>${safeOppositeName}</strong>,</p><p>Great news! <strong>${safeCurrentName}</strong> has accepted your connection request.</p><p>Log into your dashboard to check it out.</p><br><p>Best Regards,<br>JabWeMeet Team</p>`;
        } else if (action === 'Reject') {
          subject = 'Connection Request Passed - JabWeMeet';
          messageText = `Hello ${oppositeUser.name},\n\n${currentUser.name} has passed on your connection request. Don't worry, there are plenty of other matches!\n\nBest Regards,\nJabWeMeet Team`;
          messageHtml = `<p>Hello <strong>${safeOppositeName}</strong>,</p><p><strong>${safeCurrentName}</strong> has passed on your connection request. Don't worry, there are plenty of other matches!</p><br><p>Best Regards,<br>JabWeMeet Team</p>`;
        }

        if (subject) {
          await sendMail(oppositeUser.email, subject, messageText, messageHtml);
        }
      }
    } catch (mailError) {
      console.error('Error sending update email:', mailError);
    }

    res.json({ success: true, connection: updated });
  } catch (error) {
    console.error('Error updating connection:', error);
    res.status(500).json({ success: false, message: 'Failed to update connection' });
  }
});

// Get messages for a connection
router.get('/connections/:id/messages', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const connection = await prisma.matchSuggestion.findUnique({ where: { id } });
    if (!connection || (connection.clientId !== userId && connection.suggestedProfileId !== userId)) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    // Mark messages as read
    await prisma.connectionMessage.updateMany({
      where: {
        suggestionId: id,
        senderId: { not: userId },
        isRead: false
      },
      data: { isRead: true }
    });

    const messages = await prisma.connectionMessage.findMany({
      where: { suggestionId: id },
      orderBy: { createdAt: 'asc' },
      include: { sender: { select: { id: true, name: true, profileImage: true } } }
    });

    res.json({ success: true, messages });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch messages' });
  }
});

// Send a message in a connection
router.post('/connections/:id/messages', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const userId = req.user.userId;

    const connection = await prisma.matchSuggestion.findUnique({ where: { id } });
    if (!connection || (connection.clientId !== userId && connection.suggestedProfileId !== userId)) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const message = await prisma.connectionMessage.create({
      data: {
        suggestionId: id,
        senderId: userId,
        content
      },
      include: { sender: { select: { id: true, name: true, profileImage: true } } }
    });

    // Email notification if receiver is not active
    try {
      const io = req.app.get('io');
      const receiverId = connection.clientId === userId ? connection.suggestedProfileId : connection.clientId;
      const receiverSockets = io ? await io.in(`user-${receiverId}`).fetchSockets() : [];
      const isOnline = receiverSockets.length > 0;

      if (!isOnline) {
        const receiver = await prisma.user.findUnique({ where: { id: receiverId } });
        if (receiver && receiver.email) {
          const { sendMail, escapeHtml } = require('../services/emailService');
          const safeSenderName = escapeHtml(message.sender.name || 'someone');
          const safeReceiverName = escapeHtml(receiver.name || 'there');
          const safeSnippet = escapeHtml(content.substring(0, 50) + (content.length > 50 ? '...' : ''));
          const subject = `📬 New Message from ${safeSenderName}`;
          const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
              <h2 style="color: #FF4081;">💌 You've got a new message!</h2>
              <p>Hi ${safeReceiverName},</p>
              <p>You have an unread message waiting for you on JabWeMeet.</p>
              <div style="background-color: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #FF4081;">
                <p><em>"${safeSnippet}"</em></p>
              </div>
              <p>Since you weren't active, we thought we'd let you know. Log in now to reply and keep the conversation going! ✨</p>
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard?tab=messages" style="display: inline-block; padding: 10px 20px; background-color: #FF4081; color: white; text-decoration: none; border-radius: 5px; margin-top: 10px;">Go to Messages 🚀</a>
              <br/><br/>
              <p>Cheers, <br/>The JabWeMeet Team 💖</p>
            </div>
          `;
          sendMail(receiver.email, subject, '', html).catch(err => console.error('Email send failed', err));
        }
      }
    } catch (notifyErr) {
      console.error('Error notifying offline user:', notifyErr);
    }

    res.json({ success: true, message });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ success: false, message: 'Failed to send message' });
  }
});

// Get unread messages state
router.get('/messages/unread', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    const unreadMessages = await prisma.connectionMessage.findMany({
      where: {
        suggestion: {
          OR: [
            { clientId: userId },
            { suggestedProfileId: userId }
          ]
        },
        senderId: { not: userId },
        isRead: false
      },
      select: {
        suggestionId: true,
        sender: { select: { name: true } }
      }
    });

    const unreadByConnection = {};
    unreadMessages.forEach(m => {
      unreadByConnection[m.suggestionId] = (unreadByConnection[m.suggestionId] || 0) + 1;
    });

    res.json({ 
      success: true, 
      count: unreadMessages.length,
      unreadByConnection,
      senders: [...new Set(unreadMessages.map(m => m.sender.name))]
    });
  } catch (error) {
    console.error('Error fetching unread:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch unread' });
  }
});

// Check Dating Eligibility & Packages
router.get('/dating-eligibility', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const approvedMatchesCount = await prisma.matchSuggestion.count({
      where: {
        OR: [
          { clientId: userId, clientStatus: 'Approved' },
          { suggestedProfileId: userId, suggestedStatus: 'Approved' }
        ]
      }
    });

    let packages = await prisma.$queryRawUnsafe(`
      SELECT * FROM "ServicePackage" WHERE "type" = 'DATING' ORDER BY "price" ASC
    `);

    if (packages.length === 0) {
      await prisma.$executeRawUnsafe(`
        INSERT INTO "ServicePackage" ("id", "name", "description", "price", "type", "sessionLimit")
        VALUES ('PKG-DATE-1', 'Premium Dating Pass', 'Unlock 1 additional curated date', 999.0, 'DATING', 1)
        ON CONFLICT ("id") DO NOTHING;
      `);
      packages = await prisma.$queryRawUnsafe(`
        SELECT * FROM "ServicePackage" WHERE "type" = 'DATING' ORDER BY "price" ASC
      `);
    }

    const purchased = await prisma.$queryRawUnsafe(`
      SELECT COUNT(*) as count FROM "Payment" WHERE "userId" = $1 AND "type" = 'DATING_PACKAGE' AND "status" = 'SUCCESS'
    `, userId);
    
    const purchasedCount = purchased && purchased.length > 0 ? Number(purchased[0].count) : 0;
    const totalAllowed = 1 + purchasedCount;

    res.json({
      success: true,
      approvedMatchesCount,
      freeDatesRemaining: Math.max(0, totalAllowed - approvedMatchesCount),
      packages
    });
  } catch (err) {
    console.error('Error fetching dating eligibility:', err);
    res.status(500).json({ success: false, message: 'Unable to check dating eligibility' });
  }
});

const Razorpay = require('razorpay');

// Helper to get Razorpay instance
function getRazorpayInstance() {
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || '',
    key_secret: process.env.RAZORPAY_KEY_SECRET || '',
  });
}

// 1. Create Razorpay Order for Dating Package (Price validated against DB)
router.post('/payments/create-razorpay-order', authenticateToken, async (req, res) => {
  try {
    const { packageId } = req.body;
    if (!packageId) {
      return res.status(400).json({ success: false, message: 'Package ID is required' });
    }

    // Authoritative lookup from database to prevent price tampering
    const pkgs = await prisma.$queryRawUnsafe(
      `SELECT * FROM "ServicePackage" WHERE "id" = $1 AND "type" = 'DATING' LIMIT 1`,
      packageId
    );
    const selectedPackage = pkgs && pkgs.length > 0 ? pkgs[0] : null;

    if (!selectedPackage || selectedPackage.price <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid or unavailable dating package' });
    }

    const packagePrice = parseFloat(selectedPackage.price);
    const amountInPaise = Math.round(packagePrice * 100);
    const options = {
      amount: amountInPaise,
      currency: "INR",
      receipt: `rcpt_pkg_${Date.now().toString().slice(-6)}`,
      notes: {
        packageId: selectedPackage.id,
        userId: req.user.userId
      },
    };

    const razorpay = getRazorpayInstance();
    const order = await razorpay.orders.create(options);

    res.json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID || ''
    });
  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).json({ success: false, message: "Failed to create payment order" });
  }
});

// 2. Verify Razorpay Payment for Dating Package
router.post('/payments/verify-razorpay-payment', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, packageId } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !packageId) {
      return res.status(400).json({ success: false, message: "Missing required payment verification parameters" });
    }

    // Verify package existence and authoritative price
    const pkgs = await prisma.$queryRawUnsafe(
      `SELECT * FROM "ServicePackage" WHERE "id" = $1 AND "type" = 'DATING' LIMIT 1`,
      packageId
    );
    const selectedPackage = pkgs && pkgs.length > 0 ? pkgs[0] : null;

    if (!selectedPackage) {
      return res.status(400).json({ success: false, message: "Invalid package reference" });
    }

    const verifiedAmount = parseFloat(selectedPackage.price);

    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) {
      return res.status(500).json({ success: false, message: "Payment configuration error" });
    }
    const hmac = crypto.createHmac("sha256", secret);
    hmac.update(`${razorpay_order_id}|${razorpay_payment_id}`);
    const generatedSignature = hmac.digest("hex");

    let isSignatureValid = false;
    try {
      const generatedBuf = Buffer.from(generatedSignature, "utf-8");
      const signatureBuf = Buffer.from(razorpay_signature, "utf-8");
      if (generatedBuf.length === signatureBuf.length) {
        isSignatureValid = crypto.timingSafeEqual(generatedBuf, signatureBuf);
      }
    } catch (e) {
      isSignatureValid = false;
    }

    if (!isSignatureValid) {
      return res.status(400).json({ success: false, message: "Invalid payment signature" });
    }

    // Process actual DB update with verified package price (never trust client-supplied amount)
    const paymentId = 'PAY-' + razorpay_payment_id.substring(0, 7).toUpperCase();
    await prisma.$executeRawUnsafe(`
      INSERT INTO "Payment" ("id", "userId", "amount", "type", "status", "gateway", "createdAt")
      VALUES ($1, $2, $3, 'DATING_PACKAGE', 'SUCCESS', 'RAZORPAY', NOW())
    `, paymentId, userId, verifiedAmount);

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user && user.assignedManagerId) {
      const rmEarning = verifiedAmount * 0.90;
      await prisma.$executeRawUnsafe(`
        INSERT INTO "Payment" ("id", "userId", "amount", "type", "status", "gateway", "createdAt")
        VALUES ($1, $2, $3, 'RM_EARNING_DATING', 'SUCCESS', 'INTERNAL', NOW())
      `, 'EARN-' + Math.random().toString(36).substring(2, 9).toUpperCase(), user.assignedManagerId, rmEarning);
    }

    res.json({ success: true, paymentId });
  } catch (err) {
    console.error('Error verifying payment:', err);
    res.status(500).json({ success: false, message: "Payment verification failed" });
  }
});

// Fetch User Payments
router.get('/payments', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const payments = await prisma.$queryRawUnsafe(`
      SELECT * FROM "Payment" WHERE "userId" = $1 ORDER BY "createdAt" DESC
    `, userId);
    res.json({ success: true, payments });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

// Submit Date Feedback
router.post('/connections/:id/feedback', authenticateToken, dateFeedbackLimiter, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id: matchId } = req.params;
    const { rating, feedback } = req.body;

    if (!rating || !feedback || typeof feedback !== 'string' || feedback.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Rating (1-5) and feedback text are required' });
    }

    const numRating = parseInt(rating, 10);
    if (isNaN(numRating) || numRating < 1 || numRating > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be an integer between 1 and 5' });
    }

    const trimmedFeedback = feedback.trim().substring(0, 1500);

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // Verify user is actually a participant in this connection
    const connection = await prisma.matchSuggestion.findUnique({ where: { id: matchId } });
    if (!connection) {
      return res.status(404).json({ success: false, message: 'Match connection not found' });
    }

    if (connection.clientId !== userId && connection.suggestedProfileId !== userId && req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Unauthorized: You are not a participant in this connection' });
    }

    // AI Sentiment Analysis
    let sentiment = 'NEUTRAL';
    try {
      const { GoogleGenAI } = require('@google/genai');
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Analyze the sentiment of this post-date feedback. Respond with ONLY ONE WORD: POSITIVE, NEGATIVE, or NEUTRAL.\n\nFeedback: "${trimmedFeedback}"\nRating: ${numRating}/5`
      });
      const result = response.text.trim().toUpperCase();
      if (result.includes('NEGATIVE')) sentiment = 'NEGATIVE';
      else if (result.includes('POSITIVE')) sentiment = 'POSITIVE';
      else if (result.includes('NEUTRAL')) sentiment = 'NEUTRAL';
      else if (numRating <= 2) sentiment = 'NEGATIVE';
    } catch (aiErr) {
      console.error('AI Sentiment Analysis failed:', aiErr.message);
      if (numRating <= 2) sentiment = 'NEGATIVE';
    }

    // Check if feedback already exists for this user and connection
    const existingFeedback = await prisma.$queryRawUnsafe(`
      SELECT id FROM "DateFeedback" WHERE "matchId" = $1 AND "userId" = $2 LIMIT 1
    `, matchId, userId);

    if (existingFeedback && existingFeedback.length > 0) {
      await prisma.$executeRawUnsafe(`
        UPDATE "DateFeedback" 
        SET "rating" = $1, "feedback" = $2, "sentiment" = $3, "createdAt" = CURRENT_TIMESTAMP
        WHERE "id" = $4
      `, numRating, trimmedFeedback, sentiment, existingFeedback[0].id);
    } else {
      const feedbackId = 'FB-' + Math.random().toString(36).substring(2, 9).toUpperCase();
      await prisma.$executeRawUnsafe(`
        INSERT INTO "DateFeedback" ("id", "matchId", "userId", "gender", "rating", "feedback", "sentiment")
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, feedbackId, matchId, userId, user.gender || 'Unknown', numRating, trimmedFeedback, sentiment);
    }
    
    res.json({ success: true, sentiment });
  } catch (err) {
    console.error('Error submitting date feedback:', err);
    res.status(500).json({ success: false, message: 'Failed to submit date feedback' });
  }
});

// Get Public Feedbacks (Testimonials)
router.get('/public/feedbacks', async (req, res) => {
  try {
    const feedbacks = await prisma.$queryRawUnsafe(`
      SELECT f.*, u."name" as "userName", u."profileImage" as "userImage"
      FROM "DateFeedback" f
      JOIN "User" u ON f."userId" = u."id"
      WHERE f."isPublished" = true
      ORDER BY f."createdAt" DESC
      LIMIT 5
    `);
    res.json({ success: true, feedbacks });
  } catch (err) {
    console.error('Error fetching public feedbacks:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch testimonials' });
  }
});

// Generic Chat API (Admin <-> Staff / Users)
router.get('/chat/:contactId', authenticateToken, chatLimiter, async (req, res) => {
  try {
    let { contactId } = req.params;
    const userId = req.user.userId;

    if (contactId === 'admin') {
      const adminUser = await prisma.user.findFirst({ where: { role: 'ADMIN' }, orderBy: { createdAt: 'asc' } });
      if (!adminUser) return res.json({ success: true, messages: [] });
      contactId = adminUser.id;
    } else if (req.user.role !== 'ADMIN') {
      // Non-admins can only chat with administrators
      const targetUser = await prisma.user.findUnique({
        where: { id: contactId },
        select: { role: true }
      });
      if (!targetUser || targetUser.role !== 'ADMIN') {
        return res.status(403).json({ success: false, message: 'You are only authorized to communicate with administrators.' });
      }
    }

    let conversation = await prisma.conversation.findFirst({
      where: {
        OR: [
          { clientId: userId, matchmakerId: contactId },
          { clientId: contactId, matchmakerId: userId }
        ]
      },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          include: { sender: { select: { name: true } } }
        }
      }
    });

    if (!conversation) {
      return res.json({ success: true, messages: [] });
    }

    // Mark as read
    await prisma.message.updateMany({
      where: {
        conversationId: conversation.id,
        senderId: contactId,
        isRead: false
      },
      data: { isRead: true }
    });

    res.json({ success: true, messages: conversation.messages });
  } catch (error) {
    console.error('Error fetching chat:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch chat' });
  }
});

router.post('/chat/:contactId', authenticateToken, chatLimiter, async (req, res) => {
  try {
    let { contactId } = req.params;
    const userId = req.user.userId;
    const { text } = req.body;

    if (contactId === 'admin') {
      const adminUser = await prisma.user.findFirst({ where: { role: 'ADMIN' }, orderBy: { createdAt: 'asc' } });
      if (!adminUser) return res.status(404).json({ success: false, message: 'Admin not found' });
      contactId = adminUser.id;
    } else if (req.user.role !== 'ADMIN') {
      // Non-admins can only chat with administrators
      const targetUser = await prisma.user.findUnique({
        where: { id: contactId },
        select: { role: true }
      });
      if (!targetUser || targetUser.role !== 'ADMIN') {
        return res.status(403).json({ success: false, message: 'You are only authorized to communicate with administrators.' });
      }
    }

    if (typeof text !== 'string') {
      return res.status(400).json({ success: false, message: 'Text is required' });
    }

    const sanitizedText = text.trim();
    if (!sanitizedText) {
      return res.status(400).json({ success: false, message: 'Message cannot be empty' });
    }
    if (sanitizedText.length > 1000) {
      return res.status(400).json({ success: false, message: 'Message cannot exceed 1000 characters' });
    }

    let conversation = await prisma.conversation.findFirst({
      where: {
        OR: [
          { clientId: userId, matchmakerId: contactId },
          { clientId: contactId, matchmakerId: userId }
        ]
      }
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          clientId: userId,
          matchmakerId: contactId
        }
      });
    }

    const message = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        senderId: userId,
        content: sanitizedText
      }
    });

    res.json({ success: true, message });
  } catch (error) {
    console.error('Error sending chat:', error);
    res.status(500).json({ success: false, message: 'Failed to send chat' });
  }
});




// CAFE FINDER ENDPOINTS
router.get('/cafes', authenticateToken, async (req, res) => {
  try {
    const { location, dateTime } = req.query;
    let whereClause = {};
    if (location) {
      const mainLocation = location.split(',')[0].trim();
      whereClause = {
        OR: [
          { city: { contains: mainLocation, mode: 'insensitive' } },
          { address: { contains: mainLocation, mode: 'insensitive' } },
          { city: { contains: location, mode: 'insensitive' } },
          { address: { contains: location, mode: 'insensitive' } }
        ]
      };
    }
    let cafes = await prisma.cafeProfile.findMany({
      where: whereClause,
      include: { user: { select: { name: true, email: true } }, menuItems: true },
      take: 20
    });

    if (dateTime) {
      const dateObj = new Date(dateTime);
      if (!isNaN(dateObj.getTime())) {
        const resDate = dateObj.toISOString().split('T')[0];
        const resTime = `${dateObj.getHours().toString().padStart(2, '0')}:${dateObj.getMinutes().toString().padStart(2, '0')}`;
        
        for (let cafe of cafes) {
          const reservations = await prisma.cafeReservation.findMany({
            where: {
              cafeId: cafe.id,
              date: resDate,
              time: resTime,
              status: { not: 'Cancelled' }
            }
          });
          cafe.isBooked = reservations.length > 0;
        }
      }
    }

    res.json({ success: true, cafes });
  } catch (error) {
    console.error('Error fetching cafes:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch cafes' });
  }
});

router.post('/connections/:id/book-cafe', authenticateToken, async (req, res) => {
  try {
    const { cafeId, cafeName, reservationDate, reservationTime, guests } = req.body;
    const { id } = req.params;

    // Verify connection exists and user is a participant
    const existingSuggestion = await prisma.matchSuggestion.findUnique({
      where: { id }
    });

    if (!existingSuggestion) {
      return res.status(404).json({ success: false, message: 'Connection not found' });
    }

    if (existingSuggestion.clientId !== req.user.userId && existingSuggestion.suggestedProfileId !== req.user.userId && req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Unauthorized: You are not a participant in this connection' });
    }

    if (!cafeName || typeof cafeName !== 'string') {
      return res.status(400).json({ success: false, message: 'Valid cafe name is required' });
    }

    // 1. Update MatchSuggestion with meetingVenue
    const suggestion = await prisma.matchSuggestion.update({
      where: { id },
      data: { meetingVenue: cafeName.trim() }
    });

    // 2. Create CafeReservation if cafeId provided
    const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
    if (cafeId) {
      await prisma.cafeReservation.create({
        data: {
          cafeId: String(cafeId),
          customerName: user?.name || 'JabWeMeet Member',
          guests: Math.max(1, Math.min(10, parseInt(guests, 10) || 2)),
          date: reservationDate || (suggestion.meetingDate ? suggestion.meetingDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0]),
          time: reservationTime || '18:00',
          status: 'Pending'
        }
      });
    }

    res.json({ success: true, message: 'Cafe booked successfully!', suggestion });
  } catch (error) {
    console.error('Error booking cafe:', error);
    res.status(500).json({ success: false, message: 'Failed to book cafe' });
  }
});


module.exports = router;

