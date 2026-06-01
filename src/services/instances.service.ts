import { DrawParams, Instance, Pixel, type ColorCount, type DataRow, type UserItem } from "../models";
import { convertColor, fetchHTML } from "../modules/utils";
import { getPixelsForDraw } from "./canvas.service";

const baseURL: string = "https://raw.githubusercontent.com/CanvasStats/data-files/refs/heads/main";

export async function getAllInstances(): Promise<Instance[]> {
    try {
        const userCSVData = await fetchHTML(`${baseURL}/instances.csv`);
        if (!userCSVData) {
            throw new Error("Could not get instances. Please try reloading the page");
        }

        const lines = userCSVData.trim().split('\n');
        const headerLine = lines.shift();
        if (!headerLine) return [];
        const headers = headerLine.split(',').map(column => column.trim());
        const instances: Instance[] = [];

        for (const line of lines) {
            const columns = line.split(',');
            if (columns.length < 2) continue;
            const idIndex = headers.indexOf('instance_id');
            const nameIndex = headers.indexOf('instance_name');
            const instanceId = parseInt(columns[idIndex], 10);
            const instanceName = columns[nameIndex]?.trim() || '';

            const usersByYear: Record<number, number | null> = {};
            const pixelsByYear: Record<number, number | null> = {};

            headers.forEach((header, index) => {
                const valueStr = columns[index]?.trim();
                const numericValue = valueStr === '' || !valueStr ? null : parseInt(valueStr, 10);

                if (header.startsWith('users_')) {
                    const year = parseInt(header.replace('users_', ''), 10);
                    usersByYear[year] = numericValue;
                } else if (header.startsWith('pixels_')) {
                    const year = parseInt(header.replace('pixels_', ''), 10);
                    pixelsByYear[year] = numericValue;
                }
            });

            instances.push(new Instance(
                instanceId,
                instanceName,
                usersByYear,
                pixelsByYear
            ));
        }

        return instances;
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