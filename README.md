# GAMER JUICE API

This is an API for the open-source project [Gamer Juice](https://github.com/Dogson/gamer-juice). 

The API is built with [NestJS](https://nestjs.com/).

## Installation

Use the package manager [yarn](https://yarnpkg.com/) to build and watch the Gamer Juice API

```bash
yarn install
yarn start:dev
```

Create your own ```.env``` file following the properties of the ```.env.example``` file.

## Endpoints

### Media

To fetch all media without the episodes
```
GET /media
```

To fetch all media with their episodes
```
GET /media?withEpisodes=true
```

To fetch one media in particuliar (with episodes)
```
GET /media/:id
```

To generate a media with all its episodes from an RSS feed
```
POST /media/generate

{
   "feedUrl": "https://feeds.acast.com/public/shows/5b7ac427c6a58e726f576cff",
}
```

### Game

To fetch all games
```
GET /games/:id
```

To fetch one game
```
GET /games/:id
```