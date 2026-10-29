export class Pixel {
    public username: string;
    public xCoordinate: number;
    public yCoordinate: number;
    public colorHex: string;
    public isTop: boolean;
    public isUndo: boolean;
    public isSpecial: boolean;
    public timePlaced: string;

    constructor(
        username: string,
        xCoordinate: number,
        yCoordinate: number,
        colorHex: string,
        isTop: boolean,
        isUndo: boolean,
        isSpecial: boolean,
        timePlaced: string,
    ) {
        this.username = username;
        this.xCoordinate = xCoordinate;
        this.yCoordinate = yCoordinate;
        this.colorHex = colorHex;
        this.isSpecial = isSpecial;
        this.isTop = isTop;
        this.isUndo = isUndo;
        this.timePlaced = timePlaced;
    }
}

export interface EventPixelTotal {
    eventLength: number,
    downtimeLength: number,
    totalPossiblePixels: number
}

export class DrawParams {
    public year: number;
    public username: string | null = null;
    public undo: boolean | null = null;
    public color: string | null = null;
    public special: string | null = null;
    public topOnly: boolean | null = null;
    constructor(
        year: number,
        username: string | null,
        undo: boolean | null,
        color: string | null,
        special: string | null,
        topOnly: boolean | null
    ) {
        this.year = year;
        if (username) this.username = username;
        if (undo) this.undo = undo;
        if (color) this.color = color;
        if (special) this.special = special;
        if (topOnly) this.topOnly = topOnly;
    }
}