const fs = require("fs"); let code = fs.readFileSync("frontend/app/login/page.tsx", "utf8"); code = code.replace(/<Link href="\/" className="absolute top-6 left-6[^>]+>[\s\S]+?<\/Link>/, ""); code = code.replace(/<div className="w-full max-w-md bg-\[#131d2e\] border border-white\/10 rounded-2xl p-8 shadow-2xl">/, `<div className="w-full max-w-md bg-[#131d2e] border border-white/10 rounded-2xl p-8 shadow-2xl relative">
        <button onClick={() => window.history.length > 1 ? router.back() : router.push("/")} className="absolute top-4 left-4 p-2 text-slate-400 hover:text-white transition rounded-full hover:bg-white/5 flex items-center gap-1 text-xs font-semibold">
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>`); fs.writeFileSync("frontend/app/login/page.tsx", code);
