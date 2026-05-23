const {
default: makeWASocket,
useMultiFileAuthState,
fetchLatestBaileysVersion,
downloadContentFromMessage
} = require("@whiskeysockets/baileys")

const qrcode = require("qrcode-terminal")
const P = require("pino")
const fs = require("fs")
const axios = require("axios")
const yts = require("yt-search")
const ytdl = require("ytdl-core")

console.log("🌿 INICIANDO HOJITAS BOT...")

async function startBot() {

const { state, saveCreds } =
await useMultiFileAuthState("session")

const { version } =
await fetchLatestBaileysVersion()

const sock = makeWASocket({
version,
logger: P({ level: "silent" }),
auth: state
})

// CONEXIÓN
sock.ev.on("connection.update", async ({ connection, qr }) => {

if (qr) {
console.log("📱 ESCANEA EL QR")

qrcode.generate(qr, {
small: true
})
}

if (connection === "open") {
console.log("✅ BOT CONECTADO")
}

if (connection === "close") {
console.log("🔄 RECONECTANDO...")
startBot()
}

})

sock.ev.on("creds.update", saveCreds)

// MENSAJES
sock.ev.on("messages.upsert", async ({ messages }) => {

try {

const msg = messages[0]

if (!msg.message) return

const from = msg.key.remoteJid

const text =
msg.message.conversation ||
msg.message.extendedTextMessage?.text ||
""

const isGroup = from.endsWith("@g.us")

const metadata = isGroup
? await sock.groupMetadata(from)
: null

const participants = isGroup
? metadata.participants
: []

const sender = isGroup
? participants.find(
p => p.id === msg.key.participant
)
: null

const isAdmin = sender?.admin

const quoted =
msg.message.extendedTextMessage?.contextInfo?.quotedMessage

const mentionedJid =
msg.message.extendedTextMessage?.contextInfo?.mentionedJid || []

// SOLO ADMINS
function onlyAdmins() {
if (!isGroup) {
sock.sendMessage(from, {
text: "❌ Solo grupos"
})
return false
}

if (!isAdmin) {
sock.sendMessage(from, {
text: "❌ Solo admins"
})
return false
}

return true
}

// MENU
if (text === "/menu") {

const menu = `
╭━〔 🌿 HOJITAS BOT 🌿 〕━⬣
┃
┃ 👑 OWNER: Samuel
┃ ⚡ BOT: Activo 24/7
┃
┣━━〔 👥 GRUPOS 〕━━⬣
┃ ➜ /todos
┃ ➜ /admins
┃ ➜ /hidetag
┃ ➜ /kick
┃ ➜ /kickall
┃ ➜ /grupo abrir
┃ ➜ /grupo cerrar
┃
┣━━〔 🎵 DESCARGAS 〕━━⬣
┃ ➜ /play nombre
┃ ➜ /mp3 link
┃ ➜ /mp4 link
┃ ➜ /tiktok link
┃
┣━━〔 🖼️ STICKERS 〕━━⬣
┃ ➜ /sticker
┃ ➜ /toimg
┃
┣━━〔 ℹ️ INFO 〕━━⬣
┃ ➜ /info
┃ ➜ /tag
┃
╰━━━━━━━━━━━━━━⬣
`

await sock.sendMessage(from, {
image: {
url: "https://i.postimg.cc/28jSyjpS/Whats-App-Image-2026-05-23-at-7-08-40-AM.jpg"
},
caption: menu
})
}

// INFO
if (text === "/info") {

await sock.sendMessage(from, {
text: "🌿 Hojitas Bot\n👑 Owner: Samuel\n⚡ Estado: Online"
})
}

// TODOS
if (text === "/todos") {

if (!onlyAdmins()) return

const users = participants.map(p => p.id)

await sock.sendMessage(from, {
text: "📢 @everyone",
mentions: users
})
}

// ADMINS
if (text === "/admins") {

if (!onlyAdmins()) return

const admins = participants
.filter(p => p.admin)
.map(p => p.id)

await sock.sendMessage(from, {
text: "👑 Llamando admins",
mentions: admins
})
}

// HIDETAG
if (text.startsWith("/hidetag ")) {

if (!onlyAdmins()) return

const users = participants.map(p => p.id)

const mensaje = text.replace("/hidetag ", "")

await sock.sendMessage(from, {
text: mensaje,
mentions: users
})
}

// TAG
if (text.startsWith("/tag ")) {

if (!onlyAdmins()) return

if (mentionedJid.length < 1) {
return sock.sendMessage(from, {
text: "⚠️ Etiqueta a alguien"
})
}

const mensaje = text.split(" ").slice(2).join(" ")

await sock.sendMessage(from, {
text: mensaje || "📢",
mentions: mentionedJid
})
}

// KICK
if (text.startsWith("/kick")) {

if (!onlyAdmins()) return

if (mentionedJid.length < 1) {
return sock.sendMessage(from, {
text: "⚠️ Etiqueta a alguien"
})
}

await sock.groupParticipantsUpdate(
from,
[mentionedJid[0]],
"remove"
)

await sock.sendMessage(from, {
text: "✅ Usuario eliminado"
})
}

// KICKALL
if (text === "/kickall") {

if (!onlyAdmins()) return

await sock.sendMessage(from, {
text: "⚠️ Iniciando kickall..."
})

for (let user of participants) {

if (
user.id !== sock.user.id &&
user.admin == null
) {

try {

await sock.groupParticipantsUpdate(
from,
[user.id],
"remove"
)

await new Promise(resolve =>
setTimeout(resolve, 3000)
)

} catch (err) {
console.log(err)
}

}

}

await sock.sendMessage(from, {
text: "✅ Kickall completado"
})
}

// ABRIR GRUPO
if (text === "/grupo abrir") {

if (!onlyAdmins()) return

await sock.groupSettingUpdate(
from,
"not_announcement"
)

await sock.sendMessage(from, {
text: "✅ Grupo abierto"
})
}

// CERRAR GRUPO
if (text === "/grupo cerrar") {

if (!onlyAdmins()) return

await sock.groupSettingUpdate(
from,
"announcement"
)

await sock.sendMessage(from, {
text: "🔒 Grupo cerrado"
})
}

// PLAY
if (text.startsWith("/play ")) {

const query = text.replace("/play ", "")

if (!query) {
return sock.sendMessage(from, {
text: "⚠️ Escribe el nombre"
})
}

const search = await yts(query)
const video = search.videos[0]

if (!video) {
return sock.sendMessage(from, {
text: "❌ No encontrado"
})
}

await sock.sendMessage(from, {
image: { url: video.thumbnail },
caption:
`🎵 ${video.title}\n\n🔗 ${video.url}`
})
}

// MP3
if (text.startsWith("/mp3 ")) {

const url = text.replace("/mp3 ", "")

if (!ytdl.validateURL(url)) {
return sock.sendMessage(from, {
text: "❌ Link inválido"
})
}

await sock.sendMessage(from, {
text: "⏳ Descargando audio..."
})

const info = await ytdl.getInfo(url)
const title = info.videoDetails.title

const stream = ytdl(url, {
filter: "audioonly"
})

const path = "audio.mp3"
const write = fs.createWriteStream(path)

stream.pipe(write)

write.on("finish", async () => {

await sock.sendMessage(from, {
audio: fs.readFileSync(path),
mimetype: "audio/mp4",
ptt: false
})

fs.unlinkSync(path)

})
}

// MP4
if (text.startsWith("/mp4 ")) {

const url = text.replace("/mp4 ", "")

if (!ytdl.validateURL(url)) {
return sock.sendMessage(from, {
text: "❌ Link inválido"
})
}

await sock.sendMessage(from, {
text: "⏳ Descargando video..."
})

const stream = ytdl(url)

const path = "video.mp4"
const write = fs.createWriteStream(path)

stream.pipe(write)

write.on("finish", async () => {

await sock.sendMessage(from, {
video: fs.readFileSync(path),
caption: "✅ Aquí tienes"
})

fs.unlinkSync(path)

})
}

// TIKTOK
if (text.startsWith("/tiktok ")) {

const link = text.replace("/tiktok ", "")

try {

const api = await axios.get(
`https://www.tikwm.com/api/?url=${link}`
)

const video = api.data.data.play

await sock.sendMessage(from, {
video: {
url: video
},
caption: "✅ TikTok descargado"
})

} catch {

await sock.sendMessage(from, {
text: "❌ Error descargando TikTok"
})

}
}

// STICKER
if (text === "/sticker") {

if (!quoted) {
return sock.sendMessage(from, {
text: "⚠️ Responde una imagen"
})
}

const type = Object.keys(quoted)[0]

if (type !== "imageMessage") {
return sock.sendMessage(from, {
text: "⚠️ Responde una imagen"
})
}

const stream = await downloadContentFromMessage(
quoted.imageMessage,
"image"
)

let buffer = Buffer.from([])

for await (const chunk of stream) {
buffer = Buffer.concat([buffer, chunk])
}

await sock.sendMessage(from, {
sticker: buffer
})
}

// TOIMG
if (text === "/toimg") {

if (!quoted) {
return sock.sendMessage(from, {
text: "⚠️ Responde un sticker"
})
}

const type = Object.keys(quoted)[0]

if (type !== "stickerMessage") {
return sock.sendMessage(from, {
text: "⚠️ Responde un sticker"
})
}

const stream = await downloadContentFromMessage(
quoted.stickerMessage,
"sticker"
)

let buffer = Buffer.from([])

for await (const chunk of stream) {
buffer = Buffer.concat([buffer, chunk])
}

await sock.sendMessage(from, {
image: buffer,
caption: "✅ Sticker convertido"
})
}

} catch (err) {
console.log(err)
}

})

}

startBot()