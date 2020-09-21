/**
 * Check if str is an ObjectId string
 * @param str
 */
export function isObjectId(str: string): boolean {
    return /^[0-9a-fA-F]{24}$/.test(str);
}

/**
 * Do a forEach async function for an array
 * @param array
 * @param callback
 */
export async function asyncForEach(array, callback) {
    for (let index = 0; index < array.length; index++) {
        await callback(array[index], index, array);
    }
}

export async function asyncMap(array, callback) {
    for (let index = 0; index < array.length; index++) {
        array[index] = callback(array[index], index, array);
    }
}

export function removeEmptyAttrFromObj(obj) {
    Object.keys(obj).forEach(key => {
        if (obj[key] && typeof obj[key] === 'object') removeEmptyAttrFromObj(obj[key]);
        else if (obj[key] == null || obj[key] === "") delete obj[key];
    });
    return obj;
}