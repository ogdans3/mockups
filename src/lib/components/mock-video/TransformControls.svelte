<script lang="ts">
    import ScrubNumber from '$lib/components/mock-video/ScrubNumber.svelte';
    import {
        transformControlPosition,
        transformControlRotation
    } from "$lib/stores/transform.svelte";

    export let onReset: () => void;

    const axes: readonly ('x' | 'y' | 'z')[] = ['x', 'y', 'z'];
</script>

<section
        class="rounded-xl border border-surface-700/40 bg-surface-800/40 shadow-sm"
        aria-label="Transform controls"
>
    <div
            class="flex items-center justify-between px-4 py-3 border-b border-surface-700/40"
    >
        <h3 class="text-sm font-medium text-surface-200">Transform</h3>
        <button
                type="button"
                class="inline-flex items-center gap-2 rounded-md px-2.5 py-1.5
             text-xs font-medium text-surface-200 hover:text-surface-50
             hover:bg-surface-700/30 focus-visible:outline-none
             focus-visible:ring-2 focus-visible:ring-primary-400"
                on:click={onReset}
        >
            ↺ Reset
        </button>
    </div>

    <div class="p-4 space-y-6">
        <!-- Position -->
        <fieldset class="space-y-2">
            <legend class="text-xs font-semibold text-surface-400">Position</legend>
            <div class="grid grid-cols-3 gap-3">
                {#each axes as axis}
                    <ScrubNumber
                            bind:value={$transformControlPosition[axis]}
                            min={axis === 'z' ? -5 : -2}
                            max={axis === 'z' ? 5 : 2}
                            step={0.1}
                            precision={2}
                            pixelsPerStep={8}
                            label={axis}
                    />
                {/each}
            </div>
        </fieldset>

        <!-- Rotation -->
        <fieldset class="space-y-2">
            <legend class="text-xs font-semibold text-surface-400">
                Rotation (deg)
            </legend>
            <div class="grid grid-cols-3 gap-3">
                {#each axes as axis}
                    <ScrubNumber
                            bind:value={$transformControlRotation[axis]}
                            min={-360}
                            max={360}
                            step={0.1}
                            precision={2}
                            pixelsPerStep={4}
                            label={axis}
                            units="°"
                    />
                {/each}
            </div>
        </fieldset>
    </div>
</section>