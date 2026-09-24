const fs = require('fs');
let code = fs.readFileSync('frontend/app/cafe/offers/page.tsx', 'utf8');

const oldHandleCreate = `const handleCreate = async (e: any) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/cafe/offers", {
        method: "POST",
        headers: { 'Content-Type': 'application/json', 'Authorization': \`Bearer \${localStorage.getItem('token')}\` },
        body: JSON.stringify({...formData, minOrder: Number(formData.minOrder)})
      });
      const data = await res.json();
      if (data.success) { setIsModalOpen(false); fetchOffers(); }
    } catch (e) { console.error(e); }
  };`;

const newHandleCreate = `const handleCreate = async (e: any) => {
    e.preventDefault();
    try {
      const payload = {...formData, minOrder: Number(formData.minOrder) || 0};
      console.log("Sending payload:", payload);
      const res = await fetch("/api/cafe/offers", {
        method: "POST",
        headers: { 'Content-Type': 'application/json', 'Authorization': \`Bearer \${localStorage.getItem('token')}\` },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) { 
        setIsModalOpen(false); 
        fetchOffers(); 
        setFormData({ name: '', code: '', type: 'Percentage', value: '', minOrder: 0 });
      } else {
        alert("Failed to save offer: " + (data.error || data.message || "Unknown error"));
      }
    } catch (e: any) { 
      console.error(e); 
      alert("Error saving offer: " + e.message);
    }
  };`;

code = code.replace(oldHandleCreate, newHandleCreate);
fs.writeFileSync('frontend/app/cafe/offers/page.tsx', code);
