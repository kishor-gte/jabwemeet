# JabWeMeet (SimpleDate) — Platform Architecture & Technical Report

**Document Version:** 1.0.0  
**Date:** September 18, 2026  
**Repository / Workspace:** `kishor-gte/jabwemeet` (`simpledate`)

---

## Executive Summary

**JabWeMeet** is a hybrid relationship and social connection platform engineered to bridge digital matchmaking with real-world curated experiences and emotional wellness support. 

Unlike traditional swipe-based dating applications, JabWeMeet addresses the complete lifecycle of modern relationships through three distinct pillars:
1. **Curated In-Person Experiences:** Speed dating, blind dinners, singles mixers, salsa dance socials, and travel retreats.
2. **AI-Assisted Relationship Management:** Verified human Matchmakers (Relationship Managers) augmented with Google Gemini 2.5 Flash for multi-factor compatibility evaluation.
3. **Emotional Support Ecosystem ("Breakup Buddy"):** Compassionate 1-on-1 mentorship, timed chat rooms, and peer-to-peer WebRTC voice calls for individuals navigating heartbreak and recovery.
4. **Enterprise Administration:** Full governance with safety reporting, document verification, finance handling (payments, refunds, invoicing), and append-only audit logging.

---

## 1. System Architecture & Tech Stack

```
+-----------------------------------------------------------------------+
|                            Client Layer                               |
|          Next.js 16 (React 19) + Tailwind CSS v4 + Lucide             |
|          WebRTC & Socket.io Client (Real-Time Audio Signaling)        |
+-----------------------------------------------------------------------+
                                   |
                  (Next.js Proxy Rewrites /api/*)
                                   v
+-----------------------------------------------------------------------+
|                            Backend Layer                              |
|           Node.js & Express 5.2.1 REST API (Port 5001)                |
|           JWT Authentication with HTTP-Only Cookies & Bcrypt          |
|           Socket.io Server (Signaling, Rooms & Call Timers)           |
|           Google GenAI SDK (Gemini 2.5 Flash AI Engine)               |
+-----------------------------------------------------------------------+
                                   |
                                   v
+-----------------------------------------------------------------------+
|                        Data & Storage Layer                           |
|           Prisma ORM 7.10.0 + PostgreSQL Database (:5000)             |
|           Dynamic Schema Extensions (adminInit.js)                    |
|           Local File Uploads Storage (Multer /uploads)                |
+-----------------------------------------------------------------------+
```

### Technology Breakdown

| Component | Technology | Version | Purpose |
| :--- | :--- | :--- | :--- |
| **Frontend Framework** | Next.js (App Router) | 16.3.5 | Server-side rendering, routing, client layouts |
| **UI Library** | React & React DOM | 19.2.8 | Interactive reactive UI components |
| **Styling** | Tailwind CSS & PostCSS | 4.x | Design system, responsive modern styling |
| **Icons** | Lucide React | 1.46.0 | System iconography |
| **Real-Time Client** | Socket.io Client | 4.8.3 | WebRTC audio signaling & call negotiation |
| **Backend Framework** | Node.js / Express | 5.2.1 | REST API server & routing |
| **Real-Time Server** | Socket.io | 4.8.3 | Real-time signaling, room management, call timers |
| **Database ORM** | Prisma ORM | 7.10.0 | Schema definition, migrations, type-safe queries |
| **Database Engine** | PostgreSQL | 8.23.0 (pg adapter) | Relational database (Port 5000) |
| **AI Intelligence** | Google GenAI SDK | 2.23.0 | Candidate compatibility scoring (Gemini 2.5 Flash) |
| **Authentication** | JWT & Bcryptjs | 9.0.3 / 3.0.3 | HTTP-only cookie JWT tokens & salted hashing |
| **File Storage** | Multer | 2.4.0 | Verification document & profile image uploads |

---

## 2. Multi-Role Ecosystem & User Portals

The platform supports 5 specialized operational roles with strict access controls:

| Role | Access Route | Description & Responsibilities |
| :--- | :--- | :--- |
| **USER** | `/dashboard` | Member portal: Browse events, manage connections, hire Relationship Managers, book Breakup Buddy sessions, update profile questionnaires. |
| **MATCHMAKER** | `/matchmaker/dashboard` | Certified matchmaking professionals: Review assigned clients, generate AI-powered candidate recommendations via Gemini, schedule meetings, chat. |
| **BREAKUP_BUDDY** | `/breakup-buddy/dashboard` | Emotional support mentors: Handle user requests, participate in real-time timed chat & WebRTC voice calls, track sessions & earnings. |
| **HOST** | `/host/dashboard` | Event organizers: Create, publish, and manage ticketed singles events, mixers, blind dates, and travel retreats. |
| **ADMIN** | `/admin` | Platform oversight: KPI analytics, safety moderation, identity verifications, user & staff management, refunds, coupons, service packages, and immutable audit logs. |

---

## 3. Database Schema & Data Models

### Core Prisma Models
* **`User`**: Base profile storing credentials, demographics, intent, verification state, and role-specific polymorphic attributes (e.g. Breakup Buddy languages/expertise, Matchmaker document links).
* **`Event`**: Offline gathering details (category, pricing, capacity, age range, location, itinerary).
* **`MatchmakingRequest`**: Member submissions requesting professional matchmaker assistance.
* **`MatchSuggestion`**: Curated pair suggestions created by matchmakers with status tracking for both client and suggested candidate.
* **`Appointment`**: Scheduled consultations between clients and matchmakers.
* **`Conversation` & `Message`**: Matchmaker-client messaging thread.
* **`BuddyRequest`**: 1-on-1 emotional recovery connection holding session limits (`chatLimitSeconds`, `voiceCallSeconds`, `voiceCallLimitSeconds`).
* **`BuddyMessage`**: Messages exchanged within a buddy session.
* **`BuddyPresence`**: Real-time heartbeat tracking for buddy and user presence.
* **`BuddySession`**: Scheduled formal coaching calls with duration and earnings calculations.
* **`BuddyReview`**: Rating and feedback left by members for buddies.

### Dynamic Admin Schema Extensions (`backend/db/adminInit.js`)
* **`EventRegistration`**: Ticket codes, check-in status, and attendee payment references.
* **`Payment`**: Financial records tracking payment gateway status, amounts, and references.
* **`Refund`**: Payment refund requests, reason codes, processing notes, and staff attribution.
* **`Invoice`**: Tax calculations, serial invoice numbers, and billing records.
* **`ServicePackage`**: Tiered offerings for Matchmaking and Buddy services (session limits, call quotas).
* **`Subscription`**: Active member package subscriptions and auto-renewal states.
* **`Report`**: Safety reports categorizing user misconduct or event incidents.
* **`SupportTicket`**: Multi-message ticketing system with priority categorization and staff assignments.
* **`Coupon`**: Promotional discount codes (percentage/flat, usage limits, validity periods).
* **`AuditLog`**: Append-only security tracking recording action, target, staff identity, IP, and diff snapshots.

---

## 4. API Endpoints & Real-Time Specifications

### Authentication & Profiles (`/api/auth`)
* `GET /api/auth/check-email`: Debounced real-time email uniqueness check.
* `POST /api/auth/register`: Form registration supporting multi-file uploads (Gov ID, address proof, certificates).
* `POST /api/auth/login`: Credential validation with rate limiting (5 attempts / 15 mins) and JWT cookie generation.
* `GET /api/auth/me`: Current session inspection.
* `POST /api/auth/logout`: Clears authentication cookies.

### Matchmaking & Relationship Services (`/api/matchmaker` & `/api/services`)
* `GET /api/matchmaker/dashboard`: Returns client roster, pending requests, and upcoming appointments.
* `POST /api/matchmaker/ai-suggest-matches`: Invokes **Gemini 2.5 Flash** with candidate vectors to generate ranked recommendations.
* `POST /api/services/matchmaking-requests`: Submits request to hire a Relationship Manager.
* `POST /api/services/matchmaker/suggestions`: Matchmaker sends match introduction to a client.

### Breakup Buddy Services (`/api/buddy` & `/api/services`)
* `GET /api/services/breakup-buddies`: Public directory of approved emotional mentors.
* `POST /api/services/buddy-requests`: User books an initial conversation with a buddy.
* `GET /api/services/buddy-chat/:requestId`: Retrieves messages, remaining chat seconds, and call limits.
* `POST /api/services/buddy-chat/:requestId/messages`: Posts message in a buddy session.

### Real-Time WebSockets & WebRTC Signaling (Port 5001)
* `join-buddy-room`: Subscribes a buddy to incoming call alerts.
* `join-request-room`: Subscribes participants to session-specific signaling.
* `initiate-call`: Triggers an incoming voice call to the designated buddy.
* `accept-call`: Confirms call and starts a server-side 5-second interval timer updating `voiceCallSeconds` in PostgreSQL. Automatically emits `call-ended` when limit is reached.
* `webrtc-offer` / `webrtc-answer` / `ice-candidate`: Exchanges peer-to-peer WebRTC session descriptions and ICE network candidates.

---

## 5. Seed Credentials & Testing Accounts

| Role | Email | Password | Primary Portal Route |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@jabweemeet.com` | `JabWeMeet@2026` | `/admin` |
| **Member (User)** | `rohan@jabweemeet.com` | `JabWeMeet@2026` | `/dashboard` |
| **Matchmaker** | `matchmaker@jabweemeet.com` | `Matchmaker123!` | `/matchmaker/dashboard` |
| **Breakup Buddy** | `buddy@jabweemeet.com` | `JabWeMeet@2026` | `/breakup-buddy/dashboard` |
| **Event Host** | `host@jabweemeet.com` | `JabWeMeet@2026` | `/host/dashboard` |

---

## 6. Execution & Deployment Instructions

### Prerequisites
* **Node.js**: v18+ or v20+
* **PostgreSQL**: Running on port `5000` with database `simpledate` (or configured via `DATABASE_URL`).

### Starting the Application
```bash
# 1. Setup Backend
cd backend
npm install
npx prisma generate
node seed.js
npm run dev

# 2. Setup Frontend (in separate terminal)
cd frontend
npm install
npm run dev
```

* Frontend: `http://localhost:3000`
* Backend: `http://localhost:5001`
