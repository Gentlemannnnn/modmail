const fs = require("fs");

("use strict");
const { Client, GatewayIntentBits } = require("discord.js");
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
});

module.exports = ({ bot, knex, config, commands }) => {
  // Init stats
  let stats = {
    users: {},
  };

  client.on("ready", async () => {
    const guild = await client.guilds.fetch("YOUR_DISCORD_ID");
    const members = await guild.members.fetch();
    // Charge les stats déjà existante, si le fichier json n'existe pas, alors est créer

    if (fs.existsSync("stats.json")) {
      try {
        stats = JSON.parse(fs.readFileSync("stats.json", "utf8"));
      } catch (err) {
        console.error("Error while loading stats : " + err);
      }
    } else {
      // Init stats of current discord members at 0
      guild.members.cache.forEach((member) => {
        stats.users[member.id] = {
          DiscordName: member.user.username,
          DiscordId: member.user.id,
          numMessagesTicket: 0,
          numClosedTickets: 0,
          numReplies: 0,
          totalMessages: 0,
        };
      });
      // Première sauvegarde des informations
      fs.writeFileSync("stats.json", JSON.stringify(stats, null, 2), "utf8");
      setInterval(() => {
        fs.writeFile("stats.json", JSON.stringify(stats, null, 2), (err) => {
          if (err) {
            console.error("Problème pendant l'écriture du fichier " + err);
          } else {
            console.log("Fichier sauvegardé.");
          }
        });
      }, 0.3 * 60 * 1000);
    }
  });

// Ajouter un listener pour enregistrer les stats de chaque utilisateur
client.on("messageCreate", async (message) => {
  const userId = message.author.id;

  // Mettre à jour les stats de l'utilisateur
  if (!stats.users[userId]) {
    stats.users[userId] = {
      DiscordName: message.author.username,
      numMessagesTicket: 0,
      numClosedTickets: 0,
      numReplies: 0,
      totalMessages: 0,
      lastChannelId: null,
      lastChannelName : null,
    };
  }

  if (!message.content.startsWith("!")) {
    // Si le message ne commence pas par un préfixe de commande
    stats.users[userId].totalMessages++; // Incrémenter le compteur de messages total

    // Vérifier si l'utilisateur a envoyé un message dans un nouveau canal
    const lastChannelId = stats.users[userId].lastChannelId;
    if (!lastChannelId || lastChannelId !== message.channel.id) {
      stats.users[userId].numMessagesTicket++; // Incrémenter le compteur de messages ticket
      stats.users[userId].lastChannelId = message.channel.id; // Mettre à jour lastChannelId avec l'ID du nouveau canal
      stats.users[userId].lastChannelName = message.channel.name;
    }
  }

  // Vérifier si le message est un ticket fermé
  if (message.content.startsWith("!close")) {
    stats.users[userId].numClosedTickets++;
  }

  // Vérifier si le message est une réponse à un ticket
  if (message.content.startsWith("!r")) {
    stats.users[userId].numReplies++;
  }
    // Enregistrer les stats dans le fichier stats.json
    fs.writeFile("stats.json", JSON.stringify(stats, null, 2), (err) => {
      if (err) {
        console.error("Problème pendant l'écriture du fichier : " + err);
      }
    });
  });

  // Commande pour afficher les stats d'un utilisateur
  commands.addInboxThreadCommand(
    "stats",
    "<userId:string>",
    async (msg, args, thread) => {
      const userStats = stats.users[args.userId];
      if (!userStats) {
        thread.postSystemMessage(
          `Aucune statistique pour l'utilisateur avec l'id Discord ${args.userId}.`
        );
        return;
      }

      const response = `Statistiques pour l'utilisateur ${userStats.DiscordName} (${args.userId}) :
      -  Nombre de messages Ticket : ${userStats.numMessagesTicket}
      -  Nombre de tickets fermés : ${userStats.numClosedTickets}
      -  Nombre de messages envoyés : ${userStats.totalMessages}
      -  Nombre total de réponses : ${userStats.numReplies}
      -  Dernier ticket impliqué : ${userStats.lastChannelName}`;


      thread.postSystemMessage(response);
    }
  );

  client.login(
    "YOUR_BOT_TOKEN"
  );
};
