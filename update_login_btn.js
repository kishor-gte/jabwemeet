const fs = require("fs");
let code = fs.readFileSync("frontend/app/login/page.tsx", "utf8");

code = code.replace(/<button onClick=\{\(\) => window\.history\.length > 1 \? router\.back\(\) : router\.push\("\/"\)\} className="absolute top-4 left-4 p-2 text-slate-400 hover:text-white transition rounded-full hover:bg-white\/5 flex items-center gap-1 text-xs font-semibold">\\n          <ArrowLeft className="w-4 h-4" \/>\\n          Back\\n        <\/button>/, "");

const backBtn = `
      <div className="absolute top-6 left-6 sm:top-10 sm:left-10">
        <button onClick={() => router.push("/")} className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 hover:text-white rounded-full transition text-sm font-semibold">
          <ArrowLeft className="w-5 h-5" />
          Back
        </button>
      </div>`;

code = code.replace(/<div className="w-full max-w-md bg-\[#131d2e\] border border-white\/10 rounded-2xl p-8 shadow-2xl relative">/, backBtn + `\n      <div className="w-full max-w-md bg-[#131d2e] border border-white/10 rounded-2xl p-8 shadow-2xl relative">`);

fs.writeFileSync("frontend/app/login/page.tsx", code);

