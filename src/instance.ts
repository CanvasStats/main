import { initializeApp } from "./main";
import type { ContentPair, DataRow, Instance, UserItem } from "./models";
import { getBlockStructure, renderTree } from "./modules/createNodeTree";
import { createColorTreemap, createLineGraph } from "./modules/d3Graphics";
import { navigateTo } from "./modules/navigate";
import { addLoadingElement, clearMessages, createButton, createMessage, makeElement, storeMessage } from "./modules/utils";
import { getAllUsersForInstance, getColorCountsForInstance, getFinalPixelsCountForInstance, getInstanceForId, getInstanceNameForId, getPixelsForInstance, getPixelsPerHourForInstance } from "./services/instances.service";

let viewYear: string = "2025";
let yearColor: string = "";
let instanceId: number = 0;
let instanceName: string = "";
let years: ContentPair[] = [];
const main = document.querySelector('main') as HTMLElement;
const statsContainer = makeElement("div", "stats-container", null, null) as HTMLElement;
const mainLoader = addLoadingElement();
const loading = document.getElementById("loading");
let stop: boolean = false;

const urlParams = new URLSearchParams(window.location.search);
let instanceIdString: string | null = urlParams.get('id');
if (instanceIdString) {
    if (isNaN(parseInt(instanceIdString))) {
        storeMessage("Error: invalid instance ID. Please try again", "main-message", "error");
        stop = true;
        navigateTo("/instances/");
    } else {
        instanceId = +instanceIdString;
        const name = await getInstanceNameForId(instanceId);
        if (!name) {
            storeMessage("Error: invalid instance ID. Please try again", "main-message", "error");
            stop = true;
            navigateTo("/instances/");
        } else {
            instanceName = name ? name : "";
        }
    }
} else {
    storeMessage("Error: invalid instance ID. Please try again", "main-message", "error");
    stop = true;
    navigateTo("/instances/");
}

if (!stop) await initializeApp("Instances", "Instances", true);

const instanceInfo: Instance | null = await getInstanceForId(instanceId);

const yearString: string | null = urlParams.get('year');
years = instanceInfo ? instanceInfo.yearsActive() : [];
if (yearString) {
    const searchYear = years.find(year => year.contentKey === yearString);
    if (searchYear) {
        yearColor = searchYear.contentValue;
        viewYear = searchYear.contentKey;
    } else {
        createMessage(`No users from ${instanceName} participated in ${yearString}`, "main-message", "warning");
        viewYear = years[years.length - 1].contentKey;
        yearColor = years[years.length - 1].contentValue;
    }

} else {
    viewYear = years[years.length - 1].contentKey;
    yearColor = years[years.length - 1].contentValue;
}

const yearSelector = years.reduce((acc: HTMLElement, year: ContentPair) => {
    const yearButton = makeElement("div", year.contentKey, year.contentValue, year.contentKey);
    if (year.contentKey === viewYear) {
        yearButton.classList.add("active-year");
    }

    yearButton.onclick = async function () {
        viewYear = year.contentKey;
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

main.appendChild(yearSelector);
if (loading) loading.remove();
main.classList.remove("hide");

const nameH2 = makeElement("h2", null, null, instanceName);
main.appendChild(nameH2);

async function updateStats() {
    const loadingText = document.getElementById("main-loader-text") as HTMLElement;
    mainLoader.classList.remove("hide");
    statsContainer.classList.add("hide");
    statsContainer.innerHTML = "";

    try {
        loadingText.textContent = "Getting users for instance";
        let users: UserItem[] = [];
        let pixelsPlaced: number = 0;
        if (instanceIdString) users = await getAllUsersForInstance(parseInt(instanceIdString), +viewYear);
        const usernames: string[] = users.reduce((acc: string[], user: UserItem) => {
            acc.push(user.username.toLowerCase());
            return acc;
        }, []);
        loadingText.textContent = "Getting pixels for instance";
        const instancePixels = await getPixelsForInstance(usernames, +viewYear);
        let pixelsPerHour: DataRow[] | undefined = await getPixelsPerHourForInstance(instancePixels);

        const usersArticle = makeElement("article", null, "left", null);
        const usersIcon = makeElement("span", null, "material-symbols-outlined icon", "group");
        const usersInfo = makeElement("section", null, null, null);
        const usersP = makeElement("p", null, "text", `${users.length} users from ${instanceName} participated in Canvas ${viewYear}`);
        const buttonRow = makeElement("div", null, "button-row center", null);
        const viewUsers = createButton("green", `View ${viewYear} user list`);
        viewUsers.onclick = function () { navigateTo("/instances/users", { params: { id: instanceId, year: viewYear } }) }
        buttonRow.appendChild(viewUsers);
        usersInfo.append(usersP, buttonRow);
        usersArticle.append(usersIcon, usersInfo);
        statsContainer.appendChild(usersArticle);

        const pixelsArticle = makeElement("article", null, "right", null);
        const pixelsIcon = makeElement("span", null, "material-symbols-outlined icon", "grid_view");
        const pixelsInfo = makeElement("section", null, null, null);
        const pixelsP = makeElement("p", null, "text", null);
        pixelsPlaced = instanceInfo?.pixels[+viewYear] ? instanceInfo?.pixels[+viewYear] : 0;
        loadingText.textContent = "Counting pixels placed";
        pixelsP.textContent = `${pixelsPlaced} total pixels where placed on the canvas by users of ${instanceName}`;
        pixelsInfo.appendChild(pixelsP);
        pixelsArticle.append(pixelsIcon, pixelsInfo);
        statsContainer.appendChild(pixelsArticle);

        loadingText.textContent = "Calculating final pixels";
        const finalPixelsCount = await getFinalPixelsCountForInstance(instancePixels)
        const finalArticle = makeElement("article", null, "left", null);
        const finalIcon = makeElement("span", null, "material-symbols-outlined icon", "arrow_shape_up_stack_2");
        const finalInfo = makeElement("section", null, null, null);
        const finalP = makeElement("p", null, "text", `${finalPixelsCount} pixels (${((finalPixelsCount / pixelsPlaced) * 100).toFixed(2)}%) placed by ${instanceName} made it to the final image at the end of the event`);
        finalInfo.appendChild(finalP);
        finalArticle.append(finalIcon, finalInfo);
        statsContainer.appendChild(finalArticle);

        loadingText.textContent = "Counting colors";
        const colorCounts = await getColorCountsForInstance(instancePixels);
        const colorStat = makeElement("article", null, "right treemap", null);
        const treemapContainer = document.createElement('div');
        treemapContainer.setAttribute('class', 'colorCountsPieChart');
        treemapContainer.setAttribute('style', 'display: block; width: 100%; min-width: 300px; min-height: 300px;');
        colorStat.appendChild(treemapContainer);
        const treemapHeader = makeElement("h3", null, null, "Pixels by Color");
        colorStat.append(treemapContainer, treemapHeader);
        statsContainer.appendChild(colorStat);
        const dynamicRatio = window.innerWidth < 600 ? 1.0 : 0.6;
        if (colorCounts) createColorTreemap(treemapContainer, colorCounts, dynamicRatio, false, +viewYear, 0);

        loadingText.textContent = "Calculating pixels placed per hour";
        const graphStat = makeElement("article", null, "left", null);
        const statSection = makeElement("section", null, null, null);
        const statHeader = makeElement("h3", null, "center", "Pixels Placed Per Hour");
        statSection.appendChild(statHeader);
        const graphContainer = makeElement("div", "line-graph-container", null, null);
        graphContainer.setAttribute("style", "width: 100%; max-width: 800px; margin: auto;")
        statSection.appendChild(graphContainer);
        graphStat.appendChild(statSection);
        statsContainer.appendChild(graphStat);
        if (pixelsPerHour) createLineGraph(pixelsPerHour, graphContainer);
        const drawBlock = {
            type: "button-group",
            layout: "right",
            title: `View all pixels placed by ${instanceName}`,
            icon: "dashboard_customize",
            buttons: [
                {
                    linkText: "on white background",
                    classes: "white",
                    page: "/draw",
                    queryParams: { "sentFrom": "instance", "year": viewYear, "background": "white", "id": instanceId },
                    external: false
                },
                {
                    linkText: "on black background",
                    classes: "black",
                    page: "/draw",
                    queryParams: { "sentFrom": "instance", "year": viewYear, "background": "black", "id": instanceId },
                    external: false
                },
                {
                    linkText: "on transparent background",
                    classes: "dark-grey",
                    page: "/draw",
                    queryParams: { "sentFrom": "instance", "year": viewYear, "background": "transparent", "id": instanceId },
                    external: false
                }
            ]
        }
        const structure = getBlockStructure(drawBlock, parseInt(viewYear));
        renderTree(structure, statsContainer);
        loadingText.textContent = "All done!";
    } catch (error: any) {
        createMessage(error, "main-message", "error");
    }

    statsContainer.classList.remove("hide");
    mainLoader.classList.add("hide");

}




main.append(mainLoader, statsContainer);
await updateStats();