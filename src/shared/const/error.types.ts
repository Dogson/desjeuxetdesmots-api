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
    }
}