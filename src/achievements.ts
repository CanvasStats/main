import { initializeApp } from "./main";
import type { Achievement } from "./models";
import { capitalizeFirstLetter, createMessage, makeElement } from "./modules/utils";
import { checkAchievementsForUser, getAllAchievements } from "./services/achievements.service";
import { addAchievementsToDB, checkForExistingAchievements, deleteAchievementFromDB, getAllAchievementsFromDB, getClaimedUser } from "./services/db.service";
import { getYearsForUsername } from "./services/users.service";

await initializeApp("Users", "Achievements", false);

const main = document.getElementById("mainContent") as HTMLElement;

interface AchievementStat {
    name: string;
    NumUsers: number;
    percentage: string;
    group: string;
}

interface AchievementInfo {
    icon: string;
    lockedCount: number;
    hint: string;
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
    main.append(achievementArticle);
}

let claimedUsername: string = "";
const claimedResponse = await getClaimedUser();
if (claimedResponse) {
    claimedUsername = claimedResponse;
} else {
    createMessage("Please claim your profile from the Users list", "main-message", "error");
}

if (claimedUsername) {
    const yearsUserParticipated = await getYearsForUsername(claimedUsername);
    const hasExistingAchievements = await checkForExistingAchievements();
    let userAchievementArray: Achievement[] = [];

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

    const achievementGroups: Record<string, AchievementInfo> = {
        "ranking": {
            icon: "star",
            lockedCount: 0,
            hint: "These unlock by ranking within a certain range. Please note that you can only unlock one of the 4 ranking achievements for a given year."
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
    const achievementData = await getAllAchievements();
    const achievements: AchievementStat[] = achievementData.achievements;
    let achievementsNotUnlocked: AchievementStat[] = [];

    const userH2 = makeElement("h2", null, null, claimedUsername);
    const unlockedCount = makeElement("p", null, null, `You have unlocked ${userAchievementArray.length} out of ${achievements.length} achievements`);
    main.append(userH2, unlockedCount);

    achievements.forEach(achievement => {
        const foundForUser = userAchievementArray.find(userAchievement => userAchievement["name"] === achievement["name"]);
        if (foundForUser) {
            const totalUsersStat = `${achievement.NumUsers} user${achievement.NumUsers === 1 ? "" : "s"} (${achievement.percentage}) have unlocked this achievement`;
            createCard({ icon: foundForUser.icon, achName: foundForUser.name, description: foundForUser.description, years: foundForUser.years, totalUsers: [totalUsersStat] });
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
        createCard({icon: value.icon, achName: `${capitalizeFirstLetter(key)} Achievements Not Unlocked`, description: `There are ${value.lockedCount} ${key} achievement${value.lockedCount === 1 ? "" : "s"} you have not yet unlocked`, hint: value.hint, totalUsers: totalUsersArray });
    }

    const lastUpdated = makeElement("p", null, null, `Last Updated: ${achievementData.lastUpdated}`);
    main.appendChild(lastUpdated);
} else {
    main.appendChild(makeElement("h2", null, null, "Please claim a profile from the users list"));
}

const loading = document.getElementById("loading");
if (loading) loading.remove();
main.classList.remove("hide");