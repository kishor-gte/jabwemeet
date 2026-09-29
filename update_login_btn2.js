const fs = require("fs");
let code = fs.readFileSync("frontend/app/login/page.tsx", "utf8");

const startStr = `<button onClick={() => window.history.length > 1 ? router.back() : router.push("/")}`;
const endStr = `</button>`;
const startIdx = code.indexOf(startStr);
const endIdx = code.indexOf(endStr, startIdx);

if (startIdx !== -1 && endIdx !== -1) {
  code = code.substring(0, startIdx) + code.substring(endIdx + endStr.length);
  fs.writeFileSync("frontend/app/login/page.tsx", code);
  console.log("Deleted old back button!");
} else {
  console.log("Could not find old back button!");
}

