<script lang="ts">
    import type {Track, Animation} from './Animation';

    export let track: Track;
    export let currentTime: number;
    export let startTime: number = 0;
    export let endTime: number;
    //export let pxPerSecond: number; // injected from Timeline for exact alignment

    let pxPerSecond = 10;

    function leftFor(t: number) {
        return (t - startTime) * pxPerSecond;
    }

    function widthFor(a: Animation) {
        return Math.max(0, (a.end - a.start) * pxPerSecond);
    }
</script>

<div class="relative h-10 bg-surface-900/60 border-b border-surface-700/30">
    <!-- Clips -->
    {#each track.animations as anim (anim.id)}
        <div
                class="absolute top-0 h-full bg-primary-500/30 hover:bg-primary-500/40 border border-primary-500/60 rounded-sm px-2 flex items-center text-xs text-surface-100"
                style={`left:${leftFor(anim.start)}px;width:${widthFor(anim)}px;`}
                title={`${anim.name}: ${anim.start.toFixed(2)}s → ${anim.end.toFixed(2)}s`}
        >
            <span class="truncate">🎬 {anim.name}</span>
        </div>
    {/each}
</div>