/**
 * Check if str is an ObjectId string
 * @param str
 */
export function isObjectId(str: string): boolean {
    return /^[0-9a-fA-F]{24}$/.test(str);
}