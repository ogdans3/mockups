import {writable, readable, derived, get} from 'svelte/store';
import {playheadPosition, playheadPosition2} from "./playhead.svelte";
import {settings} from "./settings.svelte";

export class VideoController {
    // store holding the playing state
    public video: any = null;
    public playing = writable(false);
    public endTime = writable(10);
    public playheadAnimateFrom = writable<null | number>(null);

    playStartTime = writable<null | number>(null);
    pauseStartTime = writable<null | number>(null);
    playheadStartTime = writable<null | number>(null);

    lastUpdate = 0;
    framesPlayed = 0;
    totalFrames = derived(this.endTime, (time) => time * settings.fps);

    setPlayheadStart() {
        const pauseStartTime = get(this.pauseStartTime);
        const playStartTime = get(this.playStartTime);
        const playheadStartTime = get(this.playheadStartTime);
        if (pauseStartTime != null && playStartTime != null) {
            return this.playheadAnimateFrom.set(pauseStartTime - playStartTime);
        }
        if (playheadStartTime != null) {
            return this.playheadAnimateFrom.set(playheadStartTime);
        }
        return this.playheadAnimateFrom.set(0);
    }

    setPlayheadPosition(time: number) {
        if (time === get(this.playheadAnimateFrom)) {
            //Force svelte to give the update.
            // For example if the user click in the timeline, and then watches for one second, then clicks again to rewatch.
            this.playheadAnimateFrom.set(time - 0.001);
        }
        this.playheadAnimateFrom.set(time);
        this.video.currentTime = time;
    }

    play() {
        this.setPlayheadStart();
        console.log("Playhead animate from: ", get(this.playheadAnimateFrom));
        this.playStartTime.set(performance.now());
        this.playing.set(true);
        this.video?.play();
        requestAnimationFrame((now) => this.updatePlayhead(now));
    }

    pause() {
        this.pauseStartTime.set(performance.now());
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
        if (!this.playing) {
            return;
        }
        const frameTime = 1000 / settings.fps;
        if (now - this.lastUpdate >= frameTime) {
            this.framesPlayed++;
            if (this.framesPlayed > get(this.totalFrames)) {
                this.framesPlayed = 0;
            }
            //console.log(get(this.totalFrames), "F: ", (frameTime * this.framesPlayed) / 1000, "C: ", this.video.currentTime);
            playheadPosition.set(this.video.currentTime);
            playheadPosition2.set((frameTime * this.framesPlayed) / 1000);
            this.lastUpdate = now;
        }
        requestAnimationFrame((now) => this.updatePlayhead(now));
    }

    toggle() {
        //console.log("Playing: ", get(this.playing));
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