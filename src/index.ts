import { getYear, initializeApp } from "./main";
import { ContentPair, type ColorCount, type JsonObject } from "./models";
import { getBlockStructure, renderTree } from "./modules/createNodeTree";
import { createColorTreemap, createLineGraph } from "./modules/d3Graphics";
import { addLoadingElement, clearMessages, comingSoonBlock, createSocialBlock, getRandomColor, makeElement } from "./modules/utils";
import { getYears } from "./services/canvas.service";

let viewYear: number = 2026;
let yearColor: string = "white";
const years = getYears(false);
years.push(new ContentPair("2026", getRandomColor(20, true)));
const main = document.querySelector('main') as HTMLElement;
const mainLoader = addLoadingElement();
const statsContainer = makeElement("div", "stats-container", null, null) as HTMLElement;
const loading = document.getElementById("loading");

const yearDataCache: Record<string, JsonObject | undefined> = {};

let countdownInterval: number | null = null;

viewYear = getYear();
if (years.length > 0) {
    yearColor = years[years.length - 1].contentValue;
    statsContainer.classList.add(yearColor);
}

await initializeApp("Home", "Home", true);
const yearSelector = years.reduce((acc: HTMLElement, year: ContentPair) => {
    const yearButton = makeElement("div", year.contentKey, year.contentValue, year.contentKey);
    if (parseInt(year.contentKey) === viewYear) {
        yearButton.classList.add("active-year");
    }

    yearButton.onclick = async function () {
        viewYear = parseInt(year.contentKey);
        acc.className = `${year.contentValue}`;
        Array.from(acc.children).forEach((child) => {
            child.classList.remove("active-year");
        });
        yearButton.classList.add("active-year");
        statsContainer.className = year.contentValue;
        clearMessages();
        await updateStats();
    };

    acc.appendChild(yearButton);
    return acc;
}, makeElement("div", "year-selector", `${yearColor}`, null));

async function getJsonBlocks(year: number) {
    if (yearDataCache[year]) return yearDataCache[year];
    const response = await fetch(`https://raw.githubusercontent.com/CanvasStats/data-files/refs/heads/main/${year}/overview${year}.json`);
    const yearData = await response.json();
    yearDataCache[year] = yearData;
    return yearDataCache[year];
}

main.append(yearSelector);
if (loading) loading.remove();
main.classList.remove("hide");

async function updateStats() {
    const loadingText = document.getElementById("main-loader-text") as HTMLElement;
    statsContainer.innerHTML = "";
    mainLoader.classList.remove("hide");

    if (viewYear !== 2026 && countdownInterval) {
        clearInterval(countdownInterval);
        countdownInterval = null;
    }

    if (viewYear === 2026) {
        comingSoonBlock(statsContainer, countdownInterval, "2026-07-18T04:00:00.000Z", "2026-07-20T04:00:00.000Z");
        const socialBlock = createSocialBlock("right", "Stay Connected", "public", viewYear);
        statsContainer.appendChild(socialBlock);
    } else {
        const yearData = await getJsonBlocks(viewYear);
        let colorCounts: ColorCount[] = [];
        let pixelPerMinuteURL: string = "";
        if (yearData) yearData.blocks.forEach((block: any) => {
            const structure = getBlockStructure(block, viewYear);
            if (block.type === "color-grid") {
                loadingText.textContent = "Creating treemap chart";
                colorCounts = mapColorCountJsonToInterface(block.data);
                const treemap = makeElement("article", null, "right treemap", null);
                const treemapContainer = makeElement("div", null, 'colorCountsPieChart', null)
                treemapContainer.setAttribute('style', 'display: block; width: 100%; min-width: 300px; min-height: 300px;');
                treemap.appendChild(treemapContainer);

                const treemapTitle = makeElement("section", null, 'color-section', null);
                if (block.title) {
                    const clickP = makeElement("p", null, "text", "Click on a color to view the pixels on the canvas");

                    const statHeader = makeElement("h3", null, null, "Pixels by Color");
                    treemapTitle.append(statHeader, clickP);
                }
                treemap.appendChild(treemapTitle);
                statsContainer.appendChild(treemap);
                createColorTreemap(treemapContainer, colorCounts, true, viewYear);

            } else if (block.type === "graph") {
                loadingText.textContent = "Creating line graph";
                pixelPerMinuteURL = block.url;
                const graphStat = makeElement("article", null, block.layout, null);
                const statSection = makeElement("section", null, null, null);
                if (block.title) {
                    const statHeader = makeElement("h3", null, "center", block.title);
                    statSection.appendChild(statHeader);
                }
                const graphContainer = makeElement("div", "line-graph-container", null, null);
                graphContainer.setAttribute("style", "width: 100%; max-width: 800px; margin: auto;");
                statSection.appendChild(graphContainer);
                graphStat.appendChild(statSection);

                statsContainer.appendChild(graphStat);

                createLineGraph(pixelPerMinuteURL, graphContainer);
            } else if (block.type === "social") {
                const socialBlock = createSocialBlock(block.layout, block.title, block.icon, viewYear);
                statsContainer.appendChild(socialBlock);
            } else {
                renderTree(structure, statsContainer);
            }
        });
    }
    loadingText.textContent = "All Done";
    mainLoader.classList.add("hide");
}

function mapColorCountJsonToInterface(data: ColorCount[]) {
    return data.reduce((acc: ColorCount[], currentCount: ColorCount) => {
        const newCount: ColorCount = { class: currentCount['class'], label: currentCount['label'], count: currentCount['count'], hex: currentCount['hex'] };
        acc.push(newCount);
        return acc;
    }, []);
}

main.append(mainLoader, statsContainer);
await updateStats();