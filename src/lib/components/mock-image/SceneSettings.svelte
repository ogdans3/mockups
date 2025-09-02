<script lang="ts">
    export let background: string;
    export let selectedPreset: string;
    export let presets: Record<string, { width: number; height: number }>;
    export let onPresetChange: () => void;
    export let width: number;
    export let height: number;
</script>

<section
        class="rounded-xl border border-surface-700/40 bg-surface-800/40 shadow-sm"
        aria-label="Scene settings"
>
    <div
            class="px-4 py-3 border-b border-surface-700/40
           flex items-center justify-between"
    >
        <h3 class="text-sm font-medium text-surface-200">Scene</h3>
        <span
                class="inline-flex items-center rounded-md bg-surface-700/40
             px-2 py-1 text-xs text-surface-300"
                aria-live="polite"
        >{width} × {height}</span
        >
    </div>

    <div class="p-4 space-y-4">
        <label class="block">
            <span class="text-sm text-surface-300">Background color</span>
            <input
                    class="mt-1 h-10 w-full rounded-md bg-surface-800/70
               ring-1 ring-surface-700 focus-visible:outline-none
               focus-visible:ring-2 focus-visible:ring-primary-400"
                    type="color"
                    bind:value={background}
            />
        </label>

        <label class="block">
            <span class="text-sm text-surface-300">Resolution preset</span>
            <select
                    class="mt-1 w-full rounded-md bg-surface-800/70 px-3 py-2
               text-sm ring-1 ring-surface-700
               focus-visible:outline-none
               focus-visible:ring-2 focus-visible:ring-primary-400"
                    bind:value={selectedPreset}
                    on:change={onPresetChange}
            >
                {#each Object.keys(presets) as key}
                    <option value={key}>{key}</option>
                {/each}
            </select>
        </label>
    </div>
</section>