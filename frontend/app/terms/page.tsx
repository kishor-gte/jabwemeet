export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#0b111e] text-white p-8 font-sans">
      <div className="max-w-3xl mx-auto bg-[#131d2e] rounded-3xl p-8 border border-white/10 shadow-2xl">
        <h1 className="text-3xl font-bold font-serif mb-6 text-[#e06d53]">Terms of Service</h1>
        <div className="space-y-6 text-sm text-slate-300 leading-relaxed">
          <p>Welcome to JabWeMeet. By accessing or using our platform, you agree to be bound by these Terms of Service.</p>
          <h2 className="text-xl font-semibold text-white mt-4">1. Community Respect</h2>
          <p>All members must treat each other with respect. Harassment, discrimination, or abusive behavior will result in immediate account termination.</p>
          <h2 className="text-xl font-semibold text-white mt-4">2. Offline Event Safety</h2>
          <p>Your safety at our offline events is our priority. Please follow the guidelines provided by event hosts and venue partners. JabWeMeet is not liable for personal conduct at physical locations.</p>
          <h2 className="text-xl font-semibold text-white mt-4">3. Account Eligibility</h2>
          <p>You must be at least 18 years old to use JabWeMeet. You agree to provide accurate, truthful, and up-to-date information during registration.</p>
          <h2 className="text-xl font-semibold text-white mt-4">4. Content Guidelines</h2>
          <p>You are solely responsible for the content and information you provide. We reserve the right to remove any content that violates our policies.</p>
          <p className="mt-8 pt-6 border-t border-white/10 text-xs text-slate-500">Last updated: September 2026</p>
        </div>
      </div>
    </div>
  );
}
