<script lang="ts">
    import {tweened} from "svelte/motion";
    import {get} from "svelte/store";
    import {tick} from "svelte";
    import {videoController} from "../../../stores/video.svelte";
    import {cn} from "../../../utils/cn";
    import {linear} from "svelte/easing";

    const {
        color = "bg-red-500",
        class: className,
        startTime,
        endTime,
        rulerContainerWidth,
        time
    } = $props();

    // tweened store for playhead position
    const playheadX = tweened(0, {
        duration: 0,
        easing: linear
    });

    function calculateX(t: number) {
        return (
            Math.max(0, Math.min(1, (t - startTime) / (endTime - startTime))) *
            rulerContainerWidth
        );
    }

    function calculateTime(x: number) {
        return startTime + (x / rulerContainerWidth) * (endTime - startTime);
    }

    function animatePlayhead(currentTime: number) {
        const currentX = calculateX(currentTime);
        const remaining = Math.max(0, (endTime - currentTime) * 1000);

        // jump to current position instantly
        playheadX.set(currentX, {duration: 0});

        // then animate to the end
        playheadX.set(rulerContainerWidth, {
            duration: remaining,
            easing: linear
        }).then(animationFinished);
    }

    if (time === undefined) {
        get(videoController)?.playing?.subscribe(async (playing) => {
            if (!playing) {
                const time = calculateTime($playheadX);
                if (isNaN(time)) {
                    return;
                }
                get(videoController)?.setPlayheadPosition(time);
            } else {
                animatePlayhead(get(get(videoController).playheadAnimateFrom));
            }
        });

        get(videoController)?.playheadAnimateFrom?.subscribe((currentTime) => {
            if (!get(videoController).isPlaying) {
                const currentX = calculateX(currentTime);
                playheadX.set(currentX, {duration: 0});
                return;
            }
            if (endTime > startTime && rulerContainerWidth > 0) {
                animatePlayhead(currentTime);
            }
        });
    } else {
        // Static playhead (e.g. hover)
        $effect(() => {
            playheadX.set(calculateX(time), {duration: 0});
        });
    }

    function animationFinished() {
        get(videoController).playbackEnded();
    }
</script>

{#if time !== null}
    <div class={cn(
    "absolute left-0 right-0 top-0 bottom-0 mx-4 pointer-events-none",
    className
  )}>
        <div
                class={cn("absolute top-0 bottom-0 w-[1px] pointer-events-none", color)}
                style:transform={`translateX(${$playheadX}px)`}
        ></div>
    </div>
{/if}