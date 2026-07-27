import type { Pixel, Achievement } from "../models";
import { fetchHTML } from "../modules/utils";
import { getNumColorsUsedForUsername, getUserObject, getUsersPixels } from "./users.service";

const baseURL: string = "https://raw.githubusercontent.com/CanvasStats/data-files/refs/heads/main";

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
    2026: { start: new Date("2026-07-18T04:00:00.000Z").getTime(), end: new Date("2026-07-20T04:00:00.000Z").getTime() }
};

// Order windows from STRICTEST to MOST LENIENT (Mutual Exclusivity)
const SPEED_TIERS: { window: TimeWindow; name: string; desc: string; icon: string }[] = [
    { window: '1s', name: "Opener", desc: "Place a pixel in the 1st second of the event", icon: "counter_1" },
    { window: '5s', name: "1st 5 Seconds", desc: "Place a pixel in the first 5 seconds", icon: "counter_5" },
    { window: '10s', name: "1st 10 Seconds", desc: "Place a pixel in the first 10 seconds", icon: "timer_10" },
    { window: '1m', name: "1st Minute", desc: "Place a pixel in the 1st minute of the event", icon: "hourglass" },
];

const LAST_SPEED_TIERS: { window: TimeWindow; name: string; desc: string; icon: string }[] = [
    { window: '1s', name: "Closer", desc: "Place a pixel in the final second of the event", icon: "stop_circle" },
    { window: '5s', name: "Final 5 Seconds", desc: "Place a pixel in the final 5 seconds", icon: "alarm" },
    { window: '10s', name: "Final 10 Seconds", desc: "Place a pixel in the final 10 seconds", icon: "timer_10" },
    { window: '1m', name: "Final Minute", desc: "Place a pixel in the final minute of the event", icon: "lock" },
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
    2025: { width: 500, height: 500 },
    2026: { width: 500, height: 500 }
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

function hasAtLeast100Duplicates(userPixels: Pixel[]): boolean {
    const counts = new Map<string, number>();
    let uniqueDuplicatesCount = 0;

    for (const pixel of userPixels) {
        const key = `${pixel.xCoordinate},${pixel.yCoordinate}`;
        const currentCount = (counts.get(key) || 0) + 1;
        counts.set(key, currentCount);

        if (currentCount === 2) {
            uniqueDuplicatesCount++;

            if (uniqueDuplicatesCount >= 100) {
                return true;
            }
        }
    }

    return false;
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

    //VITE_SECRET_USER
    //Ategon@programming.dev
    const secret_user = import.meta.env.VITE_FIREBASE_API_KEY;
    if (username === secret_user) {
        addOrUpdateAchievement(fullAchievementArray, "You asked for this", "Happy Counting!", "exposure_plus_1", 2026);
    }

    for (const year of yearsUserParticipated) {
        const userStatsForYear = await getUserObject(username, year);
        if (!userStatsForYear) continue;

        const rank = userStatsForYear["userRank"];

        // Ranking checks using the helper
        if (rank <= 10) {
            addOrUpdateAchievement(fullAchievementArray, "Top 10", "Make it into the top 10 users", "star_shine", year);
        } else if (rank <= 25) {
            addOrUpdateAchievement(fullAchievementArray, "Top 25", "Make it into the top 25 users", "star", year);
        } else if (rank <= 50) {
            addOrUpdateAchievement(fullAchievementArray, "Top 50", "Make it into the top 50 users", "star", year);
        }
        else if (rank <= 100) {
            addOrUpdateAchievement(fullAchievementArray, "Top 100", "Make it into the top 100 users", "star", year);
        }
        addOrUpdateAchievement(fullAchievementArray, "Participation Trophy", "Place pixels during the event", "trophy", year);

        // Pixel placement color checks
        const totalColors = year === 2023 ? 32 : 34;
        const numColorsUsed = await getNumColorsUsedForUsername(year, username);
        if (numColorsUsed === totalColors) {
            addOrUpdateAchievement(fullAchievementArray, "Taste the Rainbow", "Use every color", "looks", year);
        } else if (numColorsUsed === 1) {
            addOrUpdateAchievement(fullAchievementArray, "Monocolor", "Use only 1 color", "colors", year);
        }

        const mostContestedPixels: Record<number, { x: number, y: number }> = {
            2023: { x: 175, y: 171 },
            2024: { x: 10, y: 262 },
            2025: { x: 304, y: 40 },
            2026: { x: 40, y: 170 }
        }
        const userPixels = await getUsersPixels(username, year);
        if (userPixels && userPixels.length > 0) {
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
            const topCoverage = Number(((topPixels.length / userStatsForYear["pixelCount"]) * 100).toFixed(2));
            console.log(`${year} = ${topCoverage}`)
            if (topCoverage > 90) {
                addOrUpdateAchievement(fullAchievementArray, "Can't Cover me", "Over 90% of your pixels made it to the end of the event", "mountain_flag", year);
            } else if (topCoverage < 10) {
                addOrUpdateAchievement(fullAchievementArray, "Cover-up", "Less than 10% of your pixels made it to the end of the event", "shades_closed", year);
            }

            const specialNumbers: { specialNumber: number, name: string, icon: string }[] = [
                { specialNumber: 13, name: "Unlucky", icon: "thumb_down" },
                { specialNumber: 42, name: "Answer to the Ultimate Question of Life, the Universe, and Everything", icon: "planet" },
                { specialNumber: 69, name: "Nice", icon: "thumb_up" },
                { specialNumber: 420, name: "Alright Alright Alright", icon: "thumbs_up_double" },
                { specialNumber: 666, name: "Diablo", icon: "skull" },];
            for (const num of specialNumbers) {
                const filteredPixelsCoord = userPixels.filter(pixel => pixel.xCoordinate === num.specialNumber || pixel.yCoordinate === num.specialNumber);
                if (userStatsForYear["pixelCount"] === num.specialNumber) {
                    addOrUpdateAchievement(fullAchievementArray, `${num.name} Count`, `Place exactly ${num.specialNumber} pixels`, num.icon, year);
                } else if (filteredPixelsCoord.length != 0) {
                    addOrUpdateAchievement(fullAchievementArray, `${num.name} Coordinate`, `Place a pixel on a coordinate containing ${num.specialNumber}`, num.icon, year);
                }
            }

            if (hasAtLeast100Duplicates(userPixels)) {
                addOrUpdateAchievement(fullAchievementArray, "You know there is an undo button, right?", "Cover 100 of your own pixels", "question_mark", year);
            }
        }
    }

    return fullAchievementArray;
}

export async function getAllAchievements() {
    try {
        const achievementsCSVData = await fetchHTML(`${baseURL}/achievements.csv`);
        if (achievementsCSVData) {
            //Split the csv file into lines
            const lines = achievementsCSVData.trim().split('\n');
            //Define the column headers
            const header = lines[0].split(',').map(h => h.trim());
            //id,name,description,icon,earned
            const nameIndex = header.indexOf("name");
            const descriptionIndex = header.indexOf("description");
            const iconIndex = header.indexOf("icon");
            const earnedIndex = header.indexOf("earned");

            const achievements: Achievement[] = [];
            for (let i = 1; i < lines.length; i++) {
                const values = lines[i].split(",");
                if (values.length === header.length) {
                    const achievement: Achievement = {
                        name: values[nameIndex]?.trim() || "",
                        description: values[descriptionIndex]?.trim() || "",
                        icon: values[iconIndex]?.trim() || "",
                        years: [],
                        totalUsers: +values[earnedIndex]?.trim() || 0
                    };
                    achievements.push(achievement);
                } else {
                    console.warn(`Skipping row ${i + 1} due to incorrect number of columns.`);
                }
            }
            return achievements;
        }
    } catch (error: any) {
        throw new Error("Error loading achievements list:", error)
    }
}