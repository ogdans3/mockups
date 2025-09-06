<script lang="ts">
    import {Play, Pause} from "lucide-svelte";
    import {v4 as uuid} from "uuid";
    import type {Track, Animation} from "../Animation";
    import {get, derived} from "svelte/store";
    import {zeroVec} from "../Animation";
    import type {Vec3, Keyframe} from "../Animation";
    import {videoPlaying, videoController, currentPlayheadTime} from "../../../stores/video.svelte";
    import {tracks, setTransformControlsFromPlayhead} from "../../../stores/tracks.svelte";
    import TrackComponent from "../Track.svelte";
    import PlayheadComponent from "./Playhead.svelte";
    import fromBottom from "$lib/animations/FromBottom.json";
    import animations from "$lib/animations/animations.svelte.ts";

    let showAnimationDialog = $state(false);
    let selectedTrackId: string | null = null;

    let startTime = 0;
    let mouseHoverPosition = $state<number | null>(null);

    function clampToTimeline(t: number) {
        return Math.max(startTime, Math.min($endTime, t));
    }

    function createAnimationForTrack(track: Track, index: number): Animation {
        return {...fromBottom};
    }

    const endTime = derived(get(videoController).endTime, (time) => time);

    function createAnimationForTrack2(track: Track, index: number): Animation {
        const last = track.animations.at(-1);
        const proposedStart = last ? last.end : startTime;
        const start = clampToTimeline(proposedStart);
        const end = clampToTimeline(Math.min(start + DEFAULT_DURATION, $endTime));

        return {
            id: uuid(),
            name: `Animation ${index + 1}`,
            start,
            end,
            keyframes: [
                {id: uuid(), time: 0, position: zeroVec(), rotation: zeroVec(), opacity: 0},
                {id: uuid(), time: end - start, position: zeroVec(), rotation: zeroVec(), opacity: 0},
            ],
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
        tracks.push(track);

        setTransformControlsFromPlayhead();
    }

    function openAnimationDialog(trackId: string) {
        selectedTrackId = trackId;
        showAnimationDialog = true;
    }

    function chooseAnimation(animDef: Animation) {
        if (selectedTrackId) {
            _addAnimation(selectedTrackId, animDef);
        }
        showAnimationDialog = false;
        selectedTrackId = null;
    }

    function addEmptyAnimation(trackId: string) {
        _addAnimation(trackId);
    }

    function addAnimation(trackId: string) {
        _addAnimation(trackId)
    }

    function _addAnimation(trackId: string, animDef?: Animation) {
        const track = tracks.find((t) => t.id === trackId);
        if (!track) return;

        const playhead = get(get(videoController).playheadAnimateFrom);
        let videoEnd = get(get(videoController).endTime);

        // Sort animations by start time
        track.animations.sort((a, b) => a.start - b.start);

        const duration = DEFAULT_DURATION;

        // Find neighbors
        const currentAnim = track.animations.find(
            (a) => playhead >= a.start && playhead <= a.end
        );
        const prevAnim = [...track.animations].reverse().find((a) => a.end <= playhead);
        const nextAnim = track.animations.find((a) => a.start >= playhead);

        let start: number;
        let end: number;

        // --- CASE 1: Playhead inside an animation ---
        if (currentAnim) {
            const distLeft = playhead - currentAnim.start;
            const distRight = currentAnim.end - playhead;

            if (distLeft <= distRight) {
                // Insert to the LEFT → clip only
                end = currentAnim.start;
                start = Math.max(end - duration, prevAnim ? prevAnim.end : 0);
            } else {
                // Insert to the RIGHT
                start = currentAnim.end;
                end = start + duration;

                if (nextAnim) {
                    if (end > nextAnim.start) {
                        // No room → push chain right
                        const shift = duration;
                        const startIndex = track.animations.indexOf(nextAnim);
                        for (let i = startIndex; i < track.animations.length; i++) {
                            track.animations[i].start += shift;
                            track.animations[i].end += shift;
                        }
                        end = start + duration;

                        // Extend timeline if needed
                        const lastAnim = track.animations[track.animations.length - 1];
                        if (lastAnim.end > videoEnd) {
                            videoEnd = lastAnim.end;
                            get(videoController).endTime.set(videoEnd);
                        }
                    } else {
                        // Clip to nextAnim.start
                        end = Math.min(end, nextAnim.start);
                    }
                }
            }
        }
        // --- CASE 2: Playhead before first animation ---
        else if (!prevAnim && nextAnim) {
            start = playhead;
            end = start + duration;

            if (end > nextAnim.start) {
                // Clip to nextAnim.start (no push here)
                end = nextAnim.start;
            }
        }
        // --- CASE 3: Playhead after last animation ---
        else if (prevAnim && !nextAnim) {
            start = Math.max(prevAnim.end, playhead);
            end = start + duration;

            if (end > videoEnd) {
                videoEnd = end;
                get(videoController).endTime.set(videoEnd);
            }
        }
        // --- CASE 4: Playhead between two animations ---
        else if (prevAnim && nextAnim) {
            start = Math.max(prevAnim.end, playhead);
            end = start + duration;

            if (end > nextAnim.start) {
                // No room → push chain right
                const shift = duration;
                const startIndex = track.animations.indexOf(nextAnim);
                for (let i = startIndex; i < track.animations.length; i++) {
                    track.animations[i].start += shift;
                    track.animations[i].end += shift;
                }
                end = start + duration;

                const lastAnim = track.animations[track.animations.length - 1];
                if (lastAnim.end > videoEnd) {
                    videoEnd = lastAnim.end;
                    get(videoController).endTime.set(videoEnd);
                }
            } else {
                // Clip to nextAnim.start
                end = Math.min(end, nextAnim.start);
            }
        }
        // --- CASE 5: No animations at all ---
        else {
            start = playhead;
            end = start + duration;

            if (end > videoEnd) {
                videoEnd = end;
                get(videoController).endTime.set(videoEnd);
            }
        }

        // --- Create animation ---
        let anim: Animation;

        if (animDef) {
            // Use provided animation definition
            anim = {
                ...animDef,
                id: uuid(),
                name: animDef.name ?? `Animation ${track.animations.length + 1}`,
                start,
                end,
                keyframes: animDef.keyframes.map((kf) => ({
                    ...kf,
                    id: uuid(),
                    time: Math.min(kf.time, end - start), // clamp times to new duration
                })),
            };
        } else {
            // Default empty animation
            anim = {
                id: uuid(),
                name: `Animation ${track.animations.length + 1}`,
                start,
                end,
                keyframes: [
                    {
                        id: uuid(),
                        time: 0,
                        position: zeroVec(),
                        rotation: zeroVec(),
                        opacity: 1,
                    },
                    {
                        id: uuid(),
                        time: end - start,
                        position: zeroVec(),
                        rotation: zeroVec(),
                        opacity: 1,
                    },
                ],
            };
        }

        track.animations.push(anim);
        track.animations.sort((a, b) => a.start - b.start);
    }

    const labelColWidth = 160;
    const DEFAULT_DURATION = 2;

    // measure container width
    let rulerContainerWidth = $state(0);

    // total seconds
    const totalSeconds = $derived(Math.max(0, $endTime - startTime));

    // number of half-second ticks
    const totalTicks = $derived(Math.ceil(totalSeconds / 0.5));

    // width per tick (fills container)
    const tickWidth = $derived(
        totalTicks > 0 ? rulerContainerWidth / totalTicks : 0
    );
    const pxPerSecond = $derived($endTime - startTime > 0 ? rulerContainerWidth / $endTime - startTime : 0);

    const ticks = $derived.by(() => {
        const arr: { time: number; type: "major" | "minor"; label?: string }[] = [];
        const step = 0.5;

        // Always include start
        arr.push({
            time: startTime,
            type: "major",
            label: `${startTime.toFixed(1).replace(/\.0$/, "")}s`
        });

        for (let t = startTime + step; t < $endTime; t += step) {
            const isWholeSecond = Math.abs(t - Math.round(t)) < 1e-6;
            arr.push({
                time: +t.toFixed(2),
                type: isWholeSecond ? "major" : "minor",
                label: isWholeSecond ? `${Math.round(t)}s` : undefined
            });
        }

        // Always include end
        arr.push({
            time: $endTime,
            type: "major",
            label: `${$endTime.toFixed(1).replace(/\.0$/, "")}s`
        });

        return arr;
    });

    let currentTimeField = $state(get(currentPlayheadTime).toFixed(2));
    let endTimeField = $state($endTime.toFixed(2));

    $effect(() => {
        currentTimeField = $currentPlayheadTime.toFixed(2);
    });

    function handleCurrentTimeInput(e: Event) {
        let val = parseFloat((e.target as HTMLInputElement).value);
        if (val > $endTime) {
            val = $endTime;
        }
        if (!isNaN(val)) {
            get(videoController).setPlayheadPosition(val);
            currentTimeField = val.toFixed(2);
        } else {
            currentTimeField = "";
        }
    }

    function handleEndInput(e: Event) {
        const val = parseFloat((e.target as HTMLInputElement).value);
        if (!isNaN(val)) {
            get(videoController).endTime.set(val);
            endTimeField = val.toFixed(2);
        } else {
            endTimeField = "";
        }
    }

    function handleMouseMove(e: MouseEvent) {
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        const x = e.clientX - rect.left; // position inside container
        const clampedX = Math.max(0, Math.min(rulerContainerWidth, x));
        const time = startTime + clampedX / pxPerSecond;
        mouseHoverPosition = time;
    }

    function handleMouseLeave() {
        mouseHoverPosition = null;
    }

    function clickTimeline() {
        get(videoController).setPlayheadPosition(mouseHoverPosition);
    }

    if (tracks.length === 0) {
        addPhone();
    }
</script>

<div class="timeline bg-surface-900 border-t border-surface-700/40 p-4 flex flex-col gap-4">
    <!-- Timeline controls -->
    <div class="flex items-center justify-between text-sm text-surface-300">
        <button
                class="inline-flex items-center justify-center rounded-md "
                aria-label={$videoPlaying ? "Pause" : "Play"}
                onclick={() => $videoController.toggle()}
                title={$videoPlaying ? "Pause" : "Play"}
        >
            {#if $videoPlaying}
                <Pause size={32}/>
            {:else}
                <Play size={32}/>
            {/if}
        </button>
        <div class="flex flex-row gap-2">
            <div class="relative">
                <input
                        id="start-time"
                        type="text"
                        bind:value={currentTimeField}
                        onblur={handleCurrentTimeInput}
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
    </div>

    <div class="relative px-4"
    >
        <!-- Ticks -->
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <!-- svelte-ignore a11y_interactive_supports_focus -->
        <div class="rounded-md ring-1 ring-surface-700/40 bg-surface-900/40"
             role="button"
             onclick={clickTimeline}
             onmousemove={handleMouseMove}
             onmouseleave={handleMouseLeave}
        >
            <div class="flex items-stretch border-b border-surface-700/40">
                <div class="grow" bind:clientWidth={rulerContainerWidth}>
                    <div class="relative h-8 w-full">
                        <div class="flex h-full w-full relative">
                            <!-- All ticks except the last one -->
                            {#each ticks as tick, i}
                                <div class="flex flex-col items-start select-none"
                                     style:width={i === ticks.length - 1 ? 0 + "px": tickWidth + "px"}
                                >
                                    <div class={tick.type === "major" ? "h-full border-l border-surface-400" : "h-1/2 border-l border-surface-600"}>
                                    </div>

                                    {#if tick.label}
                                        <div class="mt-0.5 text-xs text-surface-400 self-start"
                                             style="transform: translateX(-50%);"
                                        >
                                            {tick.label}
                                        </div>
                                    {/if}
                                </div>
                            {/each}
                        </div>
                    </div>
                </div>
            </div>

            <!-- Tracks -->
            <div class="flex">
                <div class="overflow-x-auto grow">
                    <div>
                        {#each tracks as track, i (track.id)}
                            <TrackComponent
                                    bind:track={tracks[i]}
                                    {pxPerSecond}
                            />
                        {/each}
                    </div>
                </div>
            </div>
        </div>

        <PlayheadComponent showTime={true} time={mouseHoverPosition} color="bg-blue-500" {rulerContainerWidth}/>
        <PlayheadComponent showTime={false} {rulerContainerWidth}/>
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
                    Add empty animation
                </button>
                <button
                        class="px-2 py-1 rounded-md bg-secondary-600 text-white text-xs font-medium hover:bg-secondary-500"
                        onclick={() => openAnimationDialog(track.id)}
                >
                    Add animation
                </button>
            </div>
        {/each}
    </div>
</div>

{#if showAnimationDialog}
    <div class="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
        <div class="bg-surface-900 rounded-lg shadow-lg w-[90%] h-[90%] overflow-y-auto p-6">
            <h2 class="text-lg font-bold mb-4 text-surface-100">Choose an Animation</h2>
            <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {#each animations as anim}
                    <button
                            class="p-4 bg-surface-800 rounded hover:bg-surface-700 text-left text-surface-200"
                            onclick={() => chooseAnimation(anim)}
                    >
                        <div class="font-semibold">{anim.name}</div>
                        <div class="text-xs text-surface-400">
                            {anim.keyframes.length} keyframes
                        </div>
                    </button>
                {/each}
            </div>
            <div class="mt-6 text-right">
                <button
                        class="px-4 py-2 bg-secondary-600 text-white rounded hover:bg-secondary-500"
                        onclick={() => (showAnimationDialog = false)}
                >
                    Cancel
                </button>
            </div>
        </div>
    </div>
{/if}

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