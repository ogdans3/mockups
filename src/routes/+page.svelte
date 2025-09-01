<script lang="ts">
    import ThreeScene from '$lib/components/ThreeScene.svelte';

    // State
    let pos = {x: 0, y: 0, z: 0};
    let rot = {x: 0, y: 0, z: 0};
    let background = '#111111';

    const presets = {
        'Full HD (16:9)': {width: 1920, height: 1080},
        'Square (1:1)': {width: 1080, height: 1080},
        'TikTok (9:16)': {width: 1080, height: 1920},
        'Cinema 4K (21:9)': {width: 3840, height: 1646}
    } as const;

    let selectedPreset: keyof typeof presets = 'Full HD (16:9)';
    let {width, height} = presets[selectedPreset];

    function updatePreset() {
        const p = presets[selectedPreset];
        width = p.width;
        height = p.height;
    }

    let sceneRef: any;

    // Helpers
    const clamp = (v: number, min: number, max: number) =>
        Math.min(max, Math.max(min, v));

    function nudgePos(axis: 'x' | 'y' | 'z', delta: number) {
        const range =
            axis === 'z'
                ? {min: -5, max: 5, step: 0.1}
                : {min: -2, max: 2, step: 0.1};
        const next = Number((pos[axis] + delta).toFixed(2));
        pos[axis] = clamp(next, range.min, range.max);
    }

    function nudgeRot(axis: 'x' | 'y' | 'z', delta: number) {
        const range = {min: -360, max: 360, step: 0.1};
        const next = Number((rot[axis] + delta).toFixed(2));
        rot[axis] = clamp(next, range.min, range.max);
    }

    function resetTransforms() {
        pos = {x: 0, y: 0, z: 0};
        rot = {x: 0, y: 0, z: 0};
    }

    function downloadImage() {
        const dataUrl = sceneRef?.captureImage?.();
        if (!dataUrl) return;
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = 'render.png';
        a.click();
    }

    async function downloadVideo() {
        const blob = await sceneRef?.recordVideo?.();
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = blob.type.includes('mp4') ? 'render.mp4' : 'render.webm';
        a.click();
        URL.revokeObjectURL(url);
    }
</script>

<div
        class="h-dvh min-h-0 grid grid-rows-[auto_1fr_auto] md:grid-rows-none
         md:grid-cols-[340px_1fr] bg-surface-950 text-surface-50"
>
    <!-- Sidebar header -->
    <header
            class="md:hidden px-4 py-3 border-b border-surface-700/40
           bg-surface-900/80 backdrop-blur"
    >
        <h1 class="text-base font-semibold">Scene Controls</h1>
    </header>

    <!-- Control Panel -->
    <aside
            class="hidden md:flex md:flex-col md:overflow-hidden bg-surface-900
           border-r border-surface-700/40"
    >
        <div
                class="px-4 py-3 border-b border-surface-700/40
             bg-surface-900/80 backdrop-blur"
        >
            <h2 class="text-sm font-semibold tracking-wide uppercase">
                Controls
            </h2>
        </div>

        <div class="flex-1 overflow-y-auto p-4 space-y-6">
            <!-- Transform card -->
            <section
                    class="rounded-xl border border-surface-700/40 bg-surface-800/40
               shadow-sm"
                    aria-label="Transform controls"
            >
                <div
                        class="flex items-center justify-between px-4 py-3
                 border-b border-surface-700/40"
                >
                    <h3 class="text-sm font-medium text-surface-200">
                        Transform
                    </h3>
                    <button
                            type="button"
                            class="inline-flex items-center gap-2 rounded-md
                   px-2.5 py-1.5 text-xs font-medium
                   text-surface-200 hover:text-surface-50
                   hover:bg-surface-700/30 focus-visible:outline-none
                   focus-visible:ring-2 focus-visible:ring-primary-400"
                            on:click={resetTransforms}
                            title="Reset position and rotation to defaults"
                    >
                        <svg
                                class="size-4"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                stroke-width="2"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                aria-hidden="true"
                        >
                            <path d="M21 12a9 9 0 1 1-3.16-6.84"/>
                            <path d="M21 3v9h-9"/>
                        </svg>
                        Reset
                    </button>
                </div>

                <div class="p-4 space-y-6">
                    <!-- Position -->
                    <fieldset class="space-y-3">
                        <legend class="text-xs font-semibold text-surface-400">
                            Position
                        </legend>

                        {#each ['x', 'y', 'z'] as axis (axis)}
                            <div class="grid grid-cols-[32px_1fr_82px_56px_56px] gap-3">
                                <label
                                        class="col-start-1 col-end-2 h-9 inline-flex items-center
                         justify-center rounded-md bg-surface-700/40
                         text-xs font-semibold uppercase text-surface-300"
                                        for={`pos-${axis}`}
                                >
                                    {axis}
                                </label>

                                <input
                                        id={`pos-${axis}`}
                                        class="col-start-2 col-end-3 h-2 self-center
                         accent-primary-500"
                                        type="range"
                                        min={axis === 'z' ? '-5' : '-2'}
                                        max={axis === 'z' ? '5' : '2'}
                                        step="0.1"
                                        bind:value={pos[axis]}
                                        aria-label={`Position ${axis.toUpperCase()}`}
                                />

                                <input
                                        class="col-start-3 col-end-4 h-9 w-full rounded-md
                         bg-surface-800/70 px-2.5 text-sm
                         ring-1 ring-surface-700
                         focus-visible:outline-none
                         focus-visible:ring-2 focus-visible:ring-primary-400"
                                        type="number"
                                        step="0.1"
                                        min={axis === 'z' ? '-5' : '-2'}
                                        max={axis === 'z' ? '5' : '2'}
                                        bind:value={pos[axis]}
                                        inputmode="decimal"
                                        aria-label={`Position ${axis.toUpperCase()} numeric`}
                                />

                                <button
                                        type="button"
                                        class="h-9 rounded-md bg-surface-700/40
                         text-surface-200 hover:bg-surface-700/60
                         focus-visible:outline-none
                         focus-visible:ring-2 focus-visible:ring-primary-400"
                                        on:click={() =>
                    nudgePos(axis as 'x' | 'y' | 'z', -(axis === 'z' ? 0.1 : 0.1))
                  }
                                        title="Decrement"
                                >
                                    −
                                </button>
                                <button
                                        type="button"
                                        class="h-9 rounded-md bg-surface-700/40
                         text-surface-200 hover:bg-surface-700/60
                         focus-visible:outline-none
                         focus-visible:ring-2 focus-visible:ring-primary-400"
                                        on:click={() =>
                    nudgePos(axis as 'x' | 'y' | 'z', axis === 'z' ? 0.1 : 0.1)
                  }
                                        title="Increment"
                                >
                                    +
                                </button>
                            </div>
                        {/each}
                    </fieldset>

                    <!-- Rotation -->
                    <fieldset class="space-y-3">
                        <legend class="text-xs font-semibold text-surface-400">
                            Rotation (deg)
                        </legend>

                        {#each ['x', 'y', 'z'] as axis (axis)}
                            <div class="grid grid-cols-[32px_1fr_82px_56px_56px] gap-3">
                                <label
                                        class="col-start-1 col-end-2 h-9 inline-flex items-center
                         justify-center rounded-md bg-surface-700/40
                         text-xs font-semibold uppercase text-surface-300"
                                        for={`rot-${axis}`}
                                >
                                    {axis}
                                </label>

                                <input
                                        id={`rot-${axis}`}
                                        class="col-start-2 col-end-3 h-2 self-center
                         accent-primary-500"
                                        type="range"
                                        min="-360"
                                        max="360"
                                        step="0.1"
                                        bind:value={rot[axis]}
                                        aria-label={`Rotation ${axis.toUpperCase()}`}
                                />

                                <input
                                        class="col-start-3 col-end-4 h-9 w-full rounded-md
                         bg-surface-800/70 px-2.5 text-sm
                         ring-1 ring-surface-700
                         focus-visible:outline-none
                         focus-visible:ring-2 focus-visible:ring-primary-400"
                                        type="number"
                                        step="0.1"
                                        min="-360"
                                        max="360"
                                        bind:value={rot[axis]}
                                        inputmode="decimal"
                                        aria-label={`Rotation ${axis.toUpperCase()} numeric`}
                                />

                                <button
                                        type="button"
                                        class="h-9 rounded-md bg-surface-700/40
                         text-surface-200 hover:bg-surface-700/60
                         focus-visible:outline-none
                         focus-visible:ring-2 focus-visible:ring-primary-400"
                                        on:click={() => nudgeRot(axis as 'x' | 'y' | 'z', -1)}
                                        title="−1°"
                                >
                                    −1°
                                </button>
                                <button
                                        type="button"
                                        class="h-9 rounded-md bg-surface-700/40
                         text-surface-200 hover:bg-surface-700/60
                         focus-visible:outline-none
                         focus-visible:ring-2 focus-visible:ring-primary-400"
                                        on:click={() => nudgeRot(axis as 'x' | 'y' | 'z', 1)}
                                        title="+1°"
                                >
                                    +1°
                                </button>
                            </div>
                        {/each}
                    </fieldset>
                </div>
            </section>

            <!-- Scene settings card -->
            <section
                    class="rounded-xl border border-surface-700/40 bg-surface-800/40
               shadow-sm"
                    aria-label="Scene settings"
            >
                <div
                        class="px-4 py-3 border-b border-surface-700/40
                 flex items-center justify-between"
                >
                    <h3 class="text-sm font-medium text-surface-200">
                        Scene
                    </h3>
                    <span
                            class="inline-flex items-center rounded-md bg-surface-700/40
                   px-2 py-1 text-xs text-surface-300"
                            aria-live="polite"
                    >
                        {width} × {height}
                    </span>
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
                                aria-label="Background color"
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
                                on:change={updatePreset}
                                aria-label="Resolution preset"
                        >
                            {#each Object.keys(presets) as key}
                                <option value={key}>{key}</option>
                            {/each}
                        </select>
                    </label>
                </div>
            </section>
        </div>

        <!-- Action bar -->
        <div
                class="p-4 border-t border-surface-700/40 bg-surface-900/80
             backdrop-blur"
        >
            <div class="grid grid-cols-2 gap-2">
                <button
                        type="button"
                        class="inline-flex items-center justify-center rounded-md
                 bg-primary-600 px-3 py-2 text-sm font-medium text-white
                 shadow-sm hover:bg-primary-500
                 focus-visible:outline-none
                 focus-visible:ring-2 focus-visible:ring-primary-400"
                        on:click={downloadImage}
                        title="Download PNG"
                >
                    <span aria-hidden="true">📸</span>
                    <span class="ml-2">Image</span>
                </button>
                <button
                        type="button"
                        class="inline-flex items-center justify-center rounded-md
                 bg-secondary-600 px-3 py-2 text-sm font-medium text-white
                 shadow-sm hover:bg-secondary-500
                 focus-visible:outline-none
                 focus-visible:ring-2 focus-visible:ring-secondary-400"
                        on:click={downloadVideo}
                        title="Download video"
                >
                    <span aria-hidden="true">🎥</span>
                    <span class="ml-2">Video</span>
                </button>
            </div>
        </div>
    </aside>

    <!-- Scene -->
    <main class="min-w-0 md:col-start-2 md:col-end-3">
        <ThreeScene
                bind:this={sceneRef}
                {pos}
                {rot}
                {background}
                {width}
                {height}
        />
    </main>

    <!-- Mobile actions (optional) -->
    <footer
            class="md:hidden p-3 border-t border-surface-700/40
           bg-surface-900/80 backdrop-blur"
    >
        <div class="grid grid-cols-2 gap-2">
            <button
                    type="button"
                    class="inline-flex items-center justify-center rounded-md
               bg-primary-600 px-3 py-2 text-sm font-medium text-white
               shadow-sm hover:bg-primary-500 focus-visible:outline-none
               focus-visible:ring-2 focus-visible:ring-primary-400"
                    on:click={downloadImage}
            >
                📸 Image
            </button>
            <button
                    type="button"
                    class="inline-flex items-center justify-center rounded-md
               bg-secondary-600 px-3 py-2 text-sm font-medium text-white
               shadow-sm hover:bg-secondary-500
               focus-visible:outline-none
               focus-visible:ring-2 focus-visible:ring-secondary-400"
                    on:click={downloadVideo}
            >
                🎥 Video
            </button>
        </div>
    </footer>
</div>