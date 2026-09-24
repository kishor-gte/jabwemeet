const fs = require('fs');
let code = fs.readFileSync('frontend/app/cafe/menu/page.tsx', 'utf8');

code = code.replace(
  'import { Plus, X } from "lucide-react";',
  'import { Plus, X } from "lucide-react";\nimport { useToast } from "@/components/ToastProvider";'
);
code = code.replace(
  'export default function MenuPage() {',
  'export default function MenuPage() {\n  const { showToast } = useToast();'
);
code = code.replace(
  /alert\("Failed to save item: " \+ \(data\.error \|\| data\.message \|\| "Unknown error"\)\);/g,
  'showToast("Failed to save item: " + (data.error || data.message || "Unknown error"), "error");'
);
code = code.replace(
  /alert\("Error saving item: " \+ e\.message\);/g,
  'showToast("Error saving item: " + e.message, "error");'
);

fs.writeFileSync('frontend/app/cafe/menu/page.tsx', code);
