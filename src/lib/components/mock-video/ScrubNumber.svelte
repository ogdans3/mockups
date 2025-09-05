<script lang="ts">
    import {videoController} from "$lib/stores/video.svelte";
    import {get} from "svelte/store";

    let {
        value = $bindable(0),   // ✅ bindable prop
        min = Number.NEGATIVE_INFINITY,
        max = Number.POSITIVE_INFINITY,
        step = 0.1,
        precision = 2,
        pixelsPerStep = 8,
        label = "",
        units = "",
        disabled = false,
        wheel = true,
        id = `scrub-${Math.random().toString(36).slice(2)}`
    } = $props();

    let dragging = $state(false);
    let startX = $state(0);
    let startVal = $state(0);
    let el: HTMLInputElement | null = null;

    const minAttr = $derived(Number.isFinite(min) ? min : undefined);
    const maxAttr = $derived(Number.isFinite(max) ? max : undefined);

    const clamp = (v: number) => Math.min(max, Math.max(min, v));
    const roundTo = (v: number, p: number) => {
        const f = Math.pow(10, p);
        return Math.round(v * f) / f;
    };
    const snap = (v: number) => {
        if (!Number.isFinite(step) || step <= 0) return v;
        return Math.round(v / step) * step;
    };

    function setVal(v: number) {
        value = roundTo(clamp(v), precision);
    }

    // ✅ Always enforce fixed decimals in the input field
    $effect(() => {
        if (el) {
            el.value = value.toFixed(precision);
        }
    });

    function onPointerDown(e: PointerEvent) {
        if (disabled || e.button !== 0) return;

        // Pause video when editing
        get(videoController).pause();

        dragging = true;
        startX = e.clientX;
        startVal = value ?? 0;

        (e.target as HTMLElement)?.setPointerCapture(e.pointerId);
        document.body.style.cursor = "ew-resize";
        e.preventDefault();
    }

    function onPointerMove(e: PointerEvent) {
        if (!dragging) return;

        const dx = e.clientX - startX;
        let mult = 10;
        if (e.shiftKey) mult = 1;
        else if (e.altKey || e.ctrlKey) mult = 0.1;

        const delta = (dx / pixelsPerStep) * step * mult;
        setVal(snap(startVal + delta));
    }

    function endDrag(e: PointerEvent) {
        if (!dragging) return;
        dragging = false;

        try {
            (e.target as HTMLElement)?.releasePointerCapture(e.pointerId);
        } catch {
        }
        document.body.style.cursor = "";
    }

    function onKeyDown(e: KeyboardEvent) {
        if (disabled) return;

        let mult = 1;
        if (e.shiftKey) mult = 10;
        else if (e.altKey || e.ctrlKey) mult = 0.1;

        if (e.key === "ArrowRight" || e.key === "ArrowUp") {
            setVal(snap(value + step * mult));
            e.preventDefault();
        } else if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
            setVal(snap(value - step * mult));
            e.preventDefault();
        } else if (e.key === "PageUp") {
            setVal(snap(value + step * 10));
            e.preventDefault();
        } else if (e.key === "PageDown") {
            setVal(snap(value - step * 10));
            e.preventDefault();
        } else if (e.key === "Home" && Number.isFinite(min)) {
            setVal(min);
            e.preventDefault();
        } else if (e.key === "End" && Number.isFinite(max)) {
            setVal(max);
            e.preventDefault();
        }
    }

    function onWheel(e: WheelEvent) {
        if (!wheel || disabled) return;
        e.preventDefault();

        const dir = Math.sign(e.deltaY);
        let mult = 1;
        if (e.shiftKey) mult = 10;
        else if (e.altKey || e.ctrlKey) mult = 0.1;

        setVal(snap(value - dir * step * mult));
    }

    function onInput(e: Event) {
        // Pause video when typing
        get(videoController).pause();

        const t = e.target as HTMLInputElement;
        const v = t.valueAsNumber;
        if (Number.isFinite(v)) {
            setVal(v);
        }
    }

    function onBlur() {
        setVal(snap(value));
    }
</script>

<div
        class="relative select-none touch-none flex flex-col items-center gap-1 w-full"
        on:wheel|passive={false}
        aria-label={label}
        role="spinbutton"
        aria-valuemin={minAttr}
        aria-valuemax={maxAttr}
        aria-valuenow={value}
        aria-valuetext={`${value.toFixed(precision)}${units ? " " + units : ""}`}
        aria-disabled={disabled}
>
    <!-- Editable input -->
    <div class="relative w-full">
        <input
                bind:this={el}
                id={id}
                class="w-full h-9 rounded-t-md bg-surface-800/70 pl-2.5
           {units ? 'pr-5' : 'pr-2.5'}
           text-sm tabular-nums text-right
           ring-1 ring-surface-700
           focus-visible:outline-none
           focus-visible:ring-2 focus-visible:ring-primary-400
           disabled:opacity-50 disabled:cursor-not-allowed
           [caret-color:theme(colors.primary.400)]
           transition-colors duration-150"
                type="number"
                {minAttr}
                {maxAttr}
                step={step}
                bind:value
                {disabled}
                on:input={onInput}
                on:blur={onBlur}
                on:keydown={onKeyDown}
        />

        {#if units}
            <span
                    class="pointer-events-none absolute inset-y-0 right-2.5 inline-flex
                       items-center text-xs text-surface-400"
                    aria-hidden="true"
            >
                {units}
            </span>
        {/if}
    </div>

    <!-- Draggable label below input -->
    {#if label}
        <div
                class="w-full h-6 flex items-center justify-center
                   rounded-b-md bg-surface-700/40 text-xs font-semibold
                   uppercase text-surface-300 cursor-ew-resize select-none
                   hover:bg-surface-600/40 active:bg-surface-500/40 transition-colors"
                on:pointerdown={onPointerDown}
                on:pointermove={onPointerMove}
                on:pointerup={endDrag}
                on:pointercancel={endDrag}
                title={`${label} — drag left/right`}
        >
            {label}
        </div>
    {/if}

    {#if dragging}
        <div
                class="absolute -top-8 right-2.5 px-2 py-1 rounded bg-surface-900 text-xs text-white shadow"
        >
            {value.toFixed(precision)}{units}
        </div>
    {/if}
</div>

<style>
    @reference 'tailwindcss/theme';

    /* Remove number input spinners */
    input[type="number"]::-webkit-inner-spin-button,
    input[type="number"]::-webkit-outer-spin-button {
        -webkit-appearance: none;
        margin: 0;
    }

    input[type="number"] {
        -moz-appearance: textfield;
    }
</style>