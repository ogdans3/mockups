<script lang="ts">
    import Sidebar from '$lib/components/mock-video/Sidebar.svelte';
    import Canvas from '$lib/components/mock-video/Canvas.svelte';

    type Axis = 'x' | 'y' | 'z';
    let pos: Record<Axis, number> = {x: 0, y: 0, z: 0};
    let rot: Record<Axis, number> = {x: 0, y: 0, z: 0};
    let background = '#111111';

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
    <Sidebar
            {pos}
            {rot}
            {background}
            {selectedPreset}
            {presets}
            {width}
            {height}
            onReset={resetTransforms}
            onPresetChange={updatePreset}
            onDownloadImage={downloadImage}
            onDownloadVideo={downloadVideo}
    />

    <Canvas
            bind:sceneRef
            {pos}
            {rot}
            {background}
            {width}
            {height}
    />
</div>

<style>
    @reference 'tailwindcss/theme';
</style>