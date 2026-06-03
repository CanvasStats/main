import { initializeApp } from "./main";
import type { ContentPair, Instance, UserRanks } from "./models";
import { navigateTo } from "./modules/navigate";
import { getRandomColor, makeElement } from "./modules/utils";
import { getYears } from "./services/canvas.service";
import { getAllInstances } from "./services/instances.service";
import { getAllUsers } from "./services/users.service";

const urlParams = new URLSearchParams(window.location.search);
let searchTerm: string | null | undefined = urlParams.get("term");

let instanceList: Instance[] = await getAllInstances();
let userList: UserRanks[] = await getAllUsers();
let viewYear: string = "All";
let yearColor: string = getRandomColor(1, true);
const years = getYears(true);

const main = document.querySelector("main") as HTMLElement;

await initializeApp("Search", "Search", false);

const search = document.getElementById("search") as HTMLElement;
const searchContainer = makeElement("div", "search-container", "search-bar-container", null);
const searchIcon = makeElement("span", null, "material-symbols-outlined", "search");
searchContainer.appendChild(searchIcon);
const searchInput = makeElement("input", "search-input", "search-bar", null) as HTMLInputElement
searchInput.setAttribute("type", "text");
searchInput.setAttribute("placeholder", "Search Users or Instances...");
if (searchTerm) searchInput.value = searchTerm;
searchInput.setAttribute("name", "search-input");
searchContainer.appendChild(searchInput);
search.appendChild(searchContainer);
search.addEventListener("input", (e) => {
    e.preventDefault();
    searchTerm = searchInput.value.toString();
    updateResults()
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

        updateResults();
    }

    if (year.contentKey !== "2026") filterRow.appendChild(yearButton);
});
main.appendChild(filterRow);

function updateResults() {
    const instancesDiv = document.getElementById("instances");
    if (instancesDiv) instancesDiv.remove();
    const usersDiv = document.getElementById("users");
    if (usersDiv) usersDiv.remove();
    const noResults = document.getElementById("no-results-heading");
    if (noResults) noResults.remove();

    if (searchTerm && searchTerm.trim() !== "") {
        const term = searchTerm.trim().toLowerCase();
        let matchingInstances = instanceList.filter(instance => instance.instanceName.toLowerCase().includes(term));
        if (viewYear !== "All") {
            matchingInstances = matchingInstances.filter(instance => instance.users[+viewYear]);
        }
        if (matchingInstances.length > 0) {
            const instances = makeElement("div", "instances", null, null);
            const instanceHeading = makeElement("h2", "instance-heading", "center", `${matchingInstances.length} Instance${matchingInstances.length === 1 ? '' : 's'} containing "${searchTerm.trim()}"`);
            const colHeadings = makeElement("div", "instance-list-heading", null, null);
            const instanceNameCol = makeElement("p", null, null, "Instance");
            const numUsersCol = makeElement("p", null, null, "Total Users");
            colHeadings.append(instanceNameCol, numUsersCol);
            const instanceResults = matchingInstances.reduce((acc: HTMLElement, instance: Instance) => {
                const nextInstance = makeElement("div", instance.instanceId.toString(), `user-row clickable ${yearColor}`, null);
                const instanceName = makeElement("p", null, null, instance.instanceName);
                const userCount = viewYear === "All" ? instance.totalUsers().toString() : instance.users[+viewYear].toString();
                const instanceUserCount = makeElement("p", null, null, userCount);
                nextInstance.append(instanceName, instanceUserCount);
                nextInstance.onclick = function () { navigateTo("/instances/instance", { params: { id: instance.instanceId } }) }
                acc.appendChild(nextInstance);
                return acc;
            }, makeElement("div", "instance-results", null, null));
            instances.append(instanceHeading, colHeadings, instanceResults);
            main.appendChild(instances);
        }
        let matchingUsers = userList.filter(user => user.username.toLowerCase().includes(term));
        if (viewYear !== "All") {
            matchingUsers = matchingUsers.filter(user => user.ranks[+viewYear]);
        }
        if (matchingUsers.length > 0) {
            matchingUsers.sort((a, b) => {
                const rankA = a.ranks[+viewYear] ?? Infinity;
                const rankB = b.ranks[+viewYear] ?? Infinity;
                return rankA - rankB;
            });
            const users = makeElement("div", "users", null, null);
            const userHeading = makeElement("h2", "user-heading", "center", `${matchingUsers.length} User${matchingUsers.length === 1 ? '' : 's'} containing "${searchTerm.trim()}"`);
            const colHeadings = makeElement("div", "user-list-heading", null, null);
            const usernameCol = makeElement("p", null, null, "User");
            const userStatCol = makeElement("p", null, null, viewYear === "All" ? 'Years Participated' : 'Pixels Placed');
            colHeadings.append(usernameCol, userStatCol);
            let userResults = matchingUsers.reduce((acc: HTMLElement, user: UserRanks) => {
                const nextUser = makeElement("p", user.username.toString(), `user-row clickable ${yearColor}`, null);
                const username = document.createElement("p");
                const userStat = document.createElement("p");
                if (viewYear === "All") {
                    username.textContent = user.username;
                    userStat.textContent = user.numYearsParticipated().toString();
                } else {
                    username.textContent = `${user.ranks[+viewYear]}) ${user.username}`;
                    userStat.textContent = user.pixels[+viewYear].toString();
                }
                nextUser.onclick = function () { navigateTo("/user", { params: { username: user.username } }) };
                nextUser.append(username, userStat);
                acc.appendChild(nextUser);
                return acc;
            }, makeElement("div", "user-results", null, null));
            users.append(userHeading, colHeadings, userResults);
            main.appendChild(users);
        }
        if (matchingUsers.length + matchingInstances.length < 10) returnToTopArrow.classList.add("hide");
        if (matchingInstances.length + matchingUsers.length === 0) {
            const noResults = makeElement("h2", "no-results-heading", "center", `No results for "${searchTerm.trim()}"`);
            main.appendChild(noResults);
        }
    }
}

updateResults()
main.classList.remove("hide");