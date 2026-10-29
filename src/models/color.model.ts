export interface ColorsCounts {
    username: string,
    black: number,
    darkGrey: number,
    deepGrey: number,
    mediumGrey: number,
    lightGrey: number,
    white: number,
    beige: number,
    peach: number,
    brown: number,
    chocolate: number,
    rust: number,
    orange: number,
    yellow: number,
    pastelYellow: number,
    lime: number,
    green: number,
    darkGreen: number,
    forest: number,
    darkTeal: number,
    lightTeal: number,
    aqua: number,
    azure: number,
    blue: number,
    navy: number,
    purple: number,
    mauve: number,
    magenta: number,
    pink: number,
    watermelon: number,
    red: number,
    rose: number,
    maroon: number,
    darkChocolate: number,
    darkPurple: number
}

export interface ColorCount {
    class: string;
    label: string;
    count: number;
    hex: string;
}

export interface ColorJsonObject {
    label: string;
    class: string;
    hex: string;
    count: number;
}