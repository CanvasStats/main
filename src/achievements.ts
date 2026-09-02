import { initializeApp } from "./main";
import type { Achievement } from "./models";
import { createMessage, makeElement } from "./modules/utils";
import { checkAchievementsForUser } from "./services/achievements.service";
import { addAchievementsToDB, checkForExistingAchievements, deleteAchievementFromDB, getAllAchievementsFromDB, getClaimedUser } from "./services/db.service";
import { getYearsForUsername } from "./services/users.service";

await initializeApp("Users", "Achievements", false);

const main = document.getElementById("mainContent") as HTMLElement;

function checkForAchievements(achievementArray: Achievement[], achievementNames: string[], notUnlockedCount: number) {
    let updatedNotUnlockedCount = notUnlockedCount;
    achievementNames.forEach(achievementToCheck => {
        let achievementFound = achievementArray.find(achievement => achievement.name === achievementToCheck);
        if (achievementFound) {
            createCard({ icon: achievementFound.icon, achName: achievementFound.name, description: achievementFound.description, years: achievementFound.years });
        } else {
            updatedNotUnlockedCount += 1;
        }
    });
    return updatedNotUnlockedCount;
}

function createCard(args: { icon: string, achName: string, description?: string, years?: number[], hint?: string}) {
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
    //const totalUsers = makeElement("p", null, null, `${achievement.totalUsers} users also got this achievement`);
    if (args.hint) {
        const hint = makeElement("p", null, null, `(Hint: ${args.hint})`);
        info.appendChild(hint);
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
    let fullAchievementArray: Achievement[] = [];

    if (hasExistingAchievements === "good") {
        fullAchievementArray = await getAllAchievementsFromDB();
    } else if (hasExistingAchievements === "update") {
        deleteAchievementFromDB("Perfect Attendance");
        const tempAchArray = await getAllAchievementsFromDB();
        fullAchievementArray = await checkAchievementsForUser(claimedUsername, yearsUserParticipated, tempAchArray);
        await addAchievementsToDB(fullAchievementArray);

        createMessage(`You unlocked ${fullAchievementArray.length} Achievement${fullAchievementArray.length != 1 ? "s" : ""}!`, "main-message", "info", 5);
    } else {
        fullAchievementArray = await checkAchievementsForUser(claimedUsername, yearsUserParticipated, []);
        await addAchievementsToDB(fullAchievementArray);

        createMessage(`You unlocked ${fullAchievementArray.length} Achievement${fullAchievementArray.length != 1 ? "s" : ""}!`, "main-message", "info", 5);
    }

    //Total possible = 34
    const usernameH1 = makeElement("h1", null, null, claimedUsername);
    const unlockedCountP = makeElement("p", null, null, `You have unlocked ${fullAchievementArray.length} out of 34 achievements`);
    main.append(usernameH1, unlockedCountP);

    let ranksNotUnlocked = 0;
    let colorsNotUnlocked = 0;
    let undoNotUnlocked = 0;
    let locationPlacementNotUnlocked = 0;
    let coveredNotUnlocked = 0;
    let specialsNotUnlocked = 0;
    let timingsNotUnlocked = 0;

    //rankings (6)
    const rankingsToCheck = ["Participation Trophy", "Perfect Attendance", "Top 10", "Top 25", "Top 50", "Top 100"]
    ranksNotUnlocked = checkForAchievements(fullAchievementArray, rankingsToCheck, ranksNotUnlocked);

    //Timing (8)
    const timingsToCheck = ["Opener", "1st 5 Seconds", "1st 10 Seconds", "1st Minute", "Closer", "Final 5 Seconds", "Final 10 Seconds", "Final Minute"];
    timingsNotUnlocked = checkForAchievements(fullAchievementArray, timingsToCheck, timingsNotUnlocked);

    //Colors (2)
    const colorsToCheck = ["Monocolor", "Taste the Rainbow"];
    colorsNotUnlocked = checkForAchievements(fullAchievementArray, colorsToCheck, colorsNotUnlocked)

    //Undo (3)
    const undoToCheck = ["Delete Your Art", "No Mistakes", "You know there is an undo button, right?"]
    undoNotUnlocked = checkForAchievements(fullAchievementArray, undoToCheck, undoNotUnlocked);

    //Location Placement (3)
    const locationsToCheck = ["Four Corners", "Most Contested", "Worlds Apart"];
    locationPlacementNotUnlocked = checkForAchievements(fullAchievementArray, locationsToCheck, locationPlacementNotUnlocked);

    //Covered (2)
    const coveredToCheck = ["Can't Cover me", "Cover-up"];
    coveredNotUnlocked = checkForAchievements(fullAchievementArray, coveredToCheck, coveredNotUnlocked);

    //specials (10)
    const specialsToCheck = ["Alright Alright Alright Count", "Answer to the Ultimate Question of Life, the Universe, and Everything Count", "Diablo Count", "Nice Count", "Unlucky Count", "Alright Alright Alright Coordinate", "Answer to the Ultimate Question of Life, the Universe, and Everything Coordinate","Diablo Coordinate", "Nice Coordinate", "Unlucky Coordinate"];
    specialsNotUnlocked = checkForAchievements(fullAchievementArray, specialsToCheck, specialsNotUnlocked);

    //Achievements not yet unlocked
    if (ranksNotUnlocked > 0) {
        createCard({ icon: "star", achName: "Ranking Achievements Not Unlocked", description: `There ${ranksNotUnlocked === 1 ? "is" : "are"} ${ranksNotUnlocked} ranking achievement${ranksNotUnlocked === 1 ? "" : "s"} you have not unlocked yet.`, hint: "These unlock by ranking within a certain range. Please note that you can only unlock one of the 4 ranking achievements for a given year." });
    }

    if (timingsNotUnlocked > 0) {
        createCard({icon: "timer", achName: "Timing achievements Not Unlocked", description: `There ${timingsNotUnlocked === 1 ? "is" : "are"} ${timingsNotUnlocked} timing achievement${timingsNotUnlocked === 1 ? "" : "s"} you have not unlocked yet.`, hint: "These are unlocked by placing pixels at certain times during the event."});
    }

    if (colorsNotUnlocked > 0) {
        createCard({icon: "palette", achName: "Color Achievements Not Unlocked", description: `There ${colorsNotUnlocked === 1 ? "is" : "are"} ${colorsNotUnlocked} color achievement${colorsNotUnlocked === 1 ? "" : "s"} you have not unlocked yet.`, hint: "These unlock based on how many of the total number of colors you use."});
    }

    if (undoNotUnlocked > 0) {
        createCard({icon: "palette", achName: "Undo Achievements Not Unlocked", description: `There ${undoNotUnlocked === 1 ? "is" : "are"} ${undoNotUnlocked} undo achievement${undoNotUnlocked === 1 ? "" : "s"} you have not unlocked yet.`, hint: "These unlock based on how many times you clicked the Undo button."});
    }

    if (locationPlacementNotUnlocked > 0) {
        createCard({icon: "location_searching", achName: "Location Placement Achievements Not Unlocked", description: `There ${locationPlacementNotUnlocked === 1 ? "is" : "are"} ${locationPlacementNotUnlocked} location placement achievement${locationPlacementNotUnlocked === 1 ? "" : "s"} you have not unlocked yet.`, hint: "These unlock by placing pixels in specific locations."});
    }

    if (coveredNotUnlocked > 0) {
        createCard({icon: "blinds", achName: "Pixels Covered Achievements Not Unlocked", description: `There ${coveredNotUnlocked === 1 ? "is" : "are"} ${coveredNotUnlocked} pixels covered achievement${coveredNotUnlocked === 1 ? "" : "s"} you have not unlocked yet.`, hint: "These unlock based on what percent of your pixels placed made it to the end of the event without being covered by another pixel."});
    }

    if (specialsNotUnlocked > 0) {
        createCard({icon: "numbers", achName: "Special Achievements Not Unlocked", description: `There ${specialsNotUnlocked === 1 ? "is" : "are"} ${specialsNotUnlocked} special achievement${specialsNotUnlocked === 1 ? "" : "s"} you have not unlocked yet.`, hint: "These are unlocked by placing an exact number of pixels or placing a pixel on a coordinate containing a specific number. For example place exactly 13 pixels or place a pixel on a coordinate containing 13."});
    }
} else {
    main.appendChild(makeElement("h2", null, null, "Please claim a profile from the users list"));
}

const loading = document.getElementById("loading");
if (loading) loading.remove();
main.classList.remove("hide");