const fs = require('fs');

let content = fs.readFileSync('frontend/app/page.tsx', 'utf-8');

const regex1 = /<<<<<<< HEAD[\s\S]*?const fetchTestimonials = \(\) => \{[\s\S]*?\.catch\(\(e\) => console\.error\("Error fetching testimonials:", e\)\);[\s\S]*?=======\s*\/\/ Public CMS Content state[\s\S]*?const fetchCmsContent = \(\) => \{[\s\S]*?\.catch\(\(e\) => console\.error\("Error fetching CMS content:", e\)\);[\s\S]*?>>>>>>> [a-f0-9]+[\r\n]*\s*\};/g;

content = content.replace(regex1, `  const fetchTestimonials = () => {
    fetch("/api/auth/public/feedbacks")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.success && data?.feedbacks) {
          setTestimonials(data.feedbacks);
        }
      })
      .catch((e) => console.error("Error fetching testimonials:", e));
  };

  // Public CMS Content state
  const [cmsContent, setCmsContent] = useState<any>({
    heroHeadline: "",
    heroSubheadline: "",
    aboutText: "",
    safetyPledge: "",
    announcementBanner: "",
  });

  const fetchCmsContent = () => {
    fetch("/api/services/content")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.success && data?.content) {
          setCmsContent(data.content);
        }
      })
      .catch((e) => console.error("Error fetching CMS content:", e));
  };`);

const regex2 = /<<<<<<< HEAD[\s\S]*?fetchLiveEvents\(\);\s*fetchTestimonials\(\);\s*\}, \[\]\);\s*=======\s*[\s\S]*?fetchLiveEvents\(\);\s*fetchCmsContent\(\);\s*\}, \[\]\);\s*>>>>>>> [a-f0-9]+/g;

content = content.replace(regex2, `      .then((data) => {
        if (data?.success && data?.user) {
          setCurrentUser(data.user);
        }
      })
      .catch(() => {});

    fetchLiveEvents();
    fetchTestimonials();
    fetchCmsContent();
  }, []);`);

fs.writeFileSync('frontend/app/page.tsx', content, 'utf-8');
console.log('Resolved merge conflicts.');
