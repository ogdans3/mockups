<script lang="ts">
    import ThreeScene from '$lib/components/ThreeScene.svelte';
    import {
        transformControlPosition,
        transformControlRotation
    } from "$lib/stores/transform.svelte";

    let {sceneRef, background, width, height} = $props();
</script>

<main class="min-w-0 md:col-start-2 md:col-end-3 p-4">
    <div
            class="w-full h-full rounded-lg overflow-hidden ring-1 ring-surface-700 bg-surface-950"
    >
        <ThreeScene
                bind:this={sceneRef}
                pos={$transformControlPosition}
                rot={$transformControlRotation}
                {background}
                {width}
                {height}
        />
    </div>
</main>
