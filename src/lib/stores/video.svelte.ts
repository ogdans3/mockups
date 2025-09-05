import {tick} from 'svelte';
import {writable, readable, derived, get} from 'svelte/store';
import {playheadPosition, playheadPosition2} from "./playhead.svelte";
import {settings} from "./settings.svelte";

export class VideoController {
    // store holding the playing state
    public video: HTMLVideoElement | null = null;
    public playing = writable(false);
    public endTime = writable(10);
    public playheadAnimateFrom = writable<number>(0);

    playStartTime = writable<null | number>(null);
    pauseStartTime = writable<null | number>(null);
    playheadStartTime = writable<null | number>(null);

    get isPlaying() {
        return get(this.playing);
    }

    setPlayheadPosition(time: number) {
        if (time == null) {
            console.warn("Playhead position must be set");
            return;
        }
        if (time === get(this.playheadAnimateFrom)) {
            //Force svelte to give the update.
            // For example if the user click in the timeline, and then watches for one second, then clicks again to rewatch.
            this.playheadAnimateFrom.set(time - 0.001);
        }
        this.playheadAnimateFrom.set(time);
        if (this.video) {
            this.video.currentTime = time;
        }
    }

    async play() {
        this.playStartTime.set(performance.now());
        this.playing.set(true);
        this.video?.play();
    }

    async pause() {
        this.playing.set(false);
        this.pauseStartTime.set(performance.now());
        this.video?.pause();
    }

    reset() {
        this.setPlayheadPosition(0);
    }

    playbackEnded() {
        if (settings.videoLoop) {
            this.reset();
        } else {
            this.pause();
        }
    }

    public setVideo(video: any) {
        this.video = video;
        this.video!.loop = false;
        this.video!.muted = true;
        this.video!.autoplay = false;
        this.video!.playsInline = true;
    }

    toggle() {
        if (this.isPlaying) {
            this.pause();
        } else {
            this.play();
        }
    }
}

export const videoController = readable(new VideoController());
export const videoPlaying = derived(videoController, ($controller, set) => {
    const unsubscribe = $controller.playing.subscribe(set);
    return () => unsubscribe();
});