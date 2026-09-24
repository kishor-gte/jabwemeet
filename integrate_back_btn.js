const fs = require('fs');

// 1. Remove FloatingBackButton from layout
let layout = fs.readFileSync('frontend/app/layout.tsx', 'utf8');
layout = layout.replace('import FloatingBackButton from "@/components/FloatingBackButton";\n', '');
layout = layout.replace('<FloatingBackButton />\n', '');
fs.writeFileSync('frontend/app/layout.tsx', layout);

// 2. Add Back Button to CafeHeader
let header = fs.readFileSync('frontend/components/cafe/CafeHeader.tsx', 'utf8');

header = header.replace('import { useRouter } from "next/navigation";', 'import { useRouter, usePathname } from "next/navigation";\nimport { ArrowLeft } from "lucide-react";');

header = header.replace('const router = useRouter();', 'const router = useRouter();\n  const pathname = usePathname();');

const backBtnJsx = `
        {pathname !== "/cafe/dashboard" && (
          <button
            onClick={() => {
              if (window.history.length > 1) {
                router.back();
              } else {
                router.push("/");
              }
            }}
            className="flex items-center gap-2 bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 px-4 py-2 rounded-full transition-all text-sm font-semibold ml-4"
            title="Go Back"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
        )}
      </div>
    </header>
`;

header = header.replace(/<\/div>\s*<\/header>/, backBtnJsx);
fs.writeFileSync('frontend/components/cafe/CafeHeader.tsx', header);

