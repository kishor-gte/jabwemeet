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
    case 'EVENT_MANAGER':
    case 'EVENT_HOST':
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

    // Normalize role
    let normalizedRole = 'USER';
    if (role === 'MATCHMAKER' || role === 'BREAKUP_BUDDY' || role === 'HOST') {
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
    } else if (normalizedRole !== 'BREAKUP_BUDDY' && normalizedRole !== 'MATCHMAKER' && normalizedRole !== 'HOST') {
      return res.status(400).json({ success: false, message: 'Date of birth is required.' });
    }

    // City validation - optional for Breakup Buddy, Matchmaker & Host
    let validCity = city && typeof city === 'string' ? city.trim() : null;
    if (normalizedRole !== 'BREAKUP_BUDDY' && normalizedRole !== 'MATCHMAKER' && normalizedRole !== 'HOST') {
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
        isVerified: (normalizedRole !== 'MATCHMAKER' && normalizedRole !== 'BREAKUP_BUDDY'),
        isApproved: (normalizedRole !== 'MATCHMAKER' && normalizedRole !== 'BREAKUP_BUDDY'),

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

    if (newUser.role === 'MATCHMAKER' || newUser.role === 'BREAKUP_BUDDY' || newUser.role === 'HOST') {
      return res.status(201).json({
        success: true,
        message: 'Registration successful! Your application has been sent for admin verification.',
        pendingApproval: true,
        role: newUser.role,
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

    // Block deactivated, suspended, or blocked accounts
    if (user.status && user.status !== 'ACTIVE') {
      return res.status(403).json({
        success: false,
        message: `Your account has been ${user.status.toLowerCase()}. Please contact platform administration.`,
      });
    }

    if ((user.role === 'MATCHMAKER' || user.role === 'BREAKUP_BUDDY' || user.role === 'HOST') && !user.isApproved) {
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
    const { city, gender, relationshipIntent, dateOfBirth } = req.body;
    const updateData = {};

    if (city !== undefined && typeof city === 'string') updateData.city = city.trim();
    if (gender !== undefined && typeof gender === 'string') updateData.gender = gender.trim();
    if (relationshipIntent !== undefined && typeof relationshipIntent === 'string') {
      updateData.relationshipIntent = relationshipIntent.trim();
    }
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
        email: true,
        phone: true,
        city: true,
        gender: true,
        relationshipIntent: true,
        role: true,
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
      const { sendMail } = require('../services/emailService');

      if (oppositeUser && oppositeUser.email && currentUser) {
        let subject = '';
        let messageText = '';
        let messageHtml = '';

        if (action === 'Approve') {
          subject = 'Connection Request Accepted - JabWeMeet';
          messageText = `Hello ${oppositeUser.name},\n\nGreat news! ${currentUser.name} has accepted your connection request.\nLog into your dashboard to check it out.\n\nBest Regards,\nJabWeMeet Team`;
          messageHtml = `<p>Hello <strong>${oppositeUser.name}</strong>,</p><p>Great news! <strong>${currentUser.name}</strong> has accepted your connection request.</p><p>Log into your dashboard to check it out.</p><br><p>Best Regards,<br>JabWeMeet Team</p>`;
        } else if (action === 'Reject') {
          subject = 'Connection Request Passed - JabWeMeet';
          messageText = `Hello ${oppositeUser.name},\n\n${currentUser.name} has passed on your connection request. Don't worry, there are plenty of other matches!\n\nBest Regards,\nJabWeMeet Team`;
          messageHtml = `<p>Hello <strong>${oppositeUser.name}</strong>,</p><p><strong>${currentUser.name}</strong> has passed on your connection request. Don't worry, there are plenty of other matches!</p><br><p>Best Regards,<br>JabWeMeet Team</p>`;
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

    // Create table if it doesn't exist (to avoid crashes)
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "ServicePackage" (
        "id" TEXT PRIMARY KEY,
        "name" TEXT,
        "description" TEXT,
        "price" DOUBLE PRECISION,
        "type" TEXT,
        "sessionLimit" INTEGER DEFAULT 1
      );
    `);

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Payment" (
        "id" TEXT PRIMARY KEY,
        "userId" TEXT,
        "amount" DOUBLE PRECISION,
        "type" TEXT,
        "status" TEXT,
        "gateway" TEXT,
        "createdAt" TIMESTAMP DEFAULT NOW()
      );
    `);

    let packages = await prisma.$queryRawUnsafe(`
      SELECT * FROM "ServicePackage" WHERE "type" = 'DATING' ORDER BY "price" ASC
    `);

    if (packages.length === 0) {
      await prisma.$executeRawUnsafe(`
        INSERT INTO "ServicePackage" ("id", "name", "description", "price", "type", "sessionLimit")
        VALUES ('PKG-DATE-1', 'Premium Dating Pass', 'Unlock 1 additional curated date', 999.0, 'DATING', 1)
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
    console.error(err);
    res.status(500).json({ success: false });
  }
});

const Razorpay = require('razorpay');

// Helper to get Razorpay instance
function getRazorpayInstance() {
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_RIlD5bEKRjyn3h',
    key_secret: process.env.RAZORPAY_KEY_SECRET || 'Ltg6uo9vI8TiFMVfj2cGm4I8',
  });
}

// 1. Create Razorpay Order for Dating Package
router.post('/payments/create-razorpay-order', authenticateToken, async (req, res) => {
  try {
    const { packageId, amount } = req.body;
    if (!packageId || !amount) {
      return res.status(400).json({ success: false, message: 'Missing package details' });
    }

    const amountInPaise = Math.round(parseFloat(amount) * 100);
    const options = {
      amount: amountInPaise,
      currency: "INR",
      receipt: `rcpt_pkg_${Date.now().toString().slice(-6)}`,
      notes: {
        packageId,
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
      keyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_RIlD5bEKRjyn3h'
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
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, packageId, amount } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ success: false, message: "Missing payment parameters" });
    }

    const secret = process.env.RAZORPAY_KEY_SECRET || 'Ltg6uo9vI8TiFMVfj2cGm4I8';
    const hmac = crypto.createHmac("sha256", secret);
    hmac.update(`${razorpay_order_id}|${razorpay_payment_id}`);
    const generatedSignature = hmac.digest("hex");

    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({ success: false, message: "Invalid Signature" });
    }

    // Process actual DB update
    const paymentId = 'PAY-' + razorpay_payment_id.substring(0, 7).toUpperCase();
    await prisma.$executeRawUnsafe(`
      INSERT INTO "Payment" ("id", "userId", "amount", "type", "status", "gateway", "createdAt")
      VALUES ($1, $2, $3, 'DATING_PACKAGE', 'SUCCESS', 'RAZORPAY', NOW())
    `, paymentId, userId, parseFloat(amount));

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user && user.assignedManagerId) {
      const rmEarning = parseFloat(amount) * 0.90;
      await prisma.$executeRawUnsafe(`
        INSERT INTO "Payment" ("id", "userId", "amount", "type", "status", "gateway", "createdAt")
        VALUES ($1, $2, $3, 'RM_EARNING_DATING', 'SUCCESS', 'INTERNAL', NOW())
      `, 'EARN-' + Math.random().toString(36).substring(2, 9).toUpperCase(), user.assignedManagerId, rmEarning);
    }

    res.json({ success: true, paymentId });
  } catch (err) {
    console.error(err);
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
router.post('/connections/:id/feedback', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id: matchId } = req.params;
    const { rating, feedback } = req.body;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // AI Sentiment Analysis
    let sentiment = 'NEUTRAL';
    try {
      const { GoogleGenAI } = require('@google/genai');
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Analyze the sentiment of this post-date feedback. Respond with ONLY ONE WORD: POSITIVE, NEGATIVE, or NEUTRAL.\n\nFeedback: "${feedback}"\nRating: ${rating}/5`
      });
      const result = response.text.trim().toUpperCase();
      if (result.includes('NEGATIVE')) sentiment = 'NEGATIVE';
      else if (result.includes('POSITIVE')) sentiment = 'POSITIVE';
      else if (result.includes('NEUTRAL')) sentiment = 'NEUTRAL';
      else if (rating <= 2) sentiment = 'NEGATIVE';
    } catch (aiErr) {
      console.error('AI Sentiment Analysis failed:', aiErr);
      if (rating <= 2) sentiment = 'NEGATIVE';
    }

    // Create table if not exists (with sentiment and isPublished)
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "DateFeedback" (
        "id" TEXT NOT NULL,
        "matchId" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        "gender" TEXT,
        "rating" INTEGER NOT NULL,
        "feedback" TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "sentiment" TEXT DEFAULT 'NEUTRAL',
        "isPublished" BOOLEAN DEFAULT FALSE,
        CONSTRAINT "DateFeedback_pkey" PRIMARY KEY ("id")
      );
    `);

    const feedbackId = 'FB-' + Math.random().toString(36).substring(2, 9).toUpperCase();
    await prisma.$executeRawUnsafe(`
      INSERT INTO "DateFeedback" ("id", "matchId", "userId", "gender", "rating", "feedback", "sentiment")
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, feedbackId, matchId, userId, user.gender || 'Unknown', parseInt(rating), feedback, sentiment);
    
    res.json({ success: true, sentiment });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message, stack: err.stack });
  }
});

// Get Public Feedbacks (Testimonials)
router.get('/public/feedbacks', async (req, res) => {
  try {
    // Ensure table exists to prevent crash on fresh db
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "DateFeedback" (
        "id" TEXT NOT NULL,
        "matchId" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        "gender" TEXT,
        "rating" INTEGER NOT NULL,
        "feedback" TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "sentiment" TEXT DEFAULT 'NEUTRAL',
        "isPublished" BOOLEAN DEFAULT FALSE,
        CONSTRAINT "DateFeedback_pkey" PRIMARY KEY ("id")
      );
    `);

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
    res.status(500).json({ success: false });
  }
});

// Generic Chat API (Admin <-> Staff)
router.get('/chat/:contactId', authenticateToken, async (req, res) => {
  try {
    let { contactId } = req.params;
    const userId = req.user.userId;

    if (contactId === 'admin') {
      const adminUser = await prisma.user.findFirst({ where: { role: 'ADMIN' }, orderBy: { createdAt: 'asc' } });
      if (!adminUser) return res.json({ success: true, messages: [] });
      contactId = adminUser.id;
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

router.post('/chat/:contactId', authenticateToken, async (req, res) => {
  try {
    let { contactId } = req.params;
    const userId = req.user.userId;
    const { text } = req.body;

    if (contactId === 'admin') {
      const adminUser = await prisma.user.findFirst({ where: { role: 'ADMIN' }, orderBy: { createdAt: 'asc' } });
      if (!adminUser) return res.status(404).json({ success: false, message: 'Admin not found' });
      contactId = adminUser.id;
    }

    if (!text) return res.status(400).json({ success: false, message: 'Text is required' });

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
        content: text
      }
    });

    res.json({ success: true, message });
  } catch (error) {
    console.error('Error sending chat:', error);
    res.status(500).json({ success: false, message: 'Failed to send chat' });
  }
});

module.exports = router;

