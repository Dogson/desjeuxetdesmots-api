/**
 * Response object format sent by the API
 */
export class MediaResponseObject {
    readonly name: string;
    readonly logo: string;
    readonly description: string;
    readonly type: "podcast" | "video";
}