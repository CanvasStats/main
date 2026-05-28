import { initializeApp } from "./main";
import type { ContentPair, UserItem, UserRanks } from "./models";
import { navigateTo } from "./modules/navigate";
import { getRandomColor, makeElement, storeMessage } from "./modules/utils";
import { getYears } from "./services/canvas.service";
import { getAllUsersForInstance } from "./services/instances.service";
import { getAllUsers } from "./services/users.service";

let viewYear: string = "All";
let yearColor: string = "";
const years = getYears(true);
const main = document.querySelector('main') as HTMLElement;
const heading = makeElement("div", "user-list-heading", null, null);
let userList: UserRanks[] | null = await getAllUsers();
const userListCache: Record<string, UserItem[] | undefined> = {};

const urlParams = new URLSearchParams(window.location.search);
let usernameString: string | null = urlParams.get('username');
const yearString: string | null = urlParams.get('year');
const instanceIdString: string | null = urlParams.get('id');
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

await initializeApp("Users", "Users", true);
const returnToTopArrow = document.getElementById("return-to-top") as HTMLElement;
const randomColor = getRandomColor(1, true);
returnToTopArrow.classList.add(randomColor);
returnToTopArrow.onclick = function () {
    const header = document.querySelector('header') as HTMLElement;
    header.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

async function loadYearData(viewYear: string): Promise<UserItem[]> {
    if (instanceIdString) {
        if (!isNaN(parseInt(instanceIdString))) {
            const yearToSearch: number = viewYear === "All" ? 0 : +viewYear
            const newList = await getAllUsersForInstance(+instanceIdString, yearToSearch)
            newList.sort((a, b) => {
                const rankA = a.userRank ?? Infinity;
                const rankB = b.userRank ?? Infinity;
                return rankA - rankB;
            });
            return newList;
        } else {
            storeMessage("Error: invalid instance ID. Please try again", "main-message", "error");
            navigateTo("/instances/");
        }
    }
    if (userListCache[viewYear]) {
        return userListCache[viewYear];
    }
    if (userList) {
        const newList: UserItem[] = userList.reduce((acc: UserItem[], user: UserRanks) => {
            let newUser: UserItem = { username: "" }
            if (viewYear === "All") {
                newUser = { username: user.username, yearsParticipated: user.numYearsParticipated() }
            } else {
                switch (viewYear) {
                    case "2023":
                        if (user.rank_2023 && user.pixels_2023) newUser = { userRank: user.rank_2023, username: user.username, pixelsPlaced: user.pixels_2023 }
                        break;
                    case "2024":
                        if (user.rank_2024 && user.pixels_2024) newUser = { userRank: user.rank_2024, username: user.username, pixelsPlaced: user.pixels_2024 }
                        break;
                    case "2025":
                        if (user.rank_2025 && user.pixels_2025) newUser = { userRank: user.rank_2025, username: user.username, pixelsPlaced: user.pixels_2025 }
                        break;
                }
            }
            acc.push(newUser);
            return acc;
        }, []);
        if (viewYear === "All") {
            newList.sort((a, b) => a.username.localeCompare(b.username));
        } else {
            newList.sort((a, b) => {
                const rankA = a.userRank ?? Infinity;
                const rankB = b.userRank ?? Infinity;
                return rankA - rankB;
            });
        }
        userListCache[viewYear] = newList ?? [];
        return userListCache[viewYear];
    }
    return [];
}

async function loadUserList() {
    heading.innerHTML = "";
    heading.classList.remove("hide");
    const existingUserList = document.getElementById("users");
    if (existingUserList) existingUserList.remove();
    let userList = await loadYearData(viewYear);
    if (usernameString) {
        const username = usernameString.toLowerCase();
        userList = userList.filter(user => user.username.toLowerCase().includes(username));
        viewYear = "All";
    }

    if (viewYear === "All") {
        const usernameHeading = makeElement("p", null, null, "Username");
        const yearsParticipatedHeading = makeElement("p", null, null, "Years Participated");
        heading.append(usernameHeading, yearsParticipatedHeading);
    } else {
        const usernameHeading = makeElement("p", null, null, "Username");
        const pixelsHeading = makeElement("p", null, null, "Pixels Placed");
        heading.append(usernameHeading, pixelsHeading);
    }

    if (userList.length < 10) {
        returnToTopArrow.classList.add("hide");
    } else {
        returnToTopArrow.classList.remove("hide");
    }

    if (userList.length > 0) {
        const usersListElem = userList.reduce((acc: HTMLElement, user: UserItem) => {
            const userRow = makeElement("div", user.username, `user-row clickable ${yearColor}`, null);
            const usernameP = makeElement("p", null, null, null);
            const statP = makeElement("p", null, null, null);
            if (user.userRank) {
                usernameP.textContent = `${user.userRank}) ${user.username}`;
                statP.textContent = `${user.pixelsPlaced}`;
            } else {
                usernameP.textContent = user.username;
                statP.textContent = `${user.yearsParticipated}`;
            }
            userRow.append(usernameP, statP);
            userRow.onclick = function () { navigateTo("/user", { params: { username: user.username } }) }
            if (viewYear !== "All" && user.pixelsPlaced) acc.appendChild(userRow);
            if (viewYear === "All") acc.appendChild(userRow);
            return acc;
        }, makeElement("div", "users", null, null));
        main.appendChild(usersListElem);
    } else {
        heading.classList.add("hide");
        const noUsersElem = makeElement("div", "users", null, null);
        const noUsersRow = makeElement("div", null, `user-row red`, "No users found for current filters");
        noUsersElem.appendChild(noUsersRow);
        main.appendChild(noUsersElem);
    }
}

const filterRow = makeElement("div", "filter-users-row", null, null);
const filterText = makeElement("p", "filter-users-label", null, "Filter by Year:");
filterRow.append(filterText);
years.forEach((year: ContentPair) => {
    const yearButton = makeElement("p", year.contentKey, `btn ${year.contentValue}`, year.contentKey);
    if (year.contentKey === viewYear) yearButton.classList.add("active-btn");

    yearButton.onclick = async function () {
        usernameString = null;
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
await loadUserList();
const loading = document.getElementById("loading");
if (loading) loading.remove();
main.classList.remove("hide");