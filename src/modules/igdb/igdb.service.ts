import {BadRequestException, Injectable} from '@nestjs/common';
import {ERROR_TYPES} from "../../shared/const/error.types";
import axios from "axios";
import {CreateGameDto} from "../games/dto/games.dto";

@Injectable()
export class IgdbService {

    async getTwitchToken() {
        try {
            const result = await axios({
                url: process.env.TWITCH_AUTH_URL,
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    "X-Requested-With": "XMLHttpRequest"
                },
                params: {
                    client_id: process.env.TWITCH_CLIENT_ID,
                    client_secret: process.env.TWITCH_CLIENT_SECRET,
                    grant_type: 'client_credentials'
                }
            });
            return result.data.access_token;
        } catch (error) {
            throw new BadRequestException(ERROR_TYPES.twitch_token_error(error));
        }
    }

    /**
     * Create a new game
     * @param search : string part of game to search
     * @param noFilter : if true, filter games with no hypes and reviews
     * @param limit
     * @param token
     */
    async executeIgdbQuery(search, noFilter, limit, token): Promise<any> {
        const filter = noFilter ? "" : " & (total_rating_count != null | hypes > 1)";
        try {
            if (!token) {
                token = await this.getTwitchToken();
            }
            const response = await axios({
                url: process.env.IGDB_API_GAMES_URL,
                method: 'POST',
                headers: {
                    'Client-ID': process.env.TWITCH_CLIENT_ID,
                    'Authorization': `Bearer ${token}`
                },
                data: `fields id, name, cover.url, screenshots.url, release_dates.date, involved_companies.company.name, involved_companies.developer; sort total_rating_count desc; where (themes!= (42) ${filter}) & name~*"${search}"*; limit: ${limit};`

            });
            return response.data.length === 0 ? [] : this.mappedGames(response.data);
        } catch (err) {
            throw new BadRequestException(ERROR_TYPES.unable_to_execute_igdb_query(err));
        }
    }

    /**
     * Map IGDB games to CreateGameDTO
     * @param games
     * @private
     */
    mappedGames(games): CreateGameDto[] {
        return games
            .filter((game) => {
                return game.cover || game.screenshots;
            })
            .map((game) => {
                let cover = game.cover;
                let screenshot;
                cover = cover && cover.url.replace('/t_thumb/', '/t_cover_big/').replace('//', 'https://');
                if (game.screenshots && game.screenshots.length > 0) {
                    screenshot = game.screenshots[game.screenshots.length - 1].url.replace('/t_thumb/', '/t_screenshot_big/').replace('//', 'https://');
                }
                if (!cover) {
                    cover = screenshot;
                }
                if (!screenshot) {
                    screenshot = cover;
                }

                game.release_dates = game.release_dates && game.release_dates.map((release_date) => {
                    return release_date.date;
                })
                    .filter((date) => {
                        return date != null;
                    });

                const releaseDate = game.release_dates && game.release_dates.length > 0 ?
                    new Date(Math.min(...game.release_dates) * 1000) :
                    new Date(3376684800000);

                const involvedCompanies = game.involved_companies || [];
                const result = {
                    ...game,
                    companies: involvedCompanies
                        .filter((item) => {
                            return item.developer
                        })
                        .map((item) => {
                            return {
                                name: item.company.name,
                                igdbId: item.company.id
                            }
                        }),
                    igdbId: game.id.toString(),
                    cover: cover,
                    screenshot: screenshot,
                    releaseDate: releaseDate
                };
                delete result.involved_companies;
                delete result.release_dates;
                delete result.screenshots;
                delete result.id;
                return result;
            })
    }

}
