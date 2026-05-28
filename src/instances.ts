import { initializeApp } from "./main";
import type { ContentPair, Instance, instanceItem } from "./models";
import { navigateTo } from "./modules/navigate";
import { getRandomColor, makeElement } from "./modules/utils";
import { getYears } from "./services/canvas.service";
import { getAllInstances } from "./services/instances.service";


let viewYear: string = "All";
let yearColor: string = "";
const years = getYears(true);
const main = document.querySelector('main') as HTMLElement;
const heading = makeElement("div", "instance-list-heading", null, null);
let instanceList: Instance[] | null = await getAllInstances();
const instanceListCache: Record<string, instanceItem[] | undefined> = {};

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

await initializeApp("Instances", "Instances", true);
const returnToTopArrow = document.getElementById("return-to-top") as HTMLElement;
const randomColor = getRandomColor(1, true);
returnToTopArrow.classList.add(randomColor);
returnToTopArrow.onclick = function () {
    const header = document.querySelector('header') as HTMLElement;
    header.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function loadYearData(viewYear: string): instanceItem[] {
    if (instanceListCache[viewYear]) {
        return instanceListCache[viewYear];
    }
    if (instanceList) {
        const newList: instanceItem[] = instanceList.reduce((acc: instanceItem[], instance: Instance) => {
            let newInstance: instanceItem = { instanceName: "", instanceId: 0 }
            if (viewYear === "All") {
                newInstance = { instanceName: instance.instanceName, numUsers: instance.totalUsers(), instanceId: instance.instanceId }
            } else {
                switch (viewYear) {
                    case "2023":
                        if (instance.users_2023 && instance.pixels_2023) newInstance = { 
                            numUsers: instance.users_2023, 
                            instanceName: instance.instanceName, 
                            numPixels: instance.pixels_2023, 
                            instanceId: instance.instanceId }
                        break;
                    case "2024":
                        if (instance.users_2024 && instance.pixels_2024) newInstance = { 
                            numUsers: instance.users_2024, 
                            instanceName: instance.instanceName, 
                            numPixels: instance.pixels_2024, 
                            instanceId: instance.instanceId }
                        break;
                    case "2025":
                        if (instance.users_2025 && instance.pixels_2025) newInstance = { 
                            numUsers: instance.users_2025, 
                            instanceName: instance.instanceName, 
                            numPixels: instance.pixels_2025, 
                            instanceId: instance.instanceId }
                        break;
                }
            }
            acc.push(newInstance);
            return acc;
        }, []);
        if (viewYear === "All") {
            newList.sort((a, b) => {
                const rankA = a.numUsers ?? Infinity;
                const rankB = b.numUsers ?? Infinity;
                return rankB - rankA;
            });
        } else {
            newList.sort((a, b) => {
                const rankA = a.numPixels ?? Infinity;
                const rankB = b.numPixels ?? Infinity;
                return rankB - rankA;
            });
        }
        instanceListCache[viewYear] = newList ?? [];
        return instanceListCache[viewYear];
    }
    return [];
}

function loadInstanceList() {
    heading.innerHTML = "";
    const existingInstanceList = document.getElementById("instances");
    if (existingInstanceList) existingInstanceList.remove();
    let instanceList = loadYearData(viewYear);
    if (instanceString) {
        const instanceName = instanceString.toLowerCase();
        instanceList = instanceList.filter(instance => instance.instanceName.toLowerCase().includes(instanceName));
        viewYear = "All";
    }

    if (viewYear === "All") {
        const instanceNameHeading = makeElement("p", null, null, "Instance");
        const yearsActiveHeading = makeElement("p", null, null, "Total Users");
        heading.append(instanceNameHeading, yearsActiveHeading);
    } else {
        const instanceNameHeading = makeElement("p", null, null, "Instance");
        const pixelsHeading = makeElement("p", null, null, "Pixels Placed | User Count");
        heading.append(instanceNameHeading, pixelsHeading);
    }

    if (instanceList.length < 10) {
        returnToTopArrow.classList.add("hide");
    } else {
        returnToTopArrow.classList.remove("hide");
    }

    const instanceListElem = instanceList.reduce((acc: HTMLElement, instance: instanceItem) => {
        const instanceRow = makeElement("div", instance.instanceId.toString(), `user-row clickable ${yearColor}`, null);
        const instanceNameP = makeElement("p", null, null, instance.instanceName);
        const statP = makeElement("p", null, null, null);
        if (viewYear === "All" && instance.numUsers) {
            statP.textContent = instance.numUsers?.toString();
        } else {
            statP.textContent = `${instance.numPixels} pixels | ${instance.numUsers} users`
        }
        
        instanceRow.append(instanceNameP, statP);
        instanceRow.onclick = function () { navigateTo("/instances/instance", { params: { id: instance.instanceId } }) }
        if (viewYear !== "All" && instance.numPixels) acc.appendChild(instanceRow);
        if (viewYear === "All") acc.appendChild(instanceRow);
        return acc;
    }, makeElement("div", "instances", null, null));
    main.appendChild(instanceListElem);
}


const filterRow = makeElement("div", "filter-users-row", null, null);
const filterText = makeElement("p", "filter-users-label", null, "Filter by Year:");
filterRow.append(filterText);
years.forEach((year: ContentPair) => {
    const yearButton = makeElement("p", year.contentKey, `btn ${year.contentValue}`, year.contentKey);
    if (year.contentKey === viewYear) yearButton.classList.add("active-btn");

    yearButton.onclick = function () {
        instanceString = null;
        viewYear = year.contentKey;
        yearColor = year.contentValue;
        filterRow.querySelectorAll(".btn").forEach((btn) => {
            btn.classList.remove("active-btn");
        });
        yearButton.classList.add("active-btn");

        loadInstanceList();
    }

    if (year.contentKey !== "2026") filterRow.appendChild(yearButton);
});
main.appendChild(filterRow);
main.append(heading);
loadInstanceList();
const loading = document.getElementById("loading");
if (loading) loading.remove();
main.classList.remove("hide");