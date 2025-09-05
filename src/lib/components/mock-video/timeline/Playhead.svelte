<script lang="ts">
    import {tweened} from "svelte/motion";
    import {get} from "svelte/store";
    import {tick} from "svelte";
    import {videoController, currentPlayheadTime as globalPlayheadTime} from "../../../stores/video.svelte";
    import {cn} from "../../../utils/cn";
    import {linear} from "svelte/easing";

    const {
        color = "bg-red-500",
        class: className,
        startTime,
        endTime,
        rulerContainerWidth,
        time,
        showTime,
    } = $props();

    // tweened store for playhead position
    const playheadX = tweened(0, {
        duration: 0,
        easing: linear
    });
    let currentPlayheadTime = $state(0);

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
    playheadX.subscribe((val) => {
        const _time = calculateTime(val);
        if (isNaN(_time)) {
            return;
        }
        if (time === undefined) {
            globalPlayheadTime.set(_time);
        }
        currentPlayheadTime = _time;
    });

    function animationFinished() {
        get(videoController).playbackEnded();
    }
</script>

{#if time !== null}
    <div
            class={cn(
            "absolute left-0 right-0 top-0 bottom-0 mx-4 pointer-events-none",
            className
        )}
    >
        {#if showTime}
            <!-- Time label above playhead -->
            <div
                    class="absolute -top-5 text-[10px] text-surface-200 bg-surface-800/90 px-1 rounded pointer-events-none"
                    style:transform={`translateX(${$playheadX}px) translateX(-50%)`}
            >
                {currentPlayheadTime.toFixed(2)}s
            </div>
        {/if}

        <!-- Playhead line -->
        <div
                class={cn("absolute top-0 bottom-0 w-[1px] pointer-events-none", color)}
                style:transform={`translateX(${$playheadX}px)`}
        ></div>
    </div>
{/if}