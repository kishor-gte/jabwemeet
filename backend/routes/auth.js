const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
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

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// Rate limiting for login (5 failed attempts per 15 minutes)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { success: false, message: 'Too many login attempts. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
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
      return '/host/dashboard';
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
router.get('/check-email', async (req, res) => {
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
router.post('/register', upload.fields([
  { name: 'govIdProof', maxCount: 1 },
  { name: 'addressProof', maxCount: 1 },
  { name: 'eduCertificate', maxCount: 1 },
  { name: 'workExperience', maxCount: 1 }
]), async (req, res) => {
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

<<<<<<< HEAD
    // Date of birth & Age validation (18+) - optional for Breakup Buddy
    let dob = null;
    if (dateOfBirth) {
=======
    // Date of birth & Age validation (18+)
    let dob = new Date('2000-01-01'); // Default for MATCHMAKER
    if (role !== 'MATCHMAKER' || dateOfBirth) {
      if (!dateOfBirth) {
        return res.status(400).json({ success: false, message: 'Date of birth is required.' });
      }
>>>>>>> 662c0b7f315f4daf223d9ab5014757b836bd56aa
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
<<<<<<< HEAD
    } else if (role !== 'BREAKUP_BUDDY') {
      return res.status(400).json({ success: false, message: 'Date of birth is required.' });
    }

    // City validation - optional for Breakup Buddy
    if (role !== 'BREAKUP_BUDDY' && (!city || typeof city !== 'string' || city.trim().length < 2)) {
=======
    }

    // City validation
    let validCity = city;
    if (role !== 'MATCHMAKER' && (!city || typeof city !== 'string' || city.trim().length < 2)) {
>>>>>>> 662c0b7f315f4daf223d9ab5014757b836bd56aa
      return res.status(400).json({ success: false, message: 'City is required.' });
    } else if (role === 'MATCHMAKER' && !city) {
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
<<<<<<< HEAD
        city: city ? city.trim() : null,
        gender: gender ? String(gender).trim() : null,
        relationshipIntent: relationshipIntent ? String(relationshipIntent).trim() : null,
        role: role === 'BREAKUP_BUDDY' || role === 'MATCHMAKER' ? role : 'USER',
        idType: idType ? String(idType).trim() : null,
        idDocument: idDocument ? String(idDocument).trim() : null,
        profilePhoto: profilePhoto ? String(profilePhoto).trim() : null,
        isVerified: true,
=======
        city: validCity.trim(),
        gender: gender ? String(gender).trim() : null,
        relationshipIntent: relationshipIntent ? String(relationshipIntent).trim() : null,
        role: role === 'MATCHMAKER' || role === 'BREAKUP_BUDDY' ? role : 'USER',
        isVerified: role !== 'MATCHMAKER',
        isApproved: false,
        govIdProof,
        addressProof,
        eduCertificate,
        workExperience,
>>>>>>> 662c0b7f315f4daf223d9ab5014757b836bd56aa
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

    // Automatically create a Matchmaking Request for standard users
    if (newUser.role === 'USER') {
      await prisma.matchmakingRequest.create({
        data: {
          clientId: newUser.id,
          lookingFor: newUser.relationshipIntent || 'Partner',
          status: 'New',
        }
      });
    }

    // Create JWT token
    const token = jwt.sign(
      {
        userId: newUser.id,
        email: newUser.email,
        role: newUser.role,
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Set secure HTTP-only cookie
    res.cookie('token', token, getCookieOptions());

    const redirectUrl = getRoleRedirect(newUser.role);

    if (newUser.role === 'MATCHMAKER') {
      return res.status(201).json({
        success: true,
        message: 'Registration successful! Your application has been sent for admin verification.',
        pendingApproval: true,
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Your account has been created successfully. Welcome to JabWeMeet! 🎉',
      token,
      user: newUser,
      redirectUrl,
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

    if (user.role === 'MATCHMAKER' && !user.isApproved) {
      return res.status(403).json({
        success: false,
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

// 4. GET /api/auth/me
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
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
      },
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User account not found.' });
    }

    return res.json({
      success: true,
      user,
      redirectUrl: getRoleRedirect(user.role),
    });
  } catch (error) {
    console.error('Error in /me:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve profile.' });
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
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || typeof email !== 'string') {
      return res.status(400).json({ success: false, message: 'Please enter your email address.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = await prisma.user.findUnique({
      where: { email: cleanEmail },
      select: { id: true, email: true },
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

    return res.json({
      success: true,
      message: 'Password reset link prepared successfully.',
      resetToken, // Returned in dev for easy verification without email server
    });
  } catch (error) {
    console.error('Error in forgot-password:', error);
    return res.status(500).json({ success: false, message: 'Password reset request failed.' });
  }
});

// 7. POST /api/auth/reset-password
router.post('/reset-password', async (req, res) => {
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

// 8. PUT /api/auth/profile
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const {
      displayName,
      shortBio,
      languages,
      areasOfExpertise,
      sessionTypes,
      availableDays,
      availableTimeStart,
      availableTimeEnd,
      profilePhoto
    } = req.body;

    const updatedUser = await prisma.user.update({
      where: { id: req.user.userId },
      data: {
        ...(displayName && { displayName }),
        ...(shortBio && { shortBio }),
        ...(languages && { languages }),
        ...(areasOfExpertise && { areasOfExpertise }),
        ...(sessionTypes && { sessionTypes }),
        ...(availableDays && { availableDays }),
        ...(availableTimeStart && { availableTimeStart }),
        ...(availableTimeEnd && { availableTimeEnd }),
        ...(profilePhoto && { profilePhoto })
      },
    });

    return res.json({ success: true, message: 'Profile updated successfully', user: updatedUser });
  } catch (error) {
    console.error('Error updating profile:', error);
    return res.status(500).json({ success: false, message: 'Failed to update profile.' });
  }
});

module.exports = router;
