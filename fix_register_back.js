const fs = require('fs');
let code = fs.readFileSync('frontend/app/register/page.tsx', 'utf8');

if (!code.includes('Back to Home')) {
  // 1. Add ArrowLeft import if missing
  if (!code.includes('ArrowLeft')) {
    code = code.replace(
      'import { HeartHandshake, User, ShieldCheck, CheckCircle2, ArrowRight, Eye, EyeOff } from "lucide-react";',
      'import { HeartHandshake, User, ShieldCheck, CheckCircle2, ArrowRight, Eye, EyeOff, ArrowLeft } from "lucide-react";'
    );
  }

  // 2. Add the back button to the top left
  const backBtn = `
      <Link href="/" className="absolute top-6 left-6 flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 hover:text-white rounded-full transition text-sm font-semibold z-50">
        <ArrowLeft className="w-4 h-4" />
        Back to Home
      </Link>
`;

  code = code.replace(
    '<div className="min-h-screen bg-[#0b111e] text-white flex flex-col md:flex-row font-sans">',
    '<div className="relative min-h-screen bg-[#0b111e] text-white flex flex-col md:flex-row font-sans">' + backBtn
  );

  fs.writeFileSync('frontend/app/register/page.tsx', code);
}
