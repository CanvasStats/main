import { initializeApp } from "./main";
import type { Achievement, ColorCount, ContentPair, DataRow, JsonObject } from "./models";
import { getBlockStructure, renderTree } from "./modules/createNodeTree";
import { createColorTreemap, createLineGraph } from "./modules/d3Graphics";
import { navigateTo } from "./modules/navigate";
import { addLoadingElement, clearMessages, createMessage, makeElement, storeMessage } from "./modules/utils";
import { getYears } from "./services/canvas.service";
import { getClaimedUser, setClaimedUser, checkForExistingAchievements, getAllAchievementsFromDB, addAchievementsToDB } from "./services/db.service";
import { checkAchievementsForUser, GetColorCountForUsername, getPixelsPerHourForUser, getUserStats, getYearsForUsername } from "./services/users.service";

const main = document.querySelector('main') as HTMLElement;
const statsContainer = makeElement("div", "stats-container", null, null) as HTMLElement;
const mainLoader = addLoadingElement();

let viewYear: number = 2025;
let yearColor: string = "";
let username: string = "";
let claimedUserValue: string = "";

const years = getYears(false);
let yearsUserParticipated: number[] = [];
const urlParams = new URLSearchParams(window.location.search);
const usernameString: string | null = urlParams.get('name');
const yearString: string | null = urlParams.get('year');
if (yearString) viewYear = parseInt(yearString);
if (years.length > 0) {
    const findYear = years.find(year => parseInt(year.contentKey) === viewYear);
    if (findYear) {
        yearColor = findYear.contentValue;
    } else {
        yearColor = years[years.length - 1].contentValue;
    }
} else {
    yearColor = "white";
}

const achievementSection: HTMLElement = makeElement("fieldset", "achievements", null, null);
const loadingAch = makeElement("h2", null, null, "Loading Achievements . . . ");
achievementSection.appendChild(loadingAch);

await initializeApp("Users", usernameString!, true);
if (usernameString) {
    username = usernameString;
    const claimedResponse = await getClaimedUser();
    if (claimedResponse) claimedUserValue = claimedResponse;

    try {
        yearsUserParticipated = await getYearsForUsername(usernameString);
    } catch (error: any) {
        storeMessage(`${usernameString} not found`, "main-message", "error");
        navigateTo("/users/");
    }

    const userHeader = makeElement("section", "user-header", null, null);
    const usernameH2 = makeElement("h2", null, null, usernameString);
    userHeader.appendChild(usernameH2);
    const claimProfileButton = document.createElement("button") as HTMLButtonElement;
    claimProfileButton.type = "button";
    claimProfileButton.classList.add("green", "btn");
    const profileIcon = makeElement("span", null, "material-symbols-outlined", "account_circle");
    const buttonText = makeElement("span", null, null, null);
    if (claimedUserValue && claimedUserValue !== usernameString) {
        buttonText.textContent = "Claim this profile instead";
    } else if (!claimedUserValue) {
        buttonText.textContent = "Claim this profile";
    }
    if (buttonText.textContent) {
        claimProfileButton.append(profileIcon, buttonText);
        claimProfileButton.addEventListener("click", async () => {
            try {
                await setClaimedUser(usernameString);
                window.location.reload();
            } catch (error: any) {
                createMessage(error, "main-message", "error");
            }
        });
        userHeader.appendChild(claimProfileButton);
    }

    main.appendChild(userHeader);
    if (claimedUserValue && claimedUserValue === usernameString) {
        createMessage(`Welcome ${usernameString}!`, "main-message", "waving_hand", 5);
        main.appendChild(achievementSection);
    }

    if (yearString) {
        if (yearsUserParticipated.includes(parseInt(yearString))) {
            viewYear = parseInt(yearString);
        } else {
            const searchForYear = years.find(year => parseInt(year.contentKey) === viewYear);
            if (!searchForYear) {
                console.error(`${viewYear} is not a valid year`);
            } else {
                createMessage(`${username} did not participate in ${yearString}`, "main-message", "warning");
            }
            viewYear = yearsUserParticipated[yearsUserParticipated.length - 1];
        }
    } else {
        viewYear = yearsUserParticipated[yearsUserParticipated.length - 1];
    }

    const yearSelector = years.reduce((acc: HTMLElement, year: ContentPair) => {
        if (yearsUserParticipated.includes(parseInt(year.contentKey))) {
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
        }
        return acc;
    }, makeElement("div", "year-selector", `${yearColor}`, null));

    main.appendChild(yearSelector);
    const loading = document.getElementById("loading");
    if (loading) loading.remove();
    main.classList.remove("hide");
} else {
    navigateTo("/users/");
}

async function loadAchievements() {
    const hasExistingAchievements = await checkForExistingAchievements();
    let fullAchievementArray: Achievement[] = [];
    if (hasExistingAchievements === "good") {
        fullAchievementArray = await getAllAchievementsFromDB();
    } else if (hasExistingAchievements === "update") {
        const tempAchArray = await getAllAchievementsFromDB();
        fullAchievementArray = await checkAchievementsForUser(username, yearsUserParticipated, tempAchArray);
        await addAchievementsToDB(fullAchievementArray);
        createMessage(`You unlocked ${fullAchievementArray.length} Achievement!`, "main-message", "info", 5);
    } else {
        fullAchievementArray = await checkAchievementsForUser(username, yearsUserParticipated, []);
        await addAchievementsToDB(fullAchievementArray);
        createMessage(`You unlocked ${fullAchievementArray.length} Achievement!`, "main-message", "info", 5);
    }
    achievementSection.innerHTML = "";
    const legend = makeElement("legend", null, null, "Achievements");
    achievementSection.appendChild(legend);
    const achievementsFlexbox = fullAchievementArray.reduce((acc: HTMLElement, achievement: Achievement) => {
        const achievementDiv = makeElement("div", null, "dark-purple ach", null);
        const iconSpan = makeElement("span", null, "material-symbols-outlined", achievement.icon);
        achievementDiv.appendChild(iconSpan);
        const tooltipCard = makeElement("div", null, "tooltip-card", null);
        const titleEl = makeElement("strong", null, "tooltip-title", achievement.name);
        tooltipCard.appendChild(titleEl);
        const descText = `${achievement.description} (${achievement.years.join(', ')})`;
        const descEl = makeElement("p", null, "tooltip-desc", descText);
        tooltipCard.appendChild(descEl);
        achievementDiv.appendChild(tooltipCard);
        acc.appendChild(achievementDiv);
        return acc;
    }, makeElement("section", "achievements-flexbox", null, null));
    achievementSection.append(achievementsFlexbox);
}

async function updateStats() {
    const loadingText = document.getElementById("main-loader-text") as HTMLElement;
    statsContainer.innerHTML = "";
    mainLoader.classList.remove("hide");
    loadingText.textContent = "Getting user stats";
    const userData: JsonObject | null = await getUserStats(username, viewYear);
    loadingText.textContent = "Getting color counts";
    let userColorCounts: ColorCount[] | null = await GetColorCountForUsername(viewYear, username);
    loadingText.textContent = "Calculating pixels placed per hour";
    let pixelsPerHour: DataRow[] | undefined = await getPixelsPerHourForUser(viewYear, username);
    if (userData) {
        userData.blocks.forEach(async (block: any) => {
            const structure = getBlockStructure(block, viewYear);
            if (block.type === "user-color-grid") {
                loadingText.textContent = "Creating pie chart";
                const colorStat = makeElement("article", null, "right treemap", null);
                const treemapContainer = document.createElement('div');
                treemapContainer.setAttribute('class', 'colorCountsPieChart');
                treemapContainer.setAttribute('style', 'display: block; width: 100%; min-width: 300px; min-height: 300px;');
                colorStat.appendChild(treemapContainer);
                if (block.title) {
                    const statHeader = makeElement("h3", null, null, block.title);
                    colorStat.appendChild(statHeader);
                }
                statsContainer.appendChild(colorStat);
                const dynamicRatio = window.innerWidth < 600 ? 1.0 : 0.6;
                if (userColorCounts && userColorCounts.length > 0) createColorTreemap(treemapContainer, userColorCounts, dynamicRatio, false, viewYear, 0);

            } else if (block.type === "graph") {
                loadingText.textContent = "Creating line graph";
                const graphStat = makeElement("article", null, block.layout, null);
                const statSection = makeElement("section", null, null, null);
                if (block.title) {
                    const statHeader = makeElement("h3", null, "center", block.title);
                    statSection.appendChild(statHeader);
                }
                const graphContainer = makeElement("div", "line-graph-container", null, null);
                graphContainer.setAttribute("style", "width: 100%; max-width: 800px; margin: auto;")
                statSection.appendChild(graphContainer);
                graphStat.appendChild(statSection);
                statsContainer.appendChild(graphStat);
                if (pixelsPerHour) createLineGraph(pixelsPerHour, graphContainer);
            } else {
                renderTree(structure, statsContainer);
            }
        });
    } else {
        createMessage(`Could not load ${username}'s data for ${viewYear}`, "main-message", "error");
    }
    loadingText.textContent = "All Done!";
    mainLoader.classList.add("hide");
}

main.append(mainLoader, statsContainer);
await updateStats();
if (claimedUserValue && claimedUserValue === usernameString) {
    await loadAchievements();
}
