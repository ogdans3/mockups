import type {Animation, Track, Keyframe} from "../components/mock-video/Animation";
import {writable} from 'svelte/store';

export let tracks = $state<Track[]>([]);

