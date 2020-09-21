// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function mediaToEpisodes() {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const MongoClient = require('mongodb').MongoClient;
    // eslint-disable-next-line @typescript-eslint/no-var-requires


// Connection URL
    const url = "mongodb+srv://gwenael:TVMQRuNH0yCzH6eD@cluster0.r0vxx.gcp.mongodb.net/gamerjuice?retryWrites=true&w=majority";
    const client = new MongoClient(url);
// Use connect method to connect to the server
    await client.connect();
    const db = await client.db("gamerjuice");


    const mediaCursors = await db.collection("media").find({});
    const medias = await mediaCursors.toArray();

    const episodes = [];
    medias.forEach((media) => {
        const mediaEpisodes = media.episodes.map((episode) => {
            return {
                ...episode,
                media: {
                    name: media.name,
                    logo: media.logo,
                    description: media.description
                }
            };
        });
        mediaEpisodes.forEach((episode) => {
            episodes.push(episode);
        })
    });

    await client.close();
}