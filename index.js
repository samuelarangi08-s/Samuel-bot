const msg = messages[0]

if (!msg.message) return

const from = msg.key.remoteJid

const text =
msg.message.conversation ||
msg.message.extendedTextMessage?.text ||
""

// MENU
if (text === "/menu") {

const menu = `
╭━━━〔 🍃 HOJITAS BOT 🍃 )

👑 OWNER: Samuel

╭─⬣ COMANDOS
│ ➜ /menu
│ ➜ /todos
│ ➜ /kick
│ ➜ /kickall
│ ➜ /tag
│ ➜ /tiktok
│ ➜ /play
│ ➜ /mp3
│ ➜ /mp4
│ ➜ /toimg
╰────────────⬣

⚡ Bot activo 24/7
`

await sock.sendMessage(from, {
image: {
url: "https://i.postimg.cc/28jSyjpS/Whats-App-Image-2026-05-23-at-7-08-40-AM.jpg"
},
caption: menu
})
}


// TODOS
if (text === "/todos") {

if (!from.endsWith("@g.us")) {
return sock.sendMessage(from, {
text: "❌ Solo funciona en grupos"
})
}

const metadata = await sock.groupMetadata(from)

const users = metadata.participants.map(p => p.id)

await sock.sendMessage(from, {
text: "📢 @everyone",
mentions: users
})
}

// KICK
if (text.startsWith("/kick")) {

if (!from.endsWith("@g.us")) return

const mentioned =
msg.message.extendedTextMessage?.contextInfo?.mentionedJid

if (!mentioned) {
return sock.sendMessage(from, {
text: "❌ Etiqueta a alguien"
})
}

await sock.groupParticipantsUpdate(
from,
[mentioned[0]],
"remove"
)

await sock.sendMessage(from, {
text: "✅ Usuario eliminado"
})
}

// KICKALL
if (text === "/kickall") {

if (!from.endsWith("@g.us")) {
return sock.sendMessage(from, {
text: "❌ Solo funciona en grupos"
})
}

const metadata = await sock.groupMetadata(from)

const participants = metadata.participants

for (let user of participants) {

if (
user.id !== sock.user.id &&
user.admin == null
) {

await sock.groupParticipantsUpdate(
from,
[user.id],
"remove"
)
}
}

await sock.sendMessage(from, {
text: "⚠️ Kickall ejecutado"
})
}

// TAG
if (text.startsWith("/tag")) {

const mentioned =
msg.message.extendedTextMessage?.contextInfo?.mentionedJid

if (!mentioned) {
return sock.sendMessage(from, {
text: "❌ Etiqueta a alguien"
})
}

await sock.sendMessage(from, {
text: `👋 Hola @${mentioned[0].split("@")[0]}`,
mentions: mentioned
})
}

// TIKTOK
if (text.startsWith("/tiktok ")) {

const url = text.split(" ")[1]

try {

const api = await axios.get(
`https://api.tiklydown.eu.org/api/download?url=${url}`
)

const video = api.data.video.noWatermark

await sock.sendMessage(from, {
video: { url: video },
caption: "✅ TikTok descargado"
})

} catch {
await sock.sendMessage(from, {
text: "❌ Error descargando TikTok"
})
}
}

// PLAY
if (text.startsWith("/play ")) {

const query = text.replace("/play ", "")

const search = await yts(query)

const video = search.videos[0]

await sock.sendMessage(from, {
text:
`🎵 ${video.title}

${video.url}`
})
}

// MP3
if (text.startsWith("/mp3 ")) {

const query = text.replace("/mp3 ", "")

const search = await yts(query)

const video = search.videos[0]

const stream = ytdl(video.url, {
filter: "audioonly"
})

const path = "./audio.mp3"

ffmpeg(stream)
.audioBitrate(128)
.save(path)
.on("end", async () => {

await sock.sendMessage(from, {
audio: fs.readFileSync(path),
mimetype: "audio/mp4"
})

fs.unlinkSync(path)

})
}

// MP4
if (text.startsWith("/mp4 ")) {

const query = text.replace("/mp4 ", "")

const search = await yts(query)

const video = search.videos[0]

await sock.sendMessage(from, {
video: { url: video.url },
caption: video.title
})
}

// TOIMG
if (text === "/toimg") {

const quoted =
msg.message.extendedTextMessage?.contextInfo?.quotedMessage

if (!quoted?.stickerMessage) {
return sock.sendMessage(from, {
text: "❌ Responde a un sticker"
})
}

await sock.sendMessage(from, {
text: "⚠️ Función en proceso"
})
}
startBot()