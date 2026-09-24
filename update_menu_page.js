const fs = require('fs');
let code = fs.readFileSync('frontend/app/cafe/menu/page.tsx', 'utf8');

code = code.replace(/<div><label className="block text-xs text-slate-400 mb-1">Image URL.*?<\/div>/, `<div>
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
              </div>`);
fs.writeFileSync('frontend/app/cafe/menu/page.tsx', code);
