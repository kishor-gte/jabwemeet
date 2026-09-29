export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#0b111e] text-white p-8 font-sans">
      <div className="max-w-3xl mx-auto bg-[#131d2e] rounded-3xl p-8 border border-white/10 shadow-2xl">
        <h1 className="text-3xl font-bold font-serif mb-6 text-[#e06d53]">Privacy Policy</h1>
        <div className="space-y-6 text-sm text-slate-300 leading-relaxed">
          <p>At JabWeMeet, we take your privacy seriously. This Privacy Policy outlines how we collect, use, and protect your data.</p>
          <h2 className="text-xl font-semibold text-white mt-4">1. Identity Protection</h2>
          <p>We protect your verified identity. Government IDs and sensitive verification documents are used strictly for verification purposes and are securely stored. They are never shared publicly.</p>
          <h2 className="text-xl font-semibold text-white mt-4">2. Data Collection</h2>
          <p>We collect essential profile data such as name, age, gender, and contact information to provide you with meaningful matchmaking and event experiences.</p>
          <h2 className="text-xl font-semibold text-white mt-4">3. Data Sharing</h2>
          <p>We do not sell your personal data to third parties. Minimal necessary information may be shared with verified event hosts solely for the purpose of offline event organization.</p>
          <h2 className="text-xl font-semibold text-white mt-4">4. Security</h2>
          <p>We implement industry-standard security measures to protect your account and personal information from unauthorized access or disclosure.</p>
          <p className="mt-8 pt-6 border-t border-white/10 text-xs text-slate-500">Last updated: September 2026</p>
        </div>
      </div>
    </div>
  );
}
