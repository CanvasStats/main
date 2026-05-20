import { ContentPair, DrawParams, Pixel } from "../models";
import { fetchHTML, getRandomColor } from "../modules/utils";

const years: string[] = ["2023", "2024", "2025"];
const yearCounts: ContentPair[] = [
    new ContentPair("2025", "638"),
    new ContentPair("2024", "1912"),
    new ContentPair("2023", "2204")];
const baseURL: string = "https://raw.githubusercontent.com/TheRealMonte/data-files/main";

export function getYears(includeAll: boolean): ContentPair[] {
    const yearsToReturn: ContentPair[] = [];
    if (includeAll) {
        yearsToReturn.push(new ContentPair("All Years", getRandomColor(0, true)));
    }
    years.forEach((year: string, index: number) => {
        yearsToReturn.push(new ContentPair(year, getRandomColor(index + 1, true)));
        console.log(index);
    });
    return yearsToReturn;
}

export function getYearCounts(year: number) {
    const yearCount: ContentPair | undefined = yearCounts.find(yearCount => yearCount['contentKey'] === year.toString());
    if (yearCount) return yearCount['contentValue'];
    return 0;
}

export async function getPixelDataForYear(year: number) {
    try {
        const pixelsCSVData = await fetchHTML(`${baseURL}/${year}/pixels${year}.csv`);
        if (pixelsCSVData) {
            //Split the csv file into lines
            const lines = pixelsCSVData.trim().split('\n');
            //Define the column headers
            const header = lines[0].split(',').map((h: string) => h.trim());
            const usernameIndex = header.indexOf('username');
            const xCoordinateIndex = header.indexOf('xCoordinate');
            const yCoordinateIndex = header.indexOf('yCoordinate');
            const colorHexIndex = header.indexOf('colorHex');
            const isTopIndex = header.indexOf('isTop');
            const isUndoIndex = header.indexOf('isUndo');
            const isSpecialIndex = header.indexOf('isSpecial');
            const timePlacedIndex = header.indexOf("timePlaced");

            const pixelList: Pixel[] = [];
            for (let i = 1; i < lines.length; i++) {
                const values = lines[i].split(',');
                if (values.length === header.length) {
                    const pixel: Pixel = {
                        username: values[usernameIndex]?.trim() || '',
                        xCoordinate: +values[xCoordinateIndex]?.trim() || 0,
                        yCoordinate: +values[yCoordinateIndex]?.trim() || 0,
                        colorHex: values[colorHexIndex]?.trim() || '',
                        isTop: +values[isTopIndex]?.trim() == 1 || false,
                        isUndo: +values[isUndoIndex]?.trim() == 1 || false,
                        isSpecial: +values[isSpecialIndex]?.trim() == 1 || false,
                        timePlaced: values[timePlacedIndex]?.trim() || ''
                    }
                    pixelList.push(pixel)
                } else {
                    console.warn(`Skipping row ${i + 1} due to incorrect number of columns.`);
                }
            }
            return pixelList;
        }
        return null;
    } catch (error: any) {
        console.log(`Failed to fetch pixel data: ${error}`);
        return null;
    }
}

export async function getPixelsForDraw(params: DrawParams) {
    let pixels = await getPixelDataForYear(params['year']);
    if (pixels) {
        //Get just the user's pixels
        if (params['username']) {
            pixels = pixels.filter(pixel => pixel['username'] === params['username']);
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