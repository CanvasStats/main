import { initializeApp } from "./main";
import type { ContentPair, User } from "./models";
import { navigateTo } from "./modules/navigate";
import { getRandomColor, makeElement } from "./modules/utils";
import { getYears } from "./services/canvas.service";
import { getAllUsers, getAllUserStatsForYear } from "./services/users.service";

let viewYear: number = 0;
let yearColor: string = "white";
const years = getYears();
const main = document.querySelector('main') as HTMLElement;
const urlParams = new URLSearchParams(window.location.search);
const usernameString: string | null = urlParams.get('username');
const yearString: string | null = urlParams.get('year');
if (yearString) viewYear = parseInt(yearString);
if (years.length > 0) {
    const findYear = years.find(year => parseInt(year.contentKey) === viewYear);
    if (findYear) {
        yearColor = findYear.contentValue;
    } else {
        yearColor = years[years.length - 1].contentValue;
    }
}

await initializeApp("Users", "Users", true);

const returnToTopArrow = document.getElementById("return-to-top") as HTMLElement;
const randomColor = getRandomColor(1, true);
returnToTopArrow.classList.add(randomColor);
returnToTopArrow.onclick = function () {
    const header = document.querySelector('header') as HTMLElement;
    header.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function displayUsersByName(users: ContentPair[]) {
    if (users.length < 10) {
        returnToTopArrow.classList.add("hide");
    } else {
        returnToTopArrow.classList.remove("hide");
    }
    const heading = makeElement("div", "user-list-heading", null, null);
    const usernameHeading = makeElement("p", null, null, "Username");
    const yearsParticipatedHeading = makeElement("p", null, null, "Years Participated");
    heading.append(usernameHeading, yearsParticipatedHeading);
    const usersListElem = users.reduce((acc: HTMLElement, user: ContentPair) => {
        const userRow = makeElement("div", user.contentKey, "user-row clickable", null);
        const username = makeElement("p", null, null, user.contentKey);
        const yearsParticipated = makeElement("p", null, null, user.contentValue);
        userRow.append(username, yearsParticipated);
        userRow.onclick = function () { navigateTo("/user", { params: { username: user.contentKey } }) }
        acc.appendChild(userRow);
        return acc;
    }, makeElement("div", "users", null, null));
    main.append(heading, usersListElem);
}

async function displayUsersByRank() {
    const userList = await getAllUserStatsForYear(viewYear);
    const heading = makeElement("div", "user-list-heading", null, null);
    const usernameHeading = makeElement("p", null, null, "Username");
    const userRankingHeading = makeElement("p", null, null, "Pixels Placed");
    heading.append(usernameHeading, userRankingHeading);
    if (userList) {
        const usersListElem = userList.reduce((acc: HTMLElement, user: User) => {
            const userRow = makeElement("div", user.username, "user-row clickable", null);
            const username = makeElement("p", null, null, `${user.userRank}) ${user.username}`);
            const pixelsPlaced = makeElement("p", null, null, `${user.pixelCount}`);
            userRow.append(username, pixelsPlaced);
            userRow.onclick = function () { navigateTo("/user", { params: { username: user.username, year: viewYear } }) }
            acc.appendChild(userRow);
            return acc;
        }, makeElement("div", "users", null, null));
        main.append(heading, usersListElem);
    }
}

const userList: ContentPair[] = await getAllUsers();
const filterRow = makeElement("div", "filter-users-row", null, null);
const filterText = makeElement("p", null, null, "Filter by Year:");
const all = makeElement("p", "all", "btn orange", "All Years");
all.onclick = function() {navigateTo("/users")}
filterRow.append(filterText);
if (viewYear !== 0) {
    filterRow.appendChild(all);
}
years.forEach((year: ContentPair) => {
    const yearButton = makeElement("p", year.contentKey, `btn ${year.contentValue}`, year.contentKey);
    if (parseInt(year.contentKey) === viewYear) yearButton.classList.add("active-btn");
    yearButton.onclick = function () { navigateTo("/users", { params: { year: year.contentKey } }) }
    if (year.contentKey !== "2026") filterRow.appendChild(yearButton);
});
main.appendChild(filterRow);
if (viewYear !== 0) {
    displayUsersByRank();
} else if (usernameString) {
    const filteredUsers = userList.filter(user => user.contentKey.toLowerCase().includes(usernameString.toLowerCase()));
    displayUsersByName(filteredUsers);
} else {
    displayUsersByName(userList);
}



