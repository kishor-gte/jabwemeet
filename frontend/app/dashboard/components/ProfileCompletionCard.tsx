"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ProfileProgressBar from "./profile/ProfileProgressBar";
import { calculateProfileStrength } from "./profile/profileStrength";

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  gender: string | null;
  relationshipIntent: string | null;
  role: string;
  createdAt: string;
  dateOfBirth?: string;
}

interface ProfileCompletionCardProps {
  user: UserProfile;
  onUpdateUser?: (updatedFields: Partial<UserProfile>) => void;
  onNavigateSection?: (sectionId: string) => void;
}

export default function ProfileCompletionCard({
  user,
  onNavigateSection,
}: ProfileCompletionCardProps) {
  const router = useRouter();
  const [strength, setStrength] = useState(() => calculateProfileStrength(user));

  useEffect(() => {
    setStrength(calculateProfileStrength(user));
  }, [user]);

  const handleNavigate = (sectionId: string) => {
    if (onNavigateSection) {
      onNavigateSection(sectionId);
    } else {
      router.push(`/dashboard?tab=profile`);
      setTimeout(() => {
        const el = document.getElementById(`section-${sectionId}`);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 150);
    }
  };

  return (
    <ProfileProgressBar
      percentage={strength.percentage}
      missingShortcuts={strength.missingShortcuts}
      onNavigateSection={handleNavigate}
    />
  );
}
