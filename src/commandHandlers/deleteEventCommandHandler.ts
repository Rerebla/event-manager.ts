import { Message, User } from 'discord.js';
import { readFileSync } from 'fs';
import { client } from '..';
import { deleteElement } from '../helper/jsonHelper';

export const handleDeleteEventCommand = (msg: Message) => {

    const rawdata = readFileSync("events.json");
    let json = JSON.parse(rawdata.toString());

    const name = msg.content.split(" ").slice(2)[0].replace("-", " ").replace("_", " ");

    if (!json[name]) { console.log("thing doesn exist"); return; }

    const author = new User(client, json[name].author);
    if (msg.author.id !== author.id) return;

    deleteElement(name);
};