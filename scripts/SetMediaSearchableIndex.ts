import {asyncForEach} from "../src/shared/utils/utils";

export async function setMediaSearchableIndex() {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const MongoClient = require('mongodb').MongoClient;

// Connection URL
    const url = process.env.CONNECTION_STRING;
    const client = new MongoClient(url);
// Use connect method to connect to the server
    await client.connect();
    const db = await client.db("gamerjuice");

console.log("doing...");
    const episodes = await db.collection("episodes").find({}).toArray();
    await asyncForEach(episodes, async (episode) => {
        const searchableIndex = episode.media.name.toUpperCase();
        console.log(searchableIndex);
        await db.collection("episodes").updateOne({_id: episode._id}, {
            "$set": {
                "media.searchableIndex": searchableIndex
            }
        })
    })
    console.log("done");
    await client.close();
}