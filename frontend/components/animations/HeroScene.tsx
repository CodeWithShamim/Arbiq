"use client";
import { useEffect, useRef } from "react";
import * as THREE from "three";

const PARTICLE_COUNT = 800;
const CONNECTION_DIST = 120;

export default function HeroScene() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const W = mount.clientWidth;
    const H = mount.clientHeight;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);

    // Scene + Camera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, W / H, 0.1, 2000);
    camera.position.set(0, 0, 400);

    // Mouse tracking
    const mouse = new THREE.Vector2();
    const onMouseMove = (e: MouseEvent) => {
      mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener("mousemove", onMouseMove);

    // ── A. PARTICLE NETWORK ─────────────────────────────
    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const velocities: THREE.Vector3[] = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      positions[i * 3]     = (Math.random() - 0.5) * 800;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 600;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 400;
      velocities.push(new THREE.Vector3(
        (Math.random() - 0.5) * 0.15,
        (Math.random() - 0.5) * 0.15,
        (Math.random() - 0.5) * 0.1
      ));
    }

    const ptGeo = new THREE.BufferGeometry();
    ptGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const ptMat = new THREE.PointsMaterial({ color: 0x00f0ff, size: 2, transparent: true, opacity: 0.6, sizeAttenuation: true });
    const points = new THREE.Points(ptGeo, ptMat);
    scene.add(points);

    // Line segments for connections (pre-allocated pool)
    const linePositions = new Float32Array(PARTICLE_COUNT * PARTICLE_COUNT * 6);
    const lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute("position", new THREE.BufferAttribute(linePositions, 3));
    const lineMat = new THREE.LineBasicMaterial({ color: 0x00f0ff, transparent: true, opacity: 0.12 });
    const lines = new THREE.LineSegments(lineGeo, lineMat);
    scene.add(lines);

    // ── B. WIREFRAME ICOSAHEDRON ────────────────────────
    const icoGeo = new THREE.IcosahedronGeometry(80, 1);
    const edges = new THREE.EdgesGeometry(icoGeo);
    const icoMat = new THREE.LineBasicMaterial({ color: 0x00f0ff, transparent: true, opacity: 0.8 });
    const ico = new THREE.LineSegments(edges, icoMat);
    ico.position.set(200, 0, -100);
    scene.add(ico);

    // ── C. GRID FLOOR ───────────────────────────────────
    const gridHelper = new THREE.GridHelper(2000, 40, 0x00f0ff, 0x003344);
    gridHelper.position.y = -200;
    (gridHelper.material as THREE.LineBasicMaterial).opacity = 0.35;
    (gridHelper.material as THREE.LineBasicMaterial).transparent = true;
    scene.add(gridHelper);

    // ── D. GLITCH PLANES ────────────────────────────────
    const planes: { mesh: THREE.Mesh; baseX: number; glitchTimer: number; glitchInterval: number }[] = [];
    for (let i = 0; i < 5; i++) {
      const pg = new THREE.PlaneGeometry(80 + Math.random() * 60, 4 + Math.random() * 6);
      const pm = new THREE.MeshBasicMaterial({ color: 0x00f0ff, transparent: true, opacity: 0.08 + Math.random() * 0.1, side: THREE.DoubleSide });
      const plane = new THREE.Mesh(pg, pm);
      plane.position.set((Math.random() - 0.5) * 600, (Math.random() - 0.5) * 300, (Math.random() - 0.5) * 200);
      plane.rotation.z = (Math.random() - 0.5) * 0.3;
      scene.add(plane);
      planes.push({ mesh: plane, baseX: plane.position.x, glitchTimer: 0, glitchInterval: 3000 + Math.random() * 5000 });
    }

    let time = 0;
    let lastGlitch = 0;

    const animate = () => {
      raf = requestAnimationFrame(animate);
      time += 0.008;

      // Parallax on scene
      scene.rotation.y = mouse.x * 0.05;
      scene.rotation.x = -mouse.y * 0.03;

      // Animate particles
      const pos = ptGeo.attributes.position.array as Float32Array;
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        pos[i * 3]     += velocities[i].x;
        pos[i * 3 + 1] += velocities[i].y;
        pos[i * 3 + 2] += velocities[i].z;
        // Wrap
        if (Math.abs(pos[i * 3]) > 400) velocities[i].x *= -1;
        if (Math.abs(pos[i * 3 + 1]) > 300) velocities[i].y *= -1;
        if (Math.abs(pos[i * 3 + 2]) > 200) velocities[i].z *= -1;
      }
      ptGeo.attributes.position.needsUpdate = true;

      // Connection lines (sample N^2 pairs — limit for perf)
      let lineIdx = 0;
      const SAMPLE = Math.min(PARTICLE_COUNT, 200);
      for (let i = 0; i < SAMPLE; i++) {
        for (let j = i + 1; j < SAMPLE; j++) {
          const dx = pos[i * 3] - pos[j * 3];
          const dy = pos[i * 3 + 1] - pos[j * 3 + 1];
          const dz = pos[i * 3 + 2] - pos[j * 3 + 2];
          const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
          if (dist < CONNECTION_DIST && lineIdx + 6 <= linePositions.length) {
            linePositions[lineIdx++] = pos[i * 3];
            linePositions[lineIdx++] = pos[i * 3 + 1];
            linePositions[lineIdx++] = pos[i * 3 + 2];
            linePositions[lineIdx++] = pos[j * 3];
            linePositions[lineIdx++] = pos[j * 3 + 1];
            linePositions[lineIdx++] = pos[j * 3 + 2];
          }
        }
      }
      lineGeo.attributes.position.needsUpdate = true;
      lineGeo.setDrawRange(0, lineIdx / 3);

      // Icosahedron rotation + scale oscillation
      ico.rotation.x += 0.005;
      ico.rotation.y += 0.008;
      ico.rotation.z += 0.003;
      const dist2Mouse = Math.sqrt(mouse.x * mouse.x + mouse.y * mouse.y);
      ico.scale.setScalar(1 + Math.sin(time * 2) * 0.08 + dist2Mouse * 0.1);
      if (dist2Mouse > 0.3) {
        (icoMat as THREE.LineBasicMaterial).color.set(0xff00ff);
      } else {
        (icoMat as THREE.LineBasicMaterial).color.set(0x00f0ff);
      }

      // Grid scroll toward viewer
      gridHelper.position.z = (time * 20) % 50;

      // Glitch planes
      const now2 = performance.now();
      planes.forEach((p) => {
        p.mesh.position.x = p.baseX + Math.sin(time * 0.5 + p.mesh.position.y) * 15;
        if (now2 - lastGlitch > p.glitchInterval) {
          p.mesh.position.x += (Math.random() - 0.5) * 20;
          setTimeout(() => { p.mesh.position.x = p.baseX; }, 50);
          lastGlitch = now2;
        }
      });

      renderer.render(scene, camera);
    };
    let raf = requestAnimationFrame(animate);

    // Resize
    const onResize = () => {
      const W2 = mount.clientWidth;
      const H2 = mount.clientHeight;
      camera.aspect = W2 / H2;
      camera.updateProjectionMatrix();
      renderer.setSize(W2, H2);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("resize", onResize);
      renderer.dispose();
      mount.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div
      ref={mountRef}
      style={{ position: "absolute", inset: 0, zIndex: 0 }}
    />
  );
}
