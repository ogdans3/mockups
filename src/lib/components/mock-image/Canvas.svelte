<script lang="ts">
    import ThreeScene from '$lib/components/ThreeScene.svelte';

    export let sceneRef: any;
    export let pos;
    export let rot;
    export let background;
    export let width;
    export let height;
</script>

<main
        class="min-w-0 md:col-start-2 md:col-end-3 p-4"
>
    <div
            class="w-full h-full rounded-lg overflow-hidden ring-1 ring-surface-700 bg-surface-950"
    >
        <ThreeScene
                bind:this={sceneRef}
                {pos}
                {rot}
                {background}
                {width}
                {height}
        />
    </div>
</main>