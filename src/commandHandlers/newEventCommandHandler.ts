import { DMChannel, Message, TextChannel, User } from 'discord.js';
import { readFileSync, writeFileSync } from 'fs';
import { mapJson, mapValues } from '../helper/jsonHelper';
import { DiscordEvent } from '../Event/DiscordEvent';
import { client, events } from '../index';

export const handleNewEventCommand = async (msg: Message) => {
    let [name, dateString, timeString, category, participantLimit, shouldEdit, ...peopleToPing] = msg.content.split(" ").slice(2);
    const rawdata = readFileSync("events.json");
    let json = JSON.parse(rawdata.toString());
    name = name.replace("-", " ").replace("_", " ");
    category = category.replace("-", " ").replace("_", " ");
    if (json[name]) {
        msg.channel.send("There is already a event named like that, consider using another name or ask the creator of the other event to delete it/delete it yourself if you own that event");
        return;
    }

    const author = msg.author;
    const [day, month, year] = dateString.split("-");
    const [hour, minutes] = timeString.split(":");

    const date = new Date(Number.parseInt(year), Number.parseInt(month) - 1, Number.parseInt(day), Number.parseInt(hour), Number.parseInt(minutes));
    console.log("pep: ", peopleToPing);
    console.log("edit: ", shouldEdit);
    let channel: TextChannel;
    if (msg.channel instanceof (DMChannel)) {
        const resolvedChannel = await client.channels.fetch(peopleToPing[0], true, true);
        if (resolvedChannel instanceof TextChannel) {
            channel = resolvedChannel;
        }
        delete peopleToPing[0];
    } else if (msg.channel instanceof TextChannel) {
        channel = msg.channel;
    }
    const resolvedShouldEdit = shouldEdit.startsWith("y");
    const event = new DiscordEvent(name, date, category, channel, author, Number.parseInt(participantLimit), resolvedShouldEdit);

    peopleToPing.forEach(async (id) => {
        const user: User = await client.users.fetch(id);
        event.pingInitialMember(user);
    });


    const values = mapValues(date, category, channel.id, Number.parseInt(participantLimit), resolvedShouldEdit, [], author);
    json = mapJson(json, name, values);
    const data = JSON.stringify(json, null, 2);
    writeFileSync("events.json", data);
    events.push(event);
};
