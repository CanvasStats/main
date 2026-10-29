import type { UserRanks } from "../models/user.model";
import { state } from "../modules/state.module";
import { getRandomColor, makeElement } from "../modules/utils.module";
import { router } from "../router";
import { getYears } from "../services/canvas.service";
import { getInstanceIdForName, getUsernameForInstance } from "../services/instances.service";
import { getAllUsers, getAllUserStatsForYear } from "../services/users.service";

let allUsers: UserRanks[] | null = await getAllUsers();
let usersToDisplay: { username: string, stat: number, label: string }[] = [];

export async function renderUsers(params: { container: HTMLElement, instanceName?: string, year?: number }) {
    params.container.innerHTML = "";
    // Page Elements
    const main = makeElement("main", "mainContent", null, null);
    const returnToTopArrow = makeElement("div", "return-to-top", null, null);
    returnToTopArrow.appendChild(makeElement("span", null, "material-symbols-outlined", "arrow_shape_up"));

    const urlParams = new URLSearchParams(window.location.search);
    const yearParam = urlParams.get("year");
    let yearFromUrl: number | null = yearParam && !isNaN(Number(yearParam)) ? Number(yearParam) : null;
    let username = urlParams.get("username");
    const instanceIdParam = urlParams.get("id");
    let instanceId: number | null = null;
    let usernamesForInstance: string[] = [];
    let viewYear: string = "All";
    let yearColor: string = "";
    const years = getYears(true);
    if (instanceIdParam) instanceId = +instanceIdParam;

    if (params.instanceName) {
        document.title = `${params.instanceName} Users | Canvas Stats`;
        instanceId = await getInstanceIdForName(params.instanceName);
    } else {
        document.title = "Users | Canvas Stats";
    }

    if (instanceId) {
        usernamesForInstance = await getUsernameForInstance(instanceId);
    }

    if (yearFromUrl && years[yearFromUrl]) {
        viewYear = yearFromUrl.toString();
    } else if (state.year) {
        viewYear = state.year.toString();
    } else {
        viewYear = "All";
    }
    yearColor = years[viewYear];

    async function loadUserList() {
        let rawUsers: { username: string, stat: number, label: string }[] = [];
        let userHeadingText = "";

        // Fetch base dataset depending on viewYear
        if (viewYear === "All" && allUsers) {
            rawUsers = allUsers.map(user => ({
                username: user.username,
                stat: user.numYearsParticipated(),
                label: user.username
            }));
            userHeadingText = `Displaying users for All Years`;
        } else {
            const usersForYear = await getAllUserStatsForYear(+viewYear);
            if (usersForYear) {
                rawUsers = usersForYear.map(user => ({
                    username: user.username,
                    label: `${user.userRank}) ${user.username}`,
                    stat: user.pixelCount
                }));
                userHeadingText = `Displaying users for ${viewYear}`;
            }
        }

        // Apply Unified Filters (Search term & Instance)
        usersToDisplay = rawUsers;

        if (username && username.trim() !== "") {
            const searchTerm = username.trim().toLowerCase();
            usersToDisplay = usersToDisplay.filter(user => user.username.toLowerCase().includes(searchTerm));
        }

        if (usernamesForInstance.length > 0) {
            usersToDisplay = usersToDisplay.filter(user => usernamesForInstance.includes(user.username.toLowerCase()));
        }

        let filterDescriptionParts = [];
        if (params.instanceName) filterDescriptionParts.push(`for ${params.instanceName}`);
        if (username) filterDescriptionParts.push(`matching "${username.trim()}"`);
        
        userHeadingText = `Displaying ${usersToDisplay.length} user${usersToDisplay.length !== 1 ? 's' : ''} ${filterDescriptionParts.join(' ')}`;

        // Sort if viewing a specific year
        if (viewYear !== "All") {
            usersToDisplay.sort((a, b) => (b.stat ?? Infinity) - (a.stat ?? Infinity));
        }

        // Remove any existing rendered elements
        const usersDiv = document.getElementById("users");
        if (usersDiv) usersDiv.remove();
        const noResults = document.getElementById("no-results-heading");
        if (noResults) noResults.remove();

        // Render Results
        if (usersToDisplay.length > 0) {
            const users = makeElement("div", "users", null, null);
            const userHeading = makeElement("h2", "user-heading", "center", userHeadingText);
            const colHeadings = makeElement("div", "user-list-heading", null, null);
            const usernameCol = makeElement("p", null, null, "User");
            const userStatCol = makeElement("p", null, null, viewYear === "All" ? 'Years Participated' : 'Pixels Placed');
            colHeadings.append(usernameCol, userStatCol);

            let userResults = usersToDisplay.reduce((acc: HTMLElement, user) => {
                const nextUser = makeElement("p", user.username.toString(), `user-row clickable ${yearColor}`, null);
                const usernameEl = makeElement("p", null, null, user.label);
                const userStat = makeElement("p", null, null, user.stat.toString());
                nextUser.onclick = function () { router.navigateTo(`/users/${user.username}`) };
                nextUser.append(usernameEl, userStat);
                acc.appendChild(nextUser);
                return acc;
            }, makeElement("div", "user-results", null, null));

            users.append(userHeading, colHeadings, userResults);
            main.appendChild(users);
        }

        if (usersToDisplay.length < 10) {
            returnToTopArrow.classList.add("hide");
        } else {
            returnToTopArrow.classList.remove("hide");
        }

        if (usersToDisplay.length === 0) {
            const noResultsEl = makeElement("h2", "no-results-heading", "center", null);
            if (username && username.trim() !== "") {
                noResultsEl.textContent = `No results for "${username.trim()}"`;
            } else {
                noResultsEl.textContent = "No results for current filters";
            }
            main.appendChild(noResultsEl);
        }
    }

    const searchWrapper = document.getElementById("search") as HTMLElement;
    if (searchWrapper) {
        searchWrapper.innerHTML = "";
        const searchContainer = makeElement("div", "search-container", "search-bar-container", null);
        const searchIcon = makeElement("span", null, "material-symbols-outlined", "search");
        searchContainer.appendChild(searchIcon);

        const searchInput = makeElement("input", "search-input", "search-bar", null) as HTMLInputElement;
        searchInput.setAttribute("type", "text");
        let placeHolderText = params.instanceName ? `Search ${params.instanceName} users...` : "Search Users...";
        searchInput.setAttribute("placeholder", placeHolderText);
        if (username) searchInput.value = username;
        searchInput.setAttribute("name", "search-input");
        searchContainer.appendChild(searchInput);
        searchWrapper.appendChild(searchContainer);

        searchWrapper.addEventListener("input", async (e) => {
            e.preventDefault();
            username = searchInput.value;
            await loadUserList();
        });
        searchWrapper.addEventListener('keydown', (e: KeyboardEvent): void => {
            if (e.key === 'Enter') {
                e.preventDefault();
            }
        });
    }

    const randomColor = getRandomColor(1, true);
    returnToTopArrow.classList.add(randomColor);
    returnToTopArrow.onclick = function () {
        const header = document.querySelector('header') as HTMLElement;
        if (header) header.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

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

            await loadUserList();
        }
        acc.appendChild(yearButton);
        return acc;
    }, makeElement("div", "filter-users-row", null, null));
    const filterText = makeElement("p", "filter-users-label", null, "Filter by Year:");
    filterRow.prepend(filterText);
    main.appendChild(filterRow);
    params.container.append(main, returnToTopArrow);

    await loadUserList();

    const loadingElement = document.getElementById("loading") as HTMLElement;
    if (loadingElement) loadingElement.classList.add("hide");
}