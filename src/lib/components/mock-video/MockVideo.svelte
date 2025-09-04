<script lang="ts">
    import Sidebar from '$lib/components/mock-video/Sidebar.svelte';
    import Canvas from '$lib/components/mock-video/Canvas.svelte';
    import {zeroVec} from '$lib/components/mock-video/Animation';
    import Timeline from '$lib/components/mock-video/Timeline.svelte';
    import {transformControlPosition, transformControlRotation} from "../../stores/transform.svelte";

    type Axis = 'x' | 'y' | 'z';
    let background = '#111111';

    let selectedAnimation;
    let selectedKeyframe;

    const presets = {
        'Full HD (16:9)': {width: 1920, height: 1080},
        'Square (1:1)': {width: 1080, height: 1080},
        'TikTok (9:16)': {width: 1080, height: 1920},
        'Cinema 4K (21:9)': {width: 3840, height: 1646}
    } as const;

    type PresetKey = keyof typeof presets;
    let selectedPreset: PresetKey = 'Full HD (16:9)';
    let {width, height} = presets[selectedPreset];

    function updatePreset() {
        const p = presets[selectedPreset];
        width = p.width;
        height = p.height;
    }

    let sceneRef: any;

    function resetTransforms() {
        transformControlPosition.set(zeroVec());
        transformControlRotation.set(zeroVec());
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
        class="h-dvh min-h-0 flex flex-col bg-surface-950 text-surface-50"
>
    <div class="flex flex-row flex-1 min-w-0">
        <Sidebar
                {background}
                {selectedPreset}
                {presets}
                {width}
                {height}
                {selectedAnimation}
                {selectedKeyframe}
                onReset={resetTransforms}
                onPresetChange={updatePreset}
                onDownloadImage={downloadImage}
                onDownloadVideo={downloadVideo}
                class="w-[340px] flex-shrink-0"
        />

        <Canvas
                bind:sceneRef
                {background}
                {width}
                {height}
                class="flex-1"
        />

    </div>
    <Timeline class="h-48 border-t border-surface-700/40"/>
</div>

<style>
    @reference 'tailwindcss/theme';
</style>