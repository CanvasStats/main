import type { Achievement, AchievementInfo, AchievementStat } from "../models/achievement.model";
import { state } from "../modules/state.module";
import { loadSearchBar } from "../modules/templates.module";
import { capitalizeFirstLetter, createMessage, makeElement } from "../modules/utils.module";
import { checkAchievementsForUser, getAllAchievements } from "../services/achievements.service";
import { addAchievementsToDB, checkForExistingAchievements, deleteAchievementFromDB, getAllAchievementsFromDB, getClaimedUser } from "../services/db.service";
import { getYearsForUsername } from "../services/users.service";

const loadingElement = document.getElementById("loading") as HTMLElement;
let claimedUsername: string = "";
let achievements: AchievementStat[] = state.achievements;
const claimedResponse = await getClaimedUser();
let lastUpdated = "";
if (claimedResponse) {
    claimedUsername = claimedResponse;
}

function createCard(args: { icon: string, achName: string, description?: string, years?: number[], hint?: string, totalUsers: string[] }) {
    const achievementArticle = makeElement("article", args.achName, "achievement-card", null);
    const icon = makeElement("span", null, "material-symbols-outlined", args.icon);
    const info = makeElement("div", null, null, null);
    const title = makeElement("h2", null, null, null);
    if (args.years) {
        title.textContent = `${args.achName} (${args.years.join(", ")})`;
    } else {
        title.textContent = args.achName;
        achievementArticle.classList.add("not-yet");
    }
    info.appendChild(title);
    if (args.description) {
        const description = makeElement("p", null, null, args.description);
        info.appendChild(description);
    }

    if (args.hint) {
        const hint = makeElement("p", null, null, `(Hint: ${args.hint})`);
        info.appendChild(hint);
    }

    if (args["totalUsers"]) {
        info.appendChild(document.createElement("hr"));
        args.totalUsers.forEach(totalUsersString => {
            info.appendChild(makeElement("p", null, null, totalUsersString));
        })
    }

    achievementArticle.append(icon, info);
    return achievementArticle;
}

export async function renderAchievements(params: { container: HTMLElement }) {
    const main = makeElement("main", "mainContent", null, null);
    loadingElement.classList.remove("hide");
    loadSearchBar();
    params.container.innerHTML = "";

    const achievementGroups: Record<string, AchievementInfo> = {
        "ranking": {
            icon: "star",
            lockedCount: 0,
            hint: "There are 4 achievements that unlock based on your ranking, it is only possible to unlock one of these per year. There are 2 other achievements based on your participation over the years."
        }, "timing": {
            icon: "timer",
            lockedCount: 0,
            hint: "These are unlocked by placing pixels at certain times during the event."
        }, "location": {
            icon: "location_searching",
            lockedCount: 0,
            hint: "These unlock by placing pixels in specific locations."

        }, "colors": {
            icon: "palette",
            lockedCount: 0,
            hint: "These unlock based on how many of the total number of colors you use."
        }, "placed": {
            icon: "numbers",
            lockedCount: 0,
            hint: "These are unlocked by placing an exact number of pixels or placing a pixel on a coordinate containing a specific number. For example place exactly 13 pixels or place a pixel on a coordinate containing 13."
        }, "cover": {
            icon: "blinds",
            lockedCount: 0,
            hint: "These unlock based on what percent of your pixels placed made it to the end of the event without being covered by another pixel."
        }, "undo": {
            icon: "undo",
            lockedCount: 0,
            hint: "These unlock based on how many times you clicked the Undo button."
        }
    };

    let userAchievementArray: Achievement[] = [];
    
    if (achievements.length === 0) {
        const achievementData = await getAllAchievements();
        achievements = achievementData.achievements;
        lastUpdated = achievementData.lastUpdated;
    }
    let achievementsNotUnlocked: AchievementStat[] = [];

    if (claimedUsername) {

        document.title = `${claimedUsername}'s Achievements | Canvas Stats`;
        const yearsUserParticipated = await getYearsForUsername(claimedUsername);
        const hasExistingAchievements = await checkForExistingAchievements();


        if (hasExistingAchievements === "good") {
            userAchievementArray = await getAllAchievementsFromDB();
        } else if (hasExistingAchievements === "update") {
            await deleteAchievementFromDB("Perfect Attendance");
            const tempAchArray = await getAllAchievementsFromDB();
            userAchievementArray = await checkAchievementsForUser(claimedUsername, yearsUserParticipated, tempAchArray);
            await addAchievementsToDB(userAchievementArray);

            createMessage(`You unlocked ${userAchievementArray.length} Achievement${userAchievementArray.length != 1 ? "s" : ""}!`, "main-message", "info", 5);
        } else {
            userAchievementArray = await checkAchievementsForUser(claimedUsername, yearsUserParticipated, []);
            await addAchievementsToDB(userAchievementArray);

            createMessage(`You unlocked ${userAchievementArray.length} Achievement${userAchievementArray.length != 1 ? "s" : ""}!`, "main-message", "info", 5);
        }
        const userH2 = makeElement("h2", null, null, claimedUsername);
        const unlockedCount = makeElement("p", null, null, `You have unlocked ${userAchievementArray.length} out of ${achievements.length} achievements`);
        main.append(userH2, unlockedCount);
    } else {
        document.title = "Achievements | Canvas Stats";
        const claimToView = makeElement("h2", null, null, "Please claim a profile to view your achievements");
        const totalToUnlock = makeElement("p", null, null, `There are ${achievements.length} achievements to unlock.`);
        main.append(claimToView, totalToUnlock);
    }

    achievements.forEach(achievement => {
        const foundForUser = userAchievementArray.find(userAchievement => userAchievement["name"] === achievement["name"]);
        if (foundForUser) {
            const totalUsersStat = `${achievement.NumUsers} user${achievement.NumUsers === 1 ? "" : "s"} (${achievement.percentage}) have unlocked this achievement`;
            const unlockedCard = createCard({ icon: foundForUser.icon, achName: foundForUser.name, description: foundForUser.description, years: foundForUser.years, totalUsers: [totalUsersStat] });
            main.appendChild(unlockedCard);
        } else {
            achievementsNotUnlocked.push(achievement);
            achievementGroups[achievement.group].lockedCount += 1;
        }
    });

    //Achievements not yet unlocked
    for (const [key, value] of Object.entries(achievementGroups)) {
        let totalUsersArray: string[] = [];
        const lockedForGroup = achievementsNotUnlocked.filter(ach => ach.group === key);
        console.log(JSON.stringify(lockedForGroup))
        lockedForGroup.forEach((item, index) => {
            totalUsersArray.push(`#${index + 1} has been unlocked by ${item.NumUsers} user${item.NumUsers === 1 ? "" : "s"} (${item.percentage})`);
        });
        const lockedCard = createCard({ icon: value.icon, achName: `${capitalizeFirstLetter(key)} Achievements Not Unlocked`, description: `There are ${value.lockedCount} ${key} achievement${value.lockedCount === 1 ? "" : "s"} you have not yet unlocked`, hint: value.hint, totalUsers: totalUsersArray });
        main.appendChild(lockedCard);
    }

    const lastUpdatedP = makeElement("p", null, null, `Last Updated: ${lastUpdated}`);
    main.appendChild(lastUpdatedP);

    params.container.appendChild(main);
    if (loadingElement) loadingElement.classList.add("hide");
}