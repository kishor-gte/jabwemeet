const fs = require('fs');
let content = fs.readFileSync('frontend/app/breakup-buddy/page.tsx', 'utf8');

const startIdx = content.indexOf('{/* Availability Details if present */}');
const endIdx = content.indexOf('</div>\n                    </div>\n\n                    {/* Card Footer Actions */}');
const endIdxWin = content.indexOf('</div>\r\n                    </div>\r\n\r\n                    {/* Card Footer Actions */}');
const finalEnd = endIdx !== -1 ? endIdx : endIdxWin;

if (startIdx !== -1 && finalEnd !== -1) {
  const newBlock = `{/* Availability Details if present */}
                        {(() => {
                          let activeDays = [];
                          let hasSlots = false;
                          if (Array.isArray(buddy.weeklySchedule) && buddy.weeklySchedule.length > 0) {
                            activeDays = buddy.weeklySchedule.filter((s) => s.slots && s.slots.length > 0).map((s) => s.day);
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
                                    {shortDays.map((day, idx) => (
                                      <span key={idx} className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/20">
                                        {day}
                                      </span>
                                    ))}
                                  </div>
                                  <p className="text-[10px] text-slate-400">
                                    {buddy.availableTimeStart && buddy.availableTimeEnd 
                                      ? \`Usually active between \${buddy.availableTimeStart} - \${buddy.availableTimeEnd}\`
                                      : hasSlots ? "Specific timing slots available for booking." : "Flexible hours."}
                                  </p>
                                </div>
                              ) : (
                                <div className="text-[10px] text-slate-400">
                                  Flexible Schedule 
                                  {buddy.availableTimeStart && buddy.availableTimeEnd
                                    ? \` (\${buddy.availableTimeStart} - \${buddy.availableTimeEnd})\`
                                    : ""}
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      `;
  content = content.substring(0, startIdx) + newBlock + content.substring(finalEnd);
  fs.writeFileSync('frontend/app/breakup-buddy/page.tsx', content);
  console.log('Success');
} else {
  console.log('Could not find block');
}
