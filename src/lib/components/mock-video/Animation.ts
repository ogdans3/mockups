export type Vec3 = {
    x: number;
    y: number;
    z: number;
};

export type Animation = {
    id: string;
    name: string;
    start: number; // seconds
    end: number; // seconds
    posStart: Vec3;
    posEnd: Vec3;
    rotStart: Vec3;
    rotEnd: Vec3;
};

export type Track = {
    id: string;
    phoneName: string;
    animations: Animation[];
};