import { Message, MessageEmbed, MessageReaction, TextChannel, User } from 'discord.js';
import { scheduleJob } from 'node-schedule';
import { readFileSync, writeFileSync } from 'fs';
import { deleteElement, mapJson, mapValues } from '../helper/jsonHelper';
import { client, events, setEvents } from '../index';
import { CONFIG } from '../config';
export class DiscordEvent {
    public name: string;
    public date: Date;
    category: string;
    participantLimit: number | null;
    public participants: User[];
    public channel: TextChannel;
    shouldEdit: boolean;
    isOver: boolean;
    author: User;
    lastOwnMessage: Message;

    constructor(name: string, date: Date, category: string, channel: TextChannel, author: User, participantLimit: number, shouldEdit: boolean, participants?: User[]) {
        this.name = name;
        this.date = date;
        this.category = category;
        this.participantLimit = participantLimit || 0;
        this.participants = participants || [];
        this.channel = channel;
        this.shouldEdit = shouldEdit;
        this.author = author;
        this.scheduleEvent(date);
        this.sendMessage();
    }


    public addParticipant(participant: User) {
        if (this.isOver) throw new Error("The event was cancelled or is over! Name:" + this.name);
        if (this.participants.some(user => user.id == participant.id)) return;
        this.participants.push(participant);
        this.writeCurrentStatusToJson();
    }

    public pingInitialMember(user: User) {
        user.send(`
Hey!
*Don't worry, I'm not a scam bot, I swear.* **Sourcrouts aggressively**
For reviews of this bot type !event reviews

You are invited to ${this.name} at ${this.date}
For more information check <#${this.channel}>
`).catch(() => {
            client.users.fetch(CONFIG.ownerId).then((user) => {
                user.send(`There occured an error at: ${user.username}`);
            });
        });
    }




    public removeParticipant(participant: User) {
        this.participants = this.participants.filter((element) => {
            return element.id !== participant.id;
        });
        this.writeCurrentStatusToJson();
    }


    private scheduleEvent(date: Date) {

        scheduleJob(new Date(date.valueOf() - 5 * 60000), async function (event: DiscordEvent) {
            event.channel.send("5 Minutes until Start of: " + event.name);
            event.participants.forEach((user) => {
                user.send(event.name + "is starting in 5 minutes").catch();
            });
        }.bind(null, this));

        scheduleJob(date, async function (event: DiscordEvent) {
            event.channel.send("Event has STARTED: " + event.name + "TRÖÖÖÖÖÖÖÖÖÖÖÖÖÖÖÖÖÖÖÖÖÖÖÖÖÖÖÖÖÖÖÖÖÖÖÖÖÖÖÖÖÖÖÖÖÖÖT");

            event.participants.forEach((user) => {
                user.send(event.name + " is starting now").catch();
            });

            event.deleteFromDB();

            setEvents(events.filter((value) => {
                return value !== event;
            }));

        }.bind(null, this));
    }
    public deleteFromDB() {
        deleteElement(this.name);
    }

    public constructEmbed() {
        const embed = new MessageEmbed()
            .setTitle(this.name)
            .addFields(
                { name: 'Category', value: this.category },
                { name: 'When?', value: this.date },
                { name: 'How many?', value: this.participantLimit || "Unlimited" },
                { name: 'Currently entered', value: this.participantsToNames() || "none" },
                { name: 'Still needed', value: this.participantLimit - this.participants.length },
            );
        return embed;
    }
    private participantsToNames() {
        let returnString = "";
        for (let index = 0; index < this.participants.length; index++) {
            const participant = this.participants[index];
            returnString += returnString ? ", " + participant.username : participant.username;
        }
        return returnString;
    }


    public async sendMessage() {
        let message;
        if (this.shouldEdit && this.lastOwnMessage) {
            this.lastOwnMessage.edit(this.constructEmbed());
            message = this.lastOwnMessage;
        } else {
            message = await this.channel.send(this.constructEmbed());
            message.react('👍');
            message.react('👎');
            this.lastOwnMessage = message;
        }

        const filter = (reaction: MessageReaction, user: User) => {
            const isValidEmoji = reaction.emoji.name === '👍' || reaction.emoji.name === '👎';
            const isEntered = this.participants.some(participant => participant.id == user.id);
            const returnValue = !user.bot && isValidEmoji && (reaction.emoji.name === '👍' && !isEntered) || (reaction.emoji.name === '👎' && isEntered);
            return returnValue;
        };

        const collector = message.createReactionCollector(filter, { time: this.date.valueOf() - Date.now() });

        collector.on('collect', (reaction, user) => {
            if (reaction.emoji.name === '👍') {
                this.addParticipant(user);
            } else {
                this.removeParticipant(user);
            }

            this.sendMessage();
            message.delete();
        });
    }


    private writeCurrentStatusToJson() {
        const rawdata = readFileSync("events.json");
        let json = JSON.parse(rawdata.toString());
        const values = mapValues(this.date, this.category, this.channel.id, this.participantLimit, this.shouldEdit, this.participants, this.author);
        json = mapJson(json, this.name, values);
        const data = JSON.stringify(json, null, 2);
        writeFileSync("events.json", data);
    }
}
