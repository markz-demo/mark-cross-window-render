import * as THREE from './three/three.module.js';

export const init = () => {
    const { innerWidth, innerHeight, devicePixelRatio } = window;

    // 摄像机
    const perspective = 800;
    const fov = (180 * (2 * Math.atan(window.innerHeight / 2 / perspective))) / Math.PI;
    const camera = new THREE.PerspectiveCamera(fov, window.innerWidth / window.innerHeight, 1, 1000);
    camera.position.set(0, 0, perspective);

    // 场景
    const scene = new THREE.Scene();

    // 渲染器
    const renderer = new THREE.WebGLRenderer();
    renderer.setPixelRatio(devicePixelRatio);
    renderer.setSize(innerWidth, innerHeight);
    document.body.appendChild(renderer.domElement);

    // const geometry = new THREE.BoxGeometry(100, 100, 100);
    // const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    // const cube = new THREE.Mesh(geometry, material);
    // scene.add(cube);

    return { camera, renderer, scene };
}

export const resize = (camera, renderer) => {
    const { innerWidth, innerHeight, devicePixelRatio } = window;
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(devicePixelRatio);
    renderer.setSize(innerWidth, innerHeight);
}