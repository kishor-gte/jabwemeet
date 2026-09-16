const fs = require('fs');
let code = fs.readFileSync('frontend/app/breakup-buddy/page.tsx', 'utf8');

const oldFuncRegex = /const handleBookSession = \(e: React\.FormEvent\) => \{[\s\S]*?setBookingSending\(false\);\r?\n\s*\};\r?\n/;
const newFunc = \const handleBookSession = async (e: React.FormEvent) => {
    e.preventDefault();
    setBookingSending(true);

    if (currentUser?.id && selectedBuddy) {
      try {
        const res = await fetch('/api/services/buddy-request', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            buddyId: selectedBuddy.id,
            sessionFormat,
            preferredMode,
            notes: feelingDescription,
          }),
        });
        
        const data = await res.json();
        if (data.success) {
          // Update services flag
          const services = JSON.parse(
            localStorage.getItem(\\\jwm_services_\\\\) || "{}"
          );
          services.breakupBuddy = true;
          localStorage.setItem(
            \\\jwm_services_\\\\,
            JSON.stringify(services)
          );

          setBookingSuccess(true);
        } else {
          alert('Error: ' + data.message);
        }
      } catch (error) {
        alert('Failed to submit request. Please try again.');
        console.error(error);
      }
    }
    
    setBookingSending(false);
  };\n\;

code = code.replace(oldFuncRegex, newFunc);
fs.writeFileSync('frontend/app/breakup-buddy/page.tsx', code, 'utf8');
