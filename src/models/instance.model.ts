import { getRandomColor } from "../modules/utils.module";

export class Instance {
    public instanceId: number;
    public instanceName: string;
    public users: Record<number, number> = {};
    public pixels: Record<number, number> = {};

    constructor(
        instanceId: number,
        instanceName: string,
        usersByYear?: Record<number, number | null>,
        pixelsByYear?: Record<number, number | null>
    ) {
        this.instanceId = instanceId;
        this.instanceName = instanceName;

        if (usersByYear) {
            for (const [yearStr, userCount] of Object.entries(usersByYear)) {
                const year = Number(yearStr);
                if (userCount) {
                    this.users[year] = userCount;
                    const pixelCount = pixelsByYear?.[year];
                    if (pixelCount) {
                        this.pixels[year] = pixelCount;
                    }
                }
            }
        }
    }

    public totalUsers(): number {
        return Object.values(this.users).reduce((total, count) => total + count, 0);
    }

    public yearsActive(): Record<number, string> {
        const years = Object.keys(this.users).map(Number).sort((a, b) => a - b);
        let activeYears: Record<number, string> = {};
        years.map((year, index) => {
            activeYears[year] = getRandomColor(index + 1, true)
        });
        return activeYears;
    }
}