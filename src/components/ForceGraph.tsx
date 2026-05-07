"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { ADCProduct } from "@/lib/types";

// 把临床阶段映射到球面上的纬度带 + 颜色 + 节点大小
// 从北极（已上市）到南极（IND），越高越成熟
const STAGE_CONFIG: Record<string, { clr: string; sz: number; lat: [number, number] }> = {
  "已上市": { clr: "#69f0ae", sz: 0.035, lat: [60, 90] },
  "NDA": { clr: "#f44336", sz: 0.03, lat: [30, 55] },
  "临床III期": { clr: "#00e5ff", sz: 0.03, lat: [5, 30] },
  "临床II期": { clr: "#b388ff", sz: 0.025, lat: [-25, 5] },
  "临床I期": { clr: "#ffb74d", sz: 0.025, lat: [-55, -25] },
  "IND": { clr: "#ff6ec7", sz: 0.02, lat: [-90, -55] },
};

interface Props { products: ADCProduct[]; }

export default function ForceGraph({ products }: Props) {
  const boxRef = useRef<HTMLDivElement>(null);
  const threeScene = useRef<THREE.Scene | null>(null);
  const orbitCtrl = useRef<OrbitControls | null>(null);
  const meshToDrug = useRef<Map<THREE.Mesh, ADCProduct>>(new Map());
  const [hovered, setHovered] = useState<ADCProduct | null>(null);
  const [picked, setPicked] = useState<ADCProduct | null>(null);
  const [tipXY, setTipXY] = useState({ x: 0, y: 0 });

  // 只展示有品牌名、非终止、且在六个目标阶段内的药物
  const visible = useMemo(
    () => products.filter(
      (d) => d.brandName?.length > 1 && !d.stage.includes("终止") &&
        ["已上市", "NDA", "临床III期", "临床II期", "临床I期", "IND"].includes(d.stage)
    ),
    [products]
  );

  useEffect(() => {
    const box = boxRef.current;
    if (!box) return;

    const w = box.clientWidth;
    const h = box.clientHeight;

    const scene = new THREE.Scene();
    threeScene.current = scene;

    const cam = new THREE.PerspectiveCamera(50, w / h, 0.1, 10);
    cam.position.set(0, 0.5, 3.5);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    box.innerHTML = "";
    box.appendChild(renderer.domElement);
    renderer.domElement.style.cursor = "grab";

    // 灯光：环境光打底 + 主方向光青色调 + 背面补光紫色调
    scene.add(new THREE.AmbientLight(0x334466, 1.5));
    const keyLight = new THREE.DirectionalLight(0x00ccff, 1);
    keyLight.position.set(2, 3, 3);
    scene.add(keyLight);
    const fillLight = new THREE.DirectionalLight(0x4411aa, 0.5);
    fillLight.position.set(-2, -1, -2);
    scene.add(fillLight);

    // 轨道控制器，让用户可以拖拽旋转和缩放
    const ctrl = new OrbitControls(cam, renderer.domElement);
    ctrl.enableDamping = true;
    ctrl.dampingFactor = 0.08;
    ctrl.autoRotate = true;
    ctrl.autoRotateSpeed = 0.3;
    ctrl.minDistance = 1.5;
    ctrl.maxDistance = 6;
    ctrl.target.set(0, 0, 0);
    orbitCtrl.current = ctrl;

    const globeGeo = new THREE.SphereGeometry(0.95, 64, 48);
    const globeMat = new THREE.MeshPhongMaterial({
      color: 0x0a2244,
      emissive: 0x001122,
      specular: 0x113366,
      shininess: 10,
      transparent: true,
      opacity: 0.85,
    });
    scene.add(new THREE.Mesh(globeGeo, globeMat));

    // 大气辉光，用shader做出边缘发光的效果
    const auraGeo = new THREE.SphereGeometry(0.98, 64, 48);
    const auraMat = new THREE.ShaderMaterial({
      uniforms: {},
      vertexShader: `
        varying vec3 vn;
        void main() { vn = normalize(normalMatrix * normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }
      `,
      fragmentShader: `
        varying vec3 vn;
        void main() {
          float amp = pow(0.65 - dot(vn, vec3(0.0, 0.0, 1.0)), 3.0);
          gl_FragColor = vec4(0.0, 0.6, 1.0, 1.0) * amp;
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
    });
    scene.add(new THREE.Mesh(auraGeo, auraMat));

    // 经纬网，wireframe球体套在外面，弱透明度
    const gridGeo = new THREE.SphereGeometry(0.96, 32, 20);
    const gridMat = new THREE.MeshBasicMaterial({
      color: 0x003366,
      wireframe: true,
      transparent: true,
      opacity: 0.08,
    });
    scene.add(new THREE.Mesh(gridGeo, gridMat));

    const starData = new THREE.BufferGeometry();
    const totalStars = 600;
    const posArr = new Float32Array(totalStars * 3);
    for (let i = 0; i < totalStars; i++) {
      const th = Math.random() * Math.PI * 2;
      const ph = Math.acos(2 * Math.random() - 1);
      const rad = 4 + Math.random() * 3;
      posArr[i * 3] = rad * Math.sin(ph) * Math.cos(th);
      posArr[i * 3 + 1] = rad * Math.sin(ph) * Math.sin(th);
      posArr[i * 3 + 2] = rad * Math.cos(ph);
    }
    starData.setAttribute("position", new THREE.BufferAttribute(posArr, 3));
    const starMat = new THREE.PointsMaterial({ color: 0x4488cc, size: 0.015, transparent: true, opacity: 0.6 });
    const starField = new THREE.Points(starData, starMat);
    scene.add(starField);

    const drugGroup = new THREE.Group();
    const drugMap = new Map<THREE.Mesh, ADCProduct>();

    visible.forEach((drug) => {
      const cfg = STAGE_CONFIG[drug.stage] || STAGE_CONFIG["IND"];
      const [latLo, latHi] = cfg.lat;

      // 在该阶段的纬度带内随机取一点
      const latRad = THREE.MathUtils.degToRad(latLo + Math.random() * (latHi - latLo));
      const lonRad = Math.random() * Math.PI * 2;
      const R = 0.96;

      const px = R * Math.cos(latRad) * Math.cos(lonRad);
      const py = R * Math.sin(latRad);
      const pz = R * Math.cos(latRad) * Math.sin(lonRad);

      // 小球体表示药物
      const ballGeo = new THREE.SphereGeometry(cfg.sz, 12, 8);
      const ballMat = new THREE.MeshPhongMaterial({
        color: new THREE.Color(cfg.clr),
        emissive: new THREE.Color(cfg.clr),
        emissiveIntensity: 0.5,
        specular: 0xffffff,
        shininess: 40,
      });
      const node = new THREE.Mesh(ballGeo, ballMat);
      node.position.set(px, py, pz);
      node.userData = { drug, stage: drug.stage };
      drugGroup.add(node);
      drugMap.set(node, drug);

      // 标签，用canvas画到sprite贴图上
      const displayName = drug.brandName.length > 16 ? drug.brandName.slice(0, 14) + "…" : drug.brandName;
      const canvasEl = document.createElement("canvas");
      canvasEl.width = 256;
      canvasEl.height = 32;
      const ctx2d = canvasEl.getContext("2d")!;
      ctx2d.fillStyle = "rgba(255,255,255,0.9)";
      ctx2d.font = "16px Inter, sans-serif";
      ctx2d.textAlign = "center";
      ctx2d.fillText(displayName, 128, 20);
      const labelTex = new THREE.CanvasTexture(canvasEl);
      labelTex.minFilter = THREE.LinearFilter;
      const labelMat = new THREE.SpriteMaterial({ map: labelTex, transparent: true, opacity: 0.75, depthTest: false });
      const label = new THREE.Sprite(labelMat);
      label.position.copy(node.position);
      label.position.multiplyScalar(1.08);
      label.scale.set(0.5, 0.0625, 1);
      drugGroup.add(label);
    });

    scene.add(drugGroup);
    meshToDrug.current = drugMap;

    // 射线检测，处理鼠标悬停和点击
    const raycaster = new THREE.Raycaster();
    raycaster.params.Points.threshold = 0.1;

    function pickNodes(evt: MouseEvent): THREE.Intersection[] {
      const rect = renderer.domElement.getBoundingClientRect();
      const mx = ((evt.clientX - rect.left) / rect.width) * 2 - 1;
      const my = -((evt.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(new THREE.Vector2(mx, my), cam);
      return raycaster.intersectObjects(Array.from(drugMap.keys()));
    }

    renderer.domElement.addEventListener("mousemove", (evt) => {
      const hits = pickNodes(evt);
      if (hits.length > 0) {
        const drug = drugMap.get(hits[0].object as THREE.Mesh);
        setHovered(drug || null);
        setTipXY({ x: evt.clientX, y: evt.clientY });
        renderer.domElement.style.cursor = "pointer";
      } else {
        setHovered(null);
        renderer.domElement.style.cursor = "grab";
      }
    });

    renderer.domElement.addEventListener("click", (evt) => {
      const hits = pickNodes(evt);
      if (hits.length > 0) {
        const drug = drugMap.get(hits[0].object as THREE.Mesh);
        if (drug) {
          setPicked(drug);
          ctrl.autoRotate = false;
        }
      } else {
        setPicked(null);
        ctrl.autoRotate = true;
      }
    });

    // 动画循环
    function loop() {
      requestAnimationFrame(loop);
      ctrl.update();
      starField.rotation.y += 0.0001;
      starField.rotation.x += 0.00005;
      renderer.render(scene, cam);
    }
    loop();

    function onResize() {
      const rw = boxRef.current!.clientWidth;
      const rh = boxRef.current!.clientHeight;
      cam.aspect = rw / rh;
      cam.updateProjectionMatrix();
      renderer.setSize(rw, rh);
    }
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      renderer.dispose();
      box.innerHTML = "";
    };
  }, [visible]);

  return (
    <div className="relative w-full" style={{ height: "calc(100vh - 180px)", minHeight: "500px" }}>
      <div ref={boxRef} className="w-full h-full bg-[#020810] rounded-xl overflow-hidden border border-cyber-border" />

      {/* 鼠标悬停时的浮动提示 */}
      {hovered && !picked && (
        <div className="fixed z-50 bg-black/85 border border-cyber-border rounded-lg px-3 py-2 text-sm pointer-events-none backdrop-blur-xl"
          style={{ left: tipXY.x + 15, top: tipXY.y - 10 }}>
          <div className="font-bold text-cyber-accent">{hovered.brandName}</div>
          <div className="text-xs text-cyber-text2">{hovered.stage} · {hovered.target} · {hovered.companyOriginator}</div>
        </div>
      )}

      {/* 点击后弹出的详情面板 */}
      {picked && (
        <div className="absolute top-4 right-4 w-80 max-h-[70vh] overflow-y-auto bg-black/90 border border-cyber-border rounded-xl p-5 z-20 backdrop-blur-xl shadow-2xl"
          onClick={(e) => e.stopPropagation()}>
          <div className="flex items-start justify-between mb-3">
            <h3 className="text-base font-bold text-cyber-accent">{picked.brandName}</h3>
            <button
              onClick={() => { setPicked(null); if (orbitCtrl.current) orbitCtrl.current.autoRotate = true; }}
              className="text-cyber-text2/60 hover:text-cyber-text text-lg leading-none"
            >&times;</button>
          </div>
          <div className="text-xs text-cyber-text2 mb-3">{picked.genericNameEn}</div>
          <div className="space-y-1.5 text-xs">
            {picked.target && <div><span className="text-cyber-text2/60">靶点:</span> <span className="text-cyber-pink">{picked.target}</span></div>}
            <div><span className="text-cyber-text2/60">阶段:</span> <span className="text-cyber-accent">{picked.stage}</span></div>
            {picked.companyOriginator && <div><span className="text-cyber-text2/60">公司:</span> <span className="text-cyber-text">{picked.companyOriginator}</span></div>}
            {picked.payloadName && <div><span className="text-cyber-text2/60">载荷:</span> <span className="text-cyber-text">{picked.payloadName}</span></div>}
            {picked.linkerName && <div><span className="text-cyber-text2/60">连接子:</span> <span className="text-cyber-text">{picked.linkerName}</span></div>}
            {picked.conjugationMethod && <div><span className="text-cyber-text2/60">偶联:</span> <span className="text-cyber-text">{picked.conjugationMethod}</span></div>}
            {picked.dar && <div><span className="text-cyber-text2/60">DAR:</span> <span className="text-cyber-text">{picked.dar}</span></div>}
            {picked.antibody && <div><span className="text-cyber-text2/60">抗体:</span> <span className="text-cyber-text">{picked.antibody}</span></div>}
            {picked.indication?.[0] && picked.indication[0] !== '未公开' && (
              <div><span className="text-cyber-text2/60">适应症:</span> <span className="text-cyber-green">{picked.indication.slice(0, 3).join('; ')}</span></div>
            )}
            {picked.manufacturer && <div><span className="text-cyber-text2/60">生产:</span> <span className="text-cyber-text">{picked.manufacturer}</span></div>}
            {picked.cellLine && <div><span className="text-cyber-text2/60">细胞:</span> <span className="text-cyber-text">{picked.cellLine}</span></div>}
            {picked.payloadSmiles && <div><span className="text-cyber-text2/60">SMILES:</span> <span className="text-cyber-text text-[10px] font-mono break-all">{picked.payloadSmiles}</span></div>}
            {picked.pdbId && <div><span className="text-cyber-text2/60">PDB:</span> <a href={`https://www.rcsb.org/structure/${picked.pdbId}`} target="_blank" rel="noopener noreferrer" className="text-cyber-accent font-mono hover:underline">{picked.pdbId}</a></div>}
            {picked.referenceLabel && (
              <div><span className="text-cyber-text2/60">来源:</span> <span className="text-cyber-text2/50 text-[10px]">{picked.referenceLabel}</span></div>
            )}
          </div>
          <a href={`/products/${picked.id}/`} className="inline-block mt-3 text-xs text-cyber-accent hover:underline">查看完整详情 →</a>
        </div>
      )}

      {/* 图例：底部右侧 */}
      <div className="absolute bottom-4 right-4 bg-black/80 border border-cyber-border rounded-lg px-3 py-2 text-xs flex gap-3 backdrop-blur-xl">
        {Object.entries(STAGE_CONFIG).map(([phase, { clr }]) => {
          const short = phase === "已上市" ? "已上市" : phase === "NDA" ? "NDA" : phase === "临床III期" ? "III" : phase === "临床II期" ? "II" : phase === "临床I期" ? "I" : "IND";
          return (
            <div key={phase} className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: clr }} />
              <span className="text-cyber-text2">{short}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
