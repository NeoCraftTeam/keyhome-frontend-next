'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function ThreeCanvas() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = mountRef.current;
    if (!el) { return; }

    // Scene
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, el.clientWidth / el.clientHeight, 0.1, 1000);
    camera.position.z = 300;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(el.clientWidth, el.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    el.appendChild(renderer.domElement);

    // Particles
    const PARTICLE_COUNT = 120;
    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const velocities: THREE.Vector3[] = [];

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 600;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 400;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 200;
      velocities.push(
        new THREE.Vector3(
          (Math.random() - 0.5) * 0.3,
          (Math.random() - 0.5) * 0.3,
          (Math.random() - 0.5) * 0.1,
        ),
      );
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const mat = new THREE.PointsMaterial({
      color: 0xf6475f,
      size: 2.5,
      transparent: true,
      opacity: 0.7,
      sizeAttenuation: true,
    });

    const points = new THREE.Points(geo, mat);
    scene.add(points);

    // Lines between nearby particles
    const lineMat = new THREE.LineBasicMaterial({
      color: 0xf6475f,
      transparent: true,
      opacity: 0.12,
    });

    let linesMesh: THREE.LineSegments | null = null;

    const updateLines = () => {
      const linePositions: number[] = [];
      const pos = geo.attributes.position as THREE.BufferAttribute;
      const MAX_DIST = 120;

      for (let i = 0; i < PARTICLE_COUNT; i++) {
        for (let j = i + 1; j < PARTICLE_COUNT; j++) {
          const dx = pos.getX(i) - pos.getX(j);
          const dy = pos.getY(i) - pos.getY(j);
          const dz = pos.getZ(i) - pos.getZ(j);
          const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
          if (dist < MAX_DIST) {
            linePositions.push(pos.getX(i), pos.getY(i), pos.getZ(i));
            linePositions.push(pos.getX(j), pos.getY(j), pos.getZ(j));
          }
        }
      }

      if (linesMesh) {
        scene.remove(linesMesh);
        linesMesh.geometry.dispose();
      }

      const lineGeo = new THREE.BufferGeometry();
      lineGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(linePositions), 3));
      linesMesh = new THREE.LineSegments(lineGeo, lineMat);
      scene.add(linesMesh);
    };

    // Mouse parallax
    const mouse = { x: 0, y: 0 };
    const onMouseMove = (e: MouseEvent) => {
      mouse.x = (e.clientX / window.innerWidth - 0.5) * 60;
      mouse.y = -(e.clientY / window.innerHeight - 0.5) * 40;
    };
    window.addEventListener('mousemove', onMouseMove);

    // Resize
    const onResize = () => {
      if (!el) { return; }
      camera.aspect = el.clientWidth / el.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(el.clientWidth, el.clientHeight);
    };
    window.addEventListener('resize', onResize);

    // Animation
    let frameId: number;
    let lineTick = 0;
    const animate = () => {
      frameId = requestAnimationFrame(animate);

      const pos = geo.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        pos.setX(i, pos.getX(i) + velocities[i].x);
        pos.setY(i, pos.getY(i) + velocities[i].y);
        pos.setZ(i, pos.getZ(i) + velocities[i].z);

        // Bounce
        if (Math.abs(pos.getX(i)) > 310) { velocities[i].x *= -1; }
        if (Math.abs(pos.getY(i)) > 210) { velocities[i].y *= -1; }
        if (Math.abs(pos.getZ(i)) > 110) { velocities[i].z *= -1; }
      }
      pos.needsUpdate = true;

      // Update lines every 3 frames (perf)
      lineTick++;
      if (lineTick % 3 === 0) { updateLines(); }

      // Slight camera parallax
      camera.position.x += (mouse.x - camera.position.x) * 0.02;
      camera.position.y += (mouse.y - camera.position.y) * 0.02;
      camera.lookAt(scene.position);

      renderer.render(scene, camera);
    };

    updateLines();
    animate();

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('resize', onResize);
      renderer.dispose();
      if (el.contains(renderer.domElement)) { el.removeChild(renderer.domElement); }
    };
  }, []);

  return (
    <div
      ref={mountRef}
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 0,
      }}
    />
  );
}
