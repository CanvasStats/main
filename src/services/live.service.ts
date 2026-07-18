import type { DataRow, LiveStats } from "../models";
import { createMessage, fetchHTML } from "../modules/utils";

//https://raw.githubusercontent.com/CanvasStats/data-files/refs/heads/main/users_online2026.csv
//https://raw.githubusercontent.com/CanvasStats/data-files/refs/heads/main/counts2026.json

export async function getUsersOnline() {
    try {
        const usersOnlineData = await fetchHTML("https://raw.githubusercontent.com/CanvasStats/data-files/refs/heads/main/users_online2026.csv");
        if (usersOnlineData) {
            //Split the csv file into lines
            //timestamp,user_count
            const lines = usersOnlineData.trim().split('\n');
            //Define the column headers
            const header = lines[0].split(',').map((h: string) => h.trim());
            const timestampIndex = header.indexOf("timestamp");
            const userCountIndex = header.indexOf("user_count");

            const userCountList: DataRow[] = [];
            for (let i = 1; i < lines.length; i++) {
                const values = lines[i].split(',');
                if (values.length === header.length) {
                    const userCount: DataRow = {
                        timestamp:  new Date(values[timestampIndex]?.trim()),
                        value: +values[userCountIndex]?.trim() || 0
                    }
                    userCountList.push(userCount);
                } else {
                    console.warn(`Skipping row ${i + 1} due to incorrect number of columns.`);
                }
            }
            return userCountList;
        }
        return null;
    } catch (error) {
        createMessage("Error loading users online data. Please try reloading the page", "main-message", "error");
        console.log(`Reason for failed fetch: ${error}`);
        return null;
    }
}

export async function getLiveColorCounts(): Promise<LiveStats> {
    
    const response = await fetch("https://raw.githubusercontent.com/CanvasStats/data-files/refs/heads/main/counts2026.json");

    if (!response.ok) {
        createMessage("Error loading color counts. Please try reloading the page", "main-message", "error");
    }

    const data = (await response.json()) as LiveStats;
    return data
}