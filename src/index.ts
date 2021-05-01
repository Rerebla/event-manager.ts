import { Client } from 'discord.js';
import { DiscordEvent } from './Event/DiscordEvent';
import { handleNewEventCommand } from "./commandHandlers/newEventCommandHandler";
import { CONFIG } from "./config";
import { readJson } from './helper/jsonHelper';
import { handleDeleteEventCommand } from './commandHandlers/deleteEventCommandHandler';
import { writeFileSync } from 'fs';

export const client = new Client();
const eventManagerPrefix = ["!event", "-event"];
export let events: DiscordEvent[] = [];
client.on("ready", () => {
    console.log(`Logged in as ${client.user.tag}`);
});
export function setEvents(eventsArray: DiscordEvent[]) {
    events = eventsArray;
}

client.on("message", (msg) => {
    if (msg.author.bot) return;
    let isEventCommand = false;
    eventManagerPrefix.forEach((e) => {
        if (msg.content.startsWith(e)) isEventCommand = true;
    });
    if (!isEventCommand) return;
    const command = msg.content.split(" ")[1];
    switch (command) {
        case "new":
            handleNewEventCommand(msg);
            break;
        case "delete":
            handleDeleteEventCommand(msg);
            break;
        case "help":
            msg.channel.send(`
The scheme is: 
**!event <command> <name> <dd-mm-yyyy> <hh:mm> <category> <participantLimit (number)> <notes>**
Notes: The name *cannot* contain spaces, subsitute them with _ or - if you need a space in the name. (notes *can* contain spaces)
For more information about the different commands, use !event commands`);
            break;
        case "commands":
            msg.channel.send(`
Commands: new|delete|help|commands
**new**:
Creates a new Event, use the help command to get the scheme and other information about that command
**delete**
Deletes a Event with the given name. Note: You have to be the creator of the event to delete it.`);
            break;
        case "events":
            let message = "";
            for (const event of events) {
                message += event.name + " ";
            }
            msg.channel.send(message);
        case "purge":
            if (msg.author.id !== '262853725851222016') {
                msg.reply("That's not a command known to EventManager (use 'commands' for the commands)");
                return;
            }
            writeFileSync("events.json", JSON.stringify({}));
            if (msg.deletable) msg.delete();
            else msg.reply("That's not a command known to EventManager (use 'commands' for the commands)");
            break;
        default:
            msg.reply("That's not a command known to EventManager (use 'commands' for the commands)");
    }
});

client.login(CONFIG.token).then(() => {
    readJson();
});

