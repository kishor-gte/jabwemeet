const fs = require("fs");
let code = fs.readFileSync("frontend/app/register/page.tsx", "utf8");

// Add max and min to the date input
const dateInputRegex = /<input\s+type="date"\s+required\s+value=\{dob\}\s+onChange=\{\(e\) => setDob\(e\.target\.value\)\}/g;
const replacement = `<input
                      type="date"
                      required
                      value={dob}
                      onChange={(e) => setDob(e.target.value)}
                      max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split("T")[0]}
                      min={new Date(new Date().setFullYear(new Date().getFullYear() - 100)).toISOString().split("T")[0]}`;

code = code.replace(dateInputRegex, replacement);
fs.writeFileSync("frontend/app/register/page.tsx", code);

