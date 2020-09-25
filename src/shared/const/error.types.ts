/**
 * Various error messages returned for different HTTP errors
 */

export const ERROR_TYPES = {
    invalid_credentials: {
        error: "invalid_credentials",
        message: "Invalid username/password."
    },
    invalid_auth: {
        error: "invalid_auth",
        message: "Invalid Authorization header"
    },
    token_error: (errorStack) => {
        return {
            error: "token_error",
            message: `Token error: ${errorStack}.`
        }
    },
    cannot_generate_token: (errorStack) => {
        return {
            error: "cannot_generate_token",
            message: `Cannot generate token: ${errorStack}.`
        }
    },
    user_already_exists: {
        error: "user_already_exists",
        message: "User already exists"
    },
    validation_no_body: {
        error: "validation_no_body",
        message: "Validation failed: no body submitted."
    },
    validation: (errorStack) => {
        return {
            error: "validation",
            message: `Validation failed: ${errorStack}.`
        }
    },
    not_found: (item) => {
        return {
            error: "not_found",
            message: `Could not find ${item}.`
        }
    },
    duplicate_key: (item) => {
        return {
            error: "duplicate_key",
            message: `a document with unique key-value ${item} already exists in the collection`
        }
    },
    wrong_rss_format: (err) => {
        return {
            error: "wrong_rss_format",
            message: `This error occured during the parsing of the RSS feed: ${err}`
        }
    },
    unable_to_parse_games: (err) => {
        return {
            error: "unable_to_parse_games",
            message: `Unable to parse / fetch games: ${err}`
        }
    },
    unable_to_execute_igdb_query: (err) => {
        return {
            error: "unable_to_execute_igdb_query",
            message: `Unable to execute the IGDB query : ${err}`
        }
    },
    bad_game: (err) => {
        return {
            error: "bad_game",
            message: `This game is wrongly formatted : ${err} \n Please provide an existing gameId or a correct igdb game information`
        }
    },
    twitch_token_error: (err) => {
        return {
            error: "twitch_token_error",
            message: `An error occured while trying to get the IGDB access token from twitch : ${err}`
        }
    },
};