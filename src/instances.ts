import { initializeApp } from "./main";
import type { ContentPair, Instance } from "./models";
import { navigateTo } from "./modules/navigate";
import { getRandomColor, makeElement } from "./modules/utils";
import { getYears } from "./services/canvas.service";
import { getAllInstances } from "./services/instances.service";


let viewYear: string = "All";
let yearColor: string = "";
const years = getYears(true);
const main = document.querySelector('main') as HTMLElement;
const heading = makeElement("div", "instance-list-heading", null, null);
let allInstances: Instance[] | null = await getAllInstances();

const urlParams = new URLSearchParams(window.location.search);
let instanceString: string | null = urlParams.get('name');
const yearString: string | null = urlParams.get('year');
if (yearString) {
    const searchForYear = years.find(year => year.contentKey === yearString);
    if (!searchForYear) {
        viewYear = "All";
        yearColor = years[0].contentValue;
    } else {
        viewYear = yearString;
        yearColor = searchForYear.contentValue
    }
} else {
    yearColor = years[0].contentValue
}

await initializeApp("Instances", "Instances", false);

const search = document.getElementById("search") as HTMLElement;
const searchContainer = makeElement("div", "search-container", "search-bar-container", null);
const searchIcon = makeElement("span", null, "material-symbols-outlined", "search");
searchContainer.appendChild(searchIcon);
const searchInput = makeElement("input", "search-input", "search-bar", null) as HTMLInputElement
searchInput.setAttribute("type", "text");
searchInput.setAttribute("placeholder", "Search Instances...");
if (instanceString) searchInput.value = instanceString;
searchInput.setAttribute("name", "search-input");
searchContainer.appendChild(searchInput);
search.appendChild(searchContainer);
search.addEventListener("input", (e) => {
    e.preventDefault();
    instanceString = searchInput.value.toString();
    loadInstanceList()
});

const returnToTopArrow = document.getElementById("return-to-top") as HTMLElement;
const randomColor = getRandomColor(1, true);
returnToTopArrow.classList.add(randomColor);
returnToTopArrow.onclick = function () {
    const header = document.querySelector('header') as HTMLElement;
    header.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

const filterRow = makeElement("div", "filter-users-row", null, null);
const filterText = makeElement("p", "filter-users-label", null, "Filter by Year:");
filterRow.append(filterText);
years.forEach((year: ContentPair) => {
    const yearButton = makeElement("p", year.contentKey, `btn ${year.contentValue}`, year.contentKey);
    if (year.contentKey === viewYear) yearButton.classList.add("active-btn");

    yearButton.onclick = function () {
        viewYear = year.contentKey;
        yearColor = year.contentValue;
        filterRow.querySelectorAll(".btn").forEach((btn) => {
            btn.classList.remove("active-btn");
        });
        yearButton.classList.add("active-btn");

        loadInstanceList();
    }
    filterRow.appendChild(yearButton);
});
main.appendChild(filterRow);
main.append(heading);

function loadInstanceList() {
    const instancesDiv = document.getElementById("instances");
    if (instancesDiv) instancesDiv.remove();
    const noResults = document.getElementById("no-results-heading");
    if (noResults) noResults.remove();

    if (allInstances) {
        let matchingInstances = allInstances;
        if (instanceString && instanceString.trim() !== "") {
            const term = instanceString.trim().toLowerCase();
            matchingInstances = matchingInstances.filter(instance => instance.instanceName.toLowerCase().includes(term));
        }

        if (viewYear !== "All") {
            matchingInstances = matchingInstances.filter(instance => instance.users[+viewYear]);
            matchingInstances.sort((a, b) => {
                const rankA = a.pixels[+viewYear] ?? Infinity;
                const rankB = b.pixels[+viewYear] ?? Infinity;
                return rankB - rankA;
            });
        } else {
            matchingInstances.sort((a, b) => a.instanceName.localeCompare(b.instanceName));
        }
        if (matchingInstances.length > 0) {
            const instances = makeElement("div", "instances", null, null);
            if (instanceString) {
                const instanceHeading = makeElement("h2", "instance-heading", "center", `${matchingInstances.length} Instance${matchingInstances.length === 1 ? '' : 's'} containing "${instanceString.trim()}"`);
                instances.appendChild(instanceHeading);
            }
            
            const colHeadings = makeElement("div", "instance-list-heading", null, null);
            const instanceNameCol = makeElement("p", null, null, "Instance");
            const numUsersCol = makeElement("p", null, null, viewYear === "All" ? "Total Users" : "Total Users | Pixels Placed");
            colHeadings.append(instanceNameCol, numUsersCol);
            const instanceResults = matchingInstances.reduce((acc: HTMLElement, instance: Instance) => {
                const nextInstance = makeElement("div", instance.instanceId.toString(), `user-row clickable ${yearColor}`, null);
                const instanceName = makeElement("p", null, null, instance.instanceName);
                const userCount = viewYear === "All" ? instance.totalUsers().toString() : `${instance.users[+viewYear]} | ${instance.pixels[+viewYear]}`;
                const instanceUserCount = makeElement("p", null, null, userCount);
                nextInstance.append(instanceName, instanceUserCount);
                nextInstance.onclick = function () { navigateTo("/instances/instance", { params: { id: instance.instanceId } }) }
                acc.appendChild(nextInstance);
                return acc;
            }, makeElement("div", "instance-results", null, null));
            instances.append(colHeadings, instanceResults);
            main.appendChild(instances);
        } else {
            const noResults = makeElement("h2", "no-results-heading", "center", null);
                        if (instanceString && instanceString.trim() !== "") {
                            noResults.textContent = `No results for "${instanceString.trim()}"`;
                        } else {
                            noResults.textContent = "No results for current filters";
                        }
            
                        main.appendChild(noResults);
        }

        if (matchingInstances.length < 10) {
            returnToTopArrow.classList.add("hide");
        } else {
            returnToTopArrow.classList.remove("hide");
        }
    }
}

loadInstanceList();
const loading = document.getElementById("loading");
if (loading) loading.remove();
main.classList.remove("hide");