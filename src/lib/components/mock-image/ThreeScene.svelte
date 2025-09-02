<script lang="ts">
    import {onMount} from "svelte";
    import * as THREE from "three";
    import {GLTFLoader} from "three/examples/jsm/loaders/GLTFLoader.js";

    import config from "../../models/iphone-1.model.json";

    export let pos = {x: 0, y: 0, z: 0};
    export let rot = {x: 0, y: 0, z: 0};
    export let background: string | number = "#000000";
    export let width: number = 1000;
    export let height: number = 1080;

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
        video.loop = true;
        video.muted = true;
        video.autoplay = true;
        video.playsInline = true;
        video.play();

        const videoTexture = new THREE.VideoTexture(video);
        videoTexture.encoding = THREE.sRGBEncoding;
        videoTexture.flipY = false;

        // Load model
        const loader = new GLTFLoader();
        loader.load(config.modelPath, (gltf) => {
            model = gltf.scene;

            const box = new THREE.Box3().setFromObject(model);
            const center = box.getCenter(new THREE.Vector3());
            console.log(center);
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

        // Animate
        function animate() {
            requestAnimationFrame(animate);
            if (model) {
                // ✅ Apply base + offset (degrees → radians)
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
            renderer.render(scene, camera);
        }

        animate();
        resizeCanvas();
        window.addEventListener("resize", resizeCanvas);
    });

    $: if (scene) {
        scene.background = new THREE.Color(background);
    }

    $: if (renderer && camera) {
        console.log(width, height);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
        resizeCanvas();
    }

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