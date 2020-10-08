export async function addMediaConfigToEpisode() {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const MongoClient = require('mongodb').MongoClient;


// Connection URL
    const url = process.env.CONNECTION_STRING;
    const client = new MongoClient(url);
// Use connect method to connect to the server
    await client.connect();
    const db = await client.db("gamerjuice");


    await db.collection("episodes").updateMany({"media.name": "GK Live"}, {
        "$set": {
            "media.config": {
                "episodeMustInclude": ["GK Live"],
                "excludeStrings": [
                    "GK Live Replay"
                ],
                "excludeRegex": [],
                "ignoreEpisode": [],
                "ignoreEpisodeRegex": [],
                "endOfParseStrings": [],
                "parseProperty": "name"
            },
        }
    });

    await client.close();
}