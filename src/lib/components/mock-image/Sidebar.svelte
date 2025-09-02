<script lang="ts">
    import TransformControls from './TransformControls.svelte';
    import SceneSettings from './SceneSettings.svelte';
    import ExportButtons from './ExportButtons.svelte';

    export let pos;
    export let rot;
    export let background;
    export let selectedPreset;
    export let presets;
    export let width;
    export let height;
    export let onReset;
    export let onPresetChange;
    export let onDownloadImage;
    export let onDownloadVideo;
</script>

<aside
        class="hidden md:flex md:flex-col md:overflow-hidden bg-surface-900
         border-r border-surface-700/40"
>
    <div
            class="px-4 py-3 border-b border-surface-700/40
           bg-surface-900/80 backdrop-blur"
    >
        <h2 class="text-sm font-semibold tracking-wide uppercase">Controls</h2>
    </div>

    <div class="flex-1 overflow-y-auto p-4 space-y-6">
        <TransformControls {pos} {rot} onReset={onReset}/>
        <SceneSettings
                {background}
                {selectedPreset}
                {presets}
                {width}
                {height}
                onPresetChange={onPresetChange}
        />
    </div>

    <div
            class="p-4 border-t border-surface-700/40 bg-surface-900/80
           backdrop-blur"
    >
        <ExportButtons
                onDownloadImage={onDownloadImage}
                onDownloadVideo={onDownloadVideo}
        />
    </div>
</aside>