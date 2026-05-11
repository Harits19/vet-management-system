


export const delay = (duration: number = 300) => {

    return new Promise((r) => setTimeout(r, duration));
}