export type Vec3 = {
    x: number;
    y: number;
    z: number;
};
export const zeroVec: () => Vec3 = () => ({x: 0, y: 0, z: 0});

export type Keyframe = {
    id: string;
    position: Vec3;
    rotation: Vec3;
    opacity: number;
    time: number;
};

export type Animation = {
    id: string;
    name: string;
    start: number;
    end: number;
    keyframes: Keyframe[];
};

export type Track = {
    id: string;
    phoneName: string;
    animations: Animation[];
};

export function getAnimation(track: Track, animationId: string): Animation | undefined {
    return track.animations.find(animation => animation.id === animationId);
}