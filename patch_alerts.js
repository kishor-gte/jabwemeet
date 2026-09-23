const fs = require('fs');
let code = fs.readFileSync('frontend/app/dashboard/page.tsx', 'utf8');

// Replace state
code = code.replace(
  'const [reservationToast, setReservationToast] = useState<string | null>(null);',
  'const [toast, setToast] = useState<{text: string, type: \\\'success\\\' | \\\'error\\\'} | null>(null);'
);

// Replace successes
code = code.replace(/setReservationToast\(\s*(.*?)\s*\);/g, 'setToast({ text: $1, type: \\\'success\\\' });');
// Replace setTimeout clearing
code = code.replace(/setTimeout\(\(\) => setReservationToast\(null\), (.*?)\);/g, 'setTimeout(() => setToast(null), $1);');

// Replace alerts with error toast
code = code.replace(/alert\(\s*(.*?)\s*\);/g, 'setToast({ text: $1, type: \\\'error\\\' });\\n          setTimeout(() => setToast(null), 4500);');

// Replace Toast rendering
const oldToastRegex = /\{\s*reservationToast && \([\s\S]*?<\/div>\s*<\/div>\s*\)\s*\}/;

const newToastJSX = `{toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-4 duration-200">
          <div className={\`flex items-center gap-3 px-5 py-3 rounded-2xl text-white font-medium text-xs shadow-2xl border \${toast.type === 'success' ? 'bg-emerald-500 shadow-emerald-500/40 border-emerald-400/30' : 'bg-red-500 shadow-red-500/40 border-red-400/30'}\`}>
            {toast.type === 'success' ? <ShieldCheck className="w-4 h-4 shrink-0" /> : <div className="w-4 h-4 shrink-0 font-bold text-center leading-4">!</div>}
            <span>{toast.text}</span>
          </div>
        </div>
      )}`;

code = code.replace(oldToastRegex, newToastJSX);

fs.writeFileSync('frontend/app/dashboard/page.tsx', code);
console.log('Replaced in dashboard.');
