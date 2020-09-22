// eslint-disable-next-line @typescript-eslint/no-unused-vars
import {asyncForEach} from "../src/shared/utils/utils";

export async function addMediaTypeToEpisode() {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const MongoClient = require('mongodb').MongoClient;
    // eslint-disable-next-line @typescript-eslint/no-var-requires


// Connection URL
    const url = process.env.CONNECTION_STRING;
    const client = new MongoClient("mongodb+srv://gwenael:6ZYyIs8vdECKRB6l@cluster0.r0vxx.gcp.mongodb.net/gamerjuice?retryWrites=true&w=majority");
// Use connect method to connect to the server
    await client.connect();
    const db = await client.db("gamerjuice");


    await db.collection("episodes").updateMany({}, {"$set": {"media.type": "podcast"}});

    await client.close();
}