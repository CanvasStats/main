import { initializeApp } from "./main";
import type { Achievement } from "./models";
import { createMessage, makeElement } from "./modules/utils";
import { checkAchievementsForUser } from "./services/achievements.service";
import { addAchievementsToDB, checkForExistingAchievements, getAllAchievementsFromDB, getClaimedUser } from "./services/db.service";
import { getYearsForUsername } from "./services/users.service";

await initializeApp("Users", "Achievements", false);

const main = document.getElementById("mainContent") as HTMLElement;

function checkForAchievement(arr: Achievement[], name: string) {
    let ach = arr.find(a => a.name === name);
    if (ach) {
        return ach;
    } else {
        return null;
    }
}

function createCard(args: { icon: string, achName: string, description?: string, years?: number[], hint?: string}) {
    const achievArticle = makeElement("article", args.achName, "achievement-card", null);
    const icon = makeElement("span", null, "material-symbols-outlined", args.icon);
    const info = makeElement("div", null, null, null);
    const title = makeElement("h2", null, null, null);
    if (args.years) {
        title.textContent = `${args.achName} (${args.years.join(", ")})`;
    } else {
        title.textContent = args.achName;
        achievArticle.classList.add("not-yet");
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
    achievArticle.append(icon, info);
    main.append(achievArticle);
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
        const tempAchArray = await getAllAchievementsFromDB();
        fullAchievementArray = await checkAchievementsForUser(claimedUsername, yearsUserParticipated, tempAchArray);
        await addAchievementsToDB(fullAchievementArray);

        createMessage(`You unlocked ${fullAchievementArray.length} Achievement${fullAchievementArray.length != 1 ? "s" : ""}!`, "main-message", "info", 5);
    } else {
        fullAchievementArray = await checkAchievementsForUser(claimedUsername, yearsUserParticipated, []);
        await addAchievementsToDB(fullAchievementArray);

        createMessage(`You unlocked ${fullAchievementArray.length} Achievement${fullAchievementArray.length != 1 ? "s" : ""}!`, "main-message", "info", 5);
    }

    //Total possible = 33
    const usernameH1 = makeElement("h1", null, null, claimedUsername);
    const unlockedCountP = makeElement("p", null, null, `You have unlocked ${fullAchievementArray.length} out of 33 achievements`);
    main.append(usernameH1, unlockedCountP);

    let ranksNotUnlocked = 0;
    let colorsNotUnlocked = 0;
    let undoNotUnlocked = 0;
    let locationPlacementNotUnlocked = 0;
    let coveredNotUnlocked = 0;
    let specialsNotUnlocked = 0;
    let timingsNotUnlocked = 0;

    //rankings (5)
    const top10 = checkForAchievement(fullAchievementArray, "Top 10");
    const top25 = checkForAchievement(fullAchievementArray, "Top 25");
    const top50 = checkForAchievement(fullAchievementArray, "Top 50");
    const top100 = checkForAchievement(fullAchievementArray, "Top 100");

    if (top10) {
        createCard({ icon: top10.icon, achName: top10.name, description: top10.description, years: top10.years });
    } else {
        ranksNotUnlocked += 1;
    }
    if (top25) {
        createCard({ icon: top25.icon, achName: top25.name, description: top25.description, years: top25.years });
    } else {
        ranksNotUnlocked += 1;
    }
    if (top50) {
        createCard({ icon: top50.icon, achName: top50.name, description: top50.description, years: top50.years });
    } else {
        ranksNotUnlocked += 1;
    }
    if (top100) {
        createCard({ icon: top100.icon, achName: top100.name, description: top100.description, years: top100.years });
    } else {
        ranksNotUnlocked += 1;
    }

    const participation = checkForAchievement(fullAchievementArray, "Participation Trophy");
    if (participation) {
        createCard({ icon: participation.icon, achName: participation.name, description: participation.description, years: participation.years });
    }

    //Timing (8)
    const timings = ["Opener", "1st 5 Seconds", "1st 10 Seconds", "1st Minute", "Closer", "Final 5 Seconds", "Final 10 Seconds", "Final Minute"];
    const timingsUnlocked = fullAchievementArray.filter(achievement => {
        if (timings.includes(achievement.name)) {
            return achievement;
        }
    });
    timingsUnlocked.map(achievement => createCard({icon: achievement.icon, achName: achievement.name, description: achievement.description, years: achievement.years}));
    timingsNotUnlocked = timings.length - timingsUnlocked.length;

    //Colors (2)
    const rainbow = checkForAchievement(fullAchievementArray, "Taste the Rainbow");
    const mono = checkForAchievement(fullAchievementArray, "Monocolor");
    
    if (rainbow) {
        createCard({ icon: rainbow.icon, achName: rainbow.name, description: rainbow.description, years: rainbow.years });
    } else {
        colorsNotUnlocked += 1;
    }

    if (mono) {
        createCard({ icon: mono.icon, achName: mono.name, description: mono.description, years: mono.years });
    } else {
        colorsNotUnlocked += 1;
    }

    //Undo (3)
    const deleteYourArt = checkForAchievement(fullAchievementArray, "Delete Your Art");
    const noMistakes = checkForAchievement(fullAchievementArray, "No Mistakes");
    const youKnowUndoButton = checkForAchievement(fullAchievementArray, "You know there is an undo button, right?");

    if (noMistakes) {
        createCard({ icon: noMistakes.icon, achName: noMistakes.name, description: noMistakes.description, years: noMistakes.years });
    } else {
        undoNotUnlocked += 1;
    }
    if (deleteYourArt) {
        createCard({ icon: deleteYourArt.icon, achName: deleteYourArt.name, description: deleteYourArt.description, years: deleteYourArt.years });
    } else {
        undoNotUnlocked += 1;
    }
    if (youKnowUndoButton) {
        createCard({icon: youKnowUndoButton.icon, achName: youKnowUndoButton.name, description: youKnowUndoButton.description, years: youKnowUndoButton.years});
    } else {
        undoNotUnlocked += 1;
    }

    //Location Placement (2)
    const four = checkForAchievement(fullAchievementArray, "Four Corners");
    const worlds = checkForAchievement(fullAchievementArray, "Worlds Apart");

    if (four) {
        createCard({ icon: four.icon, achName: four.name, description: four.description, years: four.years });
    } else {
        locationPlacementNotUnlocked += 1;
    }
    if (worlds) {
        createCard({ icon: worlds.icon, achName: worlds.name, description: worlds.description, years: worlds.years });
    } else {
        locationPlacementNotUnlocked += 1;
    }

    const mostContested = checkForAchievement(fullAchievementArray, "Most Contested");
    if (mostContested) {
        createCard({ icon: mostContested.icon, achName: mostContested.name, description: mostContested.description, years: mostContested.years });
    }

    //Covered (2)
    const cantCoverMe = checkForAchievement(fullAchievementArray, "Can't Cover me");
    const coverUp = checkForAchievement(fullAchievementArray, "Cover-up");

    if (cantCoverMe) {
        createCard({ icon: cantCoverMe.icon, achName: cantCoverMe.name, description: cantCoverMe.description, years: cantCoverMe.years });
    } else {
        coveredNotUnlocked += 1;
    }
    if (coverUp) {
        createCard({ icon: coverUp.icon, achName: coverUp.name, description: coverUp.description, years: coverUp.years });
    } else {
        coveredNotUnlocked += 1;
    }

    //specials (10)
    const specials = ["Alright Alright Alright Count", "Answer to the Ultimate Question of Life, the Universe, and Everything Count", "Diablo Count", "Nice Count", "Unlucky Count", "Alright Alright Alright Coordinate", "Answer to the Ultimate Question of Life, the Universe, and Everything Coordinate","Diablo Coordinate", "Nice Coordinate", "Unlucky Coordinate"];
    const specialsUnlocked = fullAchievementArray.filter(achievement => {
        if (specials.includes(achievement.name)) {
            return achievement;
        }
    });
    specialsUnlocked.map(achievement => createCard({icon: achievement.icon, achName: achievement.name, description: achievement.description, years: achievement.years}));
    specialsNotUnlocked = 10 - specialsUnlocked.length;

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

    if (!mostContested) {
        createCard({icon: "layers", achName: "Most Contested Not Unlocked", hint: "Find the most contested pixel on the canvas"});
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