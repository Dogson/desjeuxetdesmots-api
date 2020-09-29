export async function addMediaTypeToEpisode() {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const MongoClient = require('mongodb').MongoClient;
// Connection URL
    const url = process.env.CONNECTION_STRING;
    const client = new MongoClient(url);
// Use connect method to connect to the server
    await client.connect();
    const db = await client.db("gamerjuice");


    await db.collection("episodes").updateMany({}, {"$set": {"media.type": "podcast"}});

    await client.close();
}