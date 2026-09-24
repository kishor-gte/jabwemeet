const fs = require('fs');
let code = fs.readFileSync('frontend/app/cafe/settings/page.tsx', 'utf8');

code = code.replace(
  'import { Eye, EyeOff } from "lucide-react";',
  'import { Eye, EyeOff } from "lucide-react";\nimport { useToast } from "@/components/ToastProvider";'
);
code = code.replace(
  'export default function SettingsPage() {',
  'export default function SettingsPage() {\n  const { showToast } = useToast();'
);
code = code.replace(
  /alert\("Password update requested! \(Functionality pending backend auth hookup\)"\);/g,
  'showToast("Password update requested! (Pending backend hookup)", "info");'
);
code = code.replace(
  /alert\(activeTab \+ " updated successfully!"\);/g,
  'showToast(activeTab + " updated successfully!", "success");'
);
code = code.replace(
  /alert\("Failed to update: " \+ \(data\.error \|\| data\.message \|\| "Unknown error"\)\);/g,
  'showToast("Failed to update: " + (data.error || data.message || "Unknown error"), "error");'
);
code = code.replace(
  /alert\("An error occurred while updating settings\."\);/g,
  'showToast("An error occurred while updating settings.", "error");'
);
code = code.replace(
  /alert\('Data export initiated\. Check your email shortly\.'\)/g,
  'showToast("Data export initiated. Check your email shortly.", "info")'
);

fs.writeFileSync('frontend/app/cafe/settings/page.tsx', code);
