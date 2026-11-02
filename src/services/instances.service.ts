import type { ColorCount } from "../models/color.model";
import { type DataRow } from "../models/helpers.model";
import { Instance } from "../models/instance.model";
import { DrawParams, type Pixel } from "../models/pixel.model";
import type { UserRanks } from "../models/user.model";
import { state } from "../modules/state.module";
import { convertColor, fetchHTML } from "../modules/utils.module";
import { getPixelsForDraw } from "./canvas.service";
import { getAllUsers } from "./users.service";

const baseURL: string = "https://raw.githubusercontent.com/CanvasStats/data-files/refs/heads/main";

export async function getAllInstances(): Promise<Instance[]> {
    if (state.instances) {
        return state.instances;
    }
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
        state.setInstances(instances);
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

export async function getInstanceIdForName(instanceName: string): Promise<number | null> {
    const allInstances = await getAllInstances();
    const result = allInstances.find(instance => instance.instanceName === instanceName);
    if (result) {
        return result.instanceId
    }
    return null;
}

export async function getUsernameForInstance(instanceId: number): Promise<string[]> {
    const allUsers = await getAllUsers();
    if (!allUsers) return [];

    return allUsers
        .filter(user => user.instance_id === instanceId)
        .map(user => user.username.toLowerCase());
}

export async function getUsesForInstance(instanceId: number): Promise<UserRanks[]> {
    const allUsers = await getAllUsers();
    if (!allUsers) return [];

    console.log(allUsers[0])

    return allUsers.filter(user => user.instance_id === instanceId);
}

export async function getInstance(instanceName: string): Promise<Instance | null> {
    const allInstances = await getAllInstances();
    const search = allInstances.find(instance => instance.instanceName === instanceName);
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
                value: pixelsInHour.length,
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