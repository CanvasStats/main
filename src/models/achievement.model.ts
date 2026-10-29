export interface Achievement {
    name: string,
    description: string,
    icon: string,
    years: number[],
    totalUsers?: number
}

export interface AchievementStat {
    name: string;
    NumUsers: number;
    percentage: string;
    group: string;
}

export interface AchievementInfo {
    icon: string;
    lockedCount: number;
    hint: string;
}