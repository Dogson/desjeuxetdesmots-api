export async function addMediaConfigToEpisode() {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const MongoClient = require('mongodb').MongoClient;


// Connection URL
    const url = process.env.CONNECTION_STRING;
    const client = new MongoClient(url);
// Use connect method to connect to the server
    await client.connect();
    const db = await client.db("gamerjuice");


    await db.collection("episodes").updateMany({"media.name": "Le Cosy Corner"}, {
        "$set": {
            "media.config": {
                "excludeStrings": ["où il est entre autres question de", "où il est entre autre question de", "Le cosy corner numéro", "cosy corner", "le cosy corner", "Un épisode où il est entre autres question de"],
                "excludeRegex": [],
                "ignoreEpisode": ["Zone de Confort", "[HS]"],
                "endOfParseStrings": ["Remerciements", "Playlist"],
                "parseProperty": "description"
            },
            "media.feedUrl": "https://feeds.soundcloud.com/users/soundcloud:users:274829367/sounds.rss"
        },
        "$unset": {feedUrl: 1}
    });
    await db.collection("episodes").updateMany({"media.name": "Silence on joue !"}, {
        "$set": {
            "media.config": {
                "excludeStrings": ["Silence On Joue"],
                "excludeRegex": [],
                "ignoreEpisode": [],
                "endOfParseStrings": [],
                "parseProperty": "name"
            },
            "media.feedUrl": "https://feeds.acast.com/public/shows/5b7ac427c6a58e726f576cff"
        },
        "$unset": {feedUrl: 1}
    });
    await db.collection("episodes").updateMany({"media.name": "Fin Du Game"}, {
        "$set": {
            "media.config": {
                "excludeStrings": ["Episode"],
                "excludeRegex": [],
                "ignoreEpisode": [],
                "endOfParseStrings": [],
                "parseProperty": "name"
            },
            "media.feedUrl": "https://feeds.acast.com/public/shows/findugame"
        },
        "$unset": {feedUrl: 1}
    });

    await client.close();
}