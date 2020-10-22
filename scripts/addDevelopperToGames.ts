import {asyncForEach} from "../src/shared/utils/utils";
import axios from "axios";
import {BadRequestException, InternalServerErrorException} from "@nestjs/common";
import {ERROR_TYPES} from "../src/shared/const/error.types";

export async function addDevelopperToGames() {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const MongoClient = require('mongodb').MongoClient;
// Connection URL
    const url = process.env.CONNECTION_STRING;
    const client = new MongoClient(url);
// Use connect method to connect to the server
    await client.connect();
    const db = await client.db("gamerjuice");

    let count = 0;
    const games = await db.collection("games").find({}).toArray();
    try {
        const token = await getTwitchToken();
        await asyncForEach(games, async (game) => {
            const companies = await executeIgdbQuery(token, game.igdbId);
            console.log(companies);
            await db.collection("games").updateOne({_id: game._id}, {'$set': {companies: companies}});
            count++;
            console.log(count + "/" + games.length);
        })

    } catch (err) {
        throw new InternalServerErrorException(err);
    }
    await client.close();
}

async function executeIgdbQuery(token, id): Promise<any> {

    if (!token) {
        token = await getTwitchToken();
    }

    try {
        const response = await axios({
            url: process.env.IGDB_API_COMPANIES_URL,
            method: 'POST',
            headers: {
                'Client-ID': process.env.TWITCH_CLIENT_ID,
                'Authorization': `Bearer ${token}`
            },
            data: `fields company.name; where game = ${id} & developer=true;`
        });


        return response.data.map((company) => {
            return {
                name: company.company && company.company.name,
                igdbId: company.company && company.company.id
            }
        });

        // const companies = await axios({
        //     url: process.env.IGDB_API_GAMES_URL,
        //     method: 'POST',
        //     headers: {
        //         'Client-ID': process.env.TWITCH_CLIENT_ID,
        //         'Authorization': `Bearer ${token}`
        //     },
        //     data: `fields involved_companies; where id = ${id};`
        // });
    } catch (err) {
        throw new InternalServerErrorException(err);
    }
}

async function getTwitchToken() {
    try {
        const result = await axios({
            url: process.env.TWITCH_AUTH_URL,
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                "X-Requested-With": "XMLHttpRequest"
            },
            params: {
                client_id: process.env.TWITCH_CLIENT_ID,
                client_secret: process.env.TWITCH_CLIENT_SECRET,
                grant_type: 'client_credentials'
            }
        });
        return result.data.access_token;
    } catch (error) {
        throw new BadRequestException(ERROR_TYPES.twitch_token_error(error));
    }
}