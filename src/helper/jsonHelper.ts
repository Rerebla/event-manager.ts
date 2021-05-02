import { TextChannel, User } from 'discord.js';
import { readFileSync, writeFileSync } from 'fs';
import { client, events } from '..';
import { DiscordEvent } from '../Event/DiscordEvent';

export const mapJson = (jsonObject: any, key: string, value: any) => {
    jsonObject[key] = value;
    return jsonObject;
};
export const mapValues = (date: Date, category: string, channelId: string, participantLimit: number, shouldEdit: boolean, participants: User[], author: User) => {
    return {
        "date": date,
        "category": category,
        "channelId": channelId,
        "participantLimit": participantLimit,
        "participants": participants,
        "author": author,
        "shouldEdit": shouldEdit,
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
    let rawdata;
    try {
        rawdata = readFileSync("events.json");
    } catch (error) {
        rawdata = "{}";
        writeFileSync("events.json", JSON.stringify({}));
    }
    const json = JSON.parse(rawdata.toString());
    for (let name in json) {
        const event = json[name];
        const date = new Date(event.date);
        const category = event.category;
        const channelId = event.channelId;
        const participantLimit = event.participantLimit;
        const participantsInfo: User[] = event.participants;
        const author = new User(client, event.author);
        const shouldEdit = event.shouldEdit;
        let participants: User[] = [];
        for (let index = 0; index < participantsInfo.length; index++) {
            const element = participantsInfo[index];
            participants.push(new User(client, element));
        }
        const resolvedChannel = await client.channels.fetch(channelId, true, true);
        if (resolvedChannel instanceof TextChannel) {
            events.push(new DiscordEvent(name, date, category, resolvedChannel, author, participantLimit, shouldEdit, participants));
        }
    };
};