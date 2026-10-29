export interface UserItem {
    username: string;
    userRank?: number;
    yearsParticipated?: number;
    pixelsPlaced?: number;
}

export class UserRanks {
    public instance_id: number;
    public username: string;
    public ranks: Record<number, number> = {};
    public pixels: Record<number, number> = {};

    constructor(
        instance_id: number,
        username: string,
        ranksByYear?: Record<number, number | null>,
        pixelsByYear?: Record<number, number | null>
    ) {
        this.instance_id = instance_id;
        this.username = username;
        if (ranksByYear) {
            for (const [yearStr, rank] of Object.entries(ranksByYear)) {
                const year = Number(yearStr);
                if (rank) {
                    this.ranks[year] = rank;
                    const pixelCount = pixelsByYear?.[year];
                    if (pixelCount) {
                        this.pixels[year] = pixelCount;
                    }
                }
            }
        }
    }

    public yearParticipated() {
        const years = Object.keys(this.ranks).map(Number).sort((a, b) => a - b);
        return years;
    }

    public numYearsParticipated() {
        return Object.values(this.ranks).reduce((total) => total + 1, 0);
    }
}

export class User {
    public username: string;
    public userRank: number;
    public pixelCount: number;
    public xCord: number;
    public yCord: number;
    public cordCount: number;

    constructor(
        username: string,
        userRank: number,
        pixelCount: number,
        xCord: number,
        yCord: number,
        cordCount: number
    ) {
        this.username = username;
        this.userRank = userRank;
        this.pixelCount = pixelCount;
        this.xCord = xCord;
        this.yCord = yCord;
        this.cordCount = cordCount;
    }
}