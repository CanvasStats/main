import { type ColorCount, type User, DrawParams, type JsonObject, type ColorsCounts, UserRanks, type DataRow, Pixel, type EventPixelTotal } from "../models";
import { createMessage, fetchHTML, convertColor } from "../modules/utils";
import { getYearCounts, getPixelsForDraw, countUsersFinalPixels, getPixelDataForYear } from "./canvas.service";

const baseURL: string = "https://raw.githubusercontent.com/CanvasStats/data-files/refs/heads/main";

export async function getAllUsers(): Promise<UserRanks[]> {
    try {
        const userCSVData = await fetchHTML(`${baseURL}/allUserRanking.csv`);
        if (!userCSVData) {
            throw new Error("Could not get instances. Please try reloading the page");
        }

        const lines = userCSVData.trim().split('\n');
        const headerLine = lines.shift();
        if (!headerLine) return [];
        const headers = headerLine.split(',').map(column => column.trim());
        const users: UserRanks[] = [];

        for (const line of lines) {
            const columns = line.split(',');
            if (columns.length < 2) continue;
            const instanceIdIndex = headers.indexOf('instance_id');
            const usernameIndex = headers.indexOf('username');
            const instanceId = parseInt(columns[instanceIdIndex], 10);
            const username = columns[usernameIndex]?.trim() || '';

            const ranksByYear: Record<number, number | null> = {};
            const pixelsByYear: Record<number, number | null> = {};

            headers.forEach((header, index) => {
                const valueStr = columns[index]?.trim();
                const numericValue = valueStr === '' || !valueStr ? null : parseInt(valueStr, 10);

                if (header.startsWith('rank_')) {
                    const year = parseInt(header.replace('rank_', ''), 10);
                    ranksByYear[year] = numericValue;
                } else if (header.startsWith('pixels_')) {
                    const year = parseInt(header.replace('pixels_', ''), 10);
                    pixelsByYear[year] = numericValue;
                }
            });

            users.push(new UserRanks(
                instanceId,
                username,
                ranksByYear,
                pixelsByYear
            ));
        }

        return users;
    } catch (error: any) {
        throw new Error("Could not get users. Please try reloading the page");
    }
}

async function getAllUserStatsForYear(year: number) {
    try {
        const allUserCSVData = await fetchHTML(`${baseURL}/${year}/users.csv`);
        if (allUserCSVData) {
            //Split the csv file into lines
            const lines = allUserCSVData.trim().split('\n');
            //Define the column headers
            const header = lines[0].split(',').map(h => h.trim());
            const usernameIndex = header.indexOf('username');
            const userRankIndex = header.indexOf('userRank');
            const pixelCountIndex = header.indexOf('numPixels');
            const xCordIndex = header.indexOf('xCoordinateTop');
            const yCordIndex = header.indexOf('yCoordinateTop');
            const cordCountIndex = header.indexOf('NumPixelsTop');

            const userList: User[] = [];
            for (let i = 1; i < lines.length; i++) {
                const values = lines[i].split(',');
                if (values.length === header.length) {
                    const user: User = {
                        username: values[usernameIndex]?.trim() || '',
                        userRank: +values[userRankIndex]?.trim() || 0,
                        pixelCount: +values[pixelCountIndex]?.trim() || 0,
                        xCord: +values[xCordIndex]?.trim() || 0,
                        yCord: +values[yCordIndex]?.trim() || 0,
                        cordCount: +values[cordCountIndex]?.trim() || 0
                    };
                    userList.push(user);
                } else {
                    console.warn(`Skipping row ${i + 1} due to incorrect number of columns.`);
                }
            }
            return userList;
        }
    } catch (error) {
        throw new Error(`Error getting all user stats for ${year}: ${error}`)
    }
}

export async function getUserObject(username: string, year: number) {
    const allUsersData: User[] | undefined = await getAllUserStatsForYear(year);
    if (allUsersData) {
        return allUsersData.find(user => user['username'].toLowerCase() === username.toLowerCase());
    }
    return null;
}

export async function getUsersPixels(username: string, year: number) {
    let pixels = await getPixelDataForYear(year);
    if (pixels) {
        return pixels = pixels.filter(pixel => pixel['username'].toLowerCase() === username.toLowerCase());
    }
    return null;
}

async function getUndoForUser(username: string, year: number): Promise<number> {
    const userPixels = await getUsersPixels(username, year);
    if (userPixels) {
        return userPixels.reduce((acc: number, pixel: Pixel) => {
            if (pixel["isUndo"]) acc += 1;
            return acc;
        }, 0);
    }
    return 0;
}

const pixelPlacementYears: Record<number, EventPixelTotal> = {
    2023: {
        eventLength: 72,
        downtimeLength: 0,
        totalPossiblePixels: 8640
    },
    2024: {
        eventLength: 96,
        downtimeLength: 649,
        totalPossiblePixels: 10222,
    },
    2025: {
        eventLength: 48,
        downtimeLength: 7,
        totalPossiblePixels: 5746
    },
    2026: {
        eventLength: 48,
        downtimeLength: 0,
        totalPossiblePixels: 5760
    }
}

function CalculateTimeWasted(
    pixelCount: number,
    year: number
): string {
    const yearData = pixelPlacementYears[year];
    const unusedPixels = yearData.totalPossiblePixels - pixelCount;
    const totalIdleMinutes = unusedPixels * 0.5;
    const hours = Math.floor(totalIdleMinutes / 60);
    const minutes = Math.floor(totalIdleMinutes % 60);
    return `You spent ${hours} hours ${minutes} minutes idle when you could have been placing pixels. (The event was ${yearData["eventLength"]} hours long with ${yearData["downtimeLength"]} minutes of downtime, making the maximum possible pixels ${yearData["totalPossiblePixels"]})`;
}

export async function getUserStats(username: string, year: number) {
    const yearCounts = getYearCounts(year);
    const user = await getUserObject(username, year);
    const topCount = await countUsersFinalPixels(username, year)
    if (user) {
        let userJson: JsonObject = {
            username: username,
            year: year,
            blocks: [
                {
                    type: "standard",
                    layout: "left",
                    icon: "leaderboard",
                    content: [
                        `You ranked ${user['userRank']} out of ${yearCounts[0]['contentValue']} users in ${year}`
                    ]
                },
                {
                    type: "standard",
                    layout: "right",
                    icon: "grid_view",
                    content: [
                        `You placed ${user['pixelCount']} pixels throughout the event`
                    ]
                },
                {
                    type: "standard",
                    layout: "left",
                    icon: "arrow_shape_up_stack_2",
                    content: [
                        `${topCount} of your pixels (${((topCount / user['pixelCount']) * 100).toFixed(2)}%) made it to the final image at the end of the event`
                    ]
                },
                {
                    type: "user-color-grid",
                    layout: "right",
                    title: "Pixels by color",
                    data: []
                },
                {
                    type: "standard",
                    layout: "left",
                    icon: "colors",
                    content: [
                        `You used ${await getNumColorsUsedForUsername(year, username)} out of the ${year === 2023 ? "32" : "34"} colors`
                    ]
                },
                {
                    type: "standard",
                    layout: "right",
                    icon: "kid_star",
                    content: [
                        `The coordinate you placed the most pixels on was (${user['xCord']}, ${user['yCord']}) - ${user['cordCount']} times (including the pixels you deleted)`
                    ]
                },
                {
                    type: "graph",
                    layout: "left",
                    title: "Pixels Placed Per Hour"
                },
                {
                    type: "standard",
                    layout: "right",
                    icon: "undo",
                    content: [
                        `You clicked the undo button ${await getUndoForUser(username, year)} times`
                    ]
                },
                {
                    type: "standard",
                    layout: "left",
                    icon: "hourglass_pause",
                    content: [
                        CalculateTimeWasted(user["pixelCount"], year)
                    ]
                },
                {
                    type: "button-group",
                    layout: "right",
                    title: `View your pixels placed in ${year}`,
                    icon: "dashboard_customize",
                    buttons: [
                        {
                            linkText: "on white background",
                            classes: "white",
                            page: "/draw",
                            queryParams: { "sentFrom": "user", "year": year, "background": "white", "username": username },
                            external: false
                        },
                        {
                            linkText: "on black background",
                            classes: "black",
                            page: "/draw",
                            queryParams: { "sentFrom": "user", "year": year, "background": "black", "username": username },
                            external: false
                        },
                        {
                            linkText: "on transparent background",
                            classes: "dark-grey",
                            page: "/draw",
                            queryParams: { "sentFrom": "user", "year": year, "background": "transparent", "username": username },
                            external: false
                        }
                    ]
                },
            ]
        }
        return userJson;
    }
    return null;
}

export async function getColorCountsForYear(year: number) {
    try {
        const colorCSVData = await fetchHTML(`${baseURL}/${year}/color_count.csv`);
        if (colorCSVData) {
            //Split the csv file into lines
            const lines = colorCSVData.trim().split('\n');
            //Define the column headers
            const header = lines[0].split(',').map(h => h.trim());

            const colorCounts: ColorsCounts[] = [];
            for (let i = 1; i < lines.length; i++) {
                const values = lines[i].split(',');
                if (values.length === header.length) {
                    const colorCount: ColorsCounts = {
                        username: values[0]?.trim() || '',
                        black: +values[1]?.trim() || 0,
                        darkGrey: +values[2]?.trim() || 0,
                        deepGrey: +values[3]?.trim() || 0,
                        mediumGrey: +values[4]?.trim() || 0,
                        lightGrey: +values[5]?.trim() || 0,
                        white: +values[6]?.trim() || 0,
                        beige: +values[7]?.trim() || 0,
                        peach: +values[8]?.trim() || 0,
                        brown: +values[9]?.trim() || 0,
                        chocolate: +values[10]?.trim() || 0,
                        rust: +values[11]?.trim() || 0,
                        orange: +values[12]?.trim() || 0,
                        yellow: +values[13]?.trim() || 0,
                        pastelYellow: +values[14]?.trim() || 0,
                        lime: +values[15]?.trim() || 0,
                        green: +values[16]?.trim() || 0,
                        darkGreen: +values[17]?.trim() || 0,
                        forest: +values[18]?.trim() || 0,
                        darkTeal: +values[19]?.trim() || 0,
                        lightTeal: +values[20]?.trim() || 0,
                        aqua: +values[21]?.trim() || 0,
                        azure: +values[22]?.trim() || 0,
                        blue: +values[23]?.trim() || 0,
                        navy: +values[24]?.trim() || 0,
                        purple: +values[25]?.trim() || 0,
                        mauve: +values[26]?.trim() || 0,
                        magenta: +values[27]?.trim() || 0,
                        pink: +values[28]?.trim() || 0,
                        watermelon: +values[29]?.trim() || 0,
                        red: +values[30]?.trim() || 0,
                        rose: +values[31]?.trim() || 0,
                        maroon: +values[32]?.trim() || 0,
                        darkChocolate: +values[33]?.trim() || 0,
                        darkPurple: +values[34]?.trim() || 0,
                    };
                    colorCounts.push(colorCount);
                } else {
                    console.warn(`Skipping row ${i + 1} due to incorrect number of columns.`);
                }
            }
            return colorCounts;
        }
        return null
    } catch (error: any) {
        createMessage("Error: failed to load color data. Please try reloading the page", "main-message", "error");
        console.error(`Reason for failed fetch: ${error}`);
        return null;
    }
}

export async function GetColorCountForUsername(year: number, username: string) {
    const colorCounts: ColorsCounts[] | null = await getColorCountsForYear(year);
    if (colorCounts) {
        let colorCountWithUsername: Omit<ColorsCounts, "username"> | undefined = colorCounts.find(count => count['username'].toLowerCase() === username.toLowerCase());
        if (colorCountWithUsername) {
            const keys = Object.keys(colorCountWithUsername);
            const values = Object.values(colorCountWithUsername);
            keys.shift();
            values.shift();
            let colors: ColorCount[] = [];
            keys.forEach((key, index) => {
                if (values[index] > 0) {
                    const readableColor: string = key.replace(/([a-z])([A-Z])/g, "$1 $2",).toLowerCase();
                    const newColor: ColorCount = {
                        class: key,
                        label: readableColor,
                        hex: convertColor(readableColor),
                        count: values[index]
                    }
                    colors.push(newColor);
                }
            });
            colors.sort((a, b) => b.count - a.count);
            return colors;
        }
    }
    return null;
}

export async function getNumColorsUsedForUsername(year: number, username: string) {
    const colorCounts: ColorCount[] | null = await GetColorCountForUsername(year, username);
    if (colorCounts) {
        return colorCounts.length;
    } else {
        return 0;
    }
}

export async function getPixelsPerHourForUser(year: number, username: string): Promise<DataRow[]> {
    const pixelsForYear = await getPixelsForDraw(new DrawParams(year, null, null, null, null, null));
    if (!pixelsForYear || pixelsForYear.length === 0) return [];
    const pixelsForUser = pixelsForYear.filter(
        pixel => pixel.username.toLowerCase() === username.toLowerCase()
    );
    if (pixelsForUser.length === 0) return [];

    const sortedUserPixels = [...pixelsForUser].sort((a, b) => {
        const timeA = new Date(a.timePlaced.replace(" ", "T") + "Z").getTime();
        const timeB = new Date(b.timePlaced.replace(" ", "T") + "Z").getTime();
        return timeA - timeB;
    });

    let eventStartMs = Infinity;
    let eventEndMs = -Infinity;

    for (let i = 0; i < pixelsForYear.length; i++) {
        const ts = new Date(pixelsForYear[i].timePlaced.replace(" ", "T") + "Z").getTime();
        if (ts < eventStartMs) eventStartMs = ts;
        if (ts > eventEndMs) eventEndMs = ts;
    }

    let currentHour = new Date(eventStartMs);
    currentHour.setUTCMinutes(0, 0, 0);

    const lastPixelDate = new Date(eventEndMs);
    const result: DataRow[] = [];

    while (currentHour <= lastPixelDate) {
        const nextHour = new Date(currentHour);
        nextHour.setUTCHours(currentHour.getUTCHours() + 1);

        const pixelsInHour = sortedUserPixels.filter((p) => {
            const pDateMs = new Date(p.timePlaced.replace(" ", "T") + "Z").getTime();
            return pDateMs >= currentHour.getTime() && pDateMs < nextHour.getTime();
        });

        result.push({
            timestamp: new Date(currentHour.getTime()),
            value: pixelsInHour.length,
        });

        currentHour = nextHour;
    }

    return result;
}

export async function getYearsForUsername(username: string) {
    const allUsers = await getAllUsers();
    const user = allUsers.find(user => user.username.toLowerCase() === username.toLowerCase());
    if (user) {
        return user.yearParticipated();
    } else {
        throw new Error("Could not find user");
    }
}