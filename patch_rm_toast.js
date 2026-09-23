const fs = require('fs');
const file = 'frontend/app/relationship-manager/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// Add toast state
content = content.replace(
  'const [loading, setLoading] = useState(true);',
  'const [loading, setLoading] = useState(true);\n  const [toast, setToast] = useState<{text: string, type: \\\'success\\\' | \\\'error\\\'} | null>(null);'
);

// Replace alert 1
content = content.replace(
  'alert(data?.message || "Failed to submit request. Please try again.");',
  'setToast({ text: data?.message || "Failed to submit request. Please try again.", type: \\\'error\\\' });\n        setTimeout(() => setToast(null), 4500);'
);

// Replace alert 2
content = content.replace(
  'alert("Network error sending introduction request. Please try again.");',
  'setToast({ text: "Network error sending introduction request. Please try again.", type: \\\'error\\\' });\n      setTimeout(() => setToast(null), 4500);'
);

// Inject toast UI component
const toastJSX = `
      {toast && (
        <div className="fixed bottom-6 right-6 z-[9999] animate-in slide-in-from-bottom-4 duration-200">
          <div className={\`flex items-center gap-3 px-5 py-3 rounded-2xl text-white font-medium text-xs shadow-2xl border \${toast.type === 'success' ? 'bg-emerald-500 shadow-emerald-500/40 border-emerald-400/30' : 'bg-red-500 shadow-red-500/40 border-red-400/30'}\`}>
            {toast.type === 'success' ? <ShieldCheck className="w-4 h-4 shrink-0" /> : <div className="w-4 h-4 shrink-0 font-bold text-center leading-4">!</div>}
            <span>{toast.text}</span>
          </div>
        </div>
      )}`;

content = content.replace(
  '{/* Mobile Topbar */}',
  toastJSX + '\\n      {/* Mobile Topbar */}'
);

fs.writeFileSync(file, content);
console.log('Patched RM page.');
