export async function addMediaConfigToEpisode() {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const MongoClient = require('mongodb').MongoClient;


// Connection URL
    const url = process.env.CONNECTION_STRING;
    const client = new MongoClient(url);
// Use connect method to connect to the server
    await client.connect();
    const db = await client.db("gamerjuice");


    await db.collection("episodes").updateMany({"media.name": "Gamekult"}, {
        "$set": {
            "media.config": {
                "excludeStrings": ["Gamekult l'émission", "by Gamekult Jeux Vidéo"],
                "excludeRegex": [],
                "ignoreEpisode": ["Point News", "Gaijin", "Retro Dash", "Presse au kult"],
                "endOfParseStrings": [],
                "parseProperty": "name",
                "minDuration": 75
            },
        }
    });

    await client.close();
}