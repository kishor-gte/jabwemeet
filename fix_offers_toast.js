const fs = require('fs');
let code = fs.readFileSync('frontend/app/cafe/offers/page.tsx', 'utf8');

code = code.replace(
  'import { Plus, X, Tag } from "lucide-react";',
  'import { Plus, X, Tag } from "lucide-react";\nimport { useToast } from "@/components/ToastProvider";'
);
code = code.replace(
  'export default function OffersPage() {',
  'export default function OffersPage() {\n  const { showToast } = useToast();'
);
code = code.replace(
  /alert\("Failed to save offer: " \+ \(data\.error \|\| data\.message \|\| "Unknown error"\)\);/g,
  'showToast("Failed to save offer: " + (data.error || data.message || "Unknown error"), "error");'
);
code = code.replace(
  /alert\("Error saving offer: " \+ e\.message\);/g,
  'showToast("Error saving offer: " + e.message, "error");'
);
code = code.replace(
  'fetchOffers(); \n        setFormData',
  'fetchOffers(); \n        showToast("Offer saved successfully!", "success");\n        setFormData'
);

fs.writeFileSync('frontend/app/cafe/offers/page.tsx', code);
