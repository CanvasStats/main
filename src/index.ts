import { getYear, initializeApp } from "./main";
import { ContentPair, type ColorCount, type JsonObject } from "./models";
import { getBlockStructure, renderTree } from "./modules/createNodeTree";
import { createColorCountPieChart, createLineGraph } from "./modules/d3Graphics";
import { addLoadingElement, clearMessages, comingSoonBlock, getRandomColor, makeElement } from "./modules/utils";
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
    statsContainer.innerHTML = "";
    mainLoader.classList.remove("hide");

    if (viewYear !== 2026 && countdownInterval) {
        clearInterval(countdownInterval);
        countdownInterval = null;
    }

    if (viewYear === 2026) {
        comingSoonBlock(statsContainer, countdownInterval, "2026-07-18T04:00:00.000Z", "2026-07-20T04:00:00.000Z");
    } else {
        
        const yearData = await getJsonBlocks(viewYear);
        let colorCounts: ColorCount[] = [];
        let pixelPerMinuteURL: string = "";
        if (yearData) yearData.blocks.forEach((block: any) => {
            const structure = getBlockStructure(block, viewYear);
            if (block.type === "color-grid") {
                colorCounts = mapColorCountJsonToInterface(block.data);
                const colorStat = document.createElement('article');
                colorStat.setAttribute('class', `${block.layout} colorStat`);
                
                const pieChartContainer = document.createElement('div');
                pieChartContainer.setAttribute('class', 'colorCountsPieChart');
                pieChartContainer.setAttribute('style', 'display: block; width: 100%; min-width: 300px; min-height: 300px;');
                colorStat.appendChild(pieChartContainer);
                
                const statSection = document.createElement('section');
                statSection.setAttribute('class', 'color-section');
                if (block.title) {
                    const statHeader = makeElement("h3", null, null, block.title);
                    statSection.appendChild(statHeader);
                }
                const toolTip = makeElement("div", "chart-tooltip", 'chart-tooltip', null);
                statSection.appendChild(toolTip);
                colorStat.appendChild(statSection);
                
                statsContainer.appendChild(colorStat);
                createColorCountPieChart(viewYear, colorCounts, pieChartContainer, true, "slice-clickable");
                
            } else if (block.type === "graph") {
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
            } else {
                renderTree(structure, statsContainer);
            }
        });
    }
    mainLoader.classList.add("hide");
}

function mapColorCountJsonToInterface(data: ColorCount[]) {
    return data.reduce((acc: ColorCount[], currentCount: ColorCount) => {
        const newCount: ColorCount = {class: currentCount['class'], label: currentCount['label'], count: currentCount['count'], hex: currentCount['hex']};
        acc.push(newCount);
        return acc;
    }, []);
}

main.append(mainLoader, statsContainer);
await updateStats();