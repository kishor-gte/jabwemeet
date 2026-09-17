const fs = require('fs');
let content = fs.readFileSync('frontend/app/breakup-buddy/page.tsx', 'utf8');

content = content.replace('availableTimeEnd: string | null;', 'availableTimeEnd: string | null;\n  weeklySchedule?: any;');

const oldBlock = `                            activeDays = buddy.weeklySchedule.filter((s) => s.slots && s.slots.length > 0).map((s) => s.day);
                            hasSlots = activeDays.length > 0;
                          } else if (buddy.availableDays && buddy.availableDays.length > 0) {
                            activeDays = buddy.availableDays;
                          }
                          const shortDays = activeDays.map((d) => d.slice(0, 3));

                          if (shortDays.length === 0 && !buddy.availableTimeStart && !hasSlots) return null;

                          return (
                            <div className="pt-3 border-t border-white/5 space-y-2">
                              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                                <Clock className="w-3 h-3 text-emerald-400" /> Availability
                              </span>
                              {shortDays.length > 0 ? (
                                <div className="flex flex-col gap-1.5">
                                  <div className="flex flex-wrap gap-1">
                                    {shortDays.map((day, idx) => (`;
const newBlock = `                            activeDays = buddy.weeklySchedule.filter((s: any) => s.slots && s.slots.length > 0).map((s: any) => s.day);
                            hasSlots = activeDays.length > 0;
                          } else if (buddy.availableDays && buddy.availableDays.length > 0) {
                            activeDays = buddy.availableDays;
                          }
                          const shortDays = activeDays.map((d: string) => d.slice(0, 3));

                          if (shortDays.length === 0 && !buddy.availableTimeStart && !hasSlots) return null;

                          return (
                            <div className="pt-3 border-t border-white/5 space-y-2">
                              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                                <Clock className="w-3 h-3 text-emerald-400" /> Availability
                              </span>
                              {shortDays.length > 0 ? (
                                <div className="flex flex-col gap-1.5">
                                  <div className="flex flex-wrap gap-1">
                                    {shortDays.map((day: string, idx: number) => (`;

content = content.replace(oldBlock, newBlock);
fs.writeFileSync('frontend/app/breakup-buddy/page.tsx', content);
console.log('Success');
