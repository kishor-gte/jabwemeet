export interface ProfileStrengthResult {
  percentage: number;
  missingShortcuts: { label: string; sectionId: string }[];
}

export function calculateProfileStrength(
  user: {
    id?: string;
    name?: string;
    email?: string;
    phone?: string;
    city?: string;
    gender?: string | null;
    relationshipIntent?: string | null;
    dateOfBirth?: string;
  } | null,
  overrideProfile?: any
): ProfileStrengthResult {
  if (!user) {
    return { percentage: 0, missingShortcuts: [] };
  }

  let stored: any = overrideProfile || null;
  if (!stored && typeof window !== "undefined" && user.id) {
    try {
      const raw = localStorage.getItem(`jwm_matching_profile_${user.id}`);
      if (raw) stored = JSON.parse(raw);
    } catch (e) {}
  }

  const personalInfo = {
    fullName: user.name || "",
    email: user.email || "",
    phone: user.phone || "",
    city: stored?.personalInfo?.city || user.city || "",
    gender: stored?.personalInfo?.gender || user.gender || "",
    relationshipIntent: stored?.personalInfo?.relationshipIntent || user.relationshipIntent || "",
    dateOfBirth: stored?.personalInfo?.dateOfBirth || (user.dateOfBirth ? user.dateOfBirth.slice(0, 10) : ""),
    profession: stored?.personalInfo?.profession || "",
    education: stored?.personalInfo?.education || "",
    aboutMe: stored?.personalInfo?.aboutMe || "",
  };

  const lifestyle = stored?.lifestyle || {};
  const interests = stored?.interests || { hobbies: [] };
  const partnerPreferences = stored?.partnerPreferences || {
    coreQualities: [],
    preferredLocation: "Same City Only",
  };
  const eventPreferences = stored?.eventPreferences || { eventFormats: [], preferredDays: [] };

  let dobAge: number | null = null;
  if (personalInfo.dateOfBirth) {
    const bDate = new Date(personalInfo.dateOfBirth);
    if (!isNaN(bDate.getTime())) {
      const today = new Date();
      let age = today.getFullYear() - bDate.getFullYear();
      const m = today.getMonth() - bDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < bDate.getDate())) {
        age--;
      }
      dobAge = age;
    }
  }

  let score = 0;
  const missing: { label: string; sectionId: string }[] = [];

  // Verified basics (always 15% for authenticated members)
  score += 15;

  // City (5%)
  if (personalInfo.city && personalInfo.city.trim()) score += 5;
  else missing.push({ label: "Add Current City", sectionId: "personal" });

  // Gender (5%)
  if (personalInfo.gender) score += 5;
  else missing.push({ label: "Set Gender", sectionId: "personal" });

  // Relationship Intent (5%)
  if (personalInfo.relationshipIntent) score += 5;
  else missing.push({ label: "Choose Intent", sectionId: "personal" });

  // Date of Birth (5%)
  if (personalInfo.dateOfBirth && (!dobAge || dobAge >= 18)) score += 5;
  else missing.push({ label: "Enter Birthday", sectionId: "personal" });

  // Profession / Education (5%)
  if (
    (personalInfo.profession && personalInfo.profession.trim()) ||
    (personalInfo.education && personalInfo.education.trim())
  ) {
    score += 5;
  } else {
    missing.push({ label: "Add Profession", sectionId: "personal" });
  }

  // About Me (10%)
  if (personalInfo.aboutMe && personalInfo.aboutMe.trim().length >= 20) {
    score += 10;
  } else {
    missing.push({ label: "Write About Me", sectionId: "personal" });
  }

  // Lifestyle (15%)
  let lifestyleCount = 0;
  if (lifestyle.smoking) lifestyleCount++;
  if (lifestyle.alcohol) lifestyleCount++;
  if (lifestyle.foodPreference) lifestyleCount++;
  if (lifestyle.fitness) lifestyleCount++;
  if (lifestyle.travelFrequency) lifestyleCount++;
  score += Math.min(15, lifestyleCount * 3);
  if (lifestyleCount < 3) {
    missing.push({ label: "Set Lifestyle Habits", sectionId: "lifestyle" });
  }

  // Interests & Vibe (15%)
  const hobbies = Array.isArray(interests.hobbies) ? interests.hobbies : [];
  if (hobbies.length >= 3) score += 7;
  else missing.push({ label: "Pick 3+ Hobbies", sectionId: "interests" });

  if (interests.selfDescription) score += 4;
  if (Array.isArray(interests.personalityTraits) && interests.personalityTraits.length >= 2) {
    score += 4;
  }

  // Partner Criteria (10%)
  const coreQualities = Array.isArray(partnerPreferences.coreQualities)
    ? partnerPreferences.coreQualities
    : [];
  if (coreQualities.length >= 2) score += 5;
  else missing.push({ label: "Select Top Qualities", sectionId: "partner" });
  if (partnerPreferences.preferredLocation) score += 5;

  // Event Preferences (10%)
  const eventFormats = Array.isArray(eventPreferences.eventFormats)
    ? eventPreferences.eventFormats
    : [];
  if (eventFormats.length >= 2) score += 6;
  else missing.push({ label: "Choose Event Formats", sectionId: "events" });
  const preferredDays = Array.isArray(eventPreferences.preferredDays)
    ? eventPreferences.preferredDays
    : [];
  if (preferredDays.length >= 1) score += 4;

  return {
    percentage: Math.min(100, Math.round(score)),
    missingShortcuts: missing.slice(0, 4),
  };
}
