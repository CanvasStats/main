import { ContentPair, DrawParams, Pixel } from "../models";
import { createMessage, fetchHTML, getRandomColor } from "../modules/utils";

const years: string[] = ["2023", "2024", "2025", "2026"];
const yearUserCounts: ContentPair[] = [
    new ContentPair("2026", "589"),
    new ContentPair("2025", "638"),
    new ContentPair("2024", "1912"),
    new ContentPair("2023", "2204")
];
const yearPixelCounts: ContentPair[] = [
    new ContentPair("2026", "309205"),
    new ContentPair("2025", "313408"),
    new ContentPair("2024", "658367"),
    new ContentPair("2023", "630578")
];
const baseURL: string = "https://raw.githubusercontent.com/TheRealMonte/data-files/main";

export function getYears(includeAll: boolean): ContentPair[] {
    const yearsToReturn: ContentPair[] = [];
    if (includeAll) {
        yearsToReturn.push(new ContentPair("All", getRandomColor(0, true)));
    }
    years.forEach((year: string, index: number) => {
        yearsToReturn.push(new ContentPair(year, getRandomColor(index + 1, true)));
    });
    return yearsToReturn;
}

export function getYearCounts(year: number): ContentPair[] {
    const counts: ContentPair[] = []
    const yearUserCount: ContentPair | undefined = yearUserCounts.find(userCount => userCount['contentKey'] === year.toString());
    const yearPixelCount: ContentPair | undefined = yearPixelCounts.find(pixelCount => pixelCount['contentKey'] === year.toString());
    if (yearUserCount) counts.push(yearUserCount);
    if (yearPixelCount) counts.push(yearPixelCount);
    return counts;
}

export async function getPixelDataForYear(year: number) {
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

        return pixelList;
    } catch (error: any) {
        createMessage("Error loading pixel data. Please try reloading the page", "main-message", "error");
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