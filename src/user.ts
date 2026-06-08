import { initializeApp } from "./main";
import type { ColorCount, ContentPair, DataRow, JsonObject } from "./models";
import { getBlockStructure, renderTree } from "./modules/createNodeTree";
import { createColorTreemap, createLineGraph } from "./modules/d3Graphics";
import { navigateTo } from "./modules/navigate";
import { addLoadingElement, clearMessages, createMessage, makeElement, storeMessage } from "./modules/utils";
import { getYears } from "./services/canvas.service";
import { GetColorCountForUsername, getPixelsPerHourForUser, getUserStats, getYearsForUsername } from "./services/users.service";



const main = document.querySelector('main') as HTMLElement;
const statsContainer = makeElement("div", "stats-container", null, null) as HTMLElement;
const mainLoader = addLoadingElement();

let viewYear: number = 2025;
let yearColor: string = "";
let username: string = "";

const years = getYears(false);
const urlParams = new URLSearchParams(window.location.search);
const usernameString: string | null = urlParams.get('name');
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
        navigateTo("/users/");
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
    navigateTo("/users/");
}

async function updateStats() {
    const loadingText = document.getElementById("main-loader-text") as HTMLElement;
    statsContainer.innerHTML = "";
    mainLoader.classList.remove("hide");
    loadingText.textContent = "Getting user stats";
    const userData: JsonObject | null = await getUserStats(username, viewYear);
    loadingText.textContent = "Getting color counts";
    let userColorCounts: ColorCount[] | null = await GetColorCountForUsername(viewYear, username);
    loadingText.textContent = "Calculating pixels placed per hour";
    let pixelsPerHour: DataRow[] | undefined = await getPixelsPerHourForUser(viewYear, username);
    if (userData) {
        const usernameHeading = makeElement("h2", null, null, username);
        statsContainer.appendChild(usernameHeading);
        userData.blocks.forEach(async (block: any) => {
            const structure = getBlockStructure(block, viewYear);
            if (block.type === "user-color-grid") {
                loadingText.textContent = "Creating pie chart";
                const colorStat = makeElement("article", null, "right treemap", null);
                const treemapContainer = document.createElement('div');
                treemapContainer.setAttribute('class', 'colorCountsPieChart');
                treemapContainer.setAttribute('style', 'display: block; width: 100%; min-width: 300px; min-height: 300px;');
                colorStat.appendChild(treemapContainer);
                if (block.title) {
                    const statHeader = makeElement("h3", null, null, block.title);
                    colorStat.appendChild(statHeader);
                }
                statsContainer.appendChild(colorStat);
                const dynamicRatio = window.innerWidth < 600 ? 1.0 : 0.6;
                if (userColorCounts) createColorTreemap(treemapContainer, userColorCounts, dynamicRatio, false, viewYear);

            } else if (block.type === "graph") {
                loadingText.textContent = "Creating line graph";
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
                if (pixelsPerHour) createLineGraph(pixelsPerHour, graphContainer);
            } else {
                renderTree(structure, statsContainer);
            }
        });
    } else {
        createMessage(`Could not load ${username}'s data for ${viewYear}`, "main-message", "error");
    }
    loadingText.textContent = "All Done!";
    mainLoader.classList.add("hide");
}

main.append(mainLoader, statsContainer);
await updateStats();