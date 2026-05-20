import { type ColorCount, type ContentPair, type User, DrawParams, type JsonObject, type ColorsCounts } from "../models";
import { fetchHTML, getHexForColor } from "../modules/utils";
import { getYearCounts, getPixelsForDraw } from "./canvas.service";

const baseURL: string = "https://raw.githubusercontent.com/CanvasStats/data-files/refs/heads/main";

export async function getAllUsers(): Promise<ContentPair[]> {
    try {
        const userCSVData = await fetchHTML(`${baseURL}/allUsers.csv`);
        if (userCSVData) {
            //Split the csv file into lines
            const lines = userCSVData.trim().split('\n');
            //Define the column headers
            const header = lines[0].split(',').map(h => h.trim());
            const usernameIndex = header.indexOf('username');
            const canvas2023Index = header.indexOf('canvas2023');
            const canvas2024Index = header.indexOf('canvas2024');
            const canvas2025Index = header.indexOf('canvas2025');
            //Create the list of users
            const userList: ContentPair[] | null = [];
            for (let i = 1; i < lines.length; i++) {
                const values = lines[i].split(',');
                if (values.length === header.length) {
                    const user: string = values[usernameIndex]?.trim();
                    let yearsParticipated = 0
                    if (+values[canvas2023Index]?.trim() == 1) yearsParticipated += 1;
                    if (+values[canvas2024Index]?.trim() == 1) yearsParticipated += 1;
                    if (+values[canvas2025Index]?.trim() == 1) yearsParticipated += 1;
                    userList.push({contentKey: user, contentValue: `${yearsParticipated}`});
                } else {
                    console.warn(`Skipping row ${i + 1} due to incorrect number of columns.`);
                }
            }
            return userList;
        } else {
            throw new Error("Could not fetch users csv");
            return [];
        }
    } catch (error: any) {
        console.error(`Error creating user list: ${error}`);
        return [];
    }
}

export async function getAllUserStatsForYear(year: number) {
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
        console.error(`Error getting all user stats for ${year}: ${error}`);
    }
}

export async function getUserStats(username: string, year: number) {
    const allUsersData: User[] | undefined = await getAllUserStatsForYear(year);
    const totalUsers = getYearCounts(year);
    if (allUsersData) {
        const user: User | undefined = allUsersData.find(user => user['username'] === username);
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
                            `You ranked ${user['userRank']} out of ${totalUsers} users in ${year}`
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
                        icon: "grid_view",
                        content: [
                            `You placed ${user['pixelCount']} pixels throughout the event`
                        ]
                    },
                    {
                        type: "standard",
                        layout: "left",
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
                        type: "button-group",
                        layout: "left",
                        title: "View your pixels placed in 2025",
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
        console.error(`Failed to fetch color counts: ${error}`);
        return null;
    }
}

export async function GetColorCountForUsername(year: number, username: string) {
    const colorCounts: ColorsCounts[] | null = await getColorCountsForYear(year);
    if (colorCounts) {
        let colorCountWithUsername: Omit<ColorsCounts, "username"> | undefined = colorCounts.find(count => count['username'] === username);
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
                        hex: getHexForColor(readableColor),
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

interface DataRow {
    timestamp: Date;
    pixelCount: number;
}

export async function getPixelsPerHourForUser(year: number, username: string) {
    const pixelsForYear = await getPixelsForDraw(new DrawParams(year, null, null, null, null, null));
    if (pixelsForYear) {
        const firstPixel = pixelsForYear[0];
        const lastPixel = pixelsForYear[pixelsForYear.length-1];
        const pixelsForUser = pixelsForYear.filter(pixel => pixel['username'] === username);
        if (pixelsForUser.length === 0) return [];
        const sortedPixels = [...pixelsForUser].sort(
            (a, b) => new Date(a.timePlaced).getTime() - new Date(b.timePlaced).getTime()
        );
        const firstPixelDate = new Date(firstPixel.timePlaced);
        const lastPixelDate = new Date(lastPixel.timePlaced);
        let currentHour = new Date(firstPixelDate);
        currentHour.setMinutes(0, 0, 0);

        const result: DataRow[] = [];
        while (currentHour <= lastPixelDate) {
            const nextHour = new Date(currentHour);
            nextHour.setHours(currentHour.getHours() + 1);
            const pixelsInHour = sortedPixels.filter((p) => {
                const pDate = new Date(p.timePlaced);
                return pDate >= currentHour && pDate < nextHour;
            });

            result.push({
                timestamp: new Date(currentHour.toISOString()),
                pixelCount: pixelsInHour.length,
            });
            currentHour = nextHour;
        }
        return result;
    }
}

export async function getYearsForUsername(username: string) {
    try {
        const userCSVData = await fetchHTML(`${baseURL}/allUsers.csv`);
        if (userCSVData) {
            //Split the csv file into lines
            const lines = userCSVData.trim().split('\n');
            //Define the column headers
            const header = lines[0].split(',').map(h => h.trim());
            const usernameIndex = header.indexOf('username');
            const canvas2023Index = header.indexOf('canvas2023');
            const canvas2024Index = header.indexOf('canvas2024');
            const canvas2025Index = header.indexOf('canvas2025');
            //Create the list of users
            const years: number[] = []
            for (let i = 1; i < lines.length; i++) {
                const values = lines[i].split(',');
                if (values.length === header.length) {
                    const user: string = values[usernameIndex]?.trim();
                    if (user === username) {
                        if (+values[canvas2023Index]?.trim() == 1) years.push(2023);
                        if (+values[canvas2024Index]?.trim() == 1) years.push(2024);
                        if (+values[canvas2025Index]?.trim() == 1) years.push(2025);
                    }
                } else {
                    console.warn(`Skipping row ${i + 1} due to incorrect number of columns.`);
                }
            }
            return years;
        } else {
            throw new Error("Could not fetch users csv");
            return [];
        }
    } catch (error: any) {
        console.error(`Error creating user list: ${error}`);
        return [];
    }
}