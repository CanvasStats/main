export interface LiveStats {
    timestamp: string,
    width: number,
    height: number,
    total_pixels: number,
    counts: LiveColorCount[]
}

export interface LiveColorCount {
    color_name: string,
    color_hex: string,
    count: number
}