import { getYear, initializeApp } from "./main";
import { ContentPair, type ColorCount } from "./models";
import { getBlockStructure, renderTree } from "./modules/createNodeTree";
import { createColorCountPieChart, createLineGraph } from "./modules/d3Graphics";
import { addLoadingElement, getRemainingTime, makeElement } from "./modules/utils";
import { getYears } from "./services/canvas.service";

let viewYear: number = 2026;
let yearColor: string = "white";
const years = getYears();
const main = document.querySelector('main') as HTMLElement;
const mainLoader = addLoadingElement();
const statsContainer = makeElement("div", "stats-container", null, null) as HTMLElement;
const loading = document.getElementById("loading");

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
        await updateStats();
    };

    acc.appendChild(yearButton);
    return acc;
}, makeElement("div", "year-selector", `${yearColor}`, null));

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
        const countdown = makeElement("article", null, "left", null);
        const countdownIcon = makeElement("span", null, "material-symbols-outlined icon", "hourglass_top");
        countdown.appendChild(countdownIcon);
        const countdownInfo = makeElement("section", null, null, null);
        const eventDate = makeElement("p", null, "text", "Canvas 2026 will start on July 18th.");
        const eventStart = new Date("2026-07-18T04:00:00.000Z");
        const initialRemaining = getRemainingTime(eventStart);
        const timerP = makeElement(
            "p", 
            null, 
            "text", 
            initialRemaining.isFinished 
                ? "Canvas 2026 is happening now!" 
                : `${initialRemaining.days} days ${initialRemaining.hours} hours ${initialRemaining.minutes} minutes ${initialRemaining.seconds} seconds`
        );

        countdownInfo.append(eventDate, timerP);
        countdown.appendChild(countdownInfo);
        statsContainer.appendChild(countdown);
        if (!countdownInterval && !initialRemaining.isFinished) {
            countdownInterval = window.setInterval(() => {
                const remaining = getRemainingTime(eventStart);
                timerP.innerText = `${remaining.days} day${remaining.days === 1 ? "": "s"} ${remaining.hours} hour${remaining.hours === 1 ? "" : "s"} ${remaining.minutes} minute${remaining.minutes === 1 ? "" : "s"} ${remaining.seconds} second${remaining.seconds === 1 ? "" : "s"}`;
                
                if (remaining.isFinished) {
                    clearInterval(countdownInterval!);
                    countdownInterval = null;
                    timerP.innerText = "Canvas 2026 is happening now!";
                }
            }, 1000);
        }

        const templateArticle = makeElement("article", null, "right", null);
        const templateIcon = makeElement("span", null, "material-symbols-outlined icon", "border_clear");
        const templateInfo = makeElement("section", null, null, null);
        const templateP = makeElement("p", null, "text", "You can start planning your designs by using the Template feature in Canvas's setting");
        const templateButtonRow = makeElement("div", null, "button-row center", null);
        const canvasLink = document.createElement("a") as HTMLAnchorElement;
        canvasLink.href = "https://canvas.fediverse.events/?2026";
        canvasLink.target = "_blank";
        canvasLink.className = "btn green";
        const canvasLinkText = document.createTextNode("Go to Canvas");
        const canvasLinkIcon = makeElement("span", null, "material-symbols-outlined", "open_in_new");
        canvasLink.append(canvasLinkText, canvasLinkIcon);
        templateButtonRow.appendChild(canvasLink);
        templateInfo.append(templateP, templateButtonRow);
        templateArticle.append(templateIcon, templateInfo);
        statsContainer.appendChild(templateArticle);

        const fullStatsArticle = makeElement("article", null, "left", null);
        const fullStatsIcon = makeElement("span", null, "material-symbols-outlined icon", "info");
        const fullStatsInfo = makeElement("section", null, null, null);
        const fullStatsP = makeElement("p", null, "text", "Canvas Stats will be updated with full stats, graphs, and user rankings a day or 2 after the event concludes.");
        fullStatsInfo.appendChild(fullStatsP);
        fullStatsArticle.append(fullStatsIcon, fullStatsInfo);
        statsContainer.appendChild(fullStatsArticle);

        const externalLinksArticle = makeElement("article", null, "right", null);
        const externalLinksIcon = makeElement("span", null, "material-symbols-outlined icon", "public");
        const externalLinksInfo = makeElement("section", null, null, null);
        const externalLinksH3 = makeElement("h3", null, null, "Stay Connected");

        const links: ContentPair[] = [
            { contentKey: "Lemmy", contentValue: "https://toast.ooo/c/canvas" },
            { contentKey: "Mastodon", contentValue: "https://social.fediverse.events/@canvas" },
            { contentKey: "Matrix Space", contentValue: "https://matrix.to/#/#canvas:aftermath.gg?via=matrix.org" },
            { contentKey: "https://discord.gg/XrDSJ2WJqa", contentValue: "Discord Server" },
            { contentKey: "fediverse.events", contentValue: "https://fediverse.events/" }
        ];
        const linksUL = links.reduce((acc: HTMLElement, link: ContentPair) => {
            const linkLi = document.createElement("li");
            const newLink = document.createElement("a") as HTMLAnchorElement;
            newLink.href = link.contentValue;
            newLink.textContent = link.contentKey;
            newLink.target = "_blank";
            externalLinksInfo.appendChild(newLink);
            linkLi.appendChild(newLink);
            acc.appendChild(linkLi);
            return acc;
        }, document.createElement("ul"));
        externalLinksInfo.append(externalLinksH3, linksUL);
        externalLinksArticle.append(externalLinksIcon, externalLinksInfo);
        statsContainer.appendChild(externalLinksArticle);
    } else {
        const response = await fetch(`https://raw.githubusercontent.com/CanvasStats/data-files/refs/heads/main/${viewYear}/overview${viewYear}.json`);
        const yearData = await response.json();
        let colorCounts: ColorCount[] = [];
        let pixelPerMinuteURL: string = "";
        
        yearData.blocks.forEach((block: any) => {
            const structure = getBlockStructure(block, viewYear);
            if (block.type === "color-grid") {
                colorCounts = mapColorCountJsonToInterface(block.data);
                const colorStat = document.createElement('article');
                colorStat.setAttribute('class', `${block.layout} colorStat`);
                
                const pieChartContainer = document.createElement('div');
                pieChartContainer.setAttribute('class', 'colorCountsPieChart');
                // Added structural layout configuration values directly to prevent grid-collapsing anomalies
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