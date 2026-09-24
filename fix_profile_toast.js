const fs = require('fs');
let code = fs.readFileSync('frontend/app/cafe/profile/page.tsx', 'utf8');

code = code.replace(
  'import { Store } from "lucide-react";',
  'import { Store } from "lucide-react";\nimport { useToast } from "@/components/ToastProvider";'
);
code = code.replace(
  'export default function ProfilePage() {',
  'export default function ProfilePage() {\n  const { showToast } = useToast();'
);
code = code.replace(
  /alert\("Profile saved successfully!"\);/g,
  'showToast("Profile saved successfully!", "success");'
);
code = code.replace(
  /alert\("Error saving profile"\);/g,
  'showToast("Error saving profile", "error");'
);

fs.writeFileSync('frontend/app/cafe/profile/page.tsx', code);
