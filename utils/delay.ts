/**
 * delay with async await for typescript
 * 
 * @param milliseconds number
 * @returns Promise
 */
export function delay(milliseconds: number) {
    return new Promise(resolve => {
        setTimeout(resolve, milliseconds);
    });
}