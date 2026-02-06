const {
  Client,
  AttachmentBuilder,
  GatewayIntentBits,
  EmbedBuilder,
  REST,
  Routes,
  SlashCommandBuilder
} = require("discord.js")

const { createCanvas, loadImage } = require("canvas")
const Config = require("./config.json")
const fetch = require("node-fetch")

const rest = new REST({ version: "10" }).setToken(process.env.TOKEN)

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers
  ]
})

async function deployCommands() {
  await rest.put(
    Routes.applicationGuildCommands(
      process.env.CLIENT_ID,
      process.env.GUILD_ID
    ),
    { body: commands }
  )
  console.log("Commandes déployées")
}

async function sendToRoblox(action) {
  await fetch(process.env.LINK, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action,
      key: process.env.ROBLOX_SECRET
    })
  })
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

    const attachment = new AttachmentBuilder(canvas.toBuffer(), { name: "welcome.png" })

    const embed = new EmbedBuilder()
      .setColor(0x6a0dad)
      .setTitle("Ho ! Un nouveau membre !")
      .setDescription(`Bienvenue à toi ${member}`)
      .setImage("attachment://welcome.png")
      .setTimestamp()

    const channel = await client.channels.fetch(Config.channels.logs)

    channel.send({
      embeds: [embed],
      files: [attachment]
    })

  } catch (err) {
    console.error("Erreur welcome embed :", err)
  }
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
      .setDescription("Raison du warn")
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
      .setDescription("Defini si le ban est en jour, mois, heure")
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
        .setDescription("Temps du ban")
        .setRequired(true)
    )
  .toJSON(),
  
  new SlashCommandBuilder()
  .setName("unban")
  .setDescription("Permet de unban un joueur sur roblox")
  .toJSON()
]

client.on("interactionCreate", interaction => {
  if (!interaction.isChatInputCommand()) return

  if (interaction.commandName === "warn") {
    interaction.reply("Envoyer avec succé")
    sendToRoblox(":warn " + interaction.options.getString("pseudo_id") + " " + interaction.options.getString("raison"))
  }

  if (interaction.commandName === "unwarn") {
    interaction.reply("Envoyer avec succé")
    sendToRoblox(":unwarn " + interaction.options.getString("pseudo_id") + " " + interaction.options.getString("raison"))
  }

  if (interaction.commandName === "permban") {
    interaction.reply("Envoyer avec succé")
    sendToRoblox(":permban " + interaction.options.getString("pseudo_id") + " " + interaction.options.getString("raison"))
  }
})

client.login(process.env.TOKEN)

setInterval(() => {
  fetch("https://serveu-ddna.onrender.com/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "",
      key: ""
    })
  })
}, 25000)