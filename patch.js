const fs = require("fs");
let content = fs.readFileSync("backend/routes/services.js", "utf8");

const reviewCode = "\n// 13. POST /api/services/buddy-review\n" +
"// Submit a review for a Breakup Buddy\n" +
"router.post(\"/buddy-review\", authenticateToken, async (req, res) => {\n" +
"  try {\n" +
"    const userId = req.user.userId;\n" +
"    const { buddyId, rating, comment } = req.body;\n" +
"\n" +
"    if (!buddyId || !rating) {\n" +
"      return res.status(400).json({ success: false, message: \"Buddy ID and rating are required.\" });\n" +
"    }\n" +
"\n" +
"    const review = await prisma.buddyReview.create({\n" +
"      data: {\n" +
"        userId,\n" +
"        buddyId,\n" +
"        rating: parseInt(rating),\n" +
"        comment: comment || \"\",\n" +
"      }\n" +
"    });\n" +
"\n" +
"    return res.json({ success: true, data: review });\n" +
"  } catch (error) {\n" +
"    console.error(\"Error creating buddy review:\", error);\n" +
"    return res.status(500).json({ success: false, message: \"Failed to submit review.\" });\n" +
"  }\n" +
"});\n\nmodule.exports = router;\n";

content = content.replace("module.exports = router;", reviewCode);

let startIdx = content.indexOf("router.post(\"/buddy-presence/:requestId\"");
let endIdx = content.indexOf("router.get(\"/buddy-presence/:requestId\"");

if (startIdx !== -1 && endIdx !== -1) {
    let block = content.substring(startIdx, endIdx);
    
    let upsertStart = block.indexOf("await prisma.buddyPresence.upsert({");
    let matchEnd = "increment: 5 } }\n      });\n    }";
    let upsertEnd = block.indexOf(matchEnd);
    if (upsertEnd === -1) {
        matchEnd = "increment: 5 } }\r\n      });\r\n    }";
        upsertEnd = block.indexOf(matchEnd);
    }
    
    upsertEnd += matchEnd.length;
    
    let before = block.substring(0, upsertStart);
    let after = block.substring(upsertEnd);
    
    let newStr = "const oldPresence = await prisma.buddyPresence.findUnique({\n" +
"      where: { requestId_role: { requestId, role: \"USER\" } }\n" +
"    });\n\n" +
"    await prisma.buddyPresence.upsert({\n" +
"      where: { requestId_role: { requestId, role: \"USER\" } },\n" +
"      update: { lastSeen: new Date() },\n" +
"      create: { requestId, role: \"USER\", lastSeen: new Date() },\n" +
"    });\n\n" +
"    const buddyPresence = await prisma.buddyPresence.findUnique({\n" +
"      where: { requestId_role: { requestId, role: \"BUDDY\" } },\n" +
"    });\n" +
"    const threshold = new Date(Date.now() - 15000);\n" +
"    const buddyActive = buddyPresence && buddyPresence.lastSeen > threshold;\n\n" +
"    if (buddyActive && request.timeUsedSeconds < request.chatLimitSeconds) {\n" +
"      request = await prisma.buddyRequest.update({\n" +
"        where: { id: requestId },\n" +
"        data: { timeUsedSeconds: { increment: 5 } }\n" +
"      });\n" +
"    }\n\n" +
"    const twoMinsAgo = new Date(Date.now() - 120000);\n" +
"    const userJustEntered = !oldPresence || oldPresence.lastSeen < twoMinsAgo;\n\n" +
"    if (userJustEntered) {\n" +
"      const io = req.app.get(\"io\");\n" +
"      if (io && request.buddyId) {\n" +
"        const user = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } });\n" +
"        const uName = user ? user.name : \"User\";\n" +
"        io.to(\"buddy-\" + request.buddyId).emit(\"user-entered-chat\", {\n" +
"          requestId,\n" +
"          userId,\n" +
"          userName: uName,\n" +
"          message: \"Hey, your user \" + uName + \" is in chat! Go and talk with them.\"\n" +
"        });\n" +
"      }\n" +
"    }";
    
    let finalBlock = before + newStr + after;
    content = content.substring(0, startIdx) + finalBlock + content.substring(endIdx);
    fs.writeFileSync("backend/routes/services.js", content);
    console.log("Successfully patched file!");
} else {
    console.log("Failed to find blocks");
}
