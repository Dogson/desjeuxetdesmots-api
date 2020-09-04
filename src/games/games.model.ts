export class Game {

    constructor(
        public id: string,
        public lastUpdated: Date,
        public name: string,
        public cover: string,
        public screenshot: string,
        public relaseDate: Date
    ) {
    };
}