# JabWeMeet — Complete 33-Slide Project Blueprint & Presentation Content

---

## Slide 1: Introduction about the Project Subject
* **Subject Domain**: Human-Centric Matchmaking, Offline Social Connection & Emotional Wellness Ecosystem.
* **Core Concept**: **JabWeMeet** moves away from addictive, algorithm-driven swipe culture and replaces it with **human-verified offline dating**, **curated community mixers**, and **post-breakup emotional healing**.
* **Why This Subject Matters Today**:
  * Traditional dating apps optimize for screen time and endless swiping rather than real-world relationship outcomes.
  * Modern singles face **swipe fatigue**, **ghosting**, **catfishing**, and **emotional burnout** with no emotional support system before or after dating.
* **Vision**: *"No Swiping. No Ghosting. Just Real, Verified Human Connections — Online to Offline."*

---

## Slide 2: Project Overview
* **What is JabWeMeet?**
  * A full-stack, multi-role relationship and social ecosystem built with **Next.js 16**, **Express 5**, **PostgreSQL (Prisma ORM)**, **Socket.IO**, and **WebRTC**.
* **Four Core Pillars of the Platform**:
  1. **Human Relationship Managers (Matchmakers)**: Personal matchmakers who review profiles, run AI-assisted compatibility checks, suggest matches, and arrange real-world **Blind Dates** at partner cafes once both users approve.
  2. **Breakup Buddy (Emotional Healing)**: Dedicated empathy companions offering a **strictly tracked 30-minute free trial** (shared across live WebRTC voice calls and real-time chat when both participants are active), followed by structured healing packages.
  3. **Curated Offline Events & Mixers**: Event Hosts organize verified real-world social mixers with QR-code ticketing and check-in management.
  4. **Partner Cafe Network**: Verified cafes host blind dates with table reservations, menus, pre-orders, and special date offers.

---

## Slide 3: Problem Statement
* **1. Endless Swiping & Algorithm Fatigue**: Users spend hours swiping on superficial photos with <2% match-to-real-date conversion.
* **2. Ghosting & Dead-End Chats**: Matches rarely move from text chat to an actual face-to-face meeting.
* **3. Digital Deception (Catfishing & Fake Profiles)**: Lack of strict Government ID, education, and work verification creates safety risks, especially for women.
* **4. Zero Emotional Support After Heartbreak**: People recovering from breakups join swipe apps prematurely without emotional healing, leading to toxic rebound cycles.
* **5. Unstructured & Unsafe First Dates**: Users struggle to coordinate safe, vetted venues for a first meeting.

---

## Slide 4: Objectives
* **Eliminate Endless Swiping**: Replace algorithmic swiping with curated introductions managed by verified human **Relationship Managers**.
* **Guarantee Real Offline Meetings**: Automate the transition from **Mutual Approval (`BothApproved`)** to a **Scheduled Blind Date (`DateFixed`)** at a verified partner cafe.
* **Provide Accessible Emotional Healing**: Offer every user **30 minutes of free live voice/chat support** with a **Breakup Buddy** (tracked strictly to the second when both parties are present) before requiring a paid subscription.
* **Ensure 100% Community Trust & Safety**: Enforce multi-document KYC verification (Government ID, Address Proof, Education Certificate, Work Experience) and Admin approval (`ApprovalStatus`).
* **Build a Multi-Stakeholder Local Economy**: Connect Singles, Matchmakers, Breakup Buddies, Event Hosts, and Local Cafes on one unified platform.

---

## Slide 5: Project Scope
* **In-Scope (Implemented in Current Codebase)**:
  * **6 Role-Based Portals**: User, Relationship Manager (Matchmaker), Breakup Buddy, Event Host, Partner Cafe, and Super Admin.
  * **Real-Time Communication**: WebRTC peer-to-peer voice calling (`VoiceCallOverlay.tsx`), Socket.IO real-time chat, live presence heartbeats, and instant single-trigger bell notifications.
  * **Smart 30-Minute Quota Engine**: Cumulative active-overlap timer (`1800 seconds`) across voice calls and chat for Breakup Buddy sessions.
  * **End-to-End Blind Date Coordination**: Match suggestion workflow (`Pending` $\rightarrow$ `Approved` $\rightarrow$ `BothApproved` $\rightarrow$ `DateFixed`), OpenStreetMap live cafe discovery across 38+ Indian cities, and post-date feedback.
  * **Payments & Billing**: Razorpay payment gateway integration (HMAC-SHA256 verified), automated invoicing, coupon codes, refunds, and revenue splits.
* **Geographical Scope**: Designed for Tier-1 and Tier-2 Indian cities (38+ cities configured via OpenStreetMap Overpass/Nominatim API) with global scalability.

---

## Slide 6: Target Audience / Users
* **1. Serious Singles (Ages 22–40)**: Working professionals and urban singles tired of casual swipe apps who want curated, high-intent introductions and safe offline blind dates.
* **2. Individuals Recovering from Heartbreak**: Users seeking a judgment-free listener (**Breakup Buddy**) to vent, heal, and rebuild emotional readiness.
* **3. Socially Active Singles**: People who prefer meeting organically in group settings through curated offline workshops, speed dating, and mixers.
* **4. Service Partners & B2B Stakeholders**:
  * Certified Relationship Managers / Matchmakers.
  * Empathetic listeners & counselors (Breakup Buddies).
  * Local Event Organizers / Community Hosts.
  * Partner Cafes & Restaurants looking for guaranteed table bookings.

---

## Slide 7: Market Research (100% Genuine Industry Data — Simplified)

### 1. India Market Research
* **Market Value**: The Indian online dating market was worth **₹4,550 Crore ($548 Million)** in 2023 and will cross **₹8,500 Crore ($1.01 Billion)** by 2030 (*Source: Grand View Research*).
* **Growth Speed**: The market in India is growing fast at **9.2% every year**.
* **Total Users in India**: Over **65 Million to 80 Million people** in India use dating apps today.
* **Global Ranking**: India is the **2nd biggest country in the world** for dating app downloads, right after the USA.
* **Small Cities are Growing**: More than **40% of new users** now come from Tier-2 and Tier-3 cities like Jaipur, Indore, Chandigarh, and Kochi, while metro cities bring in **65% of the paid money**.

### 2. Global Market Research
* **World Market Value**: The global dating app market is worth **$10.5 Billion (around ₹88,000 Crore)** today and will reach **$14.4 Billion** by 2030.
* **Total World Users**: More than **350 Million people** around the world use online dating websites and apps.
* **Fastest Growing Region**: North America makes the most money today (36%), but **Asia-Pacific (led by India)** is the fastest-growing market in the world.

### 3. Pricing Analysis (What People Pay in India)
* **Normal Swipe Apps (Tinder, Bumble, Hinge)**: Charge **₹599 to ₹1,499 per month**, where users still have to swipe and find dates by themselves.
* **Indian Dating Apps (Aisle, TrulyMadly)**: Charge **₹399 to ₹999 per month** for basic self-chatting plans.
* **VIP Matrimony Matchmakers (Shaadi VIP, EliteMatrimony)**: Charge a very high price of **₹10,000 to ₹50,000+** for a human matchmaker.
* **Therapy & Counseling Apps**: Charge **₹800 to ₹2,500** for a single 45-minute session, with no free talking time.
* **Why JabWeMeet's Price is Best**:
  * We give a **Personal Relationship Manager starting at just ₹2,999/month** (much cheaper than ₹25,000 VIP matrimony).
  * We give **30 minutes of FREE voice call/chat** with a Breakup Buddy, and paid sessions start at just **₹799**.

### 4. Market Trends (What is Happening Right Now)
* **People are Tired of Swiping ("Swipe Fatigue")**: According to *Forbes Health*, **78% of young singles** feel mentally tired and frustrated from endless swiping.
* **People Want Offline Meetings**: Singles are leaving swipe apps and joining **real-world offline events, mixers, and cafe blind dates** (offline singles events grew by **42%** last year).
* **Human Matchmakers + AI**: People no longer trust fake app algorithms; they want a **real human matchmaker** to introduce them to verified people.
* **Emotional Healing Before Dating**: More people now want someone to talk to and heal their heartbreak before starting a new relationship.

### 5. User Needs Analysis (What Users Really Want)
* **Real & Safe Profiles**: Over **70% of women in India** worry about fake profiles and safety—they want strict ID, education, and job verification.
* **Real Dates, Not Endless Chatting**: Users are tired of "Hi / Hello" chats that go nowhere; they want someone to **fix a real blind date at a safe cafe**.
* **A Friendly Listener During Breakups**: Heartbroken users want an affordable, judgment-free friend (**Breakup Buddy**) to talk to on a call or chat, starting with a **free 30-minute trial**.

---

## Slide 8: Existing Features (Implemented in JabWeMeet Codebase)
1. **Multi-Role Authentication & KYC Onboarding**:
   * JWT + HTTP-Only Cookie authentication, password reset, and document uploads (`govIdProof`, `addressProof`, `eduCertificate`, `workExperience`) with Admin approval workflow (`PENDING`, `APPROVED`, `REJECTED`).
2. **Human Relationship Manager (Matchmaker) System**:
   * Browse & hire verified Matchmakers (`/matchmakers`), submit `MatchmakingRequest`, 1-on-1 chat with Matchmaker, AI compatibility analysis via Google Gemini (`@google/genai`), and curated `MatchSuggestion` cards.
3. **Blind Date Arrangement Engine**:
   * Dual-approval status tracking (`Pending` $\rightarrow$ `Approved` $\rightarrow$ `BothApproved` $\rightarrow$ `DateFixed`), live cafe venue selection, date/time scheduling, mutual connection messaging (`ConnectionMessage`), and post-date rating (`DateFeedback`).
4. **Breakup Buddy Healing Portal**:
   * Hire a Breakup Buddy (`/breakup-buddy`), **30-minute (1800s) free shared trial** across WebRTC Voice Calls and Real-Time Chat (counted strictly when both User and Buddy are present), smart single-trigger bell notifications (`"User in Chat"`), session notes (`BuddySession`), call logs (`CallLog`), and reviews (`BuddyReview`).
5. **Offline Events & QR Check-In System**:
   * Event creation by Hosts (`/host`), ticket booking (`EventBooking`), automated QR code & ticket code generation (`EventRegistration`), 24-hour automated email reminders (`eventReminderService.js`), and Host subscription tiers.
6. **Partner Cafe Management Portal**:
   * Dedicated Cafe dashboard (`/cafe/dashboard`) managing table reservations (`CafeReservation`), menus (`MenuItem`), pre-orders (`CafeOrder`), staff (`CafeStaff`), offers (`CafeOffer`), reviews, and revenue analytics.
7. **Super Admin Control Center**:
   * Platform KPIs, user/partner KYC verification, dynamic home page metrics (`/api/services/public/home-stats`), service package management, coupon management, support tickets, audit logs, and refund processing.

---

## Slide 9: Existing System Drawbacks (In Traditional Dating Apps)
* **Superficial Lookism**: Swipe mechanisms judge people in 0.5 seconds based solely on photos rather than values, background, or personality.
* **Monetization of Loneliness**: Swipe apps intentionally withhold high-compatibility matches behind expensive "Super Likes," "Roses," and "Boosts" to keep users paying monthly.
* **No Accountability**: Users can ghost, flake on dates, or misrepresent themselves without human oversight or post-date feedback loops.
* **Isolated Single-Purpose Apps**: Users must use one app for dating (Tinder/Bumble), another for events (BookMyShow/Meetup), another for cafe bookings (Zomato/Dineout), and another for breakup therapy.

---

## Slide 10: Unique Features (What Makes JabWeMeet Different)
* **1. Human-Arranged Blind Dates at Partner Cafes**: Unlike any swipe app, when both suggested singles click "Approve" (`BothApproved`), the Relationship Manager fixes a real-world **Blind Date (`DateFixed`)** with a confirmed date, time, and verified Cafe venue.
* **2. Strictly Tracked 30-Minute Free Breakup Buddy Trial**:
  * Shared `1800-second` free quota across **WebRTC Voice Calls** and **Live Chat**.
  * **Mutual-Presence Timer**: The timer *only* deducts seconds when **both** the User and the Breakup Buddy are actively connected at the same time, resuming seamlessly from the exact remaining second across multiple calls/chats.
* **3. Integrated 6-Role Ecosystem**: Unites Singles, Matchmakers, Breakup Buddies, Event Hosts, Partner Cafes, and Admins in a single database and real-time socket architecture.
* **4. Live OpenStreetMap Cafe Discovery**: Real-time geolocation and city lookup across 38+ Indian cities (`backend/routes/places.js`) to pair blind dates with real partner and local cafes.
* **5. Post-Date Feedback Accountability**: Structured `DateFeedback` after arranged blind dates so Relationship Managers can refine future matches and ensure community safety.

---

## Slide 11: Features to Include (Currently Built & Active in JabWeMeet)
* **Dynamic Landing Page & Live Platform Metrics**: Real-time counts of Verified Members, Curated Events, Offline Dates, and Community Trust Rating (`/api/services/public/home-stats`) plus interactive Dilemma deep-links.
* **Two-Way WebRTC Voice Calling (`VoiceCallOverlay.tsx`)**: Browser-based peer-to-peer encrypted voice calls with mute/unmute, audio visualizer, call timer, and automatic quota enforcement.
* **Real-Time Socket.IO Presence & Single-Trigger Notifications**: Smart presence heartbeats (`BuddyPresence`) that alert the Breakup Buddy bell icon strictly once when a user enters the chat room.
* **Razorpay End-to-End Checkout**: Cryptographically verified order creation and payment capture for Matchmaker subscriptions, Breakup Buddy passes, Event tickets, and Host plans.
* **AI Compatibility Assistant for Matchmakers**: Integrated `@google/genai` endpoint helping human matchmakers analyze compatibility between two client profiles.

---

## Slide 12: Future Enhancements
* **1. Native Mobile Apps (iOS & Android)**: Porting the Next.js web experience to React Native / Flutter with native push notifications and background VoIP calling.
* **2. Video Calling for Virtual Pre-Dates**: Extending the existing WebRTC audio pipeline to support optional 10-minute blurred/unblurred video introductions before an offline blind date.
* **3. Live Government ID API Verification (DigiLocker / Aadhaar e-KYC)**: Automating the current manual document upload verification via instant API verification.
* **4. Group Table Matching at Partner Cafes**: Allowing 4–6 singles with similar interests to book a shared group dinner table at partner cafes.
* **5. AI Post-Date Coaching**: Personalized insights generated from `DateFeedback` to help users improve their real-world dating communication skills.

---

## Slide 13: Competitors Analysis
* **1. Tinder (Match Group)**:
  * *Focus*: High-volume casual swiping.
  * *Weakness*: High ghosting rate, skewed gender ratio in India (~80:20 male-to-female), high fake profile complaints.
* **2. Bumble (Bumble Inc.)**:
  * *Focus*: Women-make-the-first-move swipe app (recently relaxed via "Opening Moves").
  * *Weakness*: Matches still expire or stall in text chat; no human matchmaking or offline date venue coordination.
* **3. Hinge (Match Group)**:
  * *Focus*: Prompt-based profiles ("Designed to be Deleted").
  * *Weakness*: Strong in Tier-1 metros, but still relies on self-service swiping/liking with zero emotional support or offline blind date logistics.
* **4. Aisle & TrulyMadly (Indian High-Intent Apps)**:
  * *Focus*: Serious Indian dating for marriage-minded urban singles.
  * *Weakness*: Still operates on self-browsing/chat models; lacks Breakup Buddy emotional support and integrated partner cafe reservations.

---

## Slide 14: Feature Comparison (JabWeMeet vs. Existing Dating Apps)

| Feature | Tinder / Bumble | Hinge | Aisle / TrulyMadly | **JabWeMeet (Our Platform)** |
| :--- | :---: | :---: | :---: | :---: |
| **Matching Mechanism** | Endless Swiping | Prompt Likes | Self-Browsing | **Human Relationship Manager + AI** |
| **Blind Date Arrangement** | ❌ No | ❌ No | ❌ No | **✅ Yes (`BothApproved` $\rightarrow$ `DateFixed`)** |
| **Partner Cafe Booking** | ❌ No | ❌ No | ❌ No | **✅ Yes (Built-in Cafe Portal & Menus)** |
| **Breakup Emotional Support** | ❌ No | ❌ No | ❌ No | **✅ Yes (Breakup Buddy Voice + Chat)** |
| **30-Min Free Active Trial** | ❌ No | ❌ No | ❌ No | **✅ Yes (Mutual-Presence Tracked)** |
| **Curated Offline Events & QR** | ❌ Rare / External | ❌ No | ❌ Limited | **✅ Yes (Dedicated Host Portal & QR)** |
| **Multi-Doc KYC Verification** | ⚠️ Selfie Only | ⚠️ Selfie Only | ⚠️ Basic Score | **✅ Gov ID + Address + Edu + Work KYC** |
| **Post-Date Feedback Loop** | ❌ No | ⚠️ Simple Poll | ❌ No | **✅ Structured Matchmaker Feedback** |

---

## Slide 15: Our Pricing & Existing Websites Pricing

### JabWeMeet Pricing (Configured in `backend/db/adminInit.js` & `subscription.js`)
* **Breakup Buddy Healing Passes**:
  * **Free Trial**: **₹0 for First 30 Minutes** (1800 seconds shared across Voice Call & Chat; counts only when both are active).
  * **Listen & Vent**: **₹799** (1 Session — 45 mins voice/chat + venting exercises).
  * **Comfort & Grounding**: **₹1,999** (3 Sessions — recovery roadmap).
  * **Rebuilding Circle**: **₹3,499** (6 Sessions — priority scheduling + confidence tracking).
  * **Full Transition Companion**: **₹5,999** (10 Sessions — 1 month complete healing support).
* **Relationship Manager (Matchmaker) Packages**:
  * **Starter Connect**: **₹2,999/month** (2 hand-picked introductions + profile consultation).
  * **Connect Pro**: **₹4,999/month** (4 curated dates + relationship coaching + venue booking).
  * **Premium Harmony**: **₹8,999/month** (6 matches + priority matchmaker access + post-date feedback).
  * **Elite Concierge**: **₹14,999/month** (10 matches + dedicated senior matchmaker + VIP private venue reservation).
* **Event Host Subscription Plans**:
  * **Starter**: **Free** (1 Event) | **Basic**: **₹999** (5 Events / 30 days) | **Pro**: **₹2,499** (15 Events / 90 days) | **Unlimited**: **₹4,999** (Unlimited Events / 365 days).

### Existing Websites Pricing in India (2024–2025 Genuine Rates)
* **Tinder**: Plus (₹599/mo), Gold (₹899/mo), Platinum (₹1,099/mo); Tinder SELECT ($499/mo global).
* **Bumble**: Boost (₹899/mo), Premium (₹1,199/mo).
* **Hinge**: Hinge+ (₹1,199/mo), HingeX (₹1,499/mo).
* **Aisle**: Aisle Premium / Concierge (₹399 – ₹999/mo).
* **TrulyMadly**: VIP Plans (₹499 – ₹899/mo).

---

## Slide 16: Revenue of the Existing Websites (Genuine SEC 10-K & Industry Data)
* **Match Group (Parent of Tinder, Hinge, OkCupid — FY 2024 SEC Form 10-K)**:
  * **Total Annual Revenue**: **USD 3.48 Billion (~₹29,000 Crore)** in FY 2024.
  * **Tinder Direct Revenue**: **USD 1.94 Billion (~₹16,100 Crore)** in FY 2024.
  * **Hinge Direct Revenue**: **USD 550 Million (~₹4,580 Crore)** in FY 2024 (growing ~38%–50% YoY).
* **Bumble Inc. (Parent of Bumble & Badoo — FY 2024 Annual Report)**:
  * **Total Annual Revenue**: **USD 1.07 Billion (~₹8,900 Crore)** in FY 2024.
  * **Bumble App Revenue**: **USD 866.3 Million (~₹7,200 Crore)** in FY 2024.
* **Info Edge / Indian Matrimony & Dating Sector**:
  * **Info Edge (Jeevansathi + Aisle stake)**: Jeevansathi + Aisle segment generates **₹90+ Crore – ₹100+ Crore annually**, while market leader **Matrimony.com (BharatMatrimony)** reported **₹481 Crore annual revenue (FY24)**.

---

## Slide 17: Workflow (End-to-End Operational Workflow)
1. **Onboarding & KYC**: User/Partner registers $\rightarrow$ uploads KYC documents (`govIdProof`, `addressProof`, `eduCertificate`, `workExperience`) $\rightarrow$ Admin reviews and sets `approvalStatus = APPROVED`.
2. **Service Selection**:
   * *Path A (Emotional Healing)*: User selects a Breakup Buddy $\rightarrow$ gets 30 minutes (`1800s`) free active Voice/Chat $\rightarrow$ mutual presence engine deducts elapsed seconds $\rightarrow$ when `remainingSeconds === 0`, user upgrades via Razorpay (`95%` Buddy / `5%` Platform split).
   * *Path B (Matchmaking & Blind Date)*: User subscribes to a Relationship Manager $\rightarrow$ Matchmaker uses AI compatibility check + human judgment to create a `MatchSuggestion` $\rightarrow$ both Client and Suggested Profile click Approve (`BothApproved`) $\rightarrow$ Matchmaker schedules a **Blind Date (`DateFixed`)** with Date, Time, and Partner Cafe Venue $\rightarrow$ both attend date & submit `DateFeedback`.
   * *Path C (Offline Events)*: Host subscribes to a Host Plan $\rightarrow$ publishes an Event $\rightarrow$ Users book tickets via Razorpay $\rightarrow$ receive QR Code (`EventRegistration`) $\rightarrow$ 24h automated reminder sent $\rightarrow$ Host checks attendees in at the venue.

---

## Slide 18: User Flow (Step-by-Step User Journey)
```
[Landing Page (/)]
   │  (Dynamic Stats + Dilemma Buttons)
   ▼
[Register / Login (/register, /login)] ──► [Role & KYC Verification]
   │
   ├──► 1. NEED HEALING? ──► [/breakup-buddy] ──► Request Buddy
   │         └──► [/dashboard?tab=messages] (Live Chat + WebRTC Voice Call)
   │         └──► 30-Min Mutual-Presence Free Timer ──► Razorpay Pass Upgrade
   │
   ├──► 2. READY TO DATE? ──► [/matchmakers] ──► Hire Relationship Manager
   │         └──► Receive Curated Match Suggestion (/dashboard)
   │         └──► Both Users Approve ("BothApproved")
   │         └──► Blind Date Fixed at Partner Cafe ("DateFixed")
   │         └──► Attend Offline Date & Submit Post-Date Feedback
   │
   └──► 3. GROUP SOCIALIZING? ──► [/events] ──► Book Event Ticket
             └──► Receive Unique Ticket Code & QR Code ──► Attend Offline Mixer
```

---

## Slide 19: System Architecture
* **Client Presentation Layer (Frontend)**:
  * **Next.js 16 (App Router) + React 19 + Tailwind CSS v4** running on Port `3000`.
  * Real-time state via `SocketContext` (`socket.io-client`) and P2P audio media streams via **WebRTC (`RTCPeerConnection` + Google STUN servers)**.
* **Application & Signaling Layer (Backend)**:
  * **Node.js + Express 5 REST API + Socket.IO Server** running on Port `5001`.
  * Security middleware: `helmet`, `cors`, `express-rate-limit`, `cookie-parser`, JWT authentication middleware (`middleware/auth.js`), and Role-Based Access Control (RBAC).
  * Background services: `emailQueue.js` (Redis/In-Memory queue) + `eventReminderService.js` (hourly cron job for 24h event reminders).
* **Data Persistence Layer (Database)**:
  * **PostgreSQL** managed via **Prisma ORM v7 (`@prisma/adapter-pg`)** with 26 relational models.
* **External Cloud Services**:
  * **Razorpay API** (Payments), **Google Gemini API** (AI Match Compatibility), **OpenStreetMap Overpass/Nominatim API** (Live Cafe & City Geolocation), **SMTP / Nodemailer** (Transactional Emails).

---

## Slide 20: Modules Overview
1. **Authentication & KYC Module (`routes/auth.js`)**: Registration, login, JWT cookies, password reset, and Multer multi-document KYC uploads.
2. **Matchmaker & Blind Date Module (`routes/matchmaker.js`)**: Client roster, Gemini AI compatibility scoring, match suggestions, dual approval (`BothApproved`), blind date scheduling (`DateFixed`), and connection chat.
3. **Breakup Buddy & Real-Time Quota Module (`routes/services.js` + `VoiceCallOverlay.tsx`)**: Buddy hiring, mutual-presence tracking (`BuddyPresence`), 30-minute free quota engine, WebRTC signaling (`call-user`, `make-answer`, `ice-candidate`), and session logs.
4. **Events & Host Module (`routes/events.js`, `routes/hostSubscription.js`)**: Event publishing, capacity tracking, QR ticket generation, attendee check-in, and host subscription enforcement.
5. **Partner Cafe Module (`routes/cafe.js`, `routes/places.js`)**: Cafe profile, menu management, blind-date table reservations, food pre-orders, staff roster, offers, and OpenStreetMap city/cafe discovery.
6. **Subscription, Billing & Admin Module (`routes/subscription.js`, `routes/admin.js`)**: Razorpay order/verification, 95/5 buddy commission split, invoices, coupons, refunds, support tickets, and dynamic homepage stats.

---

## Slide 21: User Roles & Permissions (`Role` Enum in Prisma Schema)

| Role (`Role` Enum) | Portal Route | Key Permissions & Capabilities |
| :--- | :--- | :--- |
| **`USER`** | `/dashboard` | Hire Matchmakers & Breakup Buddies, use 30-min free voice/chat trial, approve match suggestions, view scheduled blind dates, book event tickets, reserve cafes, submit feedback. |
| **`MATCHMAKER`** | `/matchmaker/dashboard` | View assigned clients, chat with clients, run AI compatibility checks, send `MatchSuggestion`s, fix Blind Date venues & times (`DateFixed`), record appointments. |
| **`BREAKUP_BUDDY`** | `/breakup-buddy/dashboard` | Accept/reject buddy requests, receive single-trigger `"User in Chat"` bell notifications, conduct WebRTC voice calls & live chat, log session notes, track 95% earnings. |
| **`HOST`** | `/host/dashboard` | Purchase Host subscriptions, create/edit offline events, view ticket registrations, verify QR codes, and check in attendees. |
| **`CAFE`** | `/cafe/dashboard` | Manage cafe profile, menu items, blind-date table reservations, customer pre-orders, cafe staff, promotional offers, and transaction ledger. |
| **`ADMIN`** | `/admin/dashboard` | Approve/reject KYC documents, manage all users/partners, configure service packages & coupons, resolve support tickets/reports, process refunds, view audit logs. |

---

## Slide 22: Technology Stack (Exact Versions from Codebase)

### 1. Frontend (`frontend/package.json`)
* **Framework**: Next.js `16.3.5` (App Router) with React `19.2.8` & React DOM `19.2.8`.
* **Language**: TypeScript `6.0.3`.
* **Styling & UI**: Tailwind CSS `v4` (`@tailwindcss/postcss`), `lucide-react` `1.46.0` icons, `date-fns` `4.4.0`.
* **Real-Time & Media**: `socket.io-client` `4.8.3`, Native Browser **WebRTC API** (`RTCPeerConnection`, `AudioContext` voice activity visualizer).

### 2. Backend (`backend/package.json`)
* **Runtime & Framework**: Node.js with Express `5.2.1`.
* **Real-Time Server**: Socket.IO `4.8.3` with JWT handshake authentication.
* **Security & Auth**: `jsonwebtoken` `9.0.3`, `bcryptjs` `3.0.3`, `helmet` `8.3.0`, `express-rate-limit` `8.7.0`, `cookie-parser` `1.4.7`, `cors` `2.8.6`.
* **File Uploads & Queues**: `multer` `2.4.0` (KYC & media uploads), `ioredis` `6.0.0` (with in-memory queue fallback), `nodemailer` `10.0.10`.

### 3. Database (`backend/prisma/schema.prisma`)
* **Database Engine**: **PostgreSQL** (`pg` `8.23.0`).
* **ORM**: **Prisma ORM `7.10.0`** with `@prisma/adapter-pg` `7.10.0`.

### 4. APIs & Integrations
* **Razorpay API (`razorpay` `2.9.8`)**: Order creation, HMAC-SHA256 payment verification, and subscription activation.
* **Google Gemini AI (`@google/genai` `2.24.0`)**: AI-assisted compatibility analysis for Relationship Managers.
* **OpenStreetMap (Nominatim & Overpass API)**: Real-time city coordinates and cafe discovery across 38+ Indian cities.
* **Google STUN Servers (`stun.l.google.com:19302`)**: NAT traversal for peer-to-peer WebRTC voice calls.

### 5. Database Design (26 Relational Models in `schema.prisma`)
* **Core Identity**: `User` (unified table with `Role` & `ApprovalStatus` enums + KYC fields), `PasswordReset`, `AuditLog`.
* **Matchmaking & Blind Dates**: `MatchmakingRequest`, `MatchSuggestion` (`clientStatus`, `suggestedStatus`, `meetingDate`, `meetingVenue`), `Appointment`, `Conversation`, `Message`, `ConnectionMessage`, `DateFeedback`.
* **Breakup Buddy & Calling**: `BuddyRequest` (`usedSeconds`, `extraMinutes`, `isTrial`), `BuddyMessage`, `BuddyPresence` (mutual overlap tracking), `BuddySession`, `BuddyReview`, `CallLog`.
* **Events & Hosts**: `Event`, `EventBooking`, `EventRegistration` (`ticketCode`, `qrCode`, `checkedIn`), `HostSubscription`, `HostPayment`.
* **Partner Cafe**: `CafeProfile`, `MenuItem`, `CafeReservation`, `CafeOrder`, `CafeOrderItem`, `CafeStaff`, `CafeOffer`, `CafeCustomer`, `CafeReview`, `CafeTransaction`, `CafeNotification`.
* **Commerce & Admin**: `ServicePackage`, `Subscription`, `Payment`, `Invoice`, `Coupon`, `Refund`, `Report`, `SupportTicket`, `NotificationAnnouncement`, `SystemSetting`.

---

## Slide 23: Existing Similar Apps in India & Globally
* **Global Giants Operating in India**:
  * **Tinder** (Match Group) — Casual swipe-based dating.
  * **Bumble** (Bumble Inc.) — Women-first swipe dating & BFF networking.
  * **Hinge** (Match Group) — Prompt-based relationship app.
  * **OkCupid** (Match Group) — Questionnaire-based matching.
* **Indian Homegrown Dating Apps**:
  * **Aisle** (Backed by Info Edge) — High-intent dating for Indians globally (also operates regional apps *Arike*, *Anbe*, *Neetho*).
  * **TrulyMadly** — Trust-score based serious dating for Indian singles.
  * **QuackQuack** — Tier-1, Tier-2 & Tier-3 Indian dating platform.
* **Indian Matrimony Platforms (Adjacent Market)**:
  * **Shaadi.com**, **BharatMatrimony**, and **Jeevansathi.com**.

---

## Slide 24: Comparison with Features (Deep-Dive Matrix)

| Capability | Swipe Apps (Tinder/Bumble/Hinge) | Indian Apps (Aisle/TrulyMadly) | Matrimony Apps (Shaadi/BharatMatrimony) | **JabWeMeet** |
| :--- | :--- | :--- | :--- | :--- |
| **Primary User Experience** | Infinite self-swiping | Self-browsing & likes | Family-driven biodata search | **Human Matchmaker + Curated Blind Dates** |
| **Who Selects the Match?** | Black-box engagement algorithm | User manually filters | Parents or user manually filters | **Dedicated Relationship Manager + Gemini AI** |
| **First Date Coordination** | User must ask & plan via chat | User must ask & plan via chat | Phone call / family meeting | **Matchmaker schedules Blind Date at Partner Cafe** |
| **Emotional Healing Support** | None | None | None | **Breakup Buddy (Voice Call + Chat + 30m Free)** |
| **Offline Group Mixers** | External marketing events only | Occasional city mixers | Matrimony melas | **Built-in Host Portal with QR Ticket Check-In** |
| **Partner Cafe Integration** | None | None | None | **Full Cafe Dashboard (Tables, Menus, Offers)** |

---

## Slide 25: How Many Users They Have (Genuine Verified Data)
* **Tinder**:
  * **~50 Million to 75 Million Monthly Active Users (MAUs)** globally; **~9.5 Million paying subscribers** (*Match Group FY24 10-K*).
  * **India**: Estimated **15M+ – 20M+ cumulative users** (India's #1 dating app by total downloads).
* **Bumble**:
  * **~40 Million to 50 Million MAUs** globally; **~4.2 Million paying users** (*Bumble Inc. FY24 Report*).
  * **India**: Surpassed **10M+ – 15M+ users** in India.
* **Hinge**:
  * **~23 Million to 30 Million MAUs** globally; **~1.6 Million paying users** (*Match Group FY24 10-K*).
  * **India**: India is Hinge's **2nd largest country globally by downloads** (*Sensor Tower*).
* **Indian Homegrown Apps (Official Company Milestones)**:
  * **QuackQuack**: **30 Million+ registered Indian users** across Tier-1/2/3 cities.
  * **Aisle**: **15 Million+ registered users** across India and the Indian diaspora.
  * **TrulyMadly**: **12 Million+ registered users** in India.

---

## Slide 26: How They Got Popular (Their Uniqueness & Growth Strategies)
* **Tinder — "Gamification of Dating"**:
  * Invented the **double opt-in swipe mechanic** in 2012. Grew via **college campus ambassadors** and house parties where entry required downloading Tinder.
* **Bumble — "Feminist Positioning & Safety"**:
  * Differentiated with **"Women Make the First Move"** (24-hour timer). Localized heavily in India using **Priyanka Chopra** as an investor and brand ambassador to normalize dating for Indian women.
* **Hinge — "Anti-Swipe Positioning"**:
  * Rebranded with the viral slogan **"Designed to be Deleted"**, replacing photo-only swiping with **3 mandatory personality/voice prompts**.
* **Aisle & TrulyMadly — "Cultural & Language Localization"**:
  * Positioned as the **"Middle Ground between Casual Tinder and Parent-Led Shaadi.com"** and launched mother-tongue dating apps (*Arike* for Malayalis, *Anbe* for Tamils) to win Tier-2 India.

---

## Slide 27: What Mistakes They Did
1. **Over-Monetizing Basic Connection (Paywall Fatigue)**:
   * Locking basic visibility behind ₹1,000+/month tiers, super-likes, and boosts caused **paying users at Tinder and Bumble to decline or plateau in 2024**, leading to a >60% drop in stock valuation from peak levels.
2. **Optimizing for Addiction Instead of Offline Dates**:
   * Every match that successfully marries means the swipe app loses two paying customers—creating a perverse incentive to keep users swiping rather than meeting offline.
3. **Ignoring the Emotional State of Users**:
   * Allowing unhealed, heartbroken users to flood the dating pool causes rampant **ghosting, breadcrumbing, and emotional unavailability**.
4. **Weak Identity Verification**:
   * Relying only on optional selfie checks allowed married individuals, scammers, and fake profiles to erode trust—especially among Indian women.

---

## Slide 28: How We Can Do (JabWeMeet's Winning Strategy)
1. **Solve the "Before, During, and After" of Relationships**:
   * **Before Dating**: Heal with a **Breakup Buddy** (30 mins free active voice/chat).
   * **During Dating**: Meet organically at **Curated Offline Events** or get matched by a **Human Relationship Manager**.
   * **The First Date**: Skip endless texting—attend a **verified Blind Date at a Partner Cafe**.
2. **Hyper-Local Cafe & Campus Partnerships**:
   * Partner with popular local cafes across Indian cities (using our built-in `/cafe/dashboard`) where cafes get guaranteed footfall and JabWeMeet users get safe, discounted blind-date tables.
3. **Trust-First Community**:
   * Strict KYC verification (`govIdProof`, `addressProof`, `eduCertificate`, `workExperience`) before high-trust matchmaking interactions.

---

## Slide 29: What People Are Looking For? What's Lacking in the Market?
* **What Singles Are Desperately Looking For**:
  * **Real Face-to-Face Chemistry**: A safe, low-pressure way to meet someone in person for 45 minutes over coffee rather than texting for 3 weeks and getting ghosted.
  * **Human Accountability**: Someone (a Relationship Manager) who actually vets both profiles and follows up after the date.
  * **Judgment-Free Emotional Venting**: A real human voice to talk to during lonely post-breakup nights without clinical therapy stigma.
* **What Was Lacking Until JabWeMeet**:
  * No platform combined **emotional recovery (Breakup Buddy)** + **human matchmaking** + **automated blind-date cafe reservations** + **offline singles events** under one roof.

---

## Slide 30: How We Provide the Complete Solution
* **Problem**: Endless Swiping $\rightarrow$ **JabWeMeet Solution**: Dedicated **Relationship Managers** backed by Gemini AI compatibility analysis.
* **Problem**: Ghosting Before Meeting $\rightarrow$ **JabWeMeet Solution**: **Dual-Approval Blind Date Engine** (`BothApproved` $\rightarrow$ `DateFixed`) that locks in a real date, time, and cafe venue.
* **Problem**: Heartbreak & Rebound Burnout $\rightarrow$ **JabWeMeet Solution**: **Breakup Buddy Portal** with WebRTC two-way voice calls, live chat, and a **30-minute mutual-presence free trial**.
* **Problem**: Unsafe First Dates $\rightarrow$ **JabWeMeet Solution**: **Multi-Document KYC Verification** + **Verified Partner Cafes** + **Post-Date Feedback (`DateFeedback`)**.
* **Problem**: Lonely Digital Isolation $\rightarrow$ **JabWeMeet Solution**: **Offline Curated Mixers** with QR-code ticketing and automated 24-hour reminders.

---

## Slide 31: Project Execution Plan (Phased Roadmap)
* **Phase 1: Core Platform & Architecture (Completed)**:
  * PostgreSQL + Prisma 26-model database design, JWT + RBAC authentication, and KYC document upload pipeline.
* **Phase 2: Multi-Role Dashboards & Real-Time Engine (Completed)**:
  * Built all 6 portals (`User`, `Matchmaker`, `Breakup Buddy`, `Host`, `Cafe`, `Admin`).
  * Implemented Socket.IO real-time messaging, single-trigger presence notifications, and two-way WebRTC voice calls with the 30-minute active-overlap timer.
* **Phase 3: Payments, Geolocation & AI Integration (Completed)**:
  * Integrated Razorpay checkout, 95/5 commission splits, OpenStreetMap 38-city cafe discovery, Gemini AI match analysis, and dynamic homepage metrics.
* **Phase 4: Pilot Launch & Local Market Rollout (Next 1–3 Months)**:
  * Onboard initial cohort of 20 Partner Cafes, 15 Relationship Managers, 25 Breakup Buddies, and launch offline weekend mixers in Tier-1/Tier-2 pilot cities.
* **Phase 5: Scale & Mobile App Expansion (Months 4–12)**:
  * Launch iOS/Android mobile apps, automated DigiLocker KYC, and expand across all 38+ supported Indian cities.

---

## Slide 32: Team Needed for the Project
* **1. Technical & Engineering Team (3–4 Members)**:
  * **1 Full-Stack Lead Developer**: Next.js 16, Express 5, Prisma ORM, PostgreSQL architecture.
  * **1 Real-Time & Media Engineer**: WebRTC voice/video pipelines, Socket.IO scaling, Redis queues.
  * **1 UI/UX & Frontend Developer**: Responsive dashboards, Tailwind CSS v4, mobile-first optimization.
  * **1 QA & DevOps Engineer**: Automated testing, cloud deployment (AWS/Vercel/Render), security audits.
* **2. Operations & Community Team (4–5 Members)**:
  * **1 KYC & Trust Safety Officer**: Verifying user/partner documents (`Admin` portal).
  * **2 Lead Relationship Managers & Buddy Coordinators**: Onboarding and training Matchmakers and Breakup Buddies.
  * **1 Cafe & Event Partnerships Manager**: Onboarding local Partner Cafes and Event Hosts.
  * **1 Digital Marketing & Community Growth Lead**: Social media reels, campus/corporate mixer marketing.

---

## Slide 33: Commercialization & Revenue Model (How We Make Money)
JabWeMeet operates a **5-Stream Diversified Revenue Model** (already built into the codebase):

1. **Relationship Manager Subscriptions (High-Margin Recurring Revenue)**:
   * Tiered monthly plans paid by singles via Razorpay: **₹2,999/mo** (*Starter Connect*), **₹4,999/mo** (*Connect Pro*), **₹8,999/mo** (*Premium Harmony*), and **₹14,999/mo** (*Elite Concierge*).
2. **Breakup Buddy Healing Passes (Freemium-to-Paid Conversion + Commission)**:
   * Users get **30 minutes free** (driving high top-of-funnel acquisition) and convert to paid passes (**₹799**, **₹1,999**, **₹3,499**, **₹5,999**).
   * Platform automatically retains a **5% platform fee (`platformFee`)** while **95% (`buddyPayout`)** rewards the Breakup Buddy (`backend/routes/subscription.js`).
3. **Event Host SaaS Subscriptions (B2B Recurring Revenue)**:
   * Event organizers pay **₹999** (*Basic*), **₹2,499** (*Pro*), or **₹4,999** (*Unlimited*) to publish and manage events on the platform (`HostSubscription`).
4. **Offline Event Ticket Sales (`EventBooking`)**:
   * Direct ticket revenue and booking fees from singles attending curated offline mixers, speed-dating nights, and workshops.
5. **Partner Cafe Reservations & Pre-Orders (`CafeReservation` & `CafeOrder`)**:
   * Sponsored cafe visibility for Blind Date venue selection, table reservation fees, and curated date-night dining packages.
