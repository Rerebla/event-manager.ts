import { Channel, Message, TextChannel, User } from 'discord.js';
import { readFileSync, writeFileSync } from 'fs';
import { client, events } from '..';
import { DiscordEvent } from '../Event/DiscordEvent';

export const mapJson = (jsonObject: any, key: string, value: any) => {
    jsonObject[key] = value;
    return jsonObject;
};
export const mapValues = (date: Date, category: string, notes: string, msgId: string, channelId: string, participantLimit: number, participants: User[], author: User) => {
    return {
        "date": date,
        "category": category,
        "msgId": msgId,
        "channelId": channelId,
        "notes": notes,
        "participantLimit": participantLimit,
        "participants": participants,
        "author": author
    };
};
export const deleteElement = (name: string) => {
    const rawdata = readFileSync("events.json");
    const json = JSON.parse(rawdata.toString());
    delete json[name];
    const data = JSON.stringify(json, null, 2);
    writeFileSync("events.json", data);
};
export const readJson = async () => {
    const rawdata = readFileSync("events.json");
    const json = JSON.parse(rawdata.toString());
    for (let name in json) {
        const event = json[name];
        const date = new Date(event.date);
        const category = event.category;
        const channelId = event.channelId;
        const msgId = event.msgId;
        const notes = event.notes;
        const participantLimit = event.participantLimit;
        const participantsInfo: User[] = event.participants;
        const author = new User(client, event.author);
        let participants: User[] = [];
        for (let index = 0; index < participantsInfo.length; index++) {
            const element = participantsInfo[index];
            participants.push(new User(client, element));
        }
        const channel: Channel = await client.channels.fetch(channelId, true, true);
        let message: Message;
        if (channel instanceof TextChannel) {
            message = await channel.messages.fetch(msgId);
        }
        events.push(new DiscordEvent(name, date, category, notes, message, author, participantLimit, participants));
    };
};