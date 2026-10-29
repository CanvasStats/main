import type { Achievement } from "../models/achievement.model";
import type { ColorCount } from "../models/color.model";
import type { DataRow, JsonObject } from "../models/helpers.model";
import { getBlockStructure, renderTree } from "../modules/createNodeTree.module";
import { createColorTreemap, createLineGraph } from "../modules/d3Graphics.module";
import { state } from "../modules/state.module";
import { loadSearchBar } from "../modules/templates.module";
import { addLoadingElement, clearMessages, createMessage, makeElement } from "../modules/utils.module";
import { router } from "../router";
import { checkAchievementsForUser } from "../services/achievements.service";
import { getYears } from "../services/canvas.service";
import { addAchievementsToDB, checkForExistingAchievements, clearAchievementsFromDB, deleteAchievementFromDB, getAllAchievementsFromDB, getClaimedUser, setClaimedUser } from "../services/db.service";
import { GetColorCountForUsername, getPixelsPerHourForUser, getUserStats, getYearsForUsername } from "../services/users.service";
import { renderNotFound } from "./notFound.view";

export async function renderUser(container: HTMLElement, username: string) {
    loadSearchBar();
    const urlParams = new URLSearchParams(window.location.search);
    const main = makeElement("main", "mainContent", null, null);
    const statsContainer = makeElement("div", "stats-container", null, null) as HTMLElement;
    const mainLoader = addLoadingElement();

    container.innerHTML = "";

    const loadingElement = document.getElementById("loading") as HTMLElement;
    if (loadingElement) loadingElement.classList.remove("hide");

    container.appendChild(mainLoader);
    const loadingText = document.getElementById("main-loader-text") as HTMLElement;
    mainLoader.classList.remove("hide");

    let yearColor: string = "";
    let claimedUserValue: string = "";
    let viewYear: number = 0;
    const urlYear = urlParams.get("year");
    const years = getYears(false);
    let yearsUserParticipated: number[] = [];

    const achievementSection: HTMLElement = makeElement("fieldset", "achievements", null, null);
    const loadingAch = makeElement("h2", null, null, "Loading Achievements . . . ");
    achievementSection.appendChild(loadingAch);
    const claimedResponse = await getClaimedUser();
    if (claimedResponse) claimedUserValue = claimedResponse;

    try {
        yearsUserParticipated = await getYearsForUsername(username);
    } catch (error: any) {
        renderNotFound(container, { username: username });
        return;
    }

    const userHeader = makeElement("section", "user-header", null, null);
    const usernameH2 = makeElement("h2", null, null, username);
    userHeader.appendChild(usernameH2);

    const claimProfileButton = document.createElement("button") as HTMLButtonElement;
    claimProfileButton.type = "button";
    claimProfileButton.classList.add("green", "btn");
    const profileIcon = makeElement("span", null, "material-symbols-outlined", "account_circle");
    const buttonText = makeElement("span", null, null, null);

    if (claimedUserValue && claimedUserValue !== username) {
        buttonText.textContent = "Claim this profile instead";
    } else if (!claimedUserValue) {
        buttonText.textContent = "Claim this profile";
    }

    if (buttonText.textContent) {
        claimProfileButton.append(profileIcon, buttonText);
        claimProfileButton.addEventListener("click", async () => {
            try {
                await setClaimedUser(username);
                await clearAchievementsFromDB();
                window.location.reload();
            } catch (error: any) {
                createMessage({message: error, location: "main-message", type: "error"});
            }
        });
        userHeader.appendChild(claimProfileButton);
    }

    main.appendChild(userHeader);

    if (claimedUserValue && claimedUserValue === username) {
        createMessage({message: `Welcome ${username}!`, location: "main-message", type: "waving_hand", timeoutSeconds: 5});
        main.appendChild(achievementSection);
    }

    if (urlYear) {
        if (yearsUserParticipated.includes(parseInt(urlYear))) {
            viewYear = parseInt(urlYear);
        } else {
            if (!years[+viewYear]) {
                console.error(`${viewYear} is not a valid year`);
            } else {
                createMessage({message: `${username} did not participate in ${urlYear}`, location: "main-message", type: "warning"});
            }
            viewYear = yearsUserParticipated[yearsUserParticipated.length - 1];
        }
    } else if (state.year && yearsUserParticipated.includes(state.year)) {
        viewYear = state.year;
    } else {
        viewYear = yearsUserParticipated[yearsUserParticipated.length - 1];
    }
    yearColor = years[viewYear];

    const yearSelector = Object.entries(years).reduce((acc: HTMLElement, [year, color]) => {
        if (yearsUserParticipated.includes(parseInt(year))) {
            const yearButton = makeElement("div", year, color, year);
            if (parseInt(year) === viewYear) {
                yearButton.classList.add("active-year");
            }

            yearButton.onclick = async function () {
                viewYear = parseInt(year);
                state.setYear(+year);
                const urlParams = new URLSearchParams(window.location.search);
                urlParams.set('year', String(viewYear));
                const newUrl = `${window.location.pathname}?${urlParams.toString()}`;
                window.history.replaceState({}, '', newUrl);
                acc.className = `${color}`;
                Array.from(acc.children).forEach((child) => {
                    child.classList.remove("active-year");
                });
                yearButton.classList.add("active-year");
                statsContainer.className = color;
                clearMessages();
                await updateStats();
            };

            acc.appendChild(yearButton);
        }
        return acc;
    }, makeElement("div", "year-selector", `${yearColor}`, null));

    main.appendChild(yearSelector);

    async function loadAchievements() {
        const hasExistingAchievements = await checkForExistingAchievements();
        let fullAchievementArray: Achievement[] = [];

        if (hasExistingAchievements === "good") {
            fullAchievementArray = await getAllAchievementsFromDB();
        } else if (hasExistingAchievements === "update") {
            await deleteAchievementFromDB("Perfect Attendance");
            const tempAchArray = await getAllAchievementsFromDB();
            fullAchievementArray = await checkAchievementsForUser(username, yearsUserParticipated, tempAchArray);
            await addAchievementsToDB(fullAchievementArray);

            createMessage({message: `You unlocked ${fullAchievementArray.length} Achievement${fullAchievementArray.length != 1 ? "s" : ""}!`, location: "main-message", type: "info", timeoutSeconds: 5});
        } else {
            fullAchievementArray = await checkAchievementsForUser(username, yearsUserParticipated, []);
            await addAchievementsToDB(fullAchievementArray);

            createMessage({message: `You unlocked ${fullAchievementArray.length} Achievement${fullAchievementArray.length != 1 ? "s" : ""}!`, location: "main-message", type: "info", timeoutSeconds: 5});
        }

        achievementSection.innerHTML = "";
        const legend = makeElement("legend", null, null, null);
        legend.appendChild(makeElement("span", null, null, "Achievements - "));
        const viewAll = document.createElement("a") as HTMLAnchorElement;
        viewAll.textContent = "View All";
        viewAll.addEventListener("click", () => router.navigateTo("/achievements"));
        legend.appendChild(viewAll);
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
        }, makeElement("div", "achievements-flexbox", null, null));

        achievementSection.append(achievementsFlexbox);
    }

    async function updateStats() {
        statsContainer.innerHTML = "";
        mainLoader.classList.remove("hide");
        loadingText.textContent = "Getting user stats";
        const userData: JsonObject | null = await getUserStats(username, viewYear);

        loadingText.textContent = "Getting color counts";
        let userColorCounts: ColorCount[] | null = await GetColorCountForUsername(viewYear, username);

        loadingText.textContent = "Calculating pixels placed per hour";
        let pixelsPerHour: DataRow[] | undefined = await getPixelsPerHourForUser(viewYear, username);

        if (userData) {
            for (const block of userData.blocks) {
                const structure = getBlockStructure(block);
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
                    graphContainer.setAttribute("style", "width: 100%; max-width: 800px; margin: auto;");
                    statSection.appendChild(graphContainer);
                    graphStat.appendChild(statSection);
                    statsContainer.appendChild(graphStat);
                    if (pixelsPerHour) createLineGraph(pixelsPerHour, graphContainer);
                } else {
                    console.log(`type = ${block.type}`)
                    renderTree(structure, statsContainer);
                }
            }
        } else {
            createMessage({message: `Could not load ${username}'s data for ${viewYear}`, location: "main-message", type: "error"});
        }
        mainLoader.classList.add("hide");
    }

    main.append(mainLoader, statsContainer);

    await updateStats();
    if (claimedUserValue && claimedUserValue === username) {
        loadingText.textContent = "Loading achievements";
        await loadAchievements();
    }

    loadingText.textContent = "All Done!";
    mainLoader.classList.add("hide");

    container.appendChild(main);
    if (loadingElement) loadingElement.classList.add("hide");
}