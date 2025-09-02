<script lang="ts">
    export let value = 0;
    export let min: number = Number.NEGATIVE_INFINITY;
    export let max: number = Number.POSITIVE_INFINITY;
    export let step = 0.1;
    export let precision = 2;
    export let pixelsPerStep = 8;
    export let label = '';
    export let units = '';
    export let disabled = false;
    export let wheel = true;
    export let id: string = `scrub-${Math.random().toString(36).slice(2)}`;

    let el: HTMLInputElement | null = null;
    let dragging = false;
    let startX = 0;
    let startVal = 0;

    $: minAttr = Number.isFinite(min) ? min : undefined;
    $: maxAttr = Number.isFinite(max) ? max : undefined;

    const clamp = (v: number) => {
        return Math.min(max, Math.max(min, v));
    };

    const roundTo = (v: number, p: number) => {
        const f = Math.pow(10, p);
        return Math.round(v * f) / f;
    };

    const snap = (v: number) => {
        if (!Number.isFinite(step) || step <= 0) {
            return v;
        }
        return Math.round(v / step) * step;
    };

    const setVal = (v: number) => {
        value = roundTo(clamp(v), precision);
    };

    function onPointerDown(e: PointerEvent) {
        if (disabled || e.button !== 0) {
            return;
        }

        dragging = true;
        startX = e.clientX;
        startVal = value ?? 0;

        (e.target as HTMLElement)?.setPointerCapture(e.pointerId);
        document.body.style.cursor = 'ew-resize';

        e.preventDefault();
    }

    function onPointerMove(e: PointerEvent) {
        if (!dragging) {
            return;
        }

        const dx = e.clientX - startX;

        let mult = 10;
        if (e.shiftKey) {
            mult = 1;
        } else if (e.altKey || e.ctrlKey) {
            mult = 0.1;
        }

        const delta = (dx / pixelsPerStep) * step * mult;
        setVal(snap(startVal + delta));
    }

    function endDrag(e: PointerEvent) {
        if (!dragging) {
            return;
        }

        dragging = false;

        try {
            (e.target as HTMLElement)?.releasePointerCapture(e.pointerId);
        } catch {
            // ignore
        }

        document.body.style.cursor = '';
    }

    function onKeyDown(e: KeyboardEvent) {
        if (disabled) {
            return;
        }

        let mult = 1;
        if (e.shiftKey) {
            mult = 10;
        } else if (e.altKey || e.ctrlKey) {
            mult = 0.1;
        }

        if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
            setVal(snap(value + step * mult));
            e.preventDefault();
        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
            setVal(snap(value - step * mult));
            e.preventDefault();
        } else if (e.key === 'PageUp') {
            setVal(snap(value + step * 10));
            e.preventDefault();
        } else if (e.key === 'PageDown') {
            setVal(snap(value - step * 10));
            e.preventDefault();
        } else if (e.key === 'Home' && Number.isFinite(min)) {
            setVal(min);
            e.preventDefault();
        } else if (e.key === 'End' && Number.isFinite(max)) {
            setVal(max);
            e.preventDefault();
        }
    }

    function onWheel(e: WheelEvent) {
        if (!wheel || disabled) {
            return;
        }

        e.preventDefault();

        const dir = Math.sign(e.deltaY);
        let mult = 1;

        if (e.shiftKey) {
            mult = 10;
        } else if (e.altKey || e.ctrlKey) {
            mult = 0.1;
        }

        setVal(snap(value - dir * step * mult));
    }

    function onInput(e: Event) {
        const t = e.target as HTMLInputElement;
        const v = t.valueAsNumber;

        if (Number.isFinite(v)) {
            value = v;
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
        aria-valuetext={`${value}${units ? ' ' + units : ''}`}
        aria-disabled={disabled}
>
    <!-- Editable input -->
    <div class="relative w-full">
        <input
                bind:this={el}
                id={id}
                class="w-full h-9 rounded-t-md bg-surface-800/70 px-2.5 pr-8
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
            {value}{units}
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