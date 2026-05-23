const {
  default: makeWASocket,
  useMultiFileAuthState,
  fetchLatestBaileysVersion
} = require("@whiskeysockets/baileys")

const qrcode = require("qrcode-terminal")
const P = require("pino")

console.log("INICIANDO BOT...")

async function startBot() {

  const { state, saveCreds } = await useMultiFileAuthState("session")

  const { version } = await fetchLatestBaileysVersion()

  const sock = makeWASocket({
    version,
    logger: P({ level: "silent" }),
    auth: state
  })

  // CONEXIÓN
  sock.ev.on("connection.update", ({ connection, qr }) => {

    if (qr) {

      console.log("ESCANEA ESTE QR")

      qrcode.generate(qr, {
        small: true
      })
    }

    if (connection === "open") {
      console.log("BOT CONECTADO")
    }

    if (connection === "close") {
      console.log("RECONECTANDO...")
      startBot()
    }

  })

  sock.ev.on("creds.update", saveCreds)

  // MENSAJES
  sock.ev.on("messages.upsert", async ({ messages }) => {

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
╔═══〔 MENU 〕═══╗

/hola
/hora
/estado
/dueño
/todos
/kickall

╚══════════════╝
`

      await sock.sendMessage(from, {
        text: menu
      })
    }

    // HOLA
    if (text === "/hola") {

      await sock.sendMessage(from, {
        text: "👋 Hola"
      })
    }

    // HORA
    if (text === "/hora") {

      const hora = new Date().toLocaleTimeString()

      await sock.sendMessage(from, {
        text: `🕒 ${hora}`
      })
    }

    // ESTADO
    if (text === "/estado") {

      await sock.sendMessage(from, {
        text: "✅ Bot activo 24/7"
      })
    }

    // DUEÑO
    if (text === "/dueño") {

      await sock.sendMessage(from, {
        text: "👑 Samuel"
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
})
}
startBot()