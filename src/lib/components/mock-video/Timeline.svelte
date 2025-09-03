<script lang="ts">
    import {v4 as uuid} from 'uuid';
    import type {Track, Animation} from './Animation';
    import TrackComponent from './Track.svelte';

    export let startTime: number = 0;
    export let endTime: number = 10;

    let tracks: Track[] = [];

    // Visual scale (must match Track.svelte)
    const pxPerSecond = 24;
    const labelColWidth = 160; // left label gutter width in px

    const DEFAULT_DURATION = 2;

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

    $: totalSeconds = Math.max(0, endTime - startTime);
    $: rulerWidth = totalSeconds * pxPerSecond;
</script>

<div class="timeline bg-surface-900 border-t border-surface-700/40 p-4">
    <div class="flex items-center gap-4 mb-4">
        <button
                class="px-3 py-1.5 rounded-md bg-primary-600 text-white text-sm font-medium hover:bg-primary-500"
                on:click={addPhone}
        >
            ➕ Add new phone
        </button>

        <div class="flex items-center gap-2 text-sm text-surface-300">
            <label>Start:</label>
            <input
                    type="number"
                    bind:value={startTime}
                    class="w-20 rounded bg-surface-800 px-2 py-1 text-xs"
            />
            <label>End:</label>
            <input
                    type="number"
                    bind:value={endTime}
                    class="w-20 rounded bg-surface-800 px-2 py-1 text-xs"
            />
        </div>
    </div>

    <!-- Scroll area: ruler + tracks share the same horizontal scroll -->
    <div class="rounded-md ring-1 ring-surface-700/40 bg-surface-900/40 overflow-hidden">
        <!-- Ruler row -->
        <div class="flex items-stretch border-b border-surface-700/40">
            <!-- Left label gutter (matches tracks) -->
            <div
                    class="shrink-0 text-xs text-surface-400 flex items-center justify-end pr-3 bg-surface-900/60"
                    style={`width:${labelColWidth}px;`}
            >
                Time
            </div>

            <!-- Ruler strip -->
            <div class="overflow-x-auto">
                <div class="relative h-8">
                    <div class="absolute inset-0 flex">
                        {#each Array(Math.floor(totalSeconds) + 1) as _, i}
                            <div
                                    class="h-full border-l border-surface-600 flex items-center justify-center text-xs text-surface-400"
                                    style={`width:${pxPerSecond}px;`}
                                    title={(startTime + i) + 's'}
                            >
                                {(startTime + i)}s
                            </div>
                        {/each}
                    </div>
                    <!-- Right edge line -->
                    <div
                            class="absolute top-0 right-0 h-full border-r border-surface-700/40 pointer-events-none"
                            style={`width:1px;`}
                    />
                </div>
            </div>
        </div>

        <!-- Tracks (share the same overflow container as ruler for alignment) -->
        <div class="flex">
            <!-- Left labels column -->
            <div
                    class="shrink-0"
                    style={`width:${labelColWidth}px;`}
            >
                {#each tracks as track (track.id)}
                    <div class="h-10 flex items-center justify-end pr-3 bg-surface-900/60 border-b border-surface-700/30">
                        <h3 class="text-xs font-semibold text-surface-200 truncate" title={track.phoneName}>
                            {track.phoneName}
                        </h3>
                    </div>
                {/each}
            </div>

            <!-- Track lanes in a single horizontally scrollable strip -->
            <div class="overflow-x-auto grow">
                <div>
                    {#each tracks as track (track.id)}
                        <TrackComponent
                                {track}
                                {startTime}
                                {endTime}
                                {pxPerSecond}
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
                        on:click={() => addAnimation(track.id)}
                >
                    ➕ Add animation
                </button>
            </div>
        {/each}
    </div>
</div>