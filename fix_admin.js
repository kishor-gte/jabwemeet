const fs = require('fs');
let content = fs.readFileSync('frontend/app/admin/page.tsx', 'utf8');

content = content.replace(
  'if (!confirm("Are you sure you want to approve this Relationship Manager?")) return;',
  'if (!confirm("Are you sure you want to approve this application?")) return;'
);

const oldCard = \                    <p className="text-xs text-amber-400">Role: Relationship Manager</p>
                    
                    <div className="mt-4 flex flex-wrap gap-3">
                      {p.govIdProof && (
                        <a href={\\\/uploads/\\\\} target="_blank" rel="noreferrer" className="text-xs text-blue-400 hover:underline">
                          dY", Gov ID
                        </a>
                      )}
                      {p.addressProof && (
                        <a href={\\\/uploads/\\\\} target="_blank" rel="noreferrer" className="text-xs text-blue-400 hover:underline">
                          dY", Address Proof
                        </a>
                      )}
                      {p.eduCertificate && (
                        <a href={\\\/uploads/\\\\} target="_blank" rel="noreferrer" className="text-xs text-blue-400 hover:underline">
                          dY", Education Cert
                        </a>
                      )}
                      {p.workExperience && (
                        <a href={\\\/uploads/\\\\} target="_blank" rel="noreferrer" className="text-xs text-blue-400 hover:underline">
                          dY", Work Experience
                        </a>
                      )}\;

// I will use regex because of the weird chars (e.g. dY",)
const cardRegex = /<p className="text-xs text-amber-400">Role: Relationship Manager<\/p>[\s\S]*?Work Experience\r?\n\s*<\/a>\r?\n\s*\)\}\r?\n\s*<\/div>/g;

const newCard = \<p className="text-xs text-amber-400">
                      Role: {p.role === 'MATCHMAKER' ? 'Relationship Manager' : 'Breakup Buddy'}
                    </p>
                    
                    <div className="mt-4 flex flex-wrap gap-3">
                      {p.govIdProof && (
                        <a href={\/uploads/\\} target="_blank" rel="noreferrer" className="text-xs text-blue-400 hover:underline">
                          ?? Gov ID
                        </a>
                      )}
                      {p.addressProof && (
                        <a href={\/uploads/\\} target="_blank" rel="noreferrer" className="text-xs text-blue-400 hover:underline">
                          ?? Address Proof
                        </a>
                      )}
                      {p.eduCertificate && (
                        <a href={\/uploads/\\} target="_blank" rel="noreferrer" className="text-xs text-blue-400 hover:underline">
                          ?? Education Cert
                        </a>
                      )}
                      {p.workExperience && (
                        <a href={\/uploads/\\} target="_blank" rel="noreferrer" className="text-xs text-blue-400 hover:underline">
                          ?? Work Experience
                        </a>
                      )}
                      {p.idDocument && (
                        <a href={\/uploads/\\} target="_blank" rel="noreferrer" className="text-xs text-blue-400 hover:underline">
                          ?? ID Document ({p.idType})
                        </a>
                      )}
                      {p.profilePhoto && (
                        <a href={\/uploads/\\} target="_blank" rel="noreferrer" className="text-xs text-blue-400 hover:underline">
                          ??? Profile Photo
                        </a>
                      )}
                    </div>\;

content = content.replace(cardRegex, newCard);

fs.writeFileSync('frontend/app/admin/page.tsx', content, 'utf8');
