import { Message, MessageEmbed, MessageReaction, User } from 'discord.js';
import { scheduleJob } from 'node-schedule';
import { readFileSync, writeFileSync } from 'fs';
import { deleteElement, mapJson, mapValues } from '../helper/jsonHelper';
import { events, setEvents } from '../index';
export class DiscordEvent {
    public name: string;
    public date: Date;
    category: string;
    participantLimit: number | null;
    public participants: User[];
    public message: Message;
    isOver: boolean;
    notes: string;
    author: User;

    constructor(name: string, date: Date, category: string, notes: string, message: Message, author: User, participantLimit?: number, participants?: User[]) {
        this.name = name;
        this.date = date;
        this.category = category;
        this.participantLimit = participantLimit || 0;
        this.participants = participants || [];
        this.message = message;
        this.notes = notes;
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



    public removeParticipant(participant: User) {
        this.participants = this.participants.filter((element) => {
            return element.id !== participant.id;
        });
        this.writeCurrentStatusToJson();
    }


    private scheduleEvent(date: Date) {

        scheduleJob(new Date(date.valueOf() - 5 * 60000), async function (event: DiscordEvent) {
            event.message.channel.send("5 Minutes until Start of: " + event.name);
            event.participants.forEach((user) => {
                user.send(event.name + "is starting in 5 minutes").catch();
            });
        }.bind(null, this));

        scheduleJob(date, async function (event: DiscordEvent) {
            event.message.channel.send("Event has STARTED: " + event.name);

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
                { name: 'Notes', value: this.notes }
            );
        return embed;
    }
    private participantsToNames() {
        let returnString = "";
        for (let index = 0; index < this.participants.length; index++) {
            const participant = this.participants[index];
            returnString += returnString ? "," + participant : participant.username;
        }
        return returnString;
    }


    public async sendMessage() {
        const message = await this.message.channel.send(this.constructEmbed());

        message.react('👍');
        message.react('👎');

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
        const values = mapValues(this.date, this.category, this.notes, this.message.id, this.message.channel.id, this.participantLimit, this.participants, this.author);
        json = mapJson(json, this.name, values);
        const data = JSON.stringify(json, null, 2);
        writeFileSync("events.json", data);
    }
}
