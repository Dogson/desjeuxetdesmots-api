import {SchemaOptions} from "@nestjs/mongoose";

/**
 * Default Mongoose schema options
 * Allowing here to auto generate created and updated datetime
 */
export const DEFAULT_SCHEMA_OPTIONS: SchemaOptions = {
    timestamps: {
        createdAt: "_createdAt",
        updatedAt: "_updatedAt"
    }
}