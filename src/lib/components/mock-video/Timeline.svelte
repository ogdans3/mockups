<script lang="ts">
    import {v4 as uuid} from "uuid";
    import type {Track, Animation} from "./Animation";
    import TrackComponent from "./Track.svelte";

    let {currentTime: currentTime = 0, endTime = 10} = $props<{
        currentTime?: number;
        endTime?: number;
    }>();
    let startTime = 0;
    let tracks = $state<Track[]>([]);

    function clampToTimeline(t: number) {
        return Math.max(startTime, Math.min(endTime, t));
    }

    function createAnimationForTrack(track: Track, index: number): Animation {
        const last = track.animations.at(-1);
        const proposedStart = last ? last.end : startTime;
        const start = clampToTimeline(proposedStart);
        const end = clampToTimeline(Math.min(start + DEFAULT_DURATION, endTime));

        return {
            id: uuid(),
            name: `Animation ${index + 1}`,
            start,
            end,
            posStart: {x: 0, y: 0, z: 0},
            posEnd: {x: 0, y: 0, z: 0},
            rotStart: {x: 0, y: 0, z: 0},
            rotEnd: {x: 0, y: 0, z: 0}
        };
    }

    function addPhone() {
        const id = uuid();
        const track: Track = {
            id,
            phoneName: `Phone ${tracks.length + 1}`,
            animations: []
        };
        const first = createAnimationForTrack(track, 0);
        track.animations = [first];
        tracks = [...tracks, track];
    }

    function addAnimation(trackId: string) {
        const track = tracks.find((t) => t.id === trackId);
        if (!track) return;
        const anim = createAnimationForTrack(track, track.animations.length);
        track.animations = [...track.animations, anim];
        tracks = [...tracks];
    }

    const labelColWidth = 160;
    const DEFAULT_DURATION = 2;

    // measure container width
    let rulerContainerWidth = $state(0);

    // total seconds
    const totalSeconds = $derived(Math.max(0, endTime - startTime));

    // number of half-second ticks
    const totalTicks = $derived(Math.ceil(totalSeconds / 0.5));

    // width per tick (fills container)
    const tickWidth = $derived(
        totalTicks > 0 ? rulerContainerWidth / totalTicks : 0
    );

    const ticks = $derived.by(() => {
        const arr: { time: number; type: "major" | "minor"; label?: string }[] =
            [];
        const step = 0.5;

        // Always include start
        arr.push({
            time: startTime,
            type: "major",
            label: `${startTime.toFixed(1).replace(/\.0$/, "")}s`
        });

        for (let t = startTime + step; t < endTime; t += step) {
            const isWholeSecond = Math.abs(t - Math.round(t)) < 1e-6;
            arr.push({
                time: +t.toFixed(2),
                type: isWholeSecond ? "major" : "minor",
                label: isWholeSecond ? `${Math.round(t)}s` : undefined
            });
        }

        // Always include end
        arr.push({
            time: endTime,
            type: "major",
            label: `${endTime.toFixed(1).replace(/\.0$/, "")}s`
        });

        return arr;
    });

    let currentTimeField = $state(currentTime.toFixed(2));
    let endTimeField = $state(endTime.toFixed(2));

    function handleStartInput(e: Event) {
        const val = parseFloat((e.target as HTMLInputElement).value);
        if (!isNaN(val)) {
            currentTime = val;
            currentTimeField = val.toFixed(2);
        } else {
            currentTimeField = "";
        }
    }

    function handleEndInput(e: Event) {
        const val = parseFloat((e.target as HTMLInputElement).value);
        if (!isNaN(val)) {
            endTime = val;
            endTimeField = val.toFixed(2);
        } else {
            endTimeField = "";
        }
    }
</script>

<div class="timeline bg-surface-900 border-t border-surface-700/40 p-4 flex flex-col gap-4">
    <div class="flex items-center justify-end gap-2 text-sm text-surface-300">
        <div class="relative">
            <input
                    id="start-time"
                    type="text"
                    bind:value={currentTimeField}
                    onblur={handleStartInput}
                    class="w-16 rounded bg-surface-800/80 px-1 py-0.5 pr-4 text-xs text-right
             text-surface-100 border border-surface-700/50
             focus:outline-none focus:ring-1 focus:ring-primary-500"
                    aria-label="Start time in seconds"
            />
            <span
                    class="absolute right-1 top-1/2 -translate-y-1/2 text-surface-400 text-[10px] pointer-events-none"
            >
                s
            </span>
        </div>

        <span class="text-surface-400">of</span>

        <div class="relative">
            <input
                    id="end-time"
                    type="text"
                    bind:value={endTimeField}
                    onblur={handleEndInput}
                    class="w-16 rounded bg-surface-800/80 px-1 py-0.5 pr-4 text-xs text-right
             text-surface-100 border border-surface-700/50
             focus:outline-none focus:ring-1 focus:ring-primary-500"
                    aria-label="End time in seconds"
            />
            <span
                    class="absolute right-1 top-1/2 -translate-y-1/2 text-surface-400 text-[10px] pointer-events-none"
            >
                s
            </span>
        </div>
    </div>

    <div class="rounded-md ring-1 ring-surface-700/40 bg-surface-900/40 overflow-hidden">
        <div class="flex items-stretch border-b border-surface-700/40">
            <div class="overflow-hidden grow" bind:clientWidth={rulerContainerWidth}>
                <div class="relative h-8 w-full">
                    <div class="flex h-full w-full">
                        {#each ticks as tick}
                            <div
                                    class="flex flex-col items-center"
                                    style={`width:${tickWidth}px;`}
                            >
                                <div
                                        class={tick.type === "major" ? "h-full border-l border-surface-400" : "h-1/2 border-l border-surface-600"}
                                ></div>

                                {#if tick.label}
                                    <div class="text-xs text-surface-400 mt-0.5">
                                        {tick.label}
                                    </div>
                                {/if}
                            </div>
                        {/each}
                    </div>
                </div>
            </div>
        </div>

        <div class="flex">
            <div class="overflow-x-auto grow">
                <div>
                    {#each tracks as track (track.id)}
                        <TrackComponent
                                {track}
                                {currentTime}
                                {endTime}
                        />
                    {/each}
                </div>
            </div>
        </div>
    </div>

    <!-- Controls per track: separate row with buttons -->
    <div class="mt-3 space-y-2">
        {#each tracks as track (track.id)}
            <div class="flex items-center justify-between">
                <div class="text-xs text-surface-400">
                    {track.phoneName}
                </div>
                <button
                        class="px-2 py-1 rounded-md bg-secondary-600 text-white text-xs font-medium hover:bg-secondary-500"
                        onclick={() => addAnimation(track.id)}
                >
                    ➕ Add animation
                </button>
            </div>
        {/each}
    </div>
</div>

<style>
    /* Hide number input spinners */
    input[type="number"]::-webkit-inner-spin-button,
    input[type="number"]::-webkit-outer-spin-button {
        -webkit-appearance: none;
        margin: 0;
    }

    input[type="number"] {
        -moz-appearance: textfield;
    }
</style>