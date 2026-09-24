"use client";
import { useState, useEffect } from "react";
import { Plus, X } from "lucide-react";
import { useToast } from "@/components/ToastProvider";

export default function MenuPage() {
  const { showToast } = useToast();
  const categories = ["All", "Coffee", "Tea", "Pizza", "Burgers", "Desserts", "Snacks", "Beverages"];
  const [activeCategory, setActiveCategory] = useState("All");
  
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ 
    name: '', 
    category: 'Coffee', 
    description: '', 
    price: 0, 
    isVeg: true, 
    prepTime: '10 mins', 
    isAvailable: true,
    image: '' 
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchMenu = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/cafe/menu", { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } });
      const data = await res.json();
      if (data.success) setItems(data.data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { fetchMenu(); }, []);

  const handleCreate = async (e: any) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Safety parsing
    const payload = {
      ...formData,
      price: Number(formData.price) || 0
    };

    try {
      const res = await fetch("/api/cafe/menu", {
        method: "POST",
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        setIsModalOpen(false);
        fetchMenu();
        showToast("Item saved successfully!", "success");
        setFormData({ name: '', category: 'Coffee', description: '', price: 0, isVeg: true, prepTime: '10 mins', isAvailable: true, image: '' });
      } else {
        showToast("Failed to save item: " + (data.error || data.message || "Unknown error"), "error");
      }
    } catch (e: any) { 
      console.error(e); 
      showToast("Error saving item: " + e.message, "error");
    }
    setIsSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this item?")) return;
    try {
      const res = await fetch(`/api/cafe/menu/${id}`, {
        method: "DELETE",
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      if (data.success) fetchMenu();
    } catch (e) { console.error(e); }
  };

  const toggleAvailability = async (id: string, current: boolean) => {
    try {
      const res = await fetch(`/api/cafe/menu/${id}`, {
        method: "PUT",
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ isAvailable: !current })
      });
      const data = await res.json();
      if (data.success) fetchMenu();
    } catch (e) { console.error(e); }
  };

  // Filter items by category
  const displayedItems = activeCategory === "All" 
    ? items 
    : items.filter(item => item.category === activeCategory);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 relative">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-white">Menu Management</h1>
        <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 px-5 py-2 bg-amber-500 text-black font-semibold rounded-xl"><Plus className="w-5 h-5"/> Add Item</button>
      </div>

      {/* Category Filters */}
      <div className="flex gap-2 overflow-x-auto pb-4 mb-4">
        {categories.map(c => (
          <button 
            key={c} 
            onClick={() => setActiveCategory(c)}
            className={`px-4 py-1.5 rounded-full border text-sm whitespace-nowrap transition ${
              activeCategory === c 
                ? 'bg-amber-500 border-amber-500 text-black font-semibold' 
                : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="bg-[#131d2e] border border-white/5 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-white">Loading menu items...</div>
        ) : (
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="text-xs text-slate-400 uppercase bg-white/5">
              <tr><th className="px-4 py-3">Item</th><th className="px-4 py-3">Category</th><th className="px-4 py-3">Price</th><th className="px-4 py-3">Type/Prep</th><th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right">Actions</th></tr>
            </thead>
            <tbody>
              {displayedItems.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-500">No items found for this category.</td></tr>
              ) : displayedItems.map(item => (
                <tr key={item.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      {item.image && <img src={item.image} alt={item.name} className="w-10 h-10 rounded-lg object-cover bg-white/10" />}
                      <div>
                        <p className="font-bold text-white">{item.name}</p>
                        <p className="text-xs text-slate-500 truncate max-w-[200px]">{item.description}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">{item.category}</td>
                  <td className="px-4 py-4">₹{item.price}</td>
                  <td className="px-4 py-4"><span className={`text-xs font-bold ${item.isVeg ? 'text-emerald-400' : 'text-rose-400'}`}>{item.isVeg ? 'VEG' : 'NON-VEG'}</span> <br/><span className="text-xs text-slate-500">{item.prepTime || 'N/A'}</span></td>
                  <td className="px-4 py-4"><span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${item.isAvailable ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>{item.isAvailable ? 'Available' : 'Unavailable'}</span></td>
                  <td className="px-4 py-4 flex justify-end gap-2">
                    <button onClick={() => toggleAvailability(item.id, item.isAvailable)} className="text-amber-400 hover:underline text-xs font-medium">{item.isAvailable ? 'Mark Unavail.' : 'Mark Avail.'}</button>
                    <button onClick={() => handleDelete(item.id)} className="text-rose-400 hover:underline text-xs font-medium ml-2">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#131d2e] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">Add Menu Item</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5"/></button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div><label className="block text-xs text-slate-400 mb-1">Name *</label><input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-[#0b111e] border border-white/10 rounded-xl px-4 py-2 text-sm text-white" /></div>
              
              <div><label className="block text-xs text-slate-400 mb-1">Category *</label>
                <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full bg-[#0b111e] border border-white/10 rounded-xl px-4 py-2 text-sm text-white">
                  {categories.filter(c => c !== "All").map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div><label className="block text-xs text-slate-400 mb-1">Description</label><input type="text" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full bg-[#0b111e] border border-white/10 rounded-xl px-4 py-2 text-sm text-white" /></div>
              
              <div><label className="block text-xs text-slate-400 mb-1">Price (₹) *</label><input required type="number" min="0" value={formData.price} onChange={e => setFormData({...formData, price: parseInt(e.target.value) || 0})} className="w-full bg-[#0b111e] border border-white/10 rounded-xl px-4 py-2 text-sm text-white" /></div>
              
              <div>
                <label className="block text-xs text-slate-400 mb-1">Image (Choose File)</label>
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setFormData({...formData, image: reader.result as string});
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="w-full bg-[#0b111e] border border-white/10 rounded-xl px-4 py-2 text-sm text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-amber-500/10 file:text-amber-500 hover:file:bg-amber-500/20" 
                />
                {formData.image && <p className="text-[10px] text-emerald-400 mt-1">? Image ready to upload</p>}
              </div>

              <div className="pt-2">
                <label className="block text-xs text-slate-400 mb-2">Dietary Type *</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-sm text-white cursor-pointer">
                    <input type="radio" name="dietType" checked={formData.isVeg === true} onChange={() => setFormData({...formData, isVeg: true})} className="text-emerald-400 accent-emerald-500" />
                    <span className="text-emerald-400 font-medium">Veg</span>
                  </label>
                  <label className="flex items-center gap-2 text-sm text-white cursor-pointer">
                    <input type="radio" name="dietType" checked={formData.isVeg === false} onChange={() => setFormData({...formData, isVeg: false})} className="text-rose-400 accent-rose-500" />
                    <span className="text-rose-400 font-medium">Non-Veg</span>
                  </label>
                </div>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 text-sm text-white cursor-pointer"><input type="checkbox" checked={formData.isAvailable} onChange={e => setFormData({...formData, isAvailable: e.target.checked})} className="accent-amber-500" /> Currently Available</label>
              </div>

              <button type="submit" disabled={isSubmitting} className="w-full py-2 bg-amber-500 text-black font-semibold rounded-xl hover:bg-amber-400 transition mt-6 disabled:opacity-50">
                {isSubmitting ? 'Saving...' : 'Save Item'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
