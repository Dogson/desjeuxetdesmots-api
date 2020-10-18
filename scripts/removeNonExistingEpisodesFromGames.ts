import {asyncForEach} from "../src/shared/utils/utils";

export async function removeNonExistingEpisodesFromGames() {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const MongoClient = require('mongodb').MongoClient;
// Connection URL
    const url = process.env.CONNECTION_STRING;
    const client = new MongoClient(url);
// Use connect method to connect to the server
    await client.connect();
    const db = await client.db("gamerjuice");


    const games = await db.collection("games").find({}).toArray();
    let count = 0;
    await asyncForEach(games, async (game) => {
        count++;
        const episodes = [];
        await asyncForEach(game.episodes, async (episodeId) => {
            const episode = await db.collection("episodes").findOne({_id: episodeId});
            if (episode) {
                episodes.push(episodeId);
            }
        });
        game.episodes = episodes;

        await db.collection("games").updateOne({_id: game._id}, {$set: game});
        console.log(count + "/" + games.length);
    })

    await client.close();
}