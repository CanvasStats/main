import { type ColorCount, type User, DrawParams, type JsonObject, type ColorsCounts, UserRanks, type DataRow, type Achievement, Pixel } from "../models";
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

async function getUserObject(username: string, year: number) {
    const allUsersData: User[] | undefined = await getAllUserStatsForYear(year);
    if (allUsersData) {
        return allUsersData.find(user => user['username'].toLowerCase() === username.toLowerCase());
    }
    return null;
}

async function getUsersPixels(username: string, year: number) {
    let pixels = await getPixelDataForYear(year);
    if (pixels) {
        return pixels = pixels.filter(pixel => pixel['username'].toLowerCase() === username.toLowerCase());
    }
    return null;
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
                    type: "button-group",
                    layout: "right",
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

  // 1. Filter for the specific user first
  const pixelsForUser = pixelsForYear.filter(
    pixel => pixel.username.toLowerCase() === username.toLowerCase()
  );
  if (pixelsForUser.length === 0) return [];

  // 2. Sort the user's pixels chronologically, sanitizing to UTC safely
  const sortedUserPixels = [...pixelsForUser].sort((a, b) => {
    const timeA = new Date(a.timePlaced.replace(" ", "T") + "Z").getTime();
    const timeB = new Date(b.timePlaced.replace(" ", "T") + "Z").getTime();
    return timeA - timeB;
  });

  // 3. Find event boundaries safely using a loop to prevent "too many function arguments" RangeError
  let eventStartMs = Infinity;
  let eventEndMs = -Infinity;

  for (let i = 0; i < pixelsForYear.length; i++) {
    const ts = new Date(pixelsForYear[i].timePlaced.replace(" ", "T") + "Z").getTime();
    if (ts < eventStartMs) eventStartMs = ts;
    if (ts > eventEndMs) eventEndMs = ts;
  }

  // Set the start boundary to the top of the event's first hour
  let currentHour = new Date(eventStartMs);
  currentHour.setUTCMinutes(0, 0, 0);

  const lastPixelDate = new Date(eventEndMs);
  const result: DataRow[] = [];

  // 4. Loop through hourly blocks using matching UTC comparisons
  while (currentHour <= lastPixelDate) {
    const nextHour = new Date(currentHour);
    nextHour.setUTCHours(currentHour.getUTCHours() + 1);

    const pixelsInHour = sortedUserPixels.filter((p) => {
      const pDateMs = new Date(p.timePlaced.replace(" ", "T") + "Z").getTime();
      return pDateMs >= currentHour.getTime() && pDateMs < nextHour.getTime();
    });

    result.push({
      timestamp: new Date(currentHour.getTime()), // Safe UTC wrapper for charting libraries
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

const WINDOW_DURATION_MAP = {
    '1m': 60 * 1000,
    '10s': 10 * 1000,
    '5s': 5 * 1000,
    '1s': 1 * 1000
} as const;
type TimeWindow = keyof typeof WINDOW_DURATION_MAP;
export function getEarlyOrLatePixels(
    pixels: Pixel[],
    window: TimeWindow,
    timestamp: number,
    start: boolean
): Pixel[] {
    const duration = WINDOW_DURATION_MAP[window];

    return pixels.filter(pixel => {
        const placementMs = new Date(pixel.timePlaced.replace(" ", "T") + "Z").getTime();

        if (start) {
            // Start window: Look FORWARD from the start timestamp
            const cutoffMs = timestamp + duration;
            return placementMs >= timestamp && placementMs < cutoffMs;
        } else {
            // End window: Look BACKWARD from the end timestamp
            const cutoffMs = timestamp - duration;
            return placementMs >= cutoffMs && placementMs <= timestamp;
        }
    });
}

// Define start and end times per year
const EVENT_TIMELINES: Record<number, { start: number; end: number }> = {
    2023: { start: new Date("2023-08-03T22:00:00.000Z").getTime(), end: new Date("2023-08-06T21:59:59.000Z").getTime() },
    2024: { start: new Date("2024-07-12T04:00:00.000Z").getTime(), end: new Date("2024-07-16T03:59:59.000Z").getTime() },
    2025: { start: new Date("2025-07-12T04:00:00.000Z").getTime(), end: new Date("2025-07-14T03:59:59.000Z").getTime() },
};

// Order windows from STRICTEST to MOST LENIENT (Mutual Exclusivity)
const SPEED_TIERS: { window: TimeWindow; name: string; desc: string; icon: string }[] = [
    { window: '1s', name: "Opener", desc: "You placed a pixel in the 1st second of the event", icon: "counter_1" },
    { window: '5s', name: "1st 5 Seconds", desc: "You placed a pixel in the first 5 seconds", icon: "counter_5" },
    { window: '10s', name: "1st 10 Seconds", desc: "You placed a pixel in the first 10 seconds", icon: "timer_10" },
    { window: '1m', name: "1st Minute", desc: "You placed a pixel in the 1st minute of the event", icon: "hourglass" },
];

const LAST_SPEED_TIERS: { window: TimeWindow; name: string; desc: string; icon: string }[] = [
    { window: '1s', name: "Closer", desc: "You placed a pixel in the final second of the event", icon: "stop_circle" },
    { window: '5s', name: "Final 5 Seconds", desc: "You placed a pixel in the final 5 seconds", icon: "alarm" },
    { window: '10s', name: "Final 10 Seconds", desc: "You placed a pixel in the final 10 seconds", icon: "timer_10" },
    { window: '1m', name: "Final Minute", desc: "You placed a pixel in the final minute of the event", icon: "lock" },
];

export function checkSpeedAchievements(
    userPixels: Pixel[],
    year: number,
    fullAchievementArray: Achievement[]
): void {
    const timeline = EVENT_TIMELINES[year];
    if (!timeline) return;

    for (const tier of SPEED_TIERS) {
        const matchedPixels = getEarlyOrLatePixels(userPixels, tier.window, timeline.start, true);

        if (matchedPixels.length > 0) {
            addOrUpdateAchievement(fullAchievementArray, tier.name, tier.desc, tier.icon, year);
            break;
        }
    }

    for (const tier of LAST_SPEED_TIERS) {
        const matchedPixels = getEarlyOrLatePixels(userPixels, tier.window, timeline.end, false);

        if (matchedPixels.length > 0) {
            addOrUpdateAchievement(fullAchievementArray, tier.name, tier.desc, tier.icon, year);
            break;
        }
    }
}

export interface PixelBreak {
  durationMs: number;
  readable: string;
}

/**
 * Calculates the time gaps between consecutive pixel placements and returns the 4 largest breaks.
 * Returns an empty array if there are fewer than 2 pixels.
 */
export function getLargestPixelBreaks(pixels: Pixel[]): PixelBreak[] {
  if (pixels.length < 2) return [];

  const timestamps = pixels
    .map(p => new Date(p.timePlaced.replace(" ", "T") + "Z").getTime())
    .sort((a, b) => a - b);

  const breaks: PixelBreak[] = [];

  for (let i = 0; i < timestamps.length - 1; i++) {
    const diffMs = timestamps[i + 1] - timestamps[i];
    if (diffMs > 4 * 60 * 60 * 1000) {
  }
    breaks.push({
      durationMs: diffMs,
      readable: formatDuration(diffMs)
    });
  }

  return breaks
    .sort((a, b) => b.durationMs - a.durationMs)
    .slice(0, 4);
}

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  }
  return `${seconds}s`;
}

function addOrUpdateAchievement(
    arr: Achievement[],
    name: string,
    desc: string,
    icon: string,
    year: number
) {
    let ach = arr.find(a => a.name === name);
    if (!ach) {
        ach = { name, description: desc, icon, years: [] };
        arr.push(ach);
    }
    if (!ach.years.includes(year)) {
        ach.years.push(year);
    }
}

export interface BoundaryResults {
    allCornersPlaced: boolean;
    oppositeSidesPlaced: boolean;
}

const CANVAS_SIZES: Record<number, { width: number, height: number }> = {
    2023: { width: 10000, height: 10000 },
    2024: { width: 10000, height: 500 },
    2025: { width: 500, height: 500 }
}

export function checkCanvasBoundaries(
    pixels: Pixel[],
    year: number
): BoundaryResults {
    const canvasSize = CANVAS_SIZES[year]
    const minX = 0;
    const maxX = canvasSize.width - 1;
    const minY = 0;
    const maxY = canvasSize.height - 1;

    const targetedCorners = new Set<string>([
        `${minX},${minY}`,
        `${maxX},${minY}`,
        `${minX},${maxY}`,
        `${maxX},${maxY}`
    ]);
    const cornersHit = new Set<string>();

    let hitLeft = false;
    let hitRight = false;
    let hitTop = false;
    let hitBottom = false;

    for (const pixel of pixels) {
        const x = pixel.xCoordinate;
        const y = pixel.yCoordinate;

        const coordKey = `${x},${y}`;
        if (targetedCorners.has(coordKey)) {
            cornersHit.add(coordKey);
        }

        if (x === minX) hitLeft = true;
        if (x === maxX) hitRight = true;
        if (y === minY) hitTop = true;
        if (y === maxY) hitBottom = true;
    }

    const allCornersPlaced = cornersHit.size === 4;
    const oppositeSidesPlaced = (hitLeft && hitRight) || (hitTop && hitBottom);

    return {
        allCornersPlaced,
        oppositeSidesPlaced
    };
}

export async function checkAchievementsForUser(
    username: string,
    yearsUserParticipated: number[],
    achievementsStored: Achievement[]
): Promise<Achievement[]> {
    let fullAchievementArray: Achievement[] = achievementsStored.map(ach => ({
        ...ach,
        years: [...ach.years]
    }));

    for (const year of yearsUserParticipated) {
        const userStatsForYear = await getUserObject(username, year);
        if (!userStatsForYear) continue;

        const rank = userStatsForYear["userRank"];

        // Ranking checks using the helper
        if (rank <= 10) {
            addOrUpdateAchievement(fullAchievementArray, "Top 10", "You made it into the top 10 users", "star_shine", year);
        } else if (rank <= 25) {
            addOrUpdateAchievement(fullAchievementArray, "Top 25", "You made it into the top 25 users", "star", year);
        } else if (rank <= 50) {
            addOrUpdateAchievement(fullAchievementArray, "Top 50", "You made it into the top 50 users", "star", year);
        }
        else if (rank <= 100) {
            addOrUpdateAchievement(fullAchievementArray, "Top 100", "You made it into the top 100 users", "star", year);
        } else {
            addOrUpdateAchievement(fullAchievementArray, "Participation Trophy", "You placed pixels during the event", "trophy", year);
        }

        // Pixel count checks
        if (userStatsForYear["pixelCount"] === 42) {
            addOrUpdateAchievement(
                fullAchievementArray,
                "Answer to the Ultimate Question of Life, the Universe, and Everything",
                "You placed exactly 42 pixels during the event",
                "planet",
                year
            );
        } else if (userStatsForYear["pixelCount"] === 69) {
            addOrUpdateAchievement(fullAchievementArray, "Nice", "You placed exactly 69 pixels during the event", "thumb_up", year);
        } else if (userStatsForYear["pixelCount"] === 420) {
            addOrUpdateAchievement(fullAchievementArray, "Alright Alright Alright", "You placed exactly 420 pixels during the event", "thumb_up", year);
        }

        // Pixel placement color checks
        const totalColors = year === 2023 ? 32 : 34;
        const numColorsUsed = await getNumColorsUsedForUsername(year, username);
        if (numColorsUsed === totalColors) {
            addOrUpdateAchievement(fullAchievementArray, "Taste the Rainbow", "You used every color", "looks", year);
        } else if (numColorsUsed === 1) {
            addOrUpdateAchievement(fullAchievementArray, "Monocolor", "You used only 1 color", "colors", year);
        }

        // Pixel array operations (Undone check + New Speed Check)
        const mostContestedPixels: Record<number, {x: number, y: number}> = {
            2023: { x: 175, y: 171},
            2024: { x: 10, y: 262 },
            2025: { x: 304, y: 40 }
        }
        const userPixels = await getUsersPixels(username, year);
        if (userPixels && userPixels.length > 0) {

            // Execute the early/late time window validations right here
            checkSpeedAchievements(userPixels, year, fullAchievementArray);

            const undonePixels = userPixels.reduce((acc: number, pixel: Pixel) => {
                if (pixel["isUndo"]) acc += 1;
                return acc;
            }, 0);

            if (undonePixels === 0) {
                addOrUpdateAchievement(fullAchievementArray, "No Mistakes", "You did not click the undo button", "delete_forever", year);
            } else if (undonePixels === userPixels.length) {
                addOrUpdateAchievement(fullAchievementArray, "Delete Your Art", "You clicked undo after every pixel you placed", "delete", year);
            }

            const boundsCheck = checkCanvasBoundaries(userPixels, year);
            if (boundsCheck.allCornersPlaced) {
                addOrUpdateAchievement(fullAchievementArray, "Four Corners", "You placed a pixel in all 4 corners of the map", "crop_free", year);
            }
            if (boundsCheck.oppositeSidesPlaced) {
                addOrUpdateAchievement(fullAchievementArray, "Worlds Apart", "You placed pixels on opposite sides of the canvas", "swap_horiz", year);
            }

            const mostContestedPixelForYear = mostContestedPixels[year];
            const userContestedCheck = userPixels.filter(pixel => pixel.xCoordinate === mostContestedPixelForYear.x && pixel.yCoordinate === mostContestedPixelForYear.y);
            if (userContestedCheck.length > 0) {
                addOrUpdateAchievement(fullAchievementArray, "Most Contested", "You placed a pixel on the most contested pixel on the canvas", "layers", year);
            }

            const topPixels = userPixels.filter(pixel => pixel.isTop);
            if (topPixels.length >= 90) {
                addOrUpdateAchievement(fullAchievementArray, "Can't Cover me", "90% or more of your pixels made it to the end of the event", "mountain_flag", year);
            } else if (topPixels.length < 10) {
                addOrUpdateAchievement(fullAchievementArray, "Cover-up", "Less than 10% of your pixels made it to the end of the event", "shades_closed", year);
            }

        }
    }

    return fullAchievementArray;
}