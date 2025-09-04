<script lang="ts">
    import type {Track, Animation, Vec3} from "./Animation";
    import {createEventDispatcher} from "svelte";
    import {get} from "svelte/store";
    import {selectedAnimationKeyframe, selectedAnimationStore} from "../../stores/animation.svelte";
    import {transformControlPosition, transformControlRotation} from "../../stores/transform.svelte";
    import {playheadPosition} from "../../stores/playhead.svelte";

    let {track = $bindable(), startTime, endTime, pxPerSecond}:
        {
            track: Track,
            startTime: number,
            endTime: number,
            pxPerSecond: number
        } = $props();

    const dispatch = createEventDispatcher();

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

    function selectKeyframe(animation: Animation, keyframe: 0 | 1) {
        console.log("Select keyframe: ", animation, keyframe);
        selectedAnimationStore.set(animation);
        selectedAnimationKeyframe.set(animation.keyframes[keyframe]);

        playheadPosition.set(animation.keyframes[keyframe].time);
        transformControlPosition.subscribe((position: Vec3) => {
            if (animation.id !== get(selectedAnimationStore)?.id) {
                return;
            }
            if (animation.keyframes[keyframe].id !== get(selectedAnimationKeyframe)?.id) {
                return;
            }
            animation.keyframes[keyframe].position = position;
        });
        transformControlRotation.subscribe((rotation: Vec3) => {
            if (animation.id !== get(selectedAnimationStore)?.id) {
                return;
            }
            if (animation.keyframes[keyframe].id !== get(selectedAnimationKeyframe)?.id) {
                return;
            }
            animation.keyframes[keyframe].rotation = rotation;
        });
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
                class="absolute top-0 h-full flex items-stretch bg-primary-500/40 rounded-md"
                style={`left:${leftFor(anim.start)}px;width:${widthFor(anim)}px;`}
        >
            <!-- Left resize handle -->
            <div
                    role="button"
                    tabindex="0"
                    aria-label="Click and drag to extend"
                    class="w-2 cursor-ew-resize"
                    onmousedown={(e) => startDrag(e, anim, i, "resize-left")}
            ></div>

            <!-- Keyframe button (start) -->
            <button
                    class="w-6 h-full flex items-center justify-center"
                    aria-label="Set start keyframe"
                    title="Set start keyframe"
                    onclick={() => selectKeyframe(anim, 0)}
            >
                <span
                        class="w-4 h-4 rounded-full bg-primary-400 transition-opacity"
                        class:opacity-100={$selectedAnimationStore?.id === anim.id && $selectedAnimationKeyframe.id === anim.keyframes[0].id}
                        class:opacity-0={!($selectedAnimationStore?.id === anim.id && $selectedAnimationKeyframe.id === anim.keyframes[0].id)}
                ></span>
            </button>

            <!-- Middle draggable section -->
            <div
                    tabindex="0"
                    aria-label="Click and drag to move"
                    role="button"
                    class="flex-1 flex items-center justify-center cursor-grab active:cursor-grabbing select-none text-xs text-surface-100"
                    onmousedown={(e) => startDrag(e, anim, i, "move")}
            >
                <span class="truncate px-1">{anim.name}</span>
            </div>

            <!-- Keyframe button (end) -->
            <button
                    class="w-6 h-full flex items-center justify-center"
                    aria-label="Set end keyframe"
                    title="Set end keyframe"
                    onclick={() => selectKeyframe(anim, 1)}
            >
                <span
                        class="w-4 h-4 rounded-full bg-primary-400 transition-opacity"
                        class:opacity-100={$selectedAnimationStore?.id === anim.id && $selectedAnimationKeyframe.id === anim.keyframes[1].id}
                        class:opacity-0={!($selectedAnimationStore?.id === anim.id && $selectedAnimationKeyframe.id === anim.keyframes[1].id)}
                ></span>
            </button>

            <!-- Right resize handle -->
            <div
                    tabindex="0"
                    aria-label="Click and drag to extend"
                    role="button"
                    class="w-2 cursor-ew-resize"
                    onmousedown={(e) => startDrag(e, anim, i, "resize-right")}
            ></div>
        </div>
    {/each}
</div>
