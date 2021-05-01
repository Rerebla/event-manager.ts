import { Message } from 'discord.js';
import { readFileSync, writeFileSync } from 'fs';
import { mapJson, mapValues } from '../helper/jsonHelper';
import { DiscordEvent } from '../Event/DiscordEvent';
import { events } from '..';

export const handleNewEventCommand = (msg: Message) => {
    let [name, dateString, timeString, category, participantLimit, ...notes] = msg.content.split(" ").slice(2);
    const rawdata = readFileSync("events.json");
    let json = JSON.parse(rawdata.toString());
    name = name.replace("-", " ").replace("_", " ");
    if (json[name]) {
        msg.channel.send("There is already a event named like that, consider using another name or ask the creator of the other event to delete it/delete it yourself");
        return;
    }

    const author = msg.author;
    const [day, month, year] = dateString.split("-");
    const [hour, minutes] = timeString.split(":");

    const date = new Date(Number.parseInt(year), Number.parseInt(month) - 1, Number.parseInt(day), Number.parseInt(hour), Number.parseInt(minutes));
    const event = new DiscordEvent(name, date, category, notes.join(" "), msg, author, Number.parseInt(participantLimit));

    const values = mapValues(date, category, notes.join(" "), msg.id, msg.channel.id, Number.parseInt(participantLimit), [], author);
    json = mapJson(json, name, values);
    const data = JSON.stringify(json, null, 2);
    writeFileSync("events.json", data);
    events.push(event);
};
