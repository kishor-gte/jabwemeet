"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { HeartHandshake, User, ShieldCheck, CheckCircle2, ArrowRight, Eye, EyeOff } from "lucide-react";

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

  // Breakup Buddy extra state
  const [idType, setIdType] = useState("");
  const [idDocument, setIdDocument] = useState("");
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (!terms || !privacy) {
      setError("Please accept the Terms & Conditions and Privacy Policy.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      let reqBody: BodyInit;
      let reqHeaders: HeadersInit = {};

      if (role === "MATCHMAKER" || role === "HOST") {
        const formData = new FormData();
        formData.append("name", name.trim());
        formData.append("email", email.trim());
        formData.append("phone", phone.trim());
        formData.append("password", password);
        formData.append("confirmPassword", confirmPassword);
        formData.append("role", role);
        if (city.trim()) formData.append("city", city.trim());

        const gov = document.getElementById("reg_govIdProof") as HTMLInputElement;
        if (gov?.files?.[0]) formData.append("govIdProof", gov.files[0]);
        const addr = document.getElementById("reg_addressProof") as HTMLInputElement;
        if (addr?.files?.[0]) formData.append("addressProof", addr.files[0]);
        const edu = document.getElementById("reg_eduCertificate") as HTMLInputElement;
        if (edu?.files?.[0]) formData.append("eduCertificate", edu.files[0]);
        const work = document.getElementById("reg_workExperience") as HTMLInputElement;
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
          dateOfBirth: role === "BREAKUP_BUDDY" || role === "HOST" || role === "CAFE" ? (dob || undefined) : dob,
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
        const target = "/login";
        setRedirectTarget(target);
        setTimeout(() => {
          router.push(target);
        }, 2000);
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
    <div className="h-screen overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] bg-[#0b111e] text-white flex flex-col items-center justify-start p-6 font-sans">
      <div className="w-full max-w-lg bg-[#131d2e] border border-white/10 rounded-3xl p-8 shadow-2xl my-8 shrink-0">
        <div className="text-center mb-6">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#e06d53] to-[#b8432a] flex items-center justify-center font-bold text-white shadow-md">
              J
            </div>
            <span className="font-extrabold text-lg">
              Jab<span className="text-[#e06d53]">We</span>Meet
            </span>
          </Link>
          <h1 className="text-2xl font-bold text-white font-serif">Create Your Account</h1>
          <p className="text-xs text-slate-400 mt-1">Real People. Real Places. Real Connections.</p>
        </div>

        {/* Role Selector Tabs */}
        {!success && (
          <div className="grid grid-cols-5 gap-1 p-1 bg-black/30 rounded-2xl border border-white/10 mb-6 text-[11px] font-semibold">
            <button
              type="button"
              onClick={() => setRole("USER")}
              className={`py-2 px-1 text-center rounded-xl transition ${
                role === "USER"
                  ? "bg-[#e06d53] text-white shadow-md"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Member
            </button>
            <button
              type="button"
              onClick={() => setRole("HOST")}
              className={`py-2 px-1 text-center rounded-xl transition ${
                role === "HOST"
                  ? "bg-rose-600 text-white shadow-md"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Event Host
            </button>
            <button
              type="button"
              onClick={() => setRole("MATCHMAKER")}
              className={`py-2 px-1 text-center rounded-xl transition ${
                role === "MATCHMAKER"
                  ? "bg-amber-600 text-white shadow-md"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Matchmaker
            </button>
            <button
              type="button"
              onClick={() => setRole("BREAKUP_BUDDY")}
              className={`py-2 px-1 text-center rounded-xl transition ${
                role === "BREAKUP_BUDDY"
                  ? "bg-purple-600 text-white shadow-md"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Breakup Buddy
            </button>
            <button
              type="button"
              onClick={() => setRole("CAFE")}
              className={`py-2 px-1 text-center rounded-xl transition ${
                role === "CAFE"
                  ? "bg-sky-600 text-white shadow-md"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Cafe Partner
            </button>
          </div>
        )}

        {role === "HOST" && !success && (
          <div className="mb-5 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300">
            <strong>Event Manager Account:</strong> Create &amp; host Singles Events, Speed Dating, Dance Dating, and Singles Travels.{" "}
            <span className="text-rose-200">Your application will be reviewed by the admin team before you can log in.</span>
          </div>
        )}

        {role === "MATCHMAKER" && !success && (
          <div className="mb-5 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300">
            <strong>Relationship Manager Account:</strong> Help verified members find real connections and guide offline date arrangements. Applications are reviewed by the admin team.
          </div>
        )}

        {role === "CAFE" && !success && (
          <div className="mb-5 p-3 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-xs text-sky-300">
            <strong>Cafe Partner Account:</strong> Register your venue to host JabWeMeet offline events. Applications are reviewed by the admin team before you can manage your venue.
          </div>
        )}

        {error && (
          <div className="mb-5 p-3.5 rounded-2xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs">
            {error}
          </div>
        )}

        {otpSent ? (
          <form onSubmit={handleOtpSubmit} className="space-y-4 text-xs text-center py-6">
            <h2 className="text-xl font-bold mb-2">Verify Your Email 🔐</h2>
            <p className="text-slate-300 mb-4">We've sent a 6-digit OTP to <strong className="text-white">{registeredEmail}</strong>.</p>
            <div>
              <input
                type="text"
                required
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="Enter 6-digit OTP"
                maxLength={6}
                className="w-full text-center tracking-widest text-lg px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-[#e06d53]"
              />
            </div>
            <button
              type="submit"
              disabled={loading || otp.length < 6}
              className="w-full mt-4 py-3 rounded-full bg-[#e06d53] hover:bg-[#c95940] text-white font-bold text-xs tracking-wider uppercase transition shadow-lg shadow-[#e06d53]/25 disabled:opacity-50"
            >
              {loading ? "Verifying..." : "Verify OTP"}
            </button>
          </form>
        ) : success ? (
          <div className="text-center py-6 space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-3xl mx-auto mb-2">
              ✓
            </div>
            {pendingApproval ? (
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-white">
                  {role === "HOST" ? "Application Submitted! 🎉" : "Application Submitted!"}
                </h2>
                <p className="text-xs text-slate-300">
                  {role === "HOST"
                    ? "Your Event Manager (Host) account has been registered and is awaiting admin approval."
                    : role === "MATCHMAKER"
                    ? "Your Relationship Manager registration has been submitted for admin verification."
                    : "Your Breakup Buddy registration has been submitted for admin verification."}
                </p>
                <div className={`p-3 rounded-2xl text-xs text-left leading-relaxed border ${
                  role === "HOST"
                    ? "bg-rose-500/10 border-rose-500/25 text-rose-300"
                    : "bg-amber-500/10 border-amber-500/25 text-amber-300"
                }`}>
                  <strong>Next Steps:</strong>
                  <ul className="mt-1.5 space-y-1 list-disc list-inside">
                    <li>Admin will review your application at{" "}
                      <Link href="/admin" className="underline font-bold">
                        /admin
                      </Link>
                    </li>
                    <li>Once approved, you can log in at{" "}
                      <Link href="/login" className="underline font-bold">
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
                    className="px-6 py-2.5 rounded-full bg-[#e06d53] hover:bg-[#c95940] text-white text-xs font-bold transition shadow-lg"
                  >
                    Go to Login
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-[#e06d53]">Registration Successful! 🎉</h2>
                <p className="text-xs text-slate-300">Your account has been verified and created successfully. Welcome to JabWeMeet!</p>
                <button
                  onClick={() => router.push(redirectTarget)}
                  className="w-full py-3 rounded-full bg-[#e06d53] hover:bg-[#c95940] text-white font-semibold text-xs transition shadow-lg"
                >
                  CONTINUE TO LOGIN
                </button>
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                {role === "CAFE" ? "Cafe Name *" : "Full Name *"}
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={role === "CAFE" ? "e.g. The Daily Grind" : "e.g. Priya Sharma"}
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-[#e06d53]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Email *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="priya@example.com"
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-[#e06d53]"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Mobile Number *</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-[#e06d53]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Password *</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-[#e06d53] pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Confirm Password *</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-[#e06d53] pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
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
                    <label className="block text-slate-300 font-semibold mb-1">Date of Birth *</label>
                    <input
                      type="date"
                      required
                      value={dob}
                      onChange={(e) => setDob(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-[#e06d53]"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">City *</label>
                    <input
                      type="text"
                      required
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="e.g. Bangalore"
                      className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-[#e06d53]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Gender</label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-[#131d2e] border border-white/10 text-white focus:outline-none focus:border-[#e06d53]"
                    >
                      <option value="">Select gender</option>
                      <option value="Female">Female</option>
                      <option value="Male">Male</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Looking For</label>
                    <select
                      value={intent}
                      onChange={(e) => setIntent(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-[#131d2e] border border-white/10 text-white focus:outline-none focus:border-[#e06d53]"
                    >
                      <option value="Relationship">Relationship</option>
                      <option value="Marriage">Marriage</option>
                      <option value="Friendship">Friendship</option>
                      <option value="Social Connections">Social Connections</option>
                    </select>
                  </div>
                </div>
              </>
            )}

            {/* Relationship Manager, Host & Cafe Fields */}
            {(role === "MATCHMAKER" || role === "HOST" || role === "CAFE") && (
              <div className="space-y-4 pt-2">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Operating City <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Bangalore, Mumbai, Delhi"
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-[#e06d53]"
                  />
                </div>

                <div className="space-y-3 pt-3 border-t border-white/10">
                  <div>
                    <h4 className="font-semibold text-white">Document Verification</h4>
                    <p className="text-[11px] text-slate-400">
                      Upload credentials for verification. You can also upload these after approval.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="flex items-center justify-between text-slate-300 font-semibold mb-1">
                        <span>Govt ID Proof</span>
                        {mmGovId && <span className="text-emerald-400 font-normal text-[10px]">✓ Selected</span>}
                      </label>
                      <input
                        type="file"
                        id="reg_govIdProof"
                        onChange={(e) => setMmGovId(e.target.files?.[0]?.name || "")}
                        className="w-full bg-[#0b111e] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-[11px] file:font-semibold file:bg-white/10 file:text-white hover:file:bg-white/20 transition"
                        accept=".jpg,.jpeg,.png,.pdf"
                      />
                    </div>

                    <div>
                      <label className="flex items-center justify-between text-slate-300 font-semibold mb-1">
                        <span>Address Proof</span>
                        {mmAddressProof && <span className="text-emerald-400 font-normal text-[10px]">✓ Selected</span>}
                      </label>
                      <input
                        type="file"
                        id="reg_addressProof"
                        onChange={(e) => setMmAddressProof(e.target.files?.[0]?.name || "")}
                        className="w-full bg-[#0b111e] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-[11px] file:font-semibold file:bg-white/10 file:text-white hover:file:bg-white/20 transition"
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
                  <label className="block text-slate-300 font-semibold mb-1">ID Type *</label>
                  <select
                    required
                    value={idType}
                    onChange={(e) => setIdType(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#131d2e] border border-white/10 text-white focus:outline-none focus:border-[#e06d53]"
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

            <div className="space-y-2 pt-2 text-slate-400">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={terms}
                  onChange={(e) => setTerms(e.target.checked)}
                  className="accent-[#e06d53]"
                  required
                />
                <span>I agree to the Terms & Conditions.</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={privacy}
                  onChange={(e) => setPrivacy(e.target.checked)}
                  className="accent-[#e06d53]"
                  required
                />
                <span>I agree to the Privacy Policy.</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading || !terms || !privacy}
              className="w-full mt-3 py-3 rounded-full bg-[#e06d53] hover:bg-[#c95940] text-white font-bold text-xs tracking-wider uppercase transition shadow-lg shadow-[#e06d53]/25 disabled:opacity-50"
            >
              {loading ? "Creating account..." : role === "MATCHMAKER" ? "SUBMIT MATCHMAKER APPLICATION" : "CREATE MY ACCOUNT"}
            </button>
          </form>
        )}

        <p className="text-center text-xs text-slate-400 mt-6">
          Already have an account?{" "}
          <Link href="/login" className="text-[#e06d53] font-semibold hover:underline">
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
        <div className="min-h-screen bg-[#0b111e] flex items-center justify-center text-white text-xs">
          Loading registration...
        </div>
      }
    >
      <RegisterContent />
    </Suspense>
  );
}
