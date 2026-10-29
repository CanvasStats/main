import type { Instance } from "../models/instance.model";
import { state } from "../modules/state.module";
import { getRandomColor, makeElement } from "../modules/utils.module";
import { router } from "../router";
import { getYears } from "../services/canvas.service";
import { getAllInstances } from "../services/instances.service";

export async function renderInstances(container: HTMLElement) {
    document.title = "Instances | Canvas Stats";

    let viewYear: string = "All";
    let yearColor: string = "";
    const years = getYears(true);
    const main = makeElement("main", "mainContent", null, null)
    const heading = makeElement("div", "instance-list-heading", null, null);
    let allInstances: Instance[] | null = await getAllInstances();


    const urlParams = new URLSearchParams(window.location.search);
    let instanceString: string | null = urlParams.get('name');
    const yearString: string | null = urlParams.get('year');
    if (yearString && years[+yearString]) {
        viewYear = yearString;
    } else if (state.year) {
        viewYear = state.year.toString();
    } else {
        viewYear = "All";
    }
    yearColor = years[viewYear];

    const searchWrapper = document.getElementById("search") as HTMLElement;

    if (searchWrapper) {
        searchWrapper.innerHTML = "";
        const searchContainer = makeElement("div", "search-container", "search-bar-container", null);
        const searchIcon = makeElement("span", null, "material-symbols-outlined", "search");
        searchContainer.appendChild(searchIcon);
        const searchInput = makeElement("input", "search-input", "search-bar", null) as HTMLInputElement
        searchInput.setAttribute("type", "text");
        searchInput.setAttribute("placeholder", "Search Instances...");
        if (instanceString) searchInput.value = instanceString;
        searchInput.setAttribute("name", "search-input");
        searchContainer.appendChild(searchInput);
        searchWrapper.appendChild(searchContainer);
        searchWrapper.addEventListener("input", (e) => {
            e.preventDefault();
            instanceString = searchInput.value.toString();
            loadInstanceList()
        });
        searchWrapper.addEventListener('keydown', (e: KeyboardEvent): void => {
            if (e.key === 'Enter') {
                e.preventDefault();
            }
        });
    }
    const returnToTopArrow = makeElement("div", "return-to-top", null, null);
    returnToTopArrow.appendChild(makeElement("span", null, "material-symbols-outlined", "arrow_shape_up"));
    const randomColor = getRandomColor(1, true);
    returnToTopArrow.classList.add(randomColor);
    returnToTopArrow.onclick = function () {
        const header = document.querySelector('header') as HTMLElement;
        if (header) header.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    container.innerHTML = "";

    const filterRow = Object.entries(years).reduce((acc: HTMLElement, [year, color]) => {
        const yearButton = makeElement("p", year, `btn ${color}`, year);
        if (year === viewYear) yearButton.classList.add("active-btn");

        yearButton.onclick = async function () {
            viewYear = year;
            if (year === "All") {
                state.setYear(null);
            } else {
                state.setYear(+year);
            }
            yearColor = color;
            filterRow.querySelectorAll(".btn").forEach((btn) => {
                btn.classList.remove("active-btn");
            });
            yearButton.classList.add("active-btn");

            loadInstanceList();
        }
        acc.appendChild(yearButton);
        return acc;
    }, makeElement("div", "filter-users-row", null, null));
    const filterText = makeElement("p", "filter-users-label", null, "Filter by Year:");
    filterRow.prepend(filterText);
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
                    nextInstance.onclick = function () { router.navigateTo(`/instances/${instance.instanceName}`) }
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
    container.append(main, returnToTopArrow);
    const loadingElement = document.getElementById("loading") as HTMLElement;
    if (loadingElement) loadingElement.classList.add("hide");
}