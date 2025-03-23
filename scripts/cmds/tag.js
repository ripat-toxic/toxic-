const config = {
    name: "tag",
    version: "2.1",
    author: "Dipto & Updated by ♡︎ 𝐻𝐴𝑆𝐴𝑁 ♡︎",
    credits: "Dipto",
    countDown: 0,
    role: 0,
    hasPermission: 0,
    description: "Tag user by reply, mention, or name",
    category: "box chat",
    commandCategory: "tag",
    guide: "{pn} [reply/mention/name]",
    usages: "reply, mention, or search by name"
};

const onStart = async ({ api, args, event, usersData }) => {
    try {
        let ID;
        if (event.messageReply) {
            ID = event.messageReply.senderID;
        } else if (args.length > 0) {
            let searchName = args.join(" ").toLowerCase();
            let allUsers = await api.getThreadInfo(event.threadID);
            let matchedUsers = allUsers.userInfo.filter(user => 
                user.name.toLowerCase().includes(searchName)
            );

            if (matchedUsers.length === 0) {
                return api.sendMessage(`❌| can't find any user: ${searchName}`, event.threadID, event.messageID);
            }

            let mentions = matchedUsers.map(user => ({
                tag: user.name,
                id: user.id
            }));

            let mentionText = mentions.map(user => user.tag).join(", ");
            return api.sendMessage({
                body: `🔔 ${mentionText}`,
                mentions
            }, event.threadID, event.messageID);
        } else {
            ID = event.senderID;
        }

        const userName = await usersData.getName(ID);
            const text = args.join(" ") || "";
            await api.sendMessage({
                body: `${userName} ${text}`,
                mentions: [{ tag: userName, id: ID }]
            }, event.threadID, event.messageID);
        } else {
            api.sendMessage("⚠️ please reply to a message or write username!", event.threadID, event.messageID);
        }
    } catch (error) {
        console.log(error);
        api.sendMessage(`🚨 error: ${error.message}`, event.threadID, event.messageID);
    }
};

module.exports = {
    config, 
    onStart,
    run: onStart
};
