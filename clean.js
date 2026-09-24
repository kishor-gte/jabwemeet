const fs = require('fs');
let sidebar = fs.readFileSync('frontend/components/cafe/CafeSidebar.tsx', 'utf8');
sidebar = sidebar.replace('{ name: "Events", href: "/cafe/events", icon: CalendarDays },', '');
fs.writeFileSync('frontend/components/cafe/CafeSidebar.tsx', sidebar);
try { fs.rmSync('frontend/app/cafe/events', { recursive: true, force: true }); } catch(e){}
