import { DrawParams, Instance, Pixel, type ColorCount, type DataRow, type UserItem } from "../models";
import { convertColor, fetchHTML } from "../modules/utils";
import { getPixelsForDraw } from "./canvas.service";

const baseURL: string = "https://raw.githubusercontent.com/CanvasStats/data-files/refs/heads/main";

export async function getAllInstances() {
    try {
        const userCSVData = await fetchHTML(`${baseURL}/instances.csv`);
        if (userCSVData) {
            //Split the csv file into lines
            //instance_id,instance_name,users_2023,users_2024,users_2025,pixels_2023,pixels_2024,pixels_2025
            const lines = userCSVData.trim().split('\n');
            const headers = lines.shift();
            if (!headers) return [];

            const instances: Instance[] = [];

            for (const line of lines) {
                // Split by comma to get individual values
                const columns = line.split(',');
                // Ensure the row has the expected number of columns
                if (columns.length < 5) continue;
                const [rawInstanceId, instanceName, rawUsers2023, rawUsers2024, rawUsers2025, rawPixels2023, rawPixels2024, rawPixels2025] = columns;
                // Parse integers, or fall back to null if the CSV column is empty
                const instance_id = parseInt(rawInstanceId, 10);
                const users2023 = rawUsers2023.trim() === '' ? null : parseInt(rawUsers2023, 10);
                const users2024 = rawUsers2024.trim() === '' ? null : parseInt(rawUsers2024, 10);
                const users2025 = rawUsers2025.trim() === '' ? null : parseInt(rawUsers2025, 10);
                const pixels2023 = rawPixels2023.trim() === '' ? null : parseInt(rawPixels2023, 10);
                const pixels2024 = rawPixels2024.trim() === '' ? null : parseInt(rawPixels2024, 10);
                const pixels2025 = rawPixels2025.trim() === '' ? null : parseInt(rawPixels2025, 10);
                instances.push(new Instance(
                    instance_id,
                    instanceName.trim(),
                    users2023,
                    users2024,
                    users2025,
                    null,
                    pixels2023,
                    pixels2024,
                    pixels2025,
                    null
                ));
            }
            return instances;
        } else {
            throw new Error("Could not get instances. Please try reloading the page");
        }
    } catch (error: any) {
        throw new Error("Could not get instances. Please try reloading the page");
    }
}

export async function getInstanceNameForId(id: number): Promise<string | null> {
    const allInstances = await getAllInstances();
    const search = allInstances.find(instance => instance.instanceId === id);
    if (search) return search.instanceName;
    return null;
}

export async function getAllUsersForInstance(instanceId: number, year: number) {
    try {
        const userCSVData = await fetchHTML(`${baseURL}/allUserRanking.csv`);
        if (userCSVData) {
            //Split the csv file into lines
            const lines = userCSVData.trim().split('\n');
            const headers = lines.shift();
            if (!headers) return [];
            const header = headers.split(',').map((h: string) => h.trim());
            const userInstanceIdIndex = header.indexOf("instance_id");
            const usernameIndex = header.indexOf("username");
            const rankIndex = header.indexOf(`rank_${year}`);
            const pixelsIndex = header.indexOf(`pixels_${year}`);

            const users: UserItem[] = [];

            for (const line of lines) {
                const values = line.split(",");
                if (values.length === header.length) {
                    if (+values[userInstanceIdIndex].trim() === instanceId) {
                        const user: UserItem = {
                            username: values[usernameIndex]?.trim() || '',
                            userRank: +values[rankIndex]?.trim() || undefined,
                            pixelsPlaced: +values[pixelsIndex]?.trim() || undefined
                        }
                        if (year === 0) {
                            let yearsCount = 0;
                            if (values[2].trim()) yearsCount += 1;
                            if (values[4].trim()) yearsCount += 1;
                            if (values[6].trim()) yearsCount += 1;
                            user.yearsParticipated = yearsCount;
                            users.push(user);
                        } else {
                            if (user.userRank) users.push(user);
                        }
                    }
                } else {
                    console.warn(`Skipping ${line} due to incorrect number of columns.`);
                }
            }
            return users;
        } else {
            throw new Error("Could not get users. Please try reloading the page");
        }
    } catch (error: any) {
        throw new Error("Could not get users. Please try reloading the page");
    }
}

export async function getInstanceForId(instanceId: number): Promise<Instance | null> {
    const allInstances = await getAllInstances();
    const search = allInstances.find(instance => instance.instanceId === instanceId);
    if (search) return search;
    return null;
}

export async function getPixelsForInstance(usernames: string[], year: number) {
    const pixelsForYear = await getPixelsForDraw(new DrawParams(year, null, null, null, null, null));
    if (pixelsForYear) {
        return pixelsForYear.filter(pixel => usernames.includes(pixel.username.toLowerCase()));
    }
    throw new Error("Could not get pixels for instance");
}

export async function getPixelsPerHourForInstance(instancePixels: Pixel[]) {
    if (instancePixels) {
        const firstPixel = instancePixels[0];
        const lastPixel = instancePixels[instancePixels.length - 1];
        const sortedPixels = [...instancePixels].sort(
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

export async function getFinalPixelsCountForInstance(instancePixels: Pixel[]) {
    return instancePixels.filter(pixel => pixel.isTop).length;
}

export async function getColorCountsForInstance(instancePixels: Pixel[]) {
    let colorCounts = instancePixels.reduce((acc: Record<string, number>, pixel: Pixel) => {
        // const colorName = convertColor(pixel.colorHex);
        acc[pixel.colorHex] = (acc[pixel.colorHex] || 0) + 1;
        return acc;
    }, {});
    const colors: ColorCount[] = []
    Object.entries(colorCounts).forEach(([colorHex, count]) => {
        const colorName = convertColor(colorHex);
        colors.push({
            class: colorName.replace(" ", "-"),
            label: colorName,
            count: count,
            hex: colorHex
        });
    });
    return colors;
}