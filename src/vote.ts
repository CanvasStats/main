import { initializeApp } from "./main";
import { ContentPair, type ColorCount, type JsonObject } from "./models";
import { createColorCountPieChart, createColorTreemap } from "./modules/d3Graphics";
import { navigateTo } from "./modules/navigate";
import { addLoadingElement, clearMessages, createMessage, makeElement, storeMessage } from "./modules/utils";
import { getYears } from "./services/canvas.service";

let viewYear: number = 2026;
let yearColor: string = "white";
const years = getYears(false);
const main = document.querySelector('main') as HTMLElement;
const mainLoader = addLoadingElement();
const statsContainer = makeElement("div", "stats-container", null, null) as HTMLElement;
const loading = document.getElementById("loading");

const yearDataCache: Record<string, JsonObject | undefined> = {};

viewYear = 2025;
if (years.length > 0) {
    yearColor = years[years.length - 1].contentValue;
    statsContainer.classList.add(yearColor);
}

await initializeApp("Home", "Vote", false);
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

function createRadioButton(value: string, name: string, labelText: string): HTMLDivElement {
    const wrapper = document.createElement('div');
    wrapper.className = 'radio-item';

    const input = document.createElement('input');
    input.type = 'radio';
    input.id = `${name}-${value}`;
    input.name = name;
    input.value = value;

    const label = document.createElement('label');
    label.htmlFor = input.id;
    label.textContent = labelText;

    wrapper.appendChild(input);
    wrapper.appendChild(label);
    return wrapper;
}

async function updateStats() {
    const loadingText = document.getElementById("main-loader-text") as HTMLElement;
    statsContainer.innerHTML = "";
    mainLoader.classList.remove("hide");
    const yearData = await getJsonBlocks(viewYear);
    let colorCounts: ColorCount[] = [];
    const introBlock = makeElement("article", "intro", "left", null);
    const introIcon =  makeElement("span", null, "material-symbols-outlined icon", "info");
    const introInfo = makeElement("section", null, null, null);
    const firstP = makeElement("p", null, "small", 'There is a section on the homepage and user stats page called "Pixels by color" where you can see the color counts of all the pixels.');
    const secondP = makeElement("p", null, "small", "You can click on a color to view all of the pixels of that color on the canvas.");
    const secondPextra = makeElement("p", null, "small", "Both options display a tooltip when you hover over a color.")
    const thirdP = makeElement("p", null, "small", "Please view the following options and vote on which one you like better.")
    introInfo.append(firstP, secondP, secondPextra, thirdP);
    introBlock.append(introIcon, introInfo);
    statsContainer.appendChild(introBlock);


    if (yearData) yearData.blocks.forEach((block: any) => {
        if (block.type === "color-grid") {
            loadingText.textContent = "Creating treemap chart";
            colorCounts = mapColorCountJsonToInterface(block.data);
            const treemap = makeElement("article", null, "right treemap", null);
            const treemapContainer = document.createElement('div');
            treemapContainer.setAttribute('class', 'colorCountsPieChart');
            treemapContainer.setAttribute('style', 'display: block; width: 100%; min-width: 300px; min-height: 300px;');
            treemap.appendChild(treemapContainer);

            const treemapTitle = makeElement("section", null, 'color-section', null);
            if (block.title) {
                const statHeader = makeElement("h3", null, null, "Option one: Treemap");
                treemapTitle.appendChild(statHeader);
            }
            treemap.appendChild(treemapTitle);
            statsContainer.appendChild(treemap);
            const dynamicRatio = window.innerWidth < 600 ? 1.0 : 0.6;
            createColorTreemap(treemapContainer, colorCounts, dynamicRatio, true, viewYear, 0);

            loadingText.textContent = "Creating pie chart";
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
                const statHeader = makeElement("h3", null, null, "Option 2: Donut");
                statSection.appendChild(statHeader);
            }
            const toolTip = makeElement("div", "chart-tooltip", 'chart-tooltip', null);
            statSection.appendChild(toolTip);
            colorStat.appendChild(statSection);

            statsContainer.appendChild(colorStat);
            createColorCountPieChart(viewYear, colorCounts, pieChartContainer, true, "slice-clickable");

        }
    });

    const voteBlock = makeElement("article", null, "left", null);
    const voteForm = makeElement("form", null, null, null) as HTMLFormElement;
    voteForm.style.width = "100%";
    const voteTitle = makeElement("h3", null, "center", "Which option is better?");

    const radioGroupElem = makeElement("div", "radio-container", null, null) as HTMLFieldSetElement;
    voteForm.append(voteTitle, radioGroupElem);
    const optionGroup = makeElement("section", null, "radio-group", null);
    const one = createRadioButton("Option 1", "entry.582514067", "Option 1: treemap");
    const two = createRadioButton("Option 2", "entry.582514067", "Option 2: Doughnut");
    optionGroup.append(one, two);
    voteForm.appendChild(optionGroup);
    const buttonRow = makeElement("section", null, "button-row", null);
    const submit = makeElement("button", "submit", "btn green", "Submit");
    submit.setAttribute("type", "submit");
    buttonRow.appendChild(submit);
    voteForm.appendChild(buttonRow);
    voteForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const formData = new FormData(voteForm);
        const selectedOption = formData.get("entry.582514067");
        if (!selectedOption) {
            createMessage("Please select an option", "main-message", "error");
            return;
        }
        const formAction: string = "https://docs.google.com/forms/d/e/1FAIpQLScyW0cpm3Vl7-LX8Ynwql9bo0Z3c6-9T4JeDlVB4mwrNeTMXg/formResponse";
        fetch(formAction, {
            method: "POST",
            body: formData,
            mode: "no-cors",
        })
            .then((response) => {
                //Store the message to be displayed after redirected to the home page
                console.log(response);
                storeMessage(
                    "Thanks for voting!",
                    "main-message",
                    "check_circle",
                );
                navigateTo("/");
            })
            .catch((error) => {
                //Create an error message
                console.error("Network Error:", error);
                createMessage(
                    "Error submitting vote. Please reload the page and try again",
                    "main-message",
                    "error",
                );
            });
    });

    voteBlock.append(voteForm);
    statsContainer.appendChild(voteBlock);

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