<script lang="ts">
    import {getAnimation} from "./Animation";
    import type {Track, Animation, Keyframe, Vec3} from "./Animation";
    import {createEventDispatcher} from "svelte";
    import {get} from "svelte/store";
    import {selectedAnimationKeyframe, selectedAnimationStore} from "../../stores/animation.svelte";
    import {transformControlPosition, transformControlRotation} from "../../stores/transform.svelte";
    import {videoController} from "../../stores/video.svelte";

    //TODO: Refactor this uglyness

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
    let originalKeyframes: Keyframe[] = [];

    function startDrag(
        e: MouseEvent,
        animationId: string,
        index: number,
        mode: DragMode
    ) {
        e.preventDefault();
        e.stopPropagation();
        const animation = getAnimation(track, animationId);
        draggingIndex = index;
        dragMode = mode;
        dragStartX = e.clientX;
        originalStart = animation.start;
        originalEnd = animation.end;
        originalKeyframes = animation.keyframes.map(kf => ({...kf}));

        window.addEventListener("mousemove", onDrag);
        window.addEventListener("mouseup", stopDrag);
    }

    function onDrag(e: MouseEvent) {
        e.preventDefault();
        e.stopPropagation();
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

    function stopDrag(e: MouseEvent) {
        e.preventDefault();
        e.stopPropagation();
        if (draggingIndex === null) return;

        const anim = track.animations[draggingIndex];
        const oldDuration = originalEnd - originalStart;
        const newDuration = anim.end - anim.start;

        anim.keyframes = originalKeyframes.map((kf) => {
            // absolute time before drag
            const absTime = originalStart + kf.time;

            // if duration changed, scale relative position
            let newTime: number;
            if (oldDuration > 0) {
                const rel = (absTime - originalStart) / oldDuration; // 0..1
                newTime = rel * newDuration;
            } else {
                newTime = 0;
            }

            return {...kf, time: newTime};
        });

        draggingIndex = null;
        dragMode = null;

        window.removeEventListener("mousemove", onDrag);
        window.removeEventListener("mouseup", stopDrag);
    }

    function toggleKeyframe(e: MouseEvent, animationId: string, keyframeIndex: 0 | 1) {
        e.preventDefault();
        e.stopPropagation();
        const animation = getAnimation(track, animationId);
        const keyframe = animation.keyframes[keyframeIndex];
        if (get(selectedAnimationStore)?.id === animation.id && get(selectedAnimationKeyframe)?.id === keyframe.id) {
            selectedAnimationStore.set(null);
            selectedAnimationKeyframe.set(null);
            return;
        }
        selectedAnimationStore.set(animation);
        selectedAnimationKeyframe.set(keyframe);

        transformControlPosition.set(keyframe.position);
        transformControlRotation.set(keyframe.rotation);

        get(videoController).setPlayheadPosition(animation.start + keyframe.time);
        transformControlPosition.subscribe((position: Vec3) => {
            if (animation.id !== get(selectedAnimationStore)?.id) {
                return;
            }
            if (keyframe.id !== get(selectedAnimationKeyframe)?.id) {
                return;
            }
            keyframe.position = position;
        });
        transformControlRotation.subscribe((rotation: Vec3) => {
            if (animation.id !== get(selectedAnimationStore)?.id) {
                return;
            }
            if (keyframe.id !== get(selectedAnimationKeyframe)?.id) {
                return;
            }
            keyframe.rotation = rotation;
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
                    onmousedown={(e) => startDrag(e, anim.id, i, "resize-left")}
            ></div>

            <!-- Keyframe button (start) -->
            <button
                    class="w-6 h-full flex items-center justify-center"
                    aria-label="Set start keyframe"
                    title="Set start keyframe"
                    onclick={(e) => toggleKeyframe(e, anim.id, 0)}
            >
                <span
                        class="w-4 h-4 rounded-full transition-colors"
                        class:bg-white={$selectedAnimationStore?.id === anim.id && $selectedAnimationKeyframe.id === anim.keyframes[0].id}
                        class:bg-surface-400={!($selectedAnimationStore?.id === anim.id && $selectedAnimationKeyframe.id === anim.keyframes[0].id)}
                ></span>
            </button>

            <!-- Middle draggable section -->
            <div
                    tabindex="0"
                    aria-label="Click and drag to move"
                    role="button"
                    class="flex-1 flex items-center justify-center cursor-grab active:cursor-grabbing select-none text-xs text-surface-100"
                    onmousedown={(e) => startDrag(e, anim.id, i, "move")}
            >
                <span class="truncate px-1">{anim.name}</span>
            </div>

            <!-- Keyframe button (end) -->
            <button
                    class="w-6 h-full flex items-center justify-center"
                    aria-label="Set end keyframe"
                    title="Set end keyframe"
                    onclick={(e) => toggleKeyframe(e, anim.id, 1)}
            >
                <span
                        class="w-4 h-4 rounded-full transition-colors"
                        class:bg-white={$selectedAnimationStore?.id === anim.id && $selectedAnimationKeyframe.id === anim.keyframes[1].id}
                        class:bg-surface-400={!($selectedAnimationStore?.id === anim.id && $selectedAnimationKeyframe.id === anim.keyframes[1].id)}
                ></span>
            </button>

            <!-- Right resize handle -->
            <div
                    tabindex="0"
                    aria-label="Click and drag to extend"
                    role="button"
                    class="w-2 cursor-ew-resize"
                    onmousedown={(e) => startDrag(e, anim.id, i, "resize-right")}
            ></div>
        </div>
    {/each}
</div>