import {writable} from 'svelte/store';
import type {Vec3} from "../components/mock-video/Animation";

export const playheadPosition = writable<number>(0);