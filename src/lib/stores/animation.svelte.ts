import type {Animation, Keyframe} from "../components/mock-video/Animation";
import {writable} from 'svelte/store';

export const selectedAnimationStore = writable<null | Animation>(null);
export const selectedAnimationKeyframe = writable<null | Keyframe>(null);
