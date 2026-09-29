const fs = require("fs");
let code = fs.readFileSync("frontend/app/register/page.tsx", "utf8");

// 1. Add validation logic to handleSubmit
const newSubmit = `  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    // Validations
    if (name.trim().length < 3) {
      setError("Full Name must be at least 3 characters.");
      return;
    }
    if (!/^[a-zA-Z\\s]+$/.test(name.trim())) {
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
    
code = code.replace(/  async function handleSubmit\(e: React\.FormEvent\) \{[\s\S]*?setError\(\"\"\);\n    setLoading\(true\);/, newSubmit);

// 2. Fix Checkboxes for Terms & Privacy
code = code.replace(/<span>I agree to the Terms & Conditions\.<\/span>/, `<span>I agree to the <Link href="/terms" target="_blank" className="text-[#e06d53] hover:underline">Terms & Conditions</Link>.</span>`);
code = code.replace(/<span>I agree to the Privacy Policy\.<\/span>/, `<span>I agree to the <Link href="/privacy" target="_blank" className="text-[#e06d53] hover:underline">Privacy Policy</Link>.</span>`);

// 3. Add max length to City field
code = code.replace(/onChange=\{\(e\) => setCity\(e\.target\.value\)\}/g, `onChange={(e) => setCity(e.target.value)} maxLength={50}`);

// 4. Update the "Create my account" button disabled styling
code = code.replace(/disabled:opacity-50/g, `disabled:opacity-50 disabled:cursor-not-allowed`);

fs.writeFileSync("frontend/app/register/page.tsx", code);

