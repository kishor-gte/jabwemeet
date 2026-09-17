const fs = require('fs');
let content = fs.readFileSync('frontend/app/breakup-buddy/dashboard/page.tsx', 'utf8');

// Add state variables
const stateVars = \  // API Data States
  const [dashboardData, setDashboardData] = useState({ newRequests: 0, upcomingSessions: 0, completedSessions: 0 });
  const [requests, setRequests] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [history, setHistory] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [earnings, setEarnings] = useState({ totalEarnings: 0, sessions: [] });
  const [loadingData, setLoadingData] = useState(true);

  const fetchData = async () => {
    setLoadingData(true);
    try {
      const [dashRes, reqRes, sessRes, histRes, revRes, earnRes] = await Promise.all([
        fetch('/api/buddy/dashboard', { credentials: 'include' }).then(r => r.json()),
        fetch('/api/buddy/requests', { credentials: 'include' }).then(r => r.json()),
        fetch('/api/buddy/sessions', { credentials: 'include' }).then(r => r.json()),
        fetch('/api/buddy/history', { credentials: 'include' }).then(r => r.json()),
        fetch('/api/buddy/reviews', { credentials: 'include' }).then(r => r.json()),
        fetch('/api/buddy/earnings', { credentials: 'include' }).then(r => r.json()),
      ]);
      if (dashRes.success) setDashboardData(dashRes.data);
      if (reqRes.success) setRequests(reqRes.data);
      if (sessRes.success) setSessions(sessRes.data);
      if (histRes.success) setHistory(histRes.data);
      if (revRes.success) setReviews(revRes.data);
      if (earnRes.success) setEarnings(earnRes.data);
    } catch(e) {
      console.error(e);
    }
    setLoadingData(false);
  };

  useEffect(() => {
    if (user) fetchData();
  }, [user]);
\;

content = content.replace('  const [saving, setSaving] = useState(false);', '  const [saving, setSaving] = useState(false);\n\n' + stateVars);

// Replace renderDashboardHome
const dashRegex = /const renderDashboardHome = \(\) => \([\s\S]*?<\/div>\r?\n\s*\);\r?\n/;
const newDash = \const renderDashboardHome = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold font-serif text-slate-800">Good Morning, {displayName.split(' ')[0] || 'Buddy'} ??</h2>
          <p className="text-slate-500 text-sm mt-1">Here's your session overview</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm text-center">
          <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">New Requests</p>
          <p className="text-3xl font-bold text-teal-600">{dashboardData.newRequests}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm text-center">
          <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">Upcoming</p>
          <p className="text-3xl font-bold text-sky-500">{dashboardData.upcomingSessions}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm text-center">
          <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">Completed</p>
          <p className="text-3xl font-bold text-slate-800">{dashboardData.completedSessions}</p>
        </div>
      </div>
    </div>
  );\n\n\;
content = content.replace(dashRegex, newDash);

// Replace renderRequests
const reqRegex = /const renderRequests = \(\) => \([\s\S]*?<\/div>\r?\n\s*\);\r?\n/;
const newReq = \const renderRequests = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold font-serif text-slate-800 mb-1">New Requests</h2>
      <p className="text-slate-500 text-sm mb-6 border-b border-slate-200 pb-4">Manage incoming booking requests from users.</p>
      
      {requests.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-500 shadow-sm">No pending requests at the moment.</div>
      ) : (
        requests.map((req: any) => (
          <div key={req.id} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm mb-4">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-bold text-lg text-slate-800">{req.user?.name || 'User'}</h3>
                <p className="text-sm text-slate-500">{req.sessionType || 'Chat'} Session • {req.topic || 'General'}</p>
                <p className="text-sm text-teal-600 font-semibold mt-1">Requested on {new Date(req.createdAt).toLocaleDateString()}</p>
              </div>
              <span className="px-3 py-1 bg-amber-100 text-amber-700 border border-amber-200 text-xs font-bold rounded-full">PENDING</span>
            </div>
            <div className="flex gap-3 pt-4 border-t border-slate-100">
              <button className="flex-1 py-2 rounded-lg bg-teal-500 hover:bg-teal-600 text-white text-sm font-semibold transition shadow-sm">Accept</button>
              <button className="flex-1 py-2 rounded-lg bg-red-50 text-red-600 border border-red-100 hover:bg-red-100 text-sm font-semibold transition">Reject</button>
            </div>
          </div>
        ))
      )}
    </div>
  );\n\n\;
content = content.replace(reqRegex, newReq);

// Replace renderSessions
const sessRegex = /const \[sessionTab, setSessionTab\] = useState\("Active"\);\r?\n\s*const renderSessions = \(\) => \([\s\S]*?<\/div>\r?\n\s*\);\r?\n/;
const newSess = \const [sessionTab, setSessionTab] = useState("Active");
  const renderSessions = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold font-serif text-slate-800 mb-1">Sessions</h2>
      
      {sessions.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-500 shadow-sm">No upcoming sessions.</div>
      ) : (
        sessions.map((sess: any) => (
          <div key={sess.id} className="bg-white border border-slate-200 rounded-xl p-5 flex items-center justify-between shadow-sm mb-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-xl overflow-hidden">
                {sess.user?.profileImage ? <img src={sess.user.profileImage} alt="User" /> : '??'}
              </div>
              <div>
                <h4 className="font-bold text-slate-800">{sess.user?.name || 'User'}</h4>
                <p className="text-xs text-slate-500">{sess.sessionType || 'Video'} Call • {sess.durationMinutes} mins</p>
                <p className="text-xs font-semibold text-teal-600 mt-0.5">{new Date(sess.scheduledAt).toLocaleString()}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-lg transition">Reschedule</button>
              <button className="px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white text-sm font-semibold rounded-lg shadow-sm transition">Join</button>
            </div>
          </div>
        ))
      )}
    </div>
  );\n\n\;
content = content.replace(sessRegex, newSess);

// Replace renderHistory
const histRegex = /const renderHistory = \(\) => \([\s\S]*?<\/div>\r?\n\s*\);\r?\n/;
const newHist = \const renderHistory = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold font-serif text-slate-800 mb-1">Session History</h2>
      {history.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-500 shadow-sm">No past sessions found.</div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
              <tr>
                <th className="px-6 py-3 font-semibold">User</th>
                <th className="px-6 py-3 font-semibold">Date</th>
                <th className="px-6 py-3 font-semibold">Type</th>
                <th className="px-6 py-3 font-semibold">Duration</th>
                <th className="px-6 py-3 font-semibold text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {history.map((h: any) => (
                <tr key={h.id}>
                  <td className="px-6 py-4 font-bold">{h.user?.name || 'User'}</td>
                  <td className="px-6 py-4">{new Date(h.scheduledAt).toLocaleDateString()}</td>
                  <td className="px-6 py-4">{h.sessionType}</td>
                  <td className="px-6 py-4">{h.durationMinutes}m</td>
                  <td className="px-6 py-4 text-right">
                    <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs font-semibold">Completed</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );\n\n\;
content = content.replace(histRegex, newHist);

// Replace renderReviews
const revRegex = /const renderReviews = \(\) => \([\s\S]*?<\/div>\r?\n\s*\);\r?\n/;
const newRev = \const renderReviews = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold font-serif text-slate-800 mb-1">Reviews</h2>
      {reviews.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-500 shadow-sm">No reviews yet.</div>
      ) : (
        reviews.map((rev: any) => (
          <div key={rev.id} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm mb-4">
            <div className="flex items-center gap-2 mb-3">
              {[...Array(5)].map((_, i) => (
                <span key={i} className={\	ext-lg \\}>?</span>
              ))}
              <span className="text-slate-400 text-xs ml-2">{new Date(rev.createdAt).toLocaleDateString()}</span>
            </div>
            <p className="text-slate-700 text-sm mb-4">"{rev.comment}"</p>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-slate-200 rounded-full overflow-hidden">
                {rev.user?.profileImage && <img src={rev.user.profileImage} alt="" />}
              </div>
              <span className="text-sm font-bold text-slate-800">- {rev.user?.name || 'Anonymous'}</span>
            </div>
          </div>
        ))
      )}
    </div>
  );\n\n\;
content = content.replace(revRegex, newRev);

// Replace renderEarnings
const earnRegex = /const renderEarnings = \(\) => \([\s\S]*?<\/div>\r?\n\s*\);\r?\n/;
const newEarn = \const renderEarnings = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold font-serif text-slate-800 mb-1">Earnings</h2>
      <div className="bg-gradient-to-br from-teal-500 to-emerald-600 rounded-xl p-6 text-white shadow-sm mb-6 flex justify-between items-center">
        <div>
          <p className="text-teal-100 text-sm font-medium mb-1">Total Earnings</p>
          <h3 className="text-4xl font-bold">?{earnings.totalEarnings}</h3>
        </div>
        <div className="text-right">
          <p className="text-teal-100 text-sm font-medium mb-1">Sessions Completed</p>
          <h3 className="text-2xl font-bold">{earnings.sessions.length}</h3>
        </div>
      </div>
      
      {earnings.sessions.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-500 shadow-sm">No earning history.</div>
      ) : (
        <div className="space-y-4">
          <h3 className="font-bold text-slate-800 border-b border-slate-200 pb-2">Recent Transactions</h3>
          {earnings.sessions.map((sess: any) => (
            <div key={sess.id} className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <div>
                <p className="font-bold text-slate-800">Session • {sess.sessionType}</p>
                <p className="text-xs text-slate-500">{new Date(sess.scheduledAt).toLocaleDateString()}</p>
              </div>
              <div className="text-lg font-bold text-emerald-600">+?{sess.amountEarned}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );\n\n\;
content = content.replace(earnRegex, newEarn);

fs.writeFileSync('frontend/app/breakup-buddy/dashboard/page.tsx', content, 'utf8');
