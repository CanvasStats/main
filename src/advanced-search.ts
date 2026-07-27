import { initializeApp } from "./main";
import { ContentPair, JsonBlock, Pixel, type DataRow } from "./models";
import { getBlockStructure, renderTree } from "./modules/createNodeTree";
import { createLineGraph } from "./modules/d3Graphics";
import { navigateTo } from "./modules/navigate";
import { clearMessages, createButton, createInput, createMessage, makeElement } from "./modules/utils";
import { getPixelDataForYear, getYears } from "./services/canvas.service";

const loading = document.getElementById("loading");
const searching = document.getElementById("searching") as HTMLElement;
const main = document.querySelector("main") as HTMLElement;
const formsSection = document.getElementById("forms") as HTMLElement;
const resultsSection = document.getElementById("results") as HTMLElement;

const years = getYears(false);

await initializeApp("Advanced Search", "Advanced Search", false);

interface BoundingBox {
    topLeftX: number;
    topLeftY: number;
    bottomRightX: number;
    bottomRightY: number;
}

async function searchArea(formData: FormData) {
    const searchAreaSelection = formData.get("search-area");
    const topX = formData.get("top-x");
    const topY = formData.get("top-y");
    const bottomX = formData.get("bottom-x");
    const bottomY = formData.get("bottom-y");
    const year = formData.get("year-to-search");
    let resultsTitle = "";
    if (!year) {
        createMessage("Please select a year", "main-message", "error");
        return;
    } if (searchAreaSelection && !topX && !topY) {
        createMessage("Please make sure you have filled in all fields", "main-message", "error");
        return;
    } else if (searchAreaSelection && searchAreaSelection === "area" && !bottomX && !bottomY) {
        createMessage("Please make sure you have filled in all fields", "main-message", "error");
        return;
    }
    clearMessages();
    formsSection.classList.add("hide");
    searching.classList.remove("hide");
    resultsSection.innerHTML = "";
    resultsSection.classList.remove("hide");

    const pixelsForYear: Pixel[] | null = await getPixelDataForYear(+year);
    let filteredPixels: Pixel[] | null = null;
    if (searchAreaSelection && searchAreaSelection === "area" && topX && topY && bottomX && bottomY && year) {
        resultsTitle = `(${topX}, ${topY}) to (${bottomX}, ${bottomY})`;
        if (pixelsForYear) {
            const bounds: BoundingBox = { topLeftX: +topX, topLeftY: +topY, bottomRightX: +bottomX, bottomRightY: +bottomY }
            filteredPixels = pixelsForYear.filter((pixel) => {
                const isInXBounds = pixel.xCoordinate >= bounds["topLeftX"] && pixel.xCoordinate <= bounds["bottomRightX"];
                const isInYBounds = pixel.yCoordinate >= bounds["topLeftY"] && pixel.yCoordinate <= bounds["bottomRightY"];
                return isInXBounds && isInYBounds;
            });
            updateResults(filteredPixels, resultsTitle, +year);
        }
    } else if (searchAreaSelection && searchAreaSelection === "single-pixel" && topX && topY && year) {
        resultsTitle = `(${topX}, ${topY})`;
        if (pixelsForYear) {
            filteredPixels = pixelsForYear.filter(pixel => pixel["xCoordinate"] === +topX && pixel["yCoordinate"] === +topY);
            updateResults(filteredPixels, resultsTitle, +year);
        }
    }
}

async function getPixelsPerHourForSearch(searchPixels: Pixel[]) {
    if (searchPixels) {
        const firstPixel = searchPixels[0];
        const lastPixel = searchPixels[searchPixels.length - 1];
        const sortedPixels = [...searchPixels].sort(
            (a, b) => new Date(a.timePlaced).getTime() - new Date(b.timePlaced).getTime()
        );
        const firstPixelDate = new Date(firstPixel.timePlaced);
        const lastPixelDate = new Date(lastPixel.timePlaced);
        let currentHour = new Date(firstPixelDate);
        currentHour.setMinutes(0, 0, 0);

        const result: DataRow[] = [];
        while (currentHour <= lastPixelDate) {
            const nextHour = new Date(currentHour);
            nextHour.setHours(currentHour.getHours() + 1);
            const pixelsInHour = sortedPixels.filter((p) => {
                const pDate = new Date(p.timePlaced);
                return pDate >= currentHour && pDate < nextHour;
            });

            result.push({
                timestamp: new Date(currentHour.toISOString()),
                value: pixelsInHour.length,
            });
            currentHour = nextHour;
        }
        return result;
    }
}

async function updateResults(filteredPixels: Pixel[], title: string, year: number) {
    const resultsH2 = makeElement("h2", null, null, `Results for ${title}`);
    const statsContainer = makeElement("div", "stats-container", null, null) as HTMLElement;
    if (filteredPixels) {
        const counts: Record<string, number> = filteredPixels.reduce((acc, pixel) => {
            const user = pixel.username;
            acc[user] = (acc[user] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const userPairs: ContentPair[] = Object.entries(counts)
            .sort(([, countA], [, countB]) => countB - countA)
            .map(([username, count]) =>
                new ContentPair(username, `${count} pixel${count === 1 ? '' : 's'}`)
            );

        const resultsJson: JsonBlock[] = [
            {
                type: "standard",
                layout: "left",
                icon: "grid_view",
                content: [
                    `${filteredPixels.length} pixel${filteredPixels.length !== 1 ? "s were" : " was"} placed.`
                ]
            },
            {
                type: "list",
                title: `${userPairs.length} user${userPairs.length !== 1 ? "s" : ""} placed pixels${userPairs.length > 0 ? ":" : ""}`,
                layout: "right",
                items: userPairs
            }
        ];
        resultsJson.forEach((block: JsonBlock) => {
            const structure = getBlockStructure(block, +year);
            renderTree(structure, statsContainer);
        });
        resultsSection.append(resultsH2, statsContainer);
    }
    const pixelsPerHour = await getPixelsPerHourForSearch(filteredPixels);
    if (pixelsPerHour) {
        const graphStat = makeElement("article", null, "left", null);
        const statSection = makeElement("section", null, null, null);
        const statHeader = makeElement("h3", null, "center", `Pixels Placed Per Hour ${title.includes("to") ? "within" : "on"} ${title}`);
        statSection.appendChild(statHeader);
        const graphContainer = makeElement("div", "line-graph-container", null, null);
        graphContainer.setAttribute("style", "width: 100%; max-width: 800px; margin: auto;")
        statSection.appendChild(graphContainer);
        graphStat.appendChild(statSection);
        statsContainer.appendChild(graphStat);
        if (pixelsPerHour) createLineGraph(pixelsPerHour, graphContainer);
    }

    const btnRow = makeElement("div", null, "button-row", null);
    const modifySearch = createButton("purple", "Modify Search", "edit");
    modifySearch.addEventListener("click", () => {
        resultsSection.classList.add("hide");
        formsSection.classList.remove("hide");
    });
    const newSearch = createButton("blue", "New Search", "search");
    newSearch.addEventListener("click", () => {
        searchAreaForm.reset();
        const areaRadio = document.getElementById("area") as HTMLInputElement;
        if (areaRadio) areaRadio.checked = true;
        resultsSection.classList.add("hide");
        formsSection.classList.remove("hide");
    });
    btnRow.append(modifySearch, newSearch);
    resultsSection.appendChild(btnRow);
    searching.classList.add("hide");
}

const searchUsersForm = makeElement("form", "search-users-form", "search-form", null) as HTMLFormElement;
const searchUsersInput = document.createElement("input") as HTMLInputElement;
searchUsersInput.type = "text";
searchUsersInput.name = "username";
searchUsersInput.placeholder = "Enter the username to search"
const suContainer = makeElement("div", null, "search-bar-container", null);
searchUsersInput.classList.add("search-bar");
suContainer.append(searchUsersInput);
const suBtn = createButton("blue", "Search Users", "search") as HTMLButtonElement;
suBtn.type = "submit";
searchUsersForm.append(suContainer, suBtn);
searchUsersForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const formData = new FormData(searchUsersForm);
    const usernameInput = formData.get("username");
    if (usernameInput && usernameInput.toString().trim() !== "" ) {
        navigateTo("/users/", {params: {username: usernameInput.toString().trim()}});
    } else {
        createMessage("Please enter a username", "main-message", "error");
    }
});

const searchInstancesForm = makeElement("form", "search-instances-form", "search-form", null) as HTMLFormElement;
const siContainer = makeElement("div", null, "search-bar-container", null);
const searchInstancesInput = document.createElement("input") as HTMLInputElement;
searchInstancesInput.type = "text";
searchInstancesInput.name = "instance";
searchInstancesInput.classList.add("search-bar");
siContainer.appendChild(searchInstancesInput);
const siBtn = createButton("blue", "Search Users", "search") as HTMLButtonElement;
siBtn.type = "submit";
searchInstancesInput.placeholder = "Enter the name of the instance to search"
searchInstancesForm.append(siContainer, siBtn);
searchInstancesForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const formData = new FormData(searchInstancesForm);
    const instanceInput = formData.get("instance");
    if (instanceInput && instanceInput.toString().trim() !== "" ) {
        navigateTo("/instances/", {params: {name: instanceInput.toString().trim()}});
    } else {
        createMessage("Please enter a username", "main-message", "error");
    }
});

const searchAreaForm = makeElement("form", "search-area-form", "search-form", null) as HTMLFormElement;
const searchAreaH2 = makeElement("h2", null, null, "Search in area");

const yearRow = makeElement("div", null, "form-row", null);
const yearSelectLabel = makeElement("span", null, null, "Year:");
yearRow.appendChild(yearSelectLabel);
years.forEach((year) => {
    const yearRadio = createInput("radio", year.contentKey, year.contentKey, null, "year-to-search");
    yearRow.appendChild(yearRadio);
});

const searchAreaFormRow = makeElement("div", null, "button-row left", null);
const singlePixel = createInput("radio", "single-pixel", "Single Pixel", null, "search-area");
const area = createInput("radio", "area", "Area", null, "search-area", true);
searchAreaFormRow.append(area, singlePixel);

const topCoords = makeElement("div", null, "form-row", null);
const topBeginningLabel = makeElement("span", null, null, "Top Left: (");
const topXCoord = createInput("number", "top-x", null, "x", null);
const topComma = makeElement("span", null, null, ",");
const topYCoord = createInput("number", "top-y", null, "y", null);
const topEndingLabel = makeElement("span", null, null, ")");
topCoords.append(topBeginningLabel, topXCoord, topComma, topYCoord, topEndingLabel);

const bottomCoords = makeElement("div", null, "form-row", null);
const bottomBeginningLabel = makeElement("span", null, null, "Bottom Right: (");
const bottomXCoord = createInput("number", "bottom-x", null, "x", null);
const bottomComma = makeElement("span", null, null, ",");
const bottomYCoord = createInput("number", "bottom-y", null, "y", null);
const bottomEndingLabel = makeElement("span", null, null, ")");
bottomCoords.append(bottomBeginningLabel, bottomXCoord, bottomComma, bottomYCoord, bottomEndingLabel);

const submitBtn = createButton("green", "Search", "search") as HTMLButtonElement;
submitBtn.type = "submit";

searchAreaForm.append(searchAreaH2, yearRow, searchAreaFormRow, topCoords, bottomCoords, submitBtn);
searchAreaForm.addEventListener("change", (e) => {
    e.preventDefault();
    const formData = new FormData(searchAreaForm);
    const searchAreaSelection = formData.get("search-area");
    if (searchAreaSelection && searchAreaSelection === "single-pixel") {
        topBeginningLabel.textContent = "Coordinate: (";
        bottomCoords.classList.add("hide");
    } else if (searchAreaSelection && searchAreaSelection === "area") {
        topBeginningLabel.textContent = "Top Left: (";
        bottomCoords.classList.remove("hide");
    }
});
formsSection.append(searchUsersForm, searchInstancesForm, searchAreaForm);

searchAreaForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const formData = new FormData(searchAreaForm);
    await searchArea(formData);
});

if (loading) loading.remove();
main.classList.remove("hide");
formsSection.classList.remove("hide");