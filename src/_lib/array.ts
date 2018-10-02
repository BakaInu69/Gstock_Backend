export function isArrayUnique(myArray) {
    return myArray.length === new Set(myArray).size;
}