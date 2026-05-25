import { initializeApp } from "./main";
import type { ColorCount, ContentPair, JsonObject } from "./models";
import { getBlockStructure, renderTree } from "./modules/createNodeTree";
import { createColorCountPieChart, createLineGraph } from "./modules/d3Graphics";
import { navigateTo } from "./modules/navigate";
import { addLoadingElement, clearMessages, createMessage, makeElement, storeMessage } from "./modules/utils";
import { getYears } from "./services/canvas.service";
import { GetColorCountForUsername, getPixelsPerHourForUser, getUserStats, getYearsForUsername } from "./services/users.service";

interface DataRow {
    timestamp: Date;
    pixelCount: number;
}

const main = document.querySelector('main') as HTMLElement;
const statsContainer = makeElement("div", "stats-container", null, null) as HTMLElement;
const mainLoader = addLoadingElement();

let viewYear: number = 2025;
let yearColor: string = "";
let username: string = "";

const years = getYears(false);
const urlParams = new URLSearchParams(window.location.search);
const usernameString: string | null = urlParams.get('username');
const yearString: string | null = urlParams.get('year');
if (yearString) viewYear = parseInt(yearString);
if (years.length > 0) {
    const findYear = years.find(year => parseInt(year.contentKey) === viewYear);
    if (findYear) {
        yearColor = findYear.contentValue;
    } else {
        yearColor = years[years.length - 1].contentValue;
    }
} else {
    yearColor = "white";
}

await initializeApp("Users", usernameString!, true);
if (usernameString) {
    username = usernameString;
    let yearsUserParticipated: number[] = []
    try {
        yearsUserParticipated = await getYearsForUsername(usernameString);
    } catch (error: any) {
        storeMessage(`${usernameString} not found`, "main-message", "error");
        navigateTo("/users");
    }
    if (yearString) {
        if (yearsUserParticipated.includes(parseInt(yearString))) {
            viewYear = parseInt(yearString);
        } else {
            const searchForYear = years.find(year => parseInt(year.contentKey) === viewYear);
            if (!searchForYear) {
                console.error(`${viewYear} is not a valid year`);
            } else {
                createMessage(`${username} did not participate in ${yearString}`, "main-message", "warning");
            }
            viewYear = yearsUserParticipated[yearsUserParticipated.length - 1];
        }
    } else {
        viewYear = yearsUserParticipated[yearsUserParticipated.length - 1];
    }

    const yearSelector = years.reduce((acc: HTMLElement, year: ContentPair) => {
        if (yearsUserParticipated.includes(parseInt(year.contentKey))) {
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
        }
        return acc;
    }, makeElement("div", "year-selector", `${yearColor}`, null));

    main.appendChild(yearSelector);
    const loading = document.getElementById("loading");
    if (loading) loading.remove();
    main.classList.remove("hide");
} else {
    navigateTo("/users");
}

async function updateStats() {
    statsContainer.innerHTML = "";
    mainLoader.classList.remove("hide");
    const userData: JsonObject | null = await getUserStats(username, viewYear);
    let userColorCounts: ColorCount[] | null = await GetColorCountForUsername(viewYear, username);
    let pixelsPerHour: DataRow[] | undefined = await getPixelsPerHourForUser(viewYear, username);
    if (userData) {
        const usernameHeading = makeElement("h2", null, null, username);
        statsContainer.appendChild(usernameHeading);
        const pieChartContainer = document.createElement('div');
        userData.blocks.forEach(async (block: any) => {
            const structure = getBlockStructure(block, viewYear);
            if (block.type === "user-color-grid") {
                const colorStat = document.createElement('article');
                colorStat.setAttribute('class', `${block.layout} colorStat`);

                pieChartContainer.setAttribute('id', 'colorCountsPieChart');
                colorStat.appendChild(pieChartContainer);
                const statSection = document.createElement('section');
                statSection.setAttribute('class', 'color-section');
                if (block.title) {
                    const statHeader = makeElement("h3", null, null, block.title);
                    statSection.appendChild(statHeader);
                }
                const toolTip = document.createElement('div');
                toolTip.setAttribute('id', 'tooltip');
                statSection.appendChild(toolTip);
                colorStat.appendChild(statSection);
                statsContainer.appendChild(colorStat);
            } else if (block.type === "graph") {
                const graphStat = makeElement("article", null, block.layout, null);
                const statSection = makeElement("section", null, null, null);
                if (block.title) {
                    const statHeader = makeElement("h3", null, "center", block.title);
                    statSection.appendChild(statHeader);
                }
                const graphContainer = makeElement("div", "line-graph-container", null, null);
                graphContainer.setAttribute("style", "width: 100%; max-width: 800px; margin: auto;")
                statSection.appendChild(graphContainer);
                graphStat.appendChild(statSection);
                statsContainer.appendChild(graphStat);
                if (userColorCounts) createColorCountPieChart(2025, userColorCounts, pieChartContainer, false, "slice-clickable");
                if (pixelsPerHour) createLineGraph(pixelsPerHour, graphContainer);
            } else {
                renderTree(structure, statsContainer);
            }
        });
    } else {
        createMessage(`Could not load ${username}'s data for ${viewYear}`, "main-message", "error");
    }
    mainLoader.classList.add("hide");
}

main.append(mainLoader, statsContainer);
await updateStats();