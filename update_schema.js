const fs = require('fs');
let schema = fs.readFileSync('backend/prisma/schema.prisma', 'utf8');

// Insert User relations
const userRelations = \
  // Breakup Buddy Relations
  buddyRequestsSent      BuddyRequest[]  @relation("BuddyRequestsUser")
  buddyRequestsReceived  BuddyRequest[]  @relation("BuddyRequestsBuddy")
  buddySessionsAsUser    BuddySession[]  @relation("BuddySessionsUser")
  buddySessionsAsBuddy   BuddySession[]  @relation("BuddySessionsBuddy")
  buddyReviewsGiven      BuddyReview[]   @relation("BuddyReviewsUser")
  buddyReviewsReceived   BuddyReview[]   @relation("BuddyReviewsBuddy")
\;

schema = schema.replace('  sentMessages         Message[]', '  sentMessages         Message[]\n' + userRelations);

// Insert new models at the end
const models = \
model BuddyRequest {
  id               String   @id @default(cuid())
  userId           String
  user             User     @relation("BuddyRequestsUser", fields: [userId], references: [id])
  buddyId          String
  buddy            User     @relation("BuddyRequestsBuddy", fields: [buddyId], references: [id])
  topic            String?
  sessionType      String?  
  status           String   @default("Pending") 
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt
}

model BuddySession {
  id               String   @id @default(cuid())
  userId           String
  user             User     @relation("BuddySessionsUser", fields: [userId], references: [id])
  buddyId          String
  buddy            User     @relation("BuddySessionsBuddy", fields: [buddyId], references: [id])
  scheduledAt      DateTime
  durationMinutes  Int      @default(30)
  sessionType      String
  status           String   @default("Scheduled") 
  amountEarned     Float    @default(0.0)
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt
}

model BuddyReview {
  id               String   @id @default(cuid())
  userId           String
  user             User     @relation("BuddyReviewsUser", fields: [userId], references: [id])
  buddyId          String
  buddy            User     @relation("BuddyReviewsBuddy", fields: [buddyId], references: [id])
  rating           Int
  comment          String?
  createdAt        DateTime @default(now())
}
\;

schema = schema + '\n' + models;
fs.writeFileSync('backend/prisma/schema.prisma', schema, 'utf8');
