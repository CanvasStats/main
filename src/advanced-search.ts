import { initializeApp } from "./main";
import { ContentPair, JsonBlock, Pixel } from "./models";
import { getBlockStructure, renderTree } from "./modules/createNodeTree";
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
        resultsTitle = `Results for (${topX}, ${topY}) to (${bottomX}, ${bottomY})`;
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
        resultsTitle = `Results for (${topX}, ${topY})`;
        if (pixelsForYear) {
            filteredPixels = pixelsForYear.filter(pixel => pixel["xCoordinate"] === +topX && pixel["yCoordinate"] === +topY);
            updateResults(filteredPixels, resultsTitle, +year);
        }
    }
}

async function updateResults(filteredPixels: Pixel[], title: string, year: number) {
    const resultsH2 = makeElement("h2", null, null, title);
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

const searchAreaForm = makeElement("form", "search-area-form", null, null) as HTMLFormElement;
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
formsSection.appendChild(searchAreaForm);

searchAreaForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const formData = new FormData(searchAreaForm);
    await searchArea(formData);

});


if (loading) loading.remove();
main.classList.remove("hide");
formsSection.classList.remove("hide");