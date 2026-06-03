import { initializeApp } from "./main";
import type { ContentPair, UserRanks } from "./models";
import { navigateTo } from "./modules/navigate";
import { getRandomColor, makeElement, storeMessage } from "./modules/utils";
import { getYears } from "./services/canvas.service";
import { getInstanceNameForId } from "./services/instances.service";
import { getAllUsers } from "./services/users.service";

let viewYear: string = "All";
let yearColor: string = "";
const years = getYears(true);
const main = document.querySelector('main') as HTMLElement;
const heading = makeElement("div", "user-list-heading", null, null);
let allUsers: UserRanks[] | null = await getAllUsers();

const urlParams = new URLSearchParams(window.location.search);
let usernameString: string | null = urlParams.get('username');
const yearString: string | null = urlParams.get('year');
const instanceIdString: string | null = urlParams.get('id');
let instanceName: string | null = null;
if (instanceIdString) instanceName = await getInstanceNameForId(+instanceIdString);
if (yearString) {
    const searchForYear = years.find(year => year.contentKey === yearString);
    if (!searchForYear) {
        viewYear = "All";
        yearColor = years[0].contentValue;
    } else {
        viewYear = yearString;
        yearColor = searchForYear.contentValue;
    }
} else {
    yearColor = years[0].contentValue;
}

let parentPage = instanceIdString ? "Instances" : "Users";
let currentPage = instanceIdString && instanceName ? `${instanceName} users` : "Users";
if (instanceIdString && !instanceName) {
    storeMessage("Invalid instance id. Please try again", "main-message", "error");
    navigateTo("/instances/");
} else {
    await initializeApp(parentPage, currentPage, false);
}

const search = document.getElementById("search") as HTMLElement;
const searchContainer = makeElement("div", "search-container", "search-bar-container", null);
const searchIcon = makeElement("span", null, "material-symbols-outlined", "search");
searchContainer.appendChild(searchIcon);
const searchInput = makeElement("input", "search-input", "search-bar", null) as HTMLInputElement
searchInput.setAttribute("type", "text");
let placeHolderText = instanceIdString && instanceName ? `Search ${instanceName} users...` : "Search Users...";
searchInput.setAttribute("placeholder", placeHolderText);
if (usernameString) searchInput.value = usernameString;
searchInput.setAttribute("name", "search-input");
searchContainer.appendChild(searchInput);
search.appendChild(searchContainer);
search.addEventListener("input", (e) => {
    e.preventDefault();
    usernameString = searchInput.value.toString();
    loadUserList()
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

    yearButton.onclick = async function () {
        viewYear = year.contentKey;
        yearColor = year.contentValue;
        filterRow.querySelectorAll(".btn").forEach((btn) => {
            btn.classList.remove("active-btn");
        });
        yearButton.classList.add("active-btn");

        await loadUserList();
    }

    if (year.contentKey !== "2026") filterRow.appendChild(yearButton);
});
main.appendChild(filterRow);
main.append(heading);

async function loadUserList() {
    const usersDiv = document.getElementById("users");
    if (usersDiv) usersDiv.remove();
    const noResults = document.getElementById("no-results-heading");
    if (noResults) noResults.remove();

    if (allUsers) {
        let matchingUsers = allUsers;
        if (instanceIdString) matchingUsers = matchingUsers.filter(user => user.instance_id === +instanceIdString);
        if (usernameString && usernameString.trim() !== "") {
            const term = usernameString.trim().toLowerCase();
            matchingUsers = matchingUsers.filter(user => user.username.toLowerCase().includes(term));
        }

        if (viewYear !== "All") {
            matchingUsers = matchingUsers.filter(user => user.ranks[+viewYear]);
            matchingUsers.sort((a, b) => {
                const rankA = a.ranks[+viewYear] ?? Infinity;
                const rankB = b.ranks[+viewYear] ?? Infinity;
                return rankA - rankB;
            });
        } else {
            matchingUsers.sort((a, b) => a.username.localeCompare(b.username));
        }
        if (matchingUsers.length > 0) {
            const users = makeElement("div", "users", null, null);
            const userHeading = makeElement("h2", "user-heading", "center", null);
            if (usernameString && usernameString.trim() !== "") {
                if (instanceName) {
                    userHeading.textContent = `${matchingUsers.length} User${matchingUsers.length === 1 ? '' : 's'} containing "${usernameString.trim()}" from ${instanceName}`;
                } else {
                    userHeading.textContent = `${matchingUsers.length} User${matchingUsers.length === 1 ? '' : 's'} containing "${usernameString.trim()}"`;
                }  
            }
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
                    if (user.ranks[+viewYear] && user.pixels[+viewYear]) {
                        username.textContent = `${user.ranks[+viewYear]}) ${user.username}`;
                        userStat.textContent = user.pixels[+viewYear].toString();
                    }
                }
                nextUser.onclick = function () { navigateTo("/user", { params: { username: user.username } }) };
                nextUser.append(username, userStat);
                acc.appendChild(nextUser);
                return acc;
            }, makeElement("div", "user-results", null, null));
            users.append(userHeading, colHeadings, userResults);
            main.appendChild(users);
        }
        if (matchingUsers.length < 10) returnToTopArrow.classList.add("hide");
        if (matchingUsers.length === 0) {
            const noResults = makeElement("h2", "no-results-heading", "center", null);
            if (usernameString && usernameString.trim() !== "") {
                noResults.textContent = `No results for "${usernameString.trim()}"`;
            } else {
                noResults.textContent = "No results for current filters";
            }

            main.appendChild(noResults);
        }
    }
}

await loadUserList();
const loading = document.getElementById("loading");
if (loading) loading.remove();
main.classList.remove("hide");