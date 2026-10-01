"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ShieldCheck, CheckCircle2, ArrowRight, Eye, EyeOff, ArrowLeft } from "lucide-react";

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [role, setRole] = useState("USER");

  useEffect(() => {
    const urlRole = searchParams.get("role");
    if (urlRole === "MATCHMAKER" || urlRole === "BREAKUP_BUDDY" || urlRole === "USER" || urlRole === "HOST" || urlRole === "CAFE") {
      setRole(urlRole);
    } else if (urlRole === "EVENT_MANAGER" || urlRole === "EVENT_HOST") {
      setRole("HOST");
    }
  }, [searchParams]);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [dob, setDob] = useState("");
  const [city, setCity] = useState("");
  const [gender, setGender] = useState("");
  const [intent, setIntent] = useState("Relationship");

  // Identity & Document state (used for USER, BREAKUP_BUDDY, MATCHMAKER, HOST)
  const [idType, setIdType] = useState("Aadhaar");
  const [idDocument, setIdDocument] = useState("");
  const [govIdPreview, setGovIdPreview] = useState<string | null>(null);
  const [profilePhoto, setProfilePhoto] = useState("");

  // Matchmaker document state
  const [mmGovId, setMmGovId] = useState("");
  const [mmAddressProof, setMmAddressProof] = useState("");
  const [mmEduCert, setMmEduCert] = useState("");
  const [mmWorkExp, setMmWorkExp] = useState("");

  const [terms, setTerms] = useState(false);
  const [privacy, setPrivacy] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [pendingApproval, setPendingApproval] = useState(false);
  const [redirectTarget, setRedirectTarget] = useState("/login");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState("");

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    // Validations
    if (name.trim().length < 3) {
      setError("Full Name must be at least 3 characters.");
      return;
    }
    if (!/^[a-zA-Z\s]+$/.test(name.trim())) {
      setError("Full Name can only contain letters and spaces.");
      return;
    }
    if (city && city.trim().length > 50) {
      setError("City name is too long (maximum 50 characters).");
      return;
    }

    if (!/^(?:\+91|0)?[6-9]\d{9}$/.test(phone.trim().replace(/\s+/g, ''))) {
      setError("Please enter a valid 10-digit mobile number.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }
    
    const pwScore = [
      /[A-Z]/.test(password),
      /[a-z]/.test(password),
      /[0-9]/.test(password),
      /[!@#$%^&*(),.?":{}|<>\_\-+=\[\]\\/]/.test(password)
    ].filter(Boolean).length;

    if (pwScore < 2) {
      setError("Password is too weak. Please include a mix of uppercase, lowercase, numbers, and special characters.");
      return;
    }
    if (role === "USER" || role === "HOST" || role === "CAFE") {
      if (dob) {
        const birthDate = new Date(dob);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }
        if (age < 18) {
          setError("You must be at least 18 years old.");
          return;
        }
      }
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    // Member (USER) Aadhaar / ID Validation
    if (role === "USER") {
      const cleanDoc = idDocument.replace(/\s+/g, "");
      if (!cleanDoc) {
        setError(`Please enter your ${idType || "Aadhaar"} number.`);
        return;
      }
      if (idType === "Aadhaar" && (cleanDoc.length !== 12 || !/^\d{12}$/.test(cleanDoc))) {
        setError("Please enter a valid 12-digit Aadhaar Number.");
        return;
      }
      const gov = document.getElementById("reg_govIdProof") as HTMLInputElement;
      if (!gov?.files?.[0]) {
        setError(`Please upload a clear photo of your chosen ID document (${idType || "Aadhaar Card"}).`);
        return;
      }
      if (gov.files[0].size > 5 * 1024 * 1024) {
        setError("Document photo size cannot exceed 5MB.");
        return;
      }
    }

    setError("");
    setLoading(true);

    try {
      let reqBody: BodyInit;
      let reqHeaders: HeadersInit = {};

      const gov = document.getElementById("reg_govIdProof") as HTMLInputElement;
      const addr = document.getElementById("reg_addressProof") as HTMLInputElement;
      const edu = document.getElementById("reg_eduCertificate") as HTMLInputElement;
      const work = document.getElementById("reg_workExperience") as HTMLInputElement;

      const maxSizeBytes = 5 * 1024 * 1024;
      if (
        (gov?.files?.[0] && gov.files[0].size > maxSizeBytes) ||
        (addr?.files?.[0] && addr.files[0].size > maxSizeBytes) ||
        (edu?.files?.[0] && edu.files[0].size > maxSizeBytes) ||
        (work?.files?.[0] && work.files[0].size > maxSizeBytes)
      ) {
        setError("Document file size cannot exceed 5MB.");
        setLoading(false);
        return;
      }

      if (role === "USER" || role === "MATCHMAKER" || role === "HOST") {
        const formData = new FormData();
        formData.append("name", name.trim());
        formData.append("email", email.trim());
        formData.append("phone", phone.trim());
        formData.append("password", password);
        formData.append("confirmPassword", confirmPassword);
        formData.append("role", role);
        if (city.trim()) formData.append("city", city.trim());
        if (dob) formData.append("dateOfBirth", dob);
        if (gender) formData.append("gender", gender);
        if (intent) formData.append("relationshipIntent", intent);
        if (idType) formData.append("idType", idType);
        if (idDocument) formData.append("idDocument", idDocument.trim());

        if (gov?.files?.[0]) formData.append("govIdProof", gov.files[0]);
        if (addr?.files?.[0]) formData.append("addressProof", addr.files[0]);
        if (edu?.files?.[0]) formData.append("eduCertificate", edu.files[0]);
        if (work?.files?.[0]) formData.append("workExperience", work.files[0]);

        reqBody = formData;
      } else {
        reqHeaders = { "Content-Type": "application/json" };
        reqBody = JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          password,
          confirmPassword,
          dateOfBirth: role === "BREAKUP_BUDDY" || role === "CAFE" ? (dob || undefined) : dob,
          city: role === "BREAKUP_BUDDY" ? undefined : city,
          gender,
          relationshipIntent: intent,
          role,
          idType: role === "BREAKUP_BUDDY" ? idType : undefined,
          idDocument: role === "BREAKUP_BUDDY" ? idDocument : undefined,
          profilePhoto: role === "BREAKUP_BUDDY" ? profilePhoto : undefined,
        });
      }

      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: reqHeaders,
        credentials: "include",
        body: reqBody,
      });

      const data = await res.json();
      if (res.ok && data.success) {
        if (data.requiresOtp) {
          setOtpSent(true);
          setRegisteredEmail(data.email);
          if (data.devOtp) setDevOtp(data.devOtp);
          setResendCooldown(60);
          setError("");
        } else if (data.pendingApproval) {
          setPendingApproval(true);
          setSuccess(true);
        } else {
          const target = "/login";
          setRedirectTarget(target);
          setSuccess(true);
          setTimeout(() => {
            router.push(target);
          }, 2000);
        }
      } else {
        setError(data.message || "Registration failed. Please check your inputs.");
      }
    } catch (err) {
      setError("We couldn't connect to JabWeMeet right now. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleResendOtp() {
    if (resendCooldown > 0 || resendLoading) return;
    setResendLoading(true);
    setResendSuccess("");
    setError("");

    try {
      const res = await fetch("/api/auth/resend-registration-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: registeredEmail }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setResendSuccess(data.message || "A new OTP code has been sent to your email.");
        if (data.devOtp) setDevOtp(data.devOtp);
        setResendCooldown(60);
      } else {
        setError(data.message || "Failed to resend OTP. Please try again.");
      }
    } catch (err) {
      setError("Failed to resend OTP. Please check your connection.");
    } finally {
      setResendLoading(false);
    }
  }

  async function handleOtpSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!otp) return;
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/verify-registration-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: registeredEmail, otp: otp.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        if (data.pendingApproval) {
          setPendingApproval(true);
        }
        setSuccess(true);
        setOtpSent(false);
        const target = data.redirectUrl || (data.pendingApproval ? "/login" : "/dashboard");
        setRedirectTarget(target);
        setTimeout(() => {
          router.push(target);
        }, 1500);
      } else {
        setError(data.message || "OTP verification failed.");
      }
    } catch (err) {
      setError("Failed to verify OTP.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-[#FAF3F6] via-[#FDFBF9] to-white text-slate-800 flex flex-col items-center justify-center p-4 sm:p-6 font-sans selection:bg-[#7E2248] selection:text-white">
      {/* Back button */}
      <div className="absolute top-6 left-6 sm:top-10 sm:left-10 z-10">
        <button
          onClick={() => router.push("/")}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-rose-200 hover:border-[#7E2248] text-slate-700 hover:text-[#7E2248] rounded-full transition text-xs font-semibold shadow-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </button>
      </div>

      <div className="w-full max-w-xl bg-white border border-rose-100 rounded-3xl p-6 sm:p-10 shadow-xl shadow-rose-950/5 my-8 shrink-0 relative">
        <div className="text-center mb-6">
          <Link href="/" className="inline-flex items-center gap-2 mb-2 group">
            <span className="font-extrabold text-2xl tracking-wider text-[#7E2248] uppercase">
              JABWEMEET
            </span>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 font-serif">Create Your Account</h1>
          <p className="text-xs text-slate-500 mt-1">Real People. Real Places. Real Connections.</p>
        </div>

        {/* Role Selector Tabs */}
        {!success && (
          <div className="grid grid-cols-3 gap-1.5 p-1.5 bg-rose-50/70 rounded-2xl border border-rose-200/60 mb-6 text-xs font-bold">
            <button
              type="button"
              onClick={() => setRole("USER")}
              className={`py-2 px-2 text-center rounded-xl transition ${
                role === "USER"
                  ? "bg-[#7E2248] text-white shadow-sm"
                  : "text-slate-600 hover:text-[#7E2248] hover:bg-white/80"
              }`}
            >
              Member
            </button>
            <button
              type="button"
              onClick={() => setRole("HOST")}
              className={`py-2 px-2 text-center rounded-xl transition ${
                role === "HOST"
                  ? "bg-[#7E2248] text-white shadow-sm"
                  : "text-slate-600 hover:text-[#7E2248] hover:bg-white/80"
              }`}
            >
              Event Host
            </button>
            <button
              type="button"
              onClick={() => setRole("CAFE")}
              className={`py-2 px-2 text-center rounded-xl transition ${
                role === "CAFE"
                  ? "bg-[#7E2248] text-white shadow-sm"
                  : "text-slate-600 hover:text-[#7E2248] hover:bg-white/80"
              }`}
            >
              Cafe Partner
            </button>
          </div>
        )}

        {role === "HOST" && !success && (
          <div className="mb-5 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-950 leading-relaxed">
            <strong className="text-[#7E2248]">Event Manager Account:</strong> Create &amp; host Singles Events, Speed Dating, Dance Dating, and Singles Travels.{" "}
            <span className="text-slate-700">Your application will be reviewed by the admin team before you can log in.</span>
          </div>
        )}

        {role === "MATCHMAKER" && !success && (
          <div className="mb-5 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-950 leading-relaxed">
            <strong className="text-amber-800">Relationship Manager Account:</strong> Help verified members find real connections and guide offline date arrangements. Applications are reviewed by the admin team.
          </div>
        )}

        {role === "CAFE" && !success && (
          <div className="mb-5 p-4 rounded-2xl bg-sky-50 border border-sky-200 text-xs text-sky-950 leading-relaxed">
            <strong className="text-sky-800">Cafe Partner Account:</strong> Register your venue to host JabWeMeet offline events. Applications are reviewed by the admin team before you can manage your venue.
          </div>
        )}

        {error && (
          <div className="mb-5 p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
            ⚠️ {error}
          </div>
        )}

        {otpSent ? (
          <form onSubmit={handleOtpSubmit} className="space-y-4 text-xs text-center py-4">
            <h2 className="text-2xl font-bold font-serif text-slate-900 mb-2">Verify Your Email 🔐</h2>
            <p className="text-slate-600 mb-2">
              We've sent a 6-digit OTP code to <strong className="text-slate-900">{registeredEmail}</strong>.
            </p>
            <p className="text-[11px] text-amber-900 bg-amber-50 border border-amber-200 rounded-xl p-3 mb-3 text-left leading-relaxed">
              📬 <strong>Check your Spam or Junk folder</strong> if you don't see it in your primary inbox within 30 seconds.
            </p>

            {devOtp && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center justify-between">
                <span>🧪 Testing Code: <strong className="text-slate-900 tracking-widest text-sm font-mono">{devOtp}</strong></span>
                <button
                  type="button"
                  onClick={() => setOtp(devOtp)}
                  className="px-2.5 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded-lg text-[10px] font-bold uppercase transition"
                >
                  Fill Code
                </button>
              </div>
            )}

            {resendSuccess && (
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs">
                {resendSuccess}
              </div>
            )}

            <div>
              <input
                type="text"
                required
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="Enter 6-digit OTP"
                maxLength={6}
                className="w-full text-center tracking-widest text-2xl font-mono px-4 py-3.5 rounded-2xl bg-slate-50 border-2 border-slate-200 focus:border-[#7E2248] focus:bg-white text-slate-900 placeholder-slate-400 focus:outline-none transition shadow-inner"
              />
            </div>

            <button
              type="submit"
              disabled={loading || otp.length < 6}
              className="w-full mt-4 py-3.5 rounded-full bg-[#7E2248] hover:bg-[#681938] text-white font-bold text-xs tracking-wider uppercase transition shadow-md shadow-[#7E2248]/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Verifying..." : "Verify OTP & Complete Registration"}
            </button>

            <div className="pt-4 flex items-center justify-between border-t border-rose-100 text-xs">
              <button
                type="button"
                onClick={() => {
                  setOtpSent(false);
                  setOtp("");
                  setError("");
                }}
                className="text-slate-500 hover:text-slate-800 transition"
              >
                ← Edit Details
              </button>

              <button
                type="button"
                onClick={handleResendOtp}
                disabled={resendCooldown > 0 || resendLoading}
                className="text-[#7E2248] hover:underline font-bold disabled:text-slate-400 disabled:no-underline transition"
              >
                {resendLoading ? "Resending..." : resendCooldown > 0 ? `Resend OTP in ${resendCooldown}s` : "Resend OTP"}
              </button>
            </div>
          </form>
        ) : success ? (
          <div className="text-center py-6 space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-3xl mx-auto mb-2 shadow-xs">
              ✓
            </div>
            {pendingApproval ? (
              <div className="space-y-4">
                <h2 className="text-2xl font-bold font-serif text-slate-900">
                  {role === "HOST" ? "Application Submitted! 🎉" : "Application Submitted!"}
                </h2>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {role === "HOST"
                    ? "Your Event Manager (Host) account has been registered and is awaiting admin approval."
                    : role === "MATCHMAKER"
                    ? "Your Relationship Manager registration has been submitted for admin verification."
                    : "Your Breakup Buddy registration has been submitted for admin verification."}
                </p>
                <div className={`p-4 rounded-2xl text-xs text-left leading-relaxed border ${
                  role === "HOST"
                    ? "bg-rose-50 border-rose-200 text-rose-950"
                    : "bg-amber-50 border-amber-200 text-amber-950"
                }`}>
                  <strong>Next Steps:</strong>
                  <ul className="mt-1.5 space-y-1 list-disc list-inside">
                    <li>Admin will review your application at{" "}
                      <Link href="/admin" className="underline font-bold text-[#7E2248]">
                        /admin
                      </Link>
                    </li>
                    <li>Once approved, you can log in at{" "}
                      <Link href="/login" className="underline font-bold text-[#7E2248]">
                        /login
                      </Link>
                    </li>
                    {role === "HOST" && (
                      <li>You'll be redirected to your Event Manager Dashboard after login.</li>
                    )}
                  </ul>
                </div>
                <div className="flex flex-wrap gap-2 justify-center pt-2">
                  <Link
                    href="/login"
                    className="px-8 py-3 rounded-full bg-[#7E2248] hover:bg-[#681938] text-white text-xs font-bold uppercase tracking-wider transition shadow-md shadow-[#7E2248]/20"
                  >
                    Go to Login
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <h2 className="text-2xl font-bold font-serif text-[#7E2248]">Registration Successful! 🎉</h2>
                <p className="text-xs text-slate-600">Your account has been verified and created successfully. Welcome to JabWeMeet!</p>
                <button
                  onClick={() => router.push(redirectTarget)}
                  className="w-full py-3.5 rounded-full bg-[#7E2248] hover:bg-[#681938] text-white font-bold text-xs uppercase tracking-wider transition shadow-md shadow-[#7E2248]/20"
                >
                  CONTINUE TO LOGIN
                </button>
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-700 font-bold uppercase tracking-wider text-xs mb-1.5">
                {role === "CAFE" ? "Cafe Name *" : "Full Name *"}
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={role === "CAFE" ? "e.g. The Daily Grind" : "e.g. Priya Sharma"}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#7E2248] focus:bg-white transition text-sm"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-700 font-bold uppercase tracking-wider text-xs mb-1.5">Email *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="priya@example.com"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#7E2248] focus:bg-white transition text-sm"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold uppercase tracking-wider text-xs mb-1.5">Mobile Number *</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#7E2248] focus:bg-white transition text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-700 font-bold uppercase tracking-wider text-xs mb-1.5">Password *</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#7E2248] focus:bg-white transition pr-10 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold uppercase tracking-wider text-xs mb-1.5">Confirm Password *</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#7E2248] focus:bg-white transition pr-10 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            </div>

            {/* Standard User Demographics */}
            {role === "USER" && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-700 font-bold uppercase tracking-wider text-xs mb-1.5">Date of Birth *</label>
                    <input
                      type="date"
                      required
                      value={dob}
                      onChange={(e) => setDob(e.target.value)}
                      max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split("T")[0]}
                      min={new Date(new Date().setFullYear(new Date().getFullYear() - 100)).toISOString().split("T")[0]}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-[#7E2248] focus:bg-white transition text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold uppercase tracking-wider text-xs mb-1.5">City *</label>
                    <input
                      type="text"
                      required
                      value={city}
                      onChange={(e) => setCity(e.target.value)} 
                      maxLength={50}
                      placeholder="e.g. Bengaluru"
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#7E2248] focus:bg-white transition text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-700 font-bold uppercase tracking-wider text-xs mb-1.5">Gender</label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-[#7E2248] focus:bg-white transition text-sm"
                    >
                      <option value="">Select gender</option>
                      <option value="Female">Female</option>
                      <option value="Male">Male</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold uppercase tracking-wider text-xs mb-1.5">Looking For</label>
                    <select
                      value={intent}
                      onChange={(e) => setIntent(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-[#7E2248] focus:bg-white transition text-sm"
                    >
                      <option value="Relationship">Relationship</option>
                      <option value="Marriage">Marriage</option>
                      <option value="Friendship">Friendship</option>
                      <option value="Social Connections">Social Connections</option>
                    </select>
                  </div>
                </div>

                {/* Identity & Aadhaar Verification Section for Members */}
                <div className="space-y-4 pt-4 border-t border-rose-100">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-[#7E2248]" />
                    <h4 className="font-bold text-slate-900 text-sm">Identity Verification (Aadhaar / Govt ID) *</h4>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    JabWeMeet is a verified community. Please provide your government ID details and upload a clear photo of your chosen document to ensure offline safety for all members.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-700 font-bold uppercase tracking-wider text-xs mb-1.5">
                        ID Document Type *
                      </label>
                      <select
                        value={idType}
                        onChange={(e) => {
                          setIdType(e.target.value);
                          setIdDocument("");
                        }}
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-[#7E2248] focus:bg-white transition text-sm"
                      >
                        <option value="Aadhaar">Aadhaar Card (Recommended)</option>
                        <option value="PAN">PAN Card</option>
                        <option value="Passport">Passport</option>
                        <option value="Voter ID">Voter ID</option>
                        <option value="Driving License">Driving License</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-700 font-bold uppercase tracking-wider text-xs mb-1.5">
                        {idType === "Aadhaar" ? "12-Digit Aadhaar Number *" : `${idType} Number *`}
                      </label>
                      <input
                        type="text"
                        required
                        value={idDocument}
                        onChange={(e) => {
                          let val = e.target.value;
                          if (idType === "Aadhaar") {
                            val = val.replace(/\D/g, "").slice(0, 12);
                            val = val.replace(/(\d{4})(?=\d)/g, "$1 ");
                          }
                          setIdDocument(val);
                        }}
                        placeholder={
                          idType === "Aadhaar" 
                            ? "e.g. 5432 1234 5678" 
                            : idType === "PAN" 
                            ? "e.g. ABCDE1234F" 
                            : `Enter ${idType} Number`
                        }
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#7E2248] focus:bg-white transition text-sm"
                      />
                    </div>
                  </div>

                  {/* Upload Photo of Document */}
                  <div>
                    <label className="flex items-center justify-between text-slate-700 font-bold uppercase tracking-wider text-xs mb-1.5">
                      <span>Photo of Chosen Document ({idType || "Aadhaar"}) *</span>
                      {mmGovId && <span className="text-emerald-600 font-semibold text-[11px]">✓ Selected</span>}
                    </label>

                    <div className="relative border-2 border-dashed border-rose-200 hover:border-[#7E2248] rounded-2xl p-4 text-center transition bg-rose-50/40">
                      <input
                        type="file"
                        id="reg_govIdProof"
                        required
                        accept=".jpg,.jpeg,.png,.pdf"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setMmGovId(file.name);
                            if (file.type.startsWith("image/")) {
                              setGovIdPreview(URL.createObjectURL(file));
                            } else {
                              setGovIdPreview(null);
                            }
                          } else {
                            setMmGovId("");
                            setGovIdPreview(null);
                          }
                        }}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      />

                      {govIdPreview ? (
                        <div className="flex items-center gap-3">
                          <img 
                            src={govIdPreview} 
                            alt="ID Preview" 
                            className="w-16 h-12 rounded-lg object-cover border border-rose-200"
                          />
                          <div className="text-left flex-1 min-w-0">
                            <p className="text-xs font-bold text-slate-900 truncate">{mmGovId}</p>
                            <p className="text-[10px] text-emerald-600 font-medium flex items-center gap-1">
                              <CheckCircle2 size={12} /> Photo ready for verification
                            </p>
                          </div>
                          <span className="text-[11px] text-[#7E2248] font-bold">Change</span>
                        </div>
                      ) : mmGovId ? (
                        <div className="flex items-center justify-between">
                          <div className="text-left">
                            <p className="text-xs font-bold text-slate-900 truncate">{mmGovId}</p>
                            <p className="text-[10px] text-emerald-600 font-medium flex items-center gap-1">
                              <CheckCircle2 size={12} /> Document attached
                            </p>
                          </div>
                          <span className="text-[11px] text-[#7E2248] font-bold">Change</span>
                        </div>
                      ) : (
                        <div className="py-2">
                          <div className="text-2xl mb-1">📄</div>
                          <p className="text-xs font-bold text-slate-700">
                            Click or drag to upload photo of your {idType || "Aadhaar Card"}
                          </p>
                          <p className="text-[10px] text-slate-500 mt-0.5">
                            Clear front photo or scan • JPG, PNG, or PDF up to 5MB
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Relationship Manager, Host & Cafe Fields */}
            {(role === "MATCHMAKER" || role === "HOST" || role === "CAFE") && (
              <div className="space-y-4 pt-2">
                <div>
                  <label className="block text-slate-700 font-bold uppercase tracking-wider text-xs mb-1.5">
                    Operating City <span className="text-slate-400 font-normal lowercase">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)} 
                    maxLength={50}
                    placeholder="e.g. Bengaluru, Mumbai, Delhi"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#7E2248] focus:bg-white transition text-sm"
                  />
                </div>

                <div className="space-y-3 pt-3 border-t border-rose-100">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">Document Verification</h4>
                    <p className="text-[11px] text-slate-500">
                      Upload credentials for verification. You can also upload these after approval.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="flex items-center justify-between text-slate-700 font-bold uppercase tracking-wider text-xs mb-1.5">
                        <span>Govt ID Proof</span>
                        {mmGovId && <span className="text-emerald-600 font-semibold text-[10px]">✓ Selected</span>}
                      </label>
                      <input
                        type="file"
                        id="reg_govIdProof"
                        onChange={(e) => setMmGovId(e.target.files?.[0]?.name || "")}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700 focus:outline-none file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-[11px] file:font-semibold file:bg-rose-50 file:text-[#7E2248] hover:file:bg-rose-100 transition"
                        accept=".jpg,.jpeg,.png,.pdf"
                      />
                    </div>

                    <div>
                      <label className="flex items-center justify-between text-slate-700 font-bold uppercase tracking-wider text-xs mb-1.5">
                        <span>Address Proof</span>
                        {mmAddressProof && <span className="text-emerald-600 font-semibold text-[10px]">✓ Selected</span>}
                      </label>
                      <input
                        type="file"
                        id="reg_addressProof"
                        onChange={(e) => setMmAddressProof(e.target.files?.[0]?.name || "")}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700 focus:outline-none file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-[11px] file:font-semibold file:bg-rose-50 file:text-[#7E2248] hover:file:bg-rose-100 transition"
                        accept=".jpg,.jpeg,.png,.pdf"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Breakup Buddy Fields */}
            {role === "BREAKUP_BUDDY" && (
              <div className="space-y-4 pt-2">
                <div>
                  <label className="block text-slate-700 font-bold uppercase tracking-wider text-xs mb-1.5">ID Type *</label>
                  <select
                    required
                    value={idType}
                    onChange={(e) => setIdType(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-[#7E2248] focus:bg-white transition text-sm"
                  >
                    <option value="">Select ID Type ▼</option>
                    <option value="Aadhaar">Aadhaar</option>
                    <option value="PAN">PAN</option>
                    <option value="Passport">Passport</option>
                    <option value="Driving License">Driving License</option>
                  </select>
                </div>
              </div>
            )}

            <div className="space-y-2 pt-2 text-slate-600">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={terms}
                  onChange={(e) => setTerms(e.target.checked)}
                  className="accent-[#7E2248]"
                  required
                />
                <span>I agree to the <Link href="/terms" target="_blank" className="text-[#7E2248] font-bold hover:underline">Terms & Conditions</Link>.</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={privacy}
                  onChange={(e) => setPrivacy(e.target.checked)}
                  className="accent-[#7E2248]"
                  required
                />
                <span>I agree to the <Link href="/privacy" target="_blank" className="text-[#7E2248] font-bold hover:underline">Privacy Policy</Link>.</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading || !terms || !privacy}
              className="w-full mt-3 py-3.5 rounded-full bg-[#7E2248] hover:bg-[#681938] text-white font-bold text-xs tracking-wider uppercase transition shadow-md shadow-[#7E2248]/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Creating account..." : role === "MATCHMAKER" ? "SUBMIT MATCHMAKER APPLICATION" : "CREATE MY ACCOUNT"}
            </button>
          </form>
        )}

        <p className="text-center text-xs text-slate-500 mt-6">
          Already have an account?{" "}
          <Link href="/login" className="text-[#7E2248] font-bold hover:underline">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white flex items-center justify-center text-slate-800 text-xs">
          Loading registration...
        </div>
      }
    >
      <RegisterContent />
    </Suspense>
  );
}
