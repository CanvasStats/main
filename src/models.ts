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
    public rank_2023: number | null = null;
    public pixels_2023: number | null = null;
    public rank_2024: number | null = null;
    public pixels_2024: number | null = null;
    public rank_2025: number | null = null;
    public pixels_2025: number | null = null;

    constructor(
        instance_id: number,
        username: string,
        rank_2023: number | null,
        pixels_2023: number | null,
        rank_2024: number | null,
        pixels_2024: number | null,
        rank_2025: number | null,
        pixels_2025: number | null,
    ) {
        this.instance_id = instance_id;
        this.username = username;
        if (rank_2023) {
            this.rank_2023 = rank_2023;
            this.pixels_2023 = pixels_2023;
        }
        if (rank_2024) {
            this.rank_2024 = rank_2024;
            this.pixels_2024 = pixels_2024;
        }
        if (rank_2025) {
            this.rank_2025 = rank_2025;
            this.pixels_2025 = pixels_2025
        }
    }

    public yearParticipated() {
        let years = [];
        if (this.rank_2023) years.push(2023);
        if (this.rank_2024) years.push(2024);
        if (this.rank_2025) years.push(2025);
        return years;
    }

    public numYearsParticipated() {
        let numYears = 0;
        if (this.rank_2023) numYears += 1;
        if (this.rank_2024) numYears += 1;
        if (this.rank_2025) numYears += 1;
        return numYears;
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

    constructor(
        linkText: string,
        classes: string,
        external: boolean,
        queryParams?: { [key: string]: any },
        url?: string,
        page?: any
    ) {
        this.linkText = linkText;
        this.classes = classes;
        this.external = external;
        this.queryParams = queryParams;
        if (url) this.url = url;
        if (page) this.page = page
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