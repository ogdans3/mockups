import type {Vec3} from "$lib/components/mock-video/Animation";

export function lerp(a: number, b: number, t: number) {
    return a + (b - a) * t;
}

export function lerpVec3(a: Vec3, b: Vec3, t: number): Vec3 {
    return {
        x: lerp(a.x, b.x, t),
        y: lerp(a.y, b.y, t),
        z: lerp(a.z, b.z, t),
    };
}
