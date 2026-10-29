import type { Instance } from "../models/instance.model";
import type { UserRanks } from "../models/user.model";
import { state } from "../modules/state.module";
import { getRandomColor, makeElement } from "../modules/utils.module";
import { router } from "../router";
import { getYears } from "../services/canvas.service";
import { getAllInstances } from "../services/instances.service";
import { getAllUsers } from "../services/users.service";

export async function renderSearch(container: HTMLElement, searchQuery: string) {
    document.title = `Search Results for ${searchQuery} | Canvas Stats`;
    let viewYear = "All";
    let yearColor = "";
    let years = getYears(true);
    let instanceList = await getAllInstances();
    let userList = await getAllUsers();

    if (state.year) {
        viewYear = state.year.toString();
    }
    yearColor = years[viewYear];
    const search = document.getElementById("search") as HTMLElement;
    search.innerHTML = "";
    const searchContainer = makeElement("div", "search-container", "search-bar-container", null);
    const searchIcon = makeElement("span", null, "material-symbols-outlined", "search");
    searchContainer.appendChild(searchIcon);
    const searchInput = makeElement("input", "search-input", "search-bar", null) as HTMLInputElement
    searchInput.setAttribute("type", "text");
    searchInput.setAttribute("placeholder", "Search Users or Instances...");
    if (searchQuery) searchInput.value = searchQuery;
    searchInput.setAttribute("name", "search-input");
    searchContainer.appendChild(searchInput);
    search.appendChild(searchContainer);
    search.addEventListener("input", (e) => {
        e.preventDefault();
        searchQuery = searchInput.value.toString();
        updateResults()
    });

    const returnToTopArrow = makeElement("div", "return-to-top", null, null);
    returnToTopArrow.appendChild(makeElement("span", null, "material-symbols-outlined", "arrow_shape_up"));
    const randomColor = getRandomColor(1, true);
    returnToTopArrow.classList.add(randomColor);
    returnToTopArrow.onclick = function () {
        const header = document.querySelector('header') as HTMLElement;
        if (header) header.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    const main = makeElement("main", "mainContent", null, null);
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

            updateResults();
        }
        acc.appendChild(yearButton);
        return acc;
    }, makeElement("div", "filter-users-row", null, null));
    const filterText = makeElement("p", "filter-users-label", null, "Filter by Year:");
    filterRow.prepend(filterText);
    main.appendChild(filterRow);

    function updateResults() {
        document.title = `Search Results for ${searchQuery} | Canvas Stats`;
        const instancesDiv = document.getElementById("instances");
        if (instancesDiv) instancesDiv.remove();
        const usersDiv = document.getElementById("users");
        if (usersDiv) usersDiv.remove();
        const noResults = document.getElementById("no-results-heading");
        if (noResults) noResults.remove();

        if (searchQuery && searchQuery.trim() !== "") {
            const term = searchQuery.trim().toLowerCase();
            let matchingInstances = instanceList.filter(instance => instance.instanceName.toLowerCase().includes(term));
            if (viewYear !== "All") {
                matchingInstances = matchingInstances.filter(instance => instance.users[+viewYear]);
            }
            if (matchingInstances.length > 0) {
                const instances = makeElement("div", "instances", null, null);
                const instanceHeading = makeElement("h2", "instance-heading", "center", `${matchingInstances.length} Instance${matchingInstances.length === 1 ? '' : 's'} containing "${searchQuery.trim()}"`);
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
                    nextInstance.onclick = function () { router.navigateTo(`/instances/${instance.instanceName}`) }
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
                const userHeading = makeElement("h2", "user-heading", "center", `${matchingUsers.length} User${matchingUsers.length === 1 ? '' : 's'} containing "${searchQuery.trim()}"`);
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
                    nextUser.onclick = function () { router.navigateTo(`/users/${user.username}`) };
                    nextUser.append(username, userStat);
                    acc.appendChild(nextUser);
                    return acc;
                }, makeElement("div", "user-results", null, null));
                users.append(userHeading, colHeadings, userResults);
                main.appendChild(users);
            }
            if (matchingUsers.length + matchingInstances.length < 10) returnToTopArrow.classList.add("hide");
            if (matchingInstances.length + matchingUsers.length === 0) {
                const noResults = makeElement("h2", "no-results-heading", "center", `No results for "${searchQuery.trim()}"`);
                main.appendChild(noResults);
            }
        }
    }

    updateResults()

    container.append(main, returnToTopArrow);

    const loadingElement = document.getElementById("loading") as HTMLElement;
    if (loadingElement) loadingElement.classList.add("hide");
}