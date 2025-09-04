<script lang="ts">
    import TransformControls from './TransformControls.svelte';
    import SceneSettings from './SceneSettings.svelte';
    import ExportButtons from './ExportButtons.svelte';
    import {cn} from '$lib/utils/cn.ts';

    const {
        background,
        selectedPreset,
        presets,
        width,
        height,
        onReset,
        onPresetChange,
        onDownloadImage,
        onDownloadVideo,
        class: className
    } = $props();
</script>

<aside
        class={cn(
    'hidden md:flex md:flex-col md:overflow-hidden bg-surface-900 border-r border-surface-700/40',
    className
  )}
        aria-label="Controls"
>
    <div class="px-4 py-3 border-b border-surface-700/40 bg-surface-900/80 backdrop-blur">
        <h2 class="text-sm font-semibold tracking-wide uppercase">Controls</h2>
    </div>

    <div class="flex-1 overflow-y-auto p-4 space-y-6">
        <TransformControls onReset={onReset}/>
        <SceneSettings
                {background}
                {selectedPreset}
                {presets}
                {width}
                {height}
                onPresetChange={onPresetChange}
        />
    </div>

    <div class="p-4 border-t border-surface-700/40 bg-surface-900/80 backdrop-blur">
        <ExportButtons
                onDownloadImage={onDownloadImage}
                onDownloadVideo={onDownloadVideo}
        />
    </div>
</aside>
