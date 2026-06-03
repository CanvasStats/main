import { getRandomColor } from "./modules/utils";

export class ContentPair {
    public contentKey: string;
    public contentValue: string;

    constructor(
        contentKey: string,
        contentValue: string
    ) {
        this.contentKey = contentKey;
        this.contentValue = contentValue;
    }
}

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

export interface UserItem {
    username: string;
    userRank?: number;
    yearsParticipated?: number;
    pixelsPlaced?: number;
}

export class UserRanks {
    public instance_id: number;
    public username: string;
    public ranks: Record<number, number> = {};
    public pixels: Record<number, number> = {};

    constructor(
        instance_id: number,
        username: string,
        ranksByYear?: Record<number, number | null>,
        pixelsByYear?: Record<number, number | null>
    ) {
        this.instance_id = instance_id;
        this.username = username;
        if (ranksByYear) {
            for (const [yearStr, rank] of Object.entries(ranksByYear)) {
                const year = Number(yearStr);
                if (rank) {
                    this.ranks[year] = rank;
                    const pixelCount = pixelsByYear?.[year];
                    if (pixelCount) {
                        this.pixels[year] = pixelCount;
                    }
                }
            }
        }
    }

    public yearParticipated() {
        const years = Object.keys(this.ranks).map(Number).sort((a, b) => a - b);
        return years;
    }

    public numYearsParticipated() {
        return Object.values(this.ranks).reduce((total) => total + 1, 0);
    }
}

export class User {
    public username: string;
    public userRank: number;
    public pixelCount: number;
    public xCord: number;
    public yCord: number;
    public cordCount: number;

    constructor(
        username: string,
        userRank: number,
        pixelCount: number,
        xCord: number,
        yCord: number,
        cordCount: number
    ) {
        this.username = username;
        this.userRank = userRank;
        this.pixelCount = pixelCount;
        this.xCord = xCord;
        this.yCord = yCord;
        this.cordCount = cordCount;
    }
}

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

export class Link {
    public linkText: string;
    public classes: string;
    public external: boolean;
    public queryParams?: { [key: string]: any };
    public url?: string;
    public page?: any;
    public svg?: any;

    constructor(
        linkText: string,
        classes: string,
        external: boolean,
        queryParams?: { [key: string]: any },
        url?: string,
        page?: any,
        svg?: any
    ) {
        this.linkText = linkText;
        this.classes = classes;
        this.external = external;
        this.queryParams = queryParams;
        if (url) this.url = url;
        if (page) this.page = page;
        if (svg) this.svg = svg;
    }
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

export class JsonBlock {
    public type: string;
    public layout: string;
    public icon?: string;
    public title?: string;
    public content?: (string | (string | Link)[])[];
    public data?: ColorJsonObject[];
    public url?: string;
    public items?: ContentPair[];
    public buttons?: Link[];

    constructor(
        type: string,
        layout: string,
        icon?: string,
        title?: string,
        content?: (string | (string | Link)[])[],
        data?: ColorJsonObject[],
        url?: string,
        items?: ContentPair[],
        buttons?: Link[]
    ) {
        this.type = type;
        this.layout = layout;
        if (icon) this.icon = icon;
        if (title) this.title = title;
        if (content) this.content = content;
        if (data) this.data = data;
        if (url) this.url = url;
        if (items) this.items = items;
        if (buttons) this.buttons = buttons;
    }
}

export interface ColorJsonObject {
    label: string;
    class: string;
    hex: string;
    count: number;
}

export interface JsonObject {
    year: number;
    username: string | undefined;
    blocks: JsonBlock[];

}

export class Instance {
    public instanceId: number;
    public instanceName: string;
    public users: Record<number, number> = {};
    public pixels: Record<number, number> = {};

    constructor(
        instanceId: number,
        instanceName: string,
        usersByYear?: Record<number, number | null>,
        pixelsByYear?: Record<number, number | null>
    ) {
        this.instanceId = instanceId;
        this.instanceName = instanceName;

        if (usersByYear) {
            for (const [yearStr, userCount] of Object.entries(usersByYear)) {
                const year = Number(yearStr);
                if (userCount) {
                    this.users[year] = userCount;
                    const pixelCount = pixelsByYear?.[year];
                    if (pixelCount) {
                        this.pixels[year] = pixelCount;
                    }
                }
            }
        }
    }

    /**
     * Calculates the sum of all users across all recorded years.
     * Automatically scales as new years are added.
     */
    public totalUsers(): number {
        return Object.values(this.users).reduce((total, count) => total + count, 0);
    }

    /**
     * Dynamically generates the active years based on pixel data.
     */
    public yearsActive(): ContentPair[] {
        const years = Object.keys(this.users).map(Number).sort((a, b) => a - b);
        
        return years.map((year, index) => ({
            contentKey: year.toString(),
            contentValue: getRandomColor(index + 1, true) 
        }));
    }
}

export interface DataRow {
    timestamp: Date;
    pixelCount: number;
}