import {writable, readable, derived, get} from 'svelte/store';
import {playheadPosition} from "./playhead.svelte";
import {settings} from "./settings.svelte";

export class VideoController {
    // store holding the playing state
    public playing = writable(false);
    public video: any = null;
    lastUpdate = 0;

    play() {
        this.playing.set(true);
        this.video?.play();
        requestAnimationFrame((now) => this.updatePlayhead(now));
    }

    pause() {
        console.log("Pause");
        this.playing.set(false);
        this.video?.pause();
    }

    public setVideo(video: any) {
        this.video = video;
    }

    updatePlayhead(now: number) {
        if (!this.video) {
            return;
        }
        if (!this.playing || this.video.paused || this.video.ended) {
            return;
        }
        const frameTime = 1000 / settings.fps;
        if (now - this.lastUpdate >= frameTime) {
            playheadPosition.set(this.video.currentTime);
            this.lastUpdate = now;
        }
        requestAnimationFrame((now) => this.updatePlayhead(now));
    }

    toggle() {
        console.log("Playing: ", get(this.playing));
        const isPlaying = get(this.playing);
        if (isPlaying) {
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