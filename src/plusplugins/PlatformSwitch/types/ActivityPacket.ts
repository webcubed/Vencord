export type ActivityPacket = {
    d: {
        activities: {
            type: number,
            name: string,
            platform: string
        }[]
    }
}
