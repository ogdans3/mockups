<script lang="ts">
    import {onMount} from "svelte";
    import * as THREE from "three";
    import {GLTFLoader} from "three/examples/jsm/loaders/GLTFLoader.js";
    import {playheadPosition} from "$lib/stores/playhead.svelte";
    import {videoController} from "$lib/stores/video.svelte";
    import type {Track, Animation, Vec3} from "$lib/components/mock-video/Animation";
    import {lerp, lerpVec3} from "$lib/utils/curves";
    import {zeroVec} from "$lib/components/mock-video/Animation";
    import {get} from "svelte/store";
    import {tracks} from "$lib/stores/tracks.svelte";
    import {currentPlayheadTime} from "$lib/stores/video.svelte";
    import {transformControlPosition, transformControlRotation} from "$lib/stores/transform.svelte";

    import config from "../../models/iphone-1.model.json";


    const {
        pos = zeroVec(),
        rot = zeroVec(),
        background = "#000000",
        width = 1000,
        height = 1080,
    } = $props();
    const basePos = config.defaultPosition || {x: 0, y: 0, z: 0};
    const baseRot = config.defaultRotation || {x: 0, y: 0, z: 0};

    let container: HTMLDivElement;
    let model: THREE.Object3D | null = null;

    // Helpers
    const deg2rad = (d: number) => (d * Math.PI) / 180;
    let scene, renderer, camera;
    let mediaRecorder: MediaRecorder | null = null;
    let recordedChunks: Blob[] = [];
    let video;

    onMount(() => {
        scene = new THREE.Scene();
        scene.background = new THREE.Color(background);

        camera = new THREE.PerspectiveCamera(
            45,
            width / height,
            0.1,
            100
        );
        camera.position.set(0, 0, 3);
        camera.lookAt(0, 0, 0);

        renderer = new THREE.WebGLRenderer({antialias: true});
        renderer.setSize(width, height);
        renderer.outputEncoding = THREE.sRGBEncoding;
        renderer.toneMapping = THREE.NoToneMapping;
        container.appendChild(renderer.domElement);

        const light = new THREE.DirectionalLight(0xffffff, 1);
        light.position.set(5, 5, 5);
        scene.add(light);

        // Video texture
        video = document.createElement("video");
        video.src = "/iphone-recording.mov"; // must be in static/
        get(videoController).setVideo(video);

        const videoTexture = new THREE.VideoTexture(video);
        videoTexture.encoding = THREE.sRGBEncoding;
        videoTexture.flipY = false;

        // Load model
        const loader = new GLTFLoader();
        loader.load(config.modelPath, (gltf) => {
            model = gltf.scene;

            const box = new THREE.Box3().setFromObject(model);
            const center = box.getCenter(new THREE.Vector3());
            model.position.sub(center);
            scene.add(model);

            scene.add(model);

            model.traverse((child: any) => {
                if (child.isMesh) {
                    for (const layer of config.layers || []) {
                        if (child.name.toLowerCase().includes(layer.match.toLowerCase())) {
                            if (layer.material === "video") {
                                child.material = new THREE.MeshBasicMaterial({
                                    map: videoTexture,
                                    toneMapped: false
                                });
                                videoTexture.colorSpace = THREE.SRGBColorSpace;
                            }
                        }
                    }
                }
            });
        });

        // Resize
        window.addEventListener("resize", () => {
            camera.aspect = container.clientWidth / container.clientHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(container.clientWidth, container.clientHeight);
        });

        animate();
        resizeCanvas();
        window.addEventListener("resize", resizeCanvas);
    });

    function animate() {
        if (model) {
            if (get(videoController).isPlaying) {
                // ✅ Playing → use keyframes
                const time = $currentPlayheadTime;
                const {pos, rot} = getInterpolatedTransform(time);

                model.position.set(
                    basePos.x + pos.x,
                    basePos.y + pos.y,
                    basePos.z + pos.z
                );
                model.rotation.set(
                    deg2rad(baseRot.x + rot.x),
                    deg2rad(baseRot.y + rot.y),
                    deg2rad(baseRot.z + rot.z)
                );

                // ✅ Keep transform controls in sync with lerped values
                transformControlPosition.set(pos);
                transformControlRotation.set(rot);
            } else {
                // ✅ Paused → use transform controls directly
                const pos = get(transformControlPosition);
                const rot = get(transformControlRotation);

                model.position.set(
                    basePos.x + pos.x,
                    basePos.y + pos.y,
                    basePos.z + pos.z
                );
                model.rotation.set(
                    deg2rad(baseRot.x + rot.x),
                    deg2rad(baseRot.y + rot.y),
                    deg2rad(baseRot.z + rot.z)
                );
            }
        }

        renderer.render(scene, camera);
        requestAnimationFrame(animate);
    }

    function getInterpolatedTransform(time: number): { pos: Vec3; rot: Vec3 } {
        const track = tracks[0];
        if (!track) return {pos: zeroVec(), rot: zeroVec()};

        // Find the animation that covers this time OR the closest one
        const anim = track.animations.find(a => time >= a.start && time <= a.end);

        // If no active animation, check if we are before the first or after the last
        if (!anim) {
            const firstAnim = track.animations[0];
            const lastAnim = track.animations[track.animations.length - 1];

            if (time < firstAnim.start) {
                // Before everything → clamp to first keyframe of first animation
                const kf = firstAnim.keyframes[0];
                return {pos: kf.position, rot: kf.rotation};
            }

            if (time > lastAnim.end) {
                // After everything → clamp to last keyframe of last animation
                const kf = lastAnim.keyframes[lastAnim.keyframes.length - 1];
                return {pos: kf.position, rot: kf.rotation};
            }

            // Between animations but not inside → hold last keyframe of the previous anim
            const prevAnim = [...track.animations].reverse().find(a => time > a.end);
            if (prevAnim) {
                const kf = prevAnim.keyframes[prevAnim.keyframes.length - 1];
                return {pos: kf.position, rot: kf.rotation};
            }

            return {pos: zeroVec(), rot: zeroVec()};
        }

        // We are inside an animation
        const localTime = time - anim.start;
        const firstKf = anim.keyframes[0];
        const lastKf = anim.keyframes[anim.keyframes.length - 1];

        // Before first keyframe → clamp
        if (localTime <= firstKf.time) {
            return {pos: firstKf.position, rot: firstKf.rotation};
        }

        // After last keyframe → clamp
        if (localTime >= lastKf.time) {
            return {pos: lastKf.position, rot: lastKf.rotation};
        }

        // Otherwise interpolate
        let prev = firstKf;
        let next = lastKf;

        for (let i = 0; i < anim.keyframes.length - 1; i++) {
            const kf1 = anim.keyframes[i];
            const kf2 = anim.keyframes[i + 1];
            if (localTime >= kf1.time && localTime <= kf2.time) {
                prev = kf1;
                next = kf2;
                break;
            }
        }

        const span = next.time - prev.time;
        const t = span > 0 ? (localTime - prev.time) / span : 0;

        return {
            pos: lerpVec3(prev.position, next.position, t),
            rot: lerpVec3(prev.rotation, next.rotation, t),
        };
    }

    $effect(() => {
        if (scene) {
            scene.background = new THREE.Color(background);
        }
    });

    $effect(() => {
        if (renderer && camera) {
            camera.aspect = width / height;
            camera.updateProjectionMatrix();
            renderer.setSize(width, height);
            resizeCanvas();
        }
    });

    function resizeCanvas() {
        if (!renderer || !container) return;

        const canvas = renderer.domElement;
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;

        const scale = Math.min(
            (containerWidth - 100) / width,
            (containerHeight - 100) / height
        );

        canvas.style.width = width * scale + "px";
        canvas.style.height = height * scale + "px";
    }

    export function captureImage(): string {
        if (!renderer) return "";
        // Force render at full resolution
        renderer.setSize(width, height, false);
        renderer.render(scene, camera);
        return renderer.domElement.toDataURL("image/png");
    }

    export function recordVideo(): Promise<Blob> {
        console.log("Record video");
        return new Promise((resolve) => {
            if (!renderer) return resolve(new Blob());

            // Pick best mime type
            let mimeType = "video/mp4";
            if (!MediaRecorder.isTypeSupported(mimeType)) {
                mimeType = "video/webm; codecs=vp9";
            }
            console.log(mimeType);

            const stream = renderer.domElement.captureStream(30); // 30fps
            mediaRecorder = new MediaRecorder(stream, {mimeType});
            recordedChunks = [];

            mediaRecorder.ondataavailable = (e) => {
                console.log("Data received");
                if (e.data.size > 0) recordedChunks.push(e.data);
            };

            mediaRecorder.onstop = () => {
                console.log("Stop");
                const blob = new Blob(recordedChunks, {type: mimeType});
                resolve(blob);
            };

            // ✅ Restart video and start recording
            video.currentTime = 0;
            video.play();
            mediaRecorder.start();

            // ✅ Stop recording when video ends
            video.onended = () => {
                console.log("Video ended");
                mediaRecorder.stop();
            };
        });
    }
</script>

<div
        class="canvas-container rounded-lg overflow-hidden"
        bind:this={container}
></div>

<style>
    .canvas-container {
        display: flex;
        justify-content: center;
        align-items: center;
        background: pink;
        width: 100%;
        height: 100%;
        cursor: grab;
    }

    .canvas-container:active {
        cursor: grabbing;
    }

    :global(.canvas-container canvas) {
        border-radius: inherit;
        display: block;
    }
</style>