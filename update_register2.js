const fs = require("fs");
let code = fs.readFileSync("frontend/app/register/page.tsx", "utf8");

const startStr = "async function handleSubmit(e: React.FormEvent) {";
const endStr = "setLoading(true);";
const startIdx = code.indexOf(startStr);
const endIdx = code.indexOf(endStr, startIdx);

if (startIdx !== -1 && endIdx !== -1) {
  const newSubmit = `async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    // Validations
    if (name.trim().length < 3) {
      setError("Full Name must be at least 3 characters.");
      return;
    }
    if (!/^[a-zA-Z\\\\s]+$/.test(name.trim())) {
      setError("Full Name can only contain letters and spaces.");
      return;
    }
    if (city && city.trim().length > 50) {
      setError("City name is too long (maximum 50 characters).");
      return;
    }
    
    if (role === "USER" || role === "HOST" || role === "CAFE") {
      if (dob) {
        const birthDate = new Date(dob);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }
        if (age < 18) {
          setError("You must be at least 18 years old.");
          return;
        }
        if (age > 100) {
          setError("Please enter a valid Date of Birth (age cannot exceed 100).");
          return;
        }
      } else if (role === "USER") {
        setError("Date of Birth is required.");
        return;
      }
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (!terms || !privacy) {
      setError("Please accept the Terms & Conditions and Privacy Policy.");
      return;
    }

    setError("");
    setLoading(true);`;

  code = code.substring(0, startIdx) + newSubmit + code.substring(endIdx + endStr.length);
  fs.writeFileSync("frontend/app/register/page.tsx", code);
  console.log("Updated successfully!");
} else {
  console.log("Could not find targets");
}

