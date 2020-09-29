export async function changeMediaName() {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const MongoClient = require('mongodb').MongoClient;

// Connection URL
    const url = process.env.CONNECTION_STRING;
    const client = new MongoClient(url);
// Use connect method to connect to the server
    await client.connect();
    const db = await client.db("gamerjuice");


    await db.collection("episodes").updateMany({"media.name": "Gamekult Jeux Vidéo"}, {
        "$set": {
            "media.name": "Gamekult"
        },
    });
    await db.collection("episodes").updateMany({"media.name": "Quick Load, le podcast qui met des tartes graphiques"}, {
        "$set": {
            "media.name": "Quick Load"
        },
    });
    await client.close();
}