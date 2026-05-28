const {
  Client,
  AttachmentBuilder,
  GatewayIntentBits,
  EmbedBuilder,
  REST,
  Routes,
  SlashCommandBuilder
} = require("discord.js")

const { createCanvas, loadImage } = require("@napi-rs/canvas")
const Config = require("./config.json")

const rest = new REST({ version: "10" }).setToken(process.env.TOKEN)

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers
  ]
})

const commands = [
  new SlashCommandBuilder()
    .setName("warn")
    .setDescription("Permet de warn un joueur sur roblox")
    .addStringOption(opt =>
      opt.setName("pseudo_id")
        .setDescription("Pseudo ou ID du joueur")
        .setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName("raison")
        .setDescription("Raison du warn")
        .setRequired(true)
    )
    .toJSON(),

  new SlashCommandBuilder()
    .setName("unwarn")
    .setDescription("Permet de unwarn un joueur sur roblox")
    .addStringOption(opt =>
      opt.setName("pseudo_id")
        .setDescription("Pseudo ou ID du joueur")
        .setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName("raison")
        .setDescription("Raison du unwarn")
        .setRequired(true)
    )
    .toJSON(),

  new SlashCommandBuilder()
    .setName("permban")
    .setDescription("Permet de permban un joueur sur roblox")
    .addStringOption(opt =>
      opt.setName("pseudo_id")
        .setDescription("Pseudo ou ID du joueur")
        .setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName("raison")
        .setDescription("Raison du ban")
        .setRequired(true)
    )
    .toJSON(),

  new SlashCommandBuilder()
    .setName("timeban")
    .setDescription("Permet de timeban un joueur sur roblox")
    .addStringOption(opt =>
      opt.setName("pseudo_id")
        .setDescription("Pseudo ou ID du joueur")
        .setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName("raison")
        .setDescription("Raison du ban")
        .setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName("type")
        .setDescription("Définit si le ban est en heure, jour, mois ou année")
        .setRequired(true)
        .addChoices(
          { name: "Heure", value: "Heure" },
          { name: "Jour", value: "Jour" },
          { name: "Mois", value: "Mois" },
          { name: "Année", value: "Année" }
        )
    )
    .addIntegerOption(opt =>
      opt.setName("temps")
        .setDescription("Durée du ban")
        .setRequired(true)
    )
    .toJSON(),

  new SlashCommandBuilder()
    .setName("unban")
    .setDescription("Permet de unban un joueur sur roblox")
    .addStringOption(opt =>
      opt.setName("pseudo_id")
        .setDescription("Pseudo ou ID du joueur")
        .setRequired(true)
    )
    .toJSON()
]

async function deployCommands() {
  await rest.put(
    Routes.applicationCommands(process.env.CLIENT_ID),
    { body: commands }
  )
  console.log("Commandes déployées avec succès")
}

async function sendToRoblox(action) {
  try {
    await fetch(process.env.LINK, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action,
        key: process.env.ROBLOX_SECRET
      })
    })
  } catch (err) {
    console.error("Erreur lors de l'envoi à Roblox :", err)
  }
}

client.once("clientReady", async () => {
  console.log(`Bot connecté en tant que ${client.user.tag}`)
  await deployCommands()
})

client.on("guildMemberAdd", async member => {
  try {
    const canvas = createCanvas(550, 300)
    const ctx = canvas.getContext("2d")

    const background = await loadImage("./assets/banniere.png")
    ctx.drawImage(background, 0, 0, canvas.width, canvas.height)

    const avatarURL = member.user.displayAvatarURL({ extension: "png", size: 512 })
    const avatar = await loadImage(avatarURL)

    const size = 140
    const x = 40
    const y = (canvas.height - size) / 2

    ctx.save()
    ctx.beginPath()
    ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2)
    ctx.clip()
    ctx.drawImage(avatar, x, y, size, size)
    ctx.restore()

    const attachment = new AttachmentBuilder(canvas.toBuffer("image/png"), { name: "welcome.png" })

    const embed = new EmbedBuilder()
      .setColor(0x6a0dad)
      .setTitle("Ho ! Un nouveau membre !")
      .setDescription(`Bienvenue à toi ${member}`)
      .setImage("attachment://welcome.png")
      .setTimestamp()

    const channel = await client.channels.fetch(Config.channels.logs)
    await channel.send({
      embeds: [embed],
      files: [attachment]
    })

  } catch (err) {
    console.error("Erreur welcome embed :", err)
  }
})

client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return

  const pseudoId = interaction.options.getString("pseudo_id")
  const raison = interaction.options.getString("raison")

  if (interaction.commandName === "warn") {
    await interaction.reply("✅ Envoyé avec succès")
    await sendToRoblox(`:warn ${pseudoId} ${raison}`)
  }
  
  if (interaction.commandName === "unwarn") {
    await interaction.reply("✅ Envoyé avec succès")
    await sendToRoblox(`:unwarn ${pseudoId} ${raison}`)
  }

  if (interaction.commandName === "permban") {
    await interaction.reply("✅ Envoyé avec succès")
    await sendToRoblox(`:permban ${pseudoId} ${raison}`)
  }

  if (interaction.commandName === "timeban") {
    const temps = interaction.options.getInteger("temps")
    const type = interaction.options.getString("type")
    await interaction.reply("✅ Envoyé avec succès")
    await sendToRoblox(`:timeban ${pseudoId} ${temps} ${type} ${raison}`)
  }

  if (interaction.commandName === "unban") {
    await interaction.reply("✅ Envoyé avec succès")
    await sendToRoblox(`:unban ${pseudoId}`)
  }
})

client.login(process.env.TOKEN)

setInterval(() => {
  fetch("https://serveu-ddna.onrender.com/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "", key: "" })
  }).catch(err => console.error("Erreur ping Render :", err))
}, 25000)