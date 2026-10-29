import { DrawParams, type Pixel } from "../models/pixel.model";
import { state } from "../modules/state.module";
import { createMessage, fetchHTML, getRandomColor } from "../modules/utils.module";

const baseURL: string = "https://raw.githubusercontent.com/TheRealMonte/data-files/main";

export function getYears(includeAll: boolean): Record<string, string> {
    const yearsToReturn: Record<string | number, string> = {
        2023: getRandomColor(0, true),
        2024: getRandomColor(1, true),
        2025: getRandomColor(2, true),
        2026: getRandomColor(3, true)
    }
    if (includeAll) {
        yearsToReturn["All"] = getRandomColor(0, true);
    }
    return yearsToReturn;
}

export function getYearCounts(year: number): { userCount: number, pixelCount: number } {
    const yearCounts: Record<number, { userCount: number, pixelCount: number }> = {
        2023: { userCount: 2204, pixelCount: 630578 },
        2024: { userCount: 1912, pixelCount: 658367 },
        2025: { userCount: 638, pixelCount: 313408 },
        2026: { userCount: 589, pixelCount: 309205 }
    }
    return yearCounts[year];
}

export async function getPixelDataForYear(year: number) {
    if (state.getFromPixelCache(year)) {
        return state.getFromPixelCache(year);
    }

    try {
        const pixelsCSVData = await fetchHTML(`${baseURL}/${year}/pixels${year}.csv`);
        if (!pixelsCSVData) return null;
        const cleanCSV = pixelsCSVData.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
        const lines = cleanCSV.trim().split('\n');

        if (lines.length < 2) return [];
        const header = lines[0].split(',').map(h => h.trim());
        const usernameIndex = header.indexOf('username');
        const xCoordinateIndex = header.indexOf('xCoordinate');
        const yCoordinateIndex = header.indexOf('yCoordinate');
        const colorHexIndex = header.indexOf('colorHex');
        const isTopIndex = header.indexOf('isTop');
        const isUndoIndex = header.indexOf('isUndo');
        const isSpecialIndex = header.indexOf('isSpecial');
        const timePlacedIndex = header.indexOf('timePlaced');

        const pixelList: Pixel[] = [];

        for (let i = 1; i < lines.length; i++) {
            const row = lines[i].trim();
            if (!row) continue;

            const values = row.split(',').map(v => v.trim());

            if (values.length === header.length) {
                const rawX = values[xCoordinateIndex];
                const rawY = values[yCoordinateIndex];
                const pixel: Pixel = {
                    username: values[usernameIndex] || '',
                    xCoordinate: rawX !== undefined && rawX !== '' ? Number(rawX) : 0,
                    yCoordinate: rawY !== undefined && rawY !== '' ? Number(rawY) : 0,
                    colorHex: values[colorHexIndex] || '#000000',
                    isTop: Number(values[isTopIndex]) === 1,
                    isUndo: Number(values[isUndoIndex]) === 1,
                    isSpecial: Number(values[isSpecialIndex]) === 1,
                    timePlaced: values[timePlacedIndex] || ''
                };

                pixelList.push(pixel);
            } else {
                console.warn(`Skipping row ${i + 1}: Expected ${header.length} columns, got ${values.length}`);
            }
        }
        state.addToPixelCache(year, pixelList);
        return pixelList;
    } catch (error: any) {
        createMessage({message: "Error loading pixel data. Please try reloading the page", location: "main-message", type: "error"});
        console.error(`Reason for failed fetch:`, error);
        return null;
    }

}

export async function getPixelsForDraw(params: DrawParams) {
    let pixels = await getPixelDataForYear(params['year']);
    if (pixels) {
        //Get just the user's pixels
        if (params['username']) {
            pixels = pixels.filter(pixel => pixel['username'].toLowerCase() === params['username']?.toLowerCase());
        }
        if (params['undo']) {
            if (params['undo'] === true) {
                pixels = pixels.filter(pixel => pixel['isUndo']);
            } else if (params["undo"] === false) {
                pixels = pixels.filter(pixel => !pixel['isUndo']);
            }
        }
        if (params['color']) {
            pixels = pixels.filter(pixel => pixel['colorHex'] === params['color']);
        }
        if (params['topOnly']) {
            if (params['topOnly'] === true) {
                pixels = pixels.filter(pixel => pixel['isTop']);
            } else if (params["topOnly"] === false) {
                pixels = pixels.filter(pixel => !pixel['isTop']);
            }
        }
        if (params['special']) {
            if (params['special'] === "template") {
                pixels = pixels.filter(pixel => pixel['isSpecial']);
            }
        }
        return pixels;
    } else {
        return null;
    }
}

export async function countUsersFinalPixels(username: string, year: number): Promise<number> {
    const finalPixels = await getPixelsForDraw(new DrawParams(year, username, null, null, null, true));
    if (finalPixels) {
        return finalPixels.length;
    }
    return 0;
}