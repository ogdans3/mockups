import type {Animation, Track, Keyframe} from "../components/mock-video/Animation";
import {transformControlPosition, transformControlRotation} from "$lib/stores/transform.svelte";
import {currentPlayheadTime} from "./video.svelte";
import {get} from "svelte/store";
import {lerpVec3} from "$lib/utils/curves";
import {writable} from 'svelte/store';

export let tracks = $state<Track[]>([]);

export function setTransformControlsFromPlayhead() {
    const playhead = get(currentPlayheadTime);

    let closestAnim: { anim: any; dist: number } | null = null;

    // Find the animation whose start/end is closest to the playhead
    for (const track of tracks) {
        for (const anim of track.animations) {
            // If inside animation, distance = 0
            let dist = 0;
            if (playhead < anim.start) {
                dist = anim.start - playhead;
            } else if (playhead > anim.end) {
                dist = playhead - anim.end;
            }

            if (!closestAnim || dist < closestAnim.dist) {
                closestAnim = {anim, dist};
            }
        }
    }

    if (!closestAnim) return; // no animations at all
    const anim = closestAnim.anim;
    const localTime = playhead - anim.start;

    const firstKf = anim.keyframes[0];
    const lastKf = anim.keyframes[anim.keyframes.length - 1];

    // Before first keyframe → clamp
    if (localTime <= firstKf.time) {
        transformControlPosition.set(firstKf.position);
        transformControlRotation.set(firstKf.rotation);
        return;
    }

    // After last keyframe → clamp
    if (localTime >= lastKf.time) {
        transformControlPosition.set(lastKf.position);
        transformControlRotation.set(lastKf.rotation);
        return;
    }

    // Interpolate between keyframes
    for (let i = 0; i < anim.keyframes.length - 1; i++) {
        const kf1 = anim.keyframes[i];
        const kf2 = anim.keyframes[i + 1];
        if (localTime >= kf1.time && localTime <= kf2.time) {
            const span = kf2.time - kf1.time;
            const t = span > 0 ? (localTime - kf1.time) / span : 0;

            const pos = lerpVec3(kf1.position, kf2.position, t);
            const rot = lerpVec3(kf1.rotation, kf2.rotation, t);

            transformControlPosition.set(pos);
            transformControlRotation.set(rot);
            return;
        }
    }
}