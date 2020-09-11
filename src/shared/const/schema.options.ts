import {SchemaOptions} from "@nestjs/mongoose";

export const DEFAULT_SCHEMA_OPTIONS: SchemaOptions = {
    timestamps: {
        createdAt: "_createdAt",
        updatedAt: "_updatedAt"
    }
}