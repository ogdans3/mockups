import {writable} from 'svelte/store';
import type {Vec3} from "../components/mock-video/Animation";

export const transformControlPosition = writable<Vec3>({x: 0, y: 0, z: 0});
export const transformControlRotation = writable<Vec3>({x: 0, y: 0, z: 0});