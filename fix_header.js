const fs = require('fs');
let code = fs.readFileSync('frontend/components/cafe/CafeHeader.tsx', 'utf8');

// Remove LogOut from imports
code = code.replace(/import \{ Bell, Search, User, LogOut \} from "lucide-react";/g, 'import { Bell, Search, User } from "lucide-react";');

// Remove handleLogout
code = code.replace(/const handleLogout = \(\) => \{\s*localStorage\.removeItem\("token"\);\s*router\.push\("\/login"\);\s*\};\s*/g, '');

// Remove the button JSX
code = code.replace(/<button onClick=\{handleLogout\}[\s\S]*?<\/button>\s*/g, '');

fs.writeFileSync('frontend/components/cafe/CafeHeader.tsx', code);
