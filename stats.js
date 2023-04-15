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

module.exports = ({ config, commands }) => {
  // Init stats
  let stats = {
    users: {},
  };

  client.on("ready", async () => {
    const guild = await client.guilds.fetch(config.inboxServerId);
    await guild.members.fetch();
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
          numMessagesTicketWeekly: 0,
          numClosedTicketsWeekly: 0,
          numRepliesWeekly: 0,
          totalMessagesWeekly: 0,
          numClosedTicketsMonthly: 0,
          numRepliesMonthly: 0,
          totalMessagesMonthly: 0,
          numMessagesTicketMonthly: 0,

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
      }, 20 * 1000);
    }
  });

  // Ajouter un listener pour enregistrer les stats de chaque utilisateur
  client.on("messageCreate", async (message, thread) => {
    if (message.guildId != config.inboxServerId) return;
    const userId = message.author.id;
    const guild = await client.guilds.fetch(config.inboxServerId);
    await guild.members.fetch();

    // Mettre à jour les stats de l'utilisateur
    if (!stats.users[userId]) {
      stats.users[userId] = {
        DiscordName: message.author.username,
        numMessagesTicket: 0,
        numClosedTickets: 0,
        numReplies: 0,
        totalMessages: 0,
        lastChannelId: null,
        lastChannelName: null,
      };
    }
    if (!message.content.startsWith("!")) {
      // Si le message ne commence pas par un préfixe de commande
      stats.users[userId].totalMessages++; // Incrémenter le compteur de messages total
      stats.users[userId].totalMessagesWeekly++; // Incrémenter le compteur de messages ticket
      stats.users[userId].totalMessagesMonthly++; // Incrémenter le compteur de messages ticket
      // Vérifier si l'utilisateur a envoyé un message dans un nouveau canal
      const lastChannelId = stats.users[userId].lastChannelId;
      if (!lastChannelId || lastChannelId !== message.channel.id) {
        stats.users[userId].numMessagesTicket++; // Incrémenter le compteur de messages ticket
        stats.users[userId].numMessagesTicketWeekly++; // Incrémenter le compteur de messages ticket
        stats.users[userId].numMessagesTicketMonthly++; // Incrémenter le compteur de messages ticket
        stats.users[userId].lastChannelId = message.channel.id; // Mettre à jour lastChannelId avec l'ID du nouveau canal
        stats.users[userId].lastChannelName = message.channel.name;
      }
    }
    // Vérifier si le message est un ticket fermé
    if (message.content.startsWith("!close")) {
      stats.users[userId].numClosedTickets++;
      stats.users[userId].numClosedTicketsWeekly++;
      stats.users[userId].numClosedTicketsMonthly++;
    }
    // Vérifier si le message est une réponse à un ticket
    if (message.content.startsWith("!r")) {
      stats.users[userId].numReplies++;
      stats.users[userId].numRepliesWeekly++;
      stats.users[userId].numRepliesMonthly++;
    }
  });
  // Commande pour réinitialiser les stats d'un utilisateur
  commands.addInboxThreadCommand(
    "resetstats",
    "<userId:string> <period:string>",
    async (msg, args, thread) => {

      if (!msg.member.roles.includes(config.statsCommandRoleId)) {
        thread.postSystemMessage(
          "Vous n'avez pas la permission d'utiliser cette commande."
        );
        return;
      }
      if (args.userId === "all") {
        Object.values(stats.users).forEach((userStats) => {
          if (args.period == "monthly") {
            userStats.numClosedTicketsMonthly = 0;
            userStats.numRepliesMonthly = 0;
            userStats.totalMessagesMonthly = 0;
            userStats.numMessagesTicketMonthly = 0;
          }
          else if (args.period == "weekly") {
            userStats.numMessagesTicketWeekly = 0;
            userStats.numClosedTicketsWeekly = 0;
            userStats.numRepliesWeekly = 0;
            userStats.totalMessagesWeekly = 0;
          }
          else if (args.period == "all") {
            userStats.numMessagesTicket = 0;
            userStats.numClosedTickets = 0;
            userStats.numReplies = 0;
            userStats.totalMessages = 0;
          }
        });
        thread.postSystemMessage(` Les stats de tous les utilisateurs ont été réinitialisées pour la période ${args.period}.`);
      } else {
        // Cas où on choisie de réinitialiser les stats d'un utilisateur en particulier
        const userStats = stats.users[args.userId];
        if (args.period == "monthly") {
          userStats.numClosedTicketsMonthly = 0;
          userStats.numRepliesMonthly = 0;
          userStats.totalMessagesMonthly = 0;
          userStats.numMessagesTicketMonthly = 0;
        }
        else if (args.period == "weekly") {
          userStats.numMessagesTicketWeekly = 0;
          userStats.numClosedTicketsWeekly = 0;
          userStats.numRepliesWeekly = 0;
          userStats.totalMessagesWeekly = 0;
        }
        else if (args.period == "all") {
          userStats.numMessagesTicket = 0;
          userStats.numClosedTickets = 0;
          userStats.numReplies = 0;
          userStats.totalMessages = 0;
          userStats.numMessagesTicketWeekly = 0;
          userStats.numClosedTicketsWeekly = 0;
          userStats.numRepliesWeekly = 0;
          userStats.totalMessagesWeekly = 0;
          userStats.numClosedTicketsMonthly = 0;
          userStats.numRepliesMonthly = 0;
          userStats.totalMessagesMonthly = 0;
          userStats.numMessagesTicketMonthly = 0;
        }
        thread.postSystemMessage(`Les stats de ${userStats.DiscordName} ont été réinitialisées pour la période ${args.period}.`);
      }
    }
  );

  // Commande pour afficher les stats d'aun utilisateur
  commands.addInboxThreadCommand(
    "stats",
    "<userId:string> <period:string>",
    async (msg, args, thread) => {

      if (!msg.member.roles.includes(config.statsCommandRoleId)) {
        thread.postSystemMessage(
          "Vous n'avez pas la permission d'utiliser cette commande."
        );
        return;
      }
      if (args.userId === "all") {
        let response = `**Statistiques pour tous les membres Discord (${args.period}) : **\n`;
        // Cas où on choisie tout les utilisateurs
        Object.values(stats.users).forEach((userStats) => {
          if (args.period == "monthly") {
            response += `Stats du mois de : ${userStats.DiscordName} (${userStats.DiscordId}) : Ticket agis ( ${userStats.numMessagesTicketMonthly} )  Ticket Clos ( ${userStats.numClosedTicketsMonthly} )  Total messages ( ${userStats.totalMessagesMonthly} )  Total réponses ( ${userStats.numRepliesMonthly} ) \nDernier Ticket ( ${userStats.lastChannelName} ) \n\n`;
          } else if (args.period == "weekly") {
            response += ` Stats de la semaine de : ${userStats.DiscordName} (${userStats.DiscordId}) : Ticket agis ( ${userStats.numMessagesTicketWeekly} )  Ticket Clos ( ${userStats.numClosedTicketsWeekly} )  Total messages ( ${userStats.totalMessagesWeekly} )  Total réponses ( ${userStats.numRepliesWeekly} ) \nDernier Ticket ( ${userStats.lastChannelName} ) \n\n`;
          }
          else if (args.period == "all") {
            response += `Stats de ${userStats.DiscordName} (${userStats.DiscordId}) : Ticket agis( ${userStats.numMessagesTicket} )  Ticket Clos ( ${userStats.numClosedTickets} )  Total messages ( ${userStats.totalMessages} )  Total réponses ( ${userStats.numReplies} ) \nDernier Ticket ( ${userStats.lastChannelName} ) \n\n`;
          }
        });
        thread.postSystemMessage(response);
        return;
      }
      // Cas où on choisie de réinitialiser les stats d'un utilisateur en particulier
      const userStats = stats.users[args.userId];
      if (!userStats) {
        thread.postSystemMessage(
          `**Aucune statistique pour l'utilisateur avec l'id Discord ${args.userId}.**`
        );
        return;
      }
      if (args.period == "weekly") {

        const response = ` ** Stats de la semaine de :  ${userStats.DiscordName} **(${userStats.DiscordId}) : Ticket agis ( ${userStats.numMessagesTicketWeekly} )  Ticket Clos ( ${userStats.numClosedTicketsWeekly} )  Total messages ( ${userStats.totalMessagesWeekly} )  Total réponses ( ${userStats.numRepliesWeekly} ) \nDernier Ticket ( ${userStats.lastChannelName} ) \n\n`;
        thread.postSystemMessage(response);

      }
      else if (args.period == "monthly") {
        const response = `** Stats du mois de : ${userStats.DiscordName} ** (${userStats.DiscordId}) : Ticket agis ( ${userStats.numMessagesTicketMonthly} )  Ticket Clos ( ${userStats.numClosedTicketsMonthly} )  Total messages ( ${userStats.totalMessagesMonthly} )  Total réponses ( ${userStats.numRepliesMonthly} ) \nDernier Ticket ( ${userStats.lastChannelName} ) \n\n`;
        thread.postSystemMessage(response);

      }
      else if (args.period == "all") {
        const response = `** Stats de  ${userStats.DiscordName} ** (${userStats.DiscordId}) : Ticket agis ( ${userStats.numMessagesTicket} )  Ticket Clos ( ${userStats.numClosedTickets} )  Total messages ( ${userStats.totalMessages} )  Total réponses ( ${userStats.numReplies} ) \nDernier Ticket ( ${userStats.lastChannelName} ) \n\n`;
        thread.postSystemMessage(response);

      }
    }
  );
  client.login(config.token);
};
