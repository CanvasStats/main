import type { ColorJsonObject } from "./color.model";

// export class ContentPair {
//     public contentKey: string;
//     public contentValue: string;

//     constructor(
//         contentKey: string,
//         contentValue: string
//     ) {
//         this.contentKey = contentKey;
//         this.contentValue = contentValue;
//     }
// }

// export interface stringNumberPair {
//     key: string,
//     value: number
// }

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

export interface JsonObject {
    year: number;
    username: string | undefined;
    blocks: JsonBlock[];

}

export interface DataRow {
    timestamp: Date;
    value: number;
}

export class JsonBlock {
    public type: "standard" | "color-grid" | "graph" | "list" | "button-group" | "social" | "user-color-grid";
    public layout: "left" | "right";
    public icon?: string;
    public title?: string;
    public content?: (string | Link)[];
    public data?: ColorJsonObject[];
    public url?: string;
    public items?: {key: string, value: any}[];
    public buttons?: Link[];

    constructor(
        type: "standard" | "color-grid" | "graph" | "list" | "button-group" | "social" | "user-color-grid",
        layout: "left" | "right",
        icon?: string,
        title?: string,
        content?: (string | Link)[],
        data?: ColorJsonObject[],
        url?: string,
        items?: {key: string, value: any}[],
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