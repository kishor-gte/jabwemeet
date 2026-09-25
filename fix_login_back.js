const fs = require('fs');
let code = fs.readFileSync('frontend/app/login/page.tsx', 'utf8');

// 1. Add ArrowLeft import
code = code.replace(
  'import { Eye, EyeOff } from "lucide-react";',
  'import { Eye, EyeOff, ArrowLeft } from "lucide-react";'
);

// 2. Add the back button to the top left
const backBtn = `
      <Link href="/" className="absolute top-6 left-6 flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 hover:text-white rounded-full transition text-sm font-semibold">
        <ArrowLeft className="w-4 h-4" />
        Back to Home
      </Link>
`;

code = code.replace(
  '<div className="min-h-screen bg-[#0b111e] text-white flex flex-col items-center justify-center p-6 font-sans">',
  '<div className="relative min-h-screen bg-[#0b111e] text-white flex flex-col items-center justify-center p-6 font-sans">' + backBtn
);

fs.writeFileSync('frontend/app/login/page.tsx', code);
