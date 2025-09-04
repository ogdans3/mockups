<script lang="ts">
    import type {Track, Animation} from "./Animation";

    let {track = $bindable(), currentTime, startTime, endTime, pxPerSecond} =
        $props();

    function leftFor(t: number) {
        return (t - startTime) * pxPerSecond;
    }

    function widthFor(a: Animation) {
        return Math.max(0, (a.end - a.start) * pxPerSecond);
    }

    type DragMode = "move" | "resize-left" | "resize-right";

    let draggingIndex: number | null = null;
    let dragMode: DragMode | null = null;
    let dragStartX = 0;
    let originalStart = 0;
    let originalEnd = 0;

    function startDrag(
        e: MouseEvent,
        anim: Animation,
        index: number,
        mode: DragMode
    ) {
        e.preventDefault();
        e.stopPropagation();
        draggingIndex = index;
        dragMode = mode;
        dragStartX = e.clientX;
        originalStart = anim.start;
        originalEnd = anim.end;

        window.addEventListener("mousemove", onDrag);
        window.addEventListener("mouseup", stopDrag);
    }

    function onDrag(e: MouseEvent) {
        if (draggingIndex === null || !dragMode) return;

        const deltaPx = e.clientX - dragStartX;
        const deltaSec = deltaPx / pxPerSecond;

        const anim = track.animations[draggingIndex];
        let newStart = originalStart;
        let newEnd = originalEnd;

        if (dragMode === "move") {
            const duration = originalEnd - originalStart;
            newStart = Math.max(
                startTime,
                Math.min(endTime - duration, originalStart + deltaSec)
            );
            newEnd = newStart + duration;
        } else if (dragMode === "resize-left") {
            newStart = Math.max(
                startTime,
                Math.min(originalEnd - 0.1, originalStart + deltaSec)
            );
        } else if (dragMode === "resize-right") {
            newEnd = Math.min(
                endTime,
                Math.max(originalStart + 0.1, originalEnd + deltaSec)
            );
        }

        const updated = {...anim, start: newStart, end: newEnd};
        track.animations = track.animations.map((a, i) =>
            i === draggingIndex ? updated : a
        );
    }

    function stopDrag() {
        draggingIndex = null;
        dragMode = null;
        window.removeEventListener("mousemove", onDrag);
        window.removeEventListener("mouseup", stopDrag);
    }
</script>

<div
        class="relative h-10
         bg-surface-800/60
         hover:bg-surface-700/60
         border border-surface-600/40
         rounded-md
         shadow-sm
         transition-colors"
>
    {#each track.animations as anim, i (anim.id)}
        <div
                class="absolute top-0 h-full flex"
                style={`left:${leftFor(anim.start)}px;width:${widthFor(anim)}px;`}
        >
            <!-- Left resize handle -->
            <button class="h-full w-2 cursor-ew-resize bg-primary-500/40 rounded-l-sm"
                 onmousedown={(e) => startDrag(e, anim, i, "resize-left")}
            ></button>

            <!-- Middle draggable section -->
            <button class="flex-1 flex items-center justify-center
               bg-primary-500/30 hover:bg-primary-500/40
               border-t border-b border-primary-500/60
               cursor-grab active:cursor-grabbing select-none text-xs text-surface-100"
                 onmousedown={(e) => startDrag(e, anim, i, "move")}
            >
                <span class="truncate px-1">{anim.name}</span>
            </button>

            <!-- Right resize handle -->
            <button class="h-full w-2 cursor-ew-resize bg-primary-500/40 rounded-r-sm"
                 onmousedown={(e) => startDrag(e, anim, i, "resize-right")}
            ></button>
        </div>
    {/each}
</div>