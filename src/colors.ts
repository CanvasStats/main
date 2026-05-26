import { initializeApp } from "./main";
import type { ContentPair } from "./models";
import { makeElement } from "./modules/utils";

const main = document.querySelector("main") as HTMLElement;
const loading = document.getElementById("loading");

await initializeApp("Home", "Colors", true);

const colors: ContentPair[] = [
    {contentKey: "white", contentValue: "#ffffff | rgb(255, 255, 255)"},
    {contentKey: "light-grey", contentValue: "#b9c3cf | rgb(185, 195, 207)"},
    {contentKey: "medium-grey", contentValue: "#777f8c | rgb(119, 127, 140)"},
    {contentKey: "deep-grey", contentValue: "#424651 | rgb(66, 70, 81)"},
    {contentKey: "dark-grey", contentValue: "#1f1e26 | rgb(31, 30, 38)"},
    {contentKey: "black", contentValue: "#000000 | rgb(0, 0, 0)"},
    {contentKey: "dark-chocolate", contentValue: "#382215 | rgb(56, 34, 21)"},
    {contentKey: "chocolate", contentValue: "#7c3f20 | rgb(124, 63, 32)"},
    {contentKey: "brown", contentValue: "#c06f37 | rgb(192, 111, 55)"},
    {contentKey: "peach", contentValue: "#fead6c | rgb(254, 173, 108)"},
    {contentKey: "beige", contentValue: "#ffd2b1 | rgb(255, 210, 177)"},
    {contentKey: "pink", contentValue: "#ffa4d0 | rgb(255, 164, 208)"},
    {contentKey: "magenta", contentValue: "#f14fb4 | rgb(241, 79, 180)"},
    {contentKey: "mauve", contentValue: "#e973ff | rgb(23, 115, 255)"},
    {contentKey: "purple", contentValue: "#a630d2 | rgb(166, 48, 210)"},
    {contentKey: "dark-purple", contentValue: "#531d8c | rgb(83, 29, 140)"},
    {contentKey: "navy", contentValue: "#242367 | rgb(36, 35, 103)"},
    {contentKey: "blue", contentValue: "#0334bf | 3, 52, 191)"},
    {contentKey: "azure", contentValue: "#149cff | rgb(20, 156, 255)"},
    {contentKey: "aqua", contentValue: "#8df5ff | rgb(141, 245, 255)"},
    {contentKey: "light-teal", contentValue: "#01bfa5 | rgb(1, 191, 165)"},
    {contentKey: "dark-teal", contentValue: "#16777e | rgb(22, 119, 126)"},
    {contentKey: "forest", contentValue: "#054523 | rgb(5, 69, 35)"},
    {contentKey: "dark-green", contentValue: "#18862f | rgb(24, 134, 47)"},
    {contentKey: "green", contentValue: "#61e021 | rgb(97, 224, 33)"},
    {contentKey: "lime", contentValue: "#b1ff37 | rgb(177, 255, 55"},
    {contentKey: "pastel-yellow", contentValue: "#ffffa5 | rgb(255, 255, 165)"},
    {contentKey: "yellow", contentValue: "#fde111 | rgb(253, 225, 17)"},
    {contentKey: "orange", contentValue: "#ff9f17 | rgb(255, 159, 23)"},
    {contentKey: "rust", contentValue: "#f66e08 | rgb(246, 110, 8)"},
    {contentKey: "maroon", contentValue: "#550022 | rgb(85, 0, 34)"},
    {contentKey: "rose", contentValue: "#99011a | rgb(153, 1, 26)"},
    {contentKey: "red", contentValue: "#f30f0c | rgb(243, 15, 12)"},
    {contentKey: "watermelon", contentValue: "#ff7872 | rgb(255, 120, 114)"}
];

const colorDiv = colors.reduce((acc: HTMLElement, color: ContentPair) => {
    const newColor = makeElement("span", null, color.contentKey, color.contentValue);
    acc.appendChild(newColor);
    return acc;
}, makeElement("div", "color-palette", null, null));
main.appendChild(colorDiv);
if (loading) loading.remove();
main.classList.remove("hide");
