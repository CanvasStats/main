import type { ColorCount } from '../models/color.model';
import { getBlockStructure, renderTree } from '../modules/createNodeTree.module';
import { createColorTreemap, createLineGraph } from '../modules/d3Graphics.module';
import { state } from '../modules/state.module';
import { loadSearchBar } from '../modules/templates.module';
import { addLoadingElement, clearMessages, createSocialBlock, makeElement } from '../modules/utils.module';
import { getYears } from '../services/canvas.service';

let viewYear: number = 2026;
const years: Record<string | number, string> = getYears(false);
let yearColor: string = years[state.currentYear];
const mainLoader = addLoadingElement();
const statsContainer = makeElement("div", "stats-container", yearColor, null) as HTMLElement;

export async function renderHomepage(container: HTMLElement) {
    loadSearchBar();
    document.title = "Canvas Stats";
    container.innerHTML = "";
    if (state.year) {
        viewYear = state.year;
    } else {
        viewYear = state.currentYear;
    }

    const main = makeElement("main", "mainContent", null, null);

    const yearSelector = Object.entries(years).reduce((acc: HTMLElement, [year, color]) => {
        const yearButton = makeElement("div", year, color, year);

        if (parseInt(year) === viewYear) {
            yearButton.classList.add("active-year");
        }

        yearButton.onclick = async function () {
            viewYear = parseInt(year);
            acc.className = `${year}`;
            Array.from(acc.children).forEach((child) => {
                child.classList.remove("active-year");
            });
            yearButton.classList.add("active-year");
            statsContainer.className = color;
            clearMessages();
            await updateStats();
        };

        acc.appendChild(yearButton);
        return acc;
    }, makeElement("div", "year-selector", `${yearColor}`, null));

    async function getJsonBlocks(year: number) {
        if (state.getFromYearCache(year)) return state.getFromYearCache(year);
        const response = await fetch(`https://raw.githubusercontent.com/CanvasStats/data-files/refs/heads/main/${year}/overview${year}.json`);
        const yearData = await response.json();
        state.addToYearCache(year, yearData)
        return yearData;
    }

    main.append(yearSelector);
    main.classList.remove("hide");

    async function updateStats() {
        const loadingText = document.getElementById("main-loader-text") as HTMLElement;
        statsContainer.innerHTML = "";
        mainLoader.classList.remove("hide");

        const yearData = await getJsonBlocks(viewYear);
        let colorCounts: ColorCount[] = [];
        let pixelPerMinuteURL: string = "";
        if (yearData) yearData.blocks.forEach((block: any) => {
            const structure = getBlockStructure(block);
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

                    const statHeader = makeElement("h3", null, null, block.title);
                    treemapTitle.append(statHeader, clickP);
                }
                treemap.appendChild(treemapTitle);
                statsContainer.appendChild(treemap);
                const dynamicRatio = window.innerWidth < 600 ? 1.0 : 0.6;
                createColorTreemap(treemapContainer, colorCounts, dynamicRatio, true, viewYear, 0);
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
    container.appendChild(main);
    await updateStats();

    const loadingElement = document.getElementById("loading") as HTMLElement;
    if (loadingElement) loadingElement.classList.add("hide");
}
