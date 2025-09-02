<script lang="ts">
    export let onDownloadImage: () => void;
    export let onDownloadVideo: () => void;
</script>

<div class="grid grid-cols-2 gap-2">
    <button
            type="button"
            class="inline-flex items-center justify-center rounded-md
           bg-primary-600 px-3 py-2 text-sm font-medium text-white
           shadow-sm hover:bg-primary-500
           focus-visible:outline-none
           focus-visible:ring-2 focus-visible:ring-primary-400"
            on:click={onDownloadImage}
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
            on:click={onDownloadVideo}
    >
        🎥 Video
    </button>
</div>