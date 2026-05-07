"use client";

import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { ADCProduct } from "@/lib/types";

const STAGE_CONFIG: Record<string, { color: string; size: number; latRange: [number, number] }> = {
  "已上市": { color: "#69f0ae", size: 0.035, latRange: [60, 90] },
  "NDA": { color: "#f44336", size: 0.03, latRange: [30, 55] },
  "临床III期": { color: "#00e5ff", size: 0.03, latRange: [5, 30] },
  "临床II期": { color: "#b388ff", size: 0.025, latRange: [-25, 5] },
  "临床I期": { color: "#ffb74d", size: 0.025, latRange: [-55, -25] },
  "IND": { color: "#ff6ec7", size: 0.02, latRange: [-90, -55] },
};

interface Props { products: ADCProduct[]; }

export default function ForceGraph({ products }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const nodesRef = useRef<Map<THREE.Mesh, ADCProduct>>(new Map());
  const [hovered, setHovered] = useState<ADCProduct | null>(null);
  const [selected, setSelected] = useState<ADCProduct | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  const filtered = useMemo(
    () => products.filter(
      (p) => p.brandName?.length > 1 && !p.stage.includes("终止") &&
        ["已上市", "NDA", "临床III期", "临床II期", "临床I期", "IND"].includes(p.stage)
    ),
    [products]
  );


  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const W = container.clientWidth;
    const H = container.clientHeight;

    // --- Scene ---
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // --- Camera ---
    const camera = new THREE.PerspectiveCamera(50, W / H, 0.1, 10);
    camera.position.set(0, 0.5, 3.5);

    // --- Renderer ---
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.innerHTML = "";
    container.appendChild(renderer.domElement);
    renderer.domElement.style.cursor = "grab";

    // --- Lights ---
    scene.add(new THREE.AmbientLight(0x334466, 1.5));
    const dirLight = new THREE.DirectionalLight(0x00ccff, 1);
    dirLight.position.set(2, 3, 3);
    scene.add(dirLight);
    const backLight = new THREE.DirectionalLight(0x4411aa, 0.5);
    backLight.position.set(-2, -1, -2);
    scene.add(backLight);

    // --- Controls ---
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.3;
    controls.minDistance = 1.5;
    controls.maxDistance = 6;
    controls.target.set(0, 0, 0);
    controlsRef.current = controls;

    // --- Earth globe ---
    const globeGeo = new THREE.SphereGeometry(0.95, 64, 48);
    const globeMat = new THREE.MeshPhongMaterial({
      color: 0x0a2244,
      emissive: 0x001122,
      specular: 0x113366,
      shininess: 10,
      transparent: true,
      opacity: 0.85,
    });
    const globe = new THREE.Mesh(globeGeo, globeMat);
    scene.add(globe);

    // Atmosphere glow
    const glowGeo = new THREE.SphereGeometry(0.98, 64, 48);
    const glowMat = new THREE.ShaderMaterial({
      uniforms: {},
      vertexShader: `
        varying vec3 vNormal;
        void main() { vNormal = normalize(normalMatrix * normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        void main() {
          float intensity = pow(0.65 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 3.0);
          gl_FragColor = vec4(0.0, 0.6, 1.0, 1.0) * intensity;
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
    });
    const glow = new THREE.Mesh(glowGeo, glowMat);
    scene.add(glow);

    // Wireframe grid (like latitude/longitude)
    const gridGeo = new THREE.SphereGeometry(0.96, 32, 20);
    const gridMat = new THREE.MeshBasicMaterial({
      color: 0x003366,
      wireframe: true,
      transparent: true,
      opacity: 0.08,
    });
    const grid = new THREE.Mesh(gridGeo, gridMat);
    scene.add(grid);

    // --- Stars background ---
    const starsGeo = new THREE.BufferGeometry();
    const starsCount = 600;
    const starsPos = new Float32Array(starsCount * 3);
    for (let i = 0; i < starsCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 4 + Math.random() * 3;
      starsPos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      starsPos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      starsPos[i * 3 + 2] = r * Math.cos(phi);
    }
    starsGeo.setAttribute("position", new THREE.BufferAttribute(starsPos, 3));
    const starsMat = new THREE.PointsMaterial({ color: 0x4488cc, size: 0.015, transparent: true, opacity: 0.6 });
    const stars = new THREE.Points(starsGeo, starsMat);
    scene.add(stars);

    // --- Drug nodes ---
    const nodeGroup = new THREE.Group();
    const nodesMap = new Map<THREE.Mesh, ADCProduct>();

    filtered.forEach((p) => {
      const cfg = STAGE_CONFIG[p.stage] || STAGE_CONFIG["IND"];
      const [latMin, latMax] = cfg.latRange;

      // Random position within stage's latitude band
      const lat = THREE.MathUtils.degToRad(latMin + Math.random() * (latMax - latMin));
      const lon = Math.random() * Math.PI * 2;

      // Spherical to Cartesian on globe surface
      const r = 0.96;
      const x = r * Math.cos(lat) * Math.cos(lon);
      const y = r * Math.sin(lat);
      const z = r * Math.cos(lat) * Math.sin(lon);

      // Node sphere
      const nodeGeo = new THREE.SphereGeometry(cfg.size, 12, 8);
      const nodeMat = new THREE.MeshPhongMaterial({
        color: new THREE.Color(cfg.color),
        emissive: new THREE.Color(cfg.color),
        emissiveIntensity: 0.5,
        specular: 0xffffff,
        shininess: 40,
      });
      const mesh = new THREE.Mesh(nodeGeo, nodeMat);
      mesh.position.set(x, y, z);
      mesh.userData = { product: p, stage: p.stage };
      nodeGroup.add(mesh);
      nodesMap.set(mesh, p);

      // Text label sprite
      const labelName = p.brandName.length > 16 ? p.brandName.slice(0, 14) + "…" : p.brandName;
      const canvas = document.createElement("canvas");
      canvas.width = 256;
      canvas.height = 32;
      const cctx = canvas.getContext("2d")!;
      cctx.fillStyle = "rgba(255,255,255,0.9)";
      cctx.font = "16px Inter, sans-serif";
      cctx.textAlign = "center";
      cctx.fillText(labelName, 128, 20);
      const tex = new THREE.CanvasTexture(canvas);
      tex.minFilter = THREE.LinearFilter;
      const spriteMat = new THREE.SpriteMaterial({ map: tex, transparent: true, opacity: 0.75, depthTest: false });
      const sprite = new THREE.Sprite(spriteMat);
      sprite.position.copy(mesh.position);
      sprite.position.multiplyScalar(1.08);
      sprite.scale.set(0.5, 0.0625, 1);
      nodeGroup.add(sprite);
    });

    scene.add(nodeGroup);
    nodesRef.current = nodesMap;

    // --- Raycaster ---
    const raycaster = new THREE.Raycaster();
    raycaster.params.Points.threshold = 0.1;

    function getNodeIntersections(event: MouseEvent): THREE.Intersection[] {
      const rect = renderer.domElement.getBoundingClientRect();
      const mouse = new THREE.Vector2(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1
      );
      raycaster.setFromCamera(mouse, camera);
      return raycaster.intersectObjects(Array.from(nodesMap.keys()));
    }

    renderer.domElement.addEventListener("mousemove", (event: MouseEvent) => {
      const hits = getNodeIntersections(event);
      if (hits.length > 0) {
        const p = nodesMap.get(hits[0].object as THREE.Mesh);
        setHovered(p || null);
        setTooltipPos({ x: event.clientX, y: event.clientY });
        renderer.domElement.style.cursor = "pointer";
      } else {
        setHovered(null);
        renderer.domElement.style.cursor = "grab";
      }
    });

    renderer.domElement.addEventListener("click", (event: MouseEvent) => {
      const hits = getNodeIntersections(event);
      if (hits.length > 0) {
        const p = nodesMap.get(hits[0].object as THREE.Mesh);
        if (p) {
          setSelected(p);
          controls.autoRotate = false;
        }
      } else {
        setSelected(null);
        controls.autoRotate = true;
      }
    });

    // --- Animation ---
    function animate() {
      requestAnimationFrame(animate);
      controls.update();
      stars.rotation.y += 0.0001;
      stars.rotation.x += 0.00005;
      renderer.render(scene, camera);
    }
    animate();

    // --- Resize ---
    const handleResize = () => {
      const rw = container.clientWidth;
      const rh = container.clientHeight;
      camera.aspect = rw / rh;
      camera.updateProjectionMatrix();
      renderer.setSize(rw, rh);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      renderer.dispose();
      container.innerHTML = "";
    };
  }, [filtered]);

  return (
    <div className="relative w-full" style={{ height: "calc(100vh - 180px)", minHeight: "500px" }}>
      <div ref={containerRef} className="w-full h-full bg-[#020810] rounded-xl overflow-hidden border border-cyber-border" />

      {/* Hover tooltip */}
      {hovered && !selected && (
        <div className="fixed z-50 bg-black/85 border border-cyber-border rounded-lg px-3 py-2 text-sm pointer-events-none backdrop-blur-xl"
          style={{ left: tooltipPos.x + 15, top: tooltipPos.y - 10 }}>
          <div className="font-bold text-cyber-accent">{hovered.brandName}</div>
          <div className="text-xs text-cyber-text2">{hovered.stage} · {hovered.target} · {hovered.companyOriginator}</div>
        </div>
      )}

      {/* Selected detail panel */}
      {selected && (
        <div className="absolute top-4 right-4 w-80 max-h-[70vh] overflow-y-auto bg-black/90 border border-cyber-border rounded-xl p-5 z-20 backdrop-blur-xl shadow-2xl" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-start justify-between mb-3">
            <h3 className="text-base font-bold text-cyber-accent">{selected.brandName}</h3>
            <button onClick={() => { setSelected(null); if (controlsRef.current) controlsRef.current.autoRotate = true; }} className="text-cyber-text2/60 hover:text-cyber-text text-lg leading-none">&times;</button>
          </div>
          <div className="text-xs text-cyber-text2 mb-3">{selected.genericNameEn}</div>
          <div className="space-y-1.5 text-xs">
            {selected.target && <div><span className="text-cyber-text2/60">靶点:</span> <span className="text-cyber-pink">{selected.target}</span></div>}
            <div><span className="text-cyber-text2/60">阶段:</span> <span className="text-cyber-accent">{selected.stage}</span></div>
            {selected.companyOriginator && <div><span className="text-cyber-text2/60">公司:</span> <span className="text-cyber-text">{selected.companyOriginator}</span></div>}
            {selected.payloadName && <div><span className="text-cyber-text2/60">载荷:</span> <span className="text-cyber-text">{selected.payloadName}</span></div>}
            {selected.linkerName && <div><span className="text-cyber-text2/60">连接子:</span> <span className="text-cyber-text">{selected.linkerName}</span></div>}
            {selected.conjugationMethod && <div><span className="text-cyber-text2/60">偶联:</span> <span className="text-cyber-text">{selected.conjugationMethod}</span></div>}
            {selected.dar && <div><span className="text-cyber-text2/60">DAR:</span> <span className="text-cyber-text">{selected.dar}</span></div>}
            {selected.antibody && <div><span className="text-cyber-text2/60">抗体:</span> <span className="text-cyber-text">{selected.antibody}</span></div>}
            {selected.indication?.[0] && selected.indication[0] !== '未公开' && (
              <div><span className="text-cyber-text2/60">适应症:</span> <span className="text-cyber-green">{selected.indication.slice(0,3).join('; ')}</span></div>
            )}
            {selected.cellLine && <div><span className="text-cyber-text2/60">细胞:</span> <span className="text-cyber-text">{selected.cellLine}</span></div>}
            {selected.payloadSmiles && <div><span className="text-cyber-text2/60">SMILES:</span> <span className="text-cyber-text text-[10px] font-mono break-all">{selected.payloadSmiles}</span></div>}
            {selected.pdbId && <div><span className="text-cyber-text2/60">PDB:</span> <a href={`https://www.rcsb.org/structure/${selected.pdbId}`} target="_blank" rel="noopener noreferrer" className="text-cyber-accent font-mono hover:underline">{selected.pdbId}</a></div>}
            {selected.referenceLabel && (
              <div><span className="text-cyber-text2/60">来源:</span> <span className="text-cyber-text2/50 text-[10px]">{selected.referenceLabel}</span></div>
            )}
          </div>
          <a href={`/products/${selected.id}/`} className="inline-block mt-3 text-xs text-cyber-accent hover:underline">查看完整详情 →</a>
        </div>
      )}

      {/* Legend */}
      <div className="absolute bottom-4 right-4 bg-black/80 border border-cyber-border rounded-lg px-3 py-2 text-xs flex gap-3 backdrop-blur-xl">
        {Object.entries(STAGE_CONFIG).map(([stage, { color }]) => (
          <div key={stage} className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
            <span className="text-cyber-text2">{stage === "已上市" ? "已上市" : stage === "NDA" ? "NDA" : stage === "临床III期" ? "III" : stage === "临床II期" ? "II" : stage === "临床I期" ? "I" : "IND"}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
