import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";


const GLAZES = {
  nero_opaco: {
    label: "Nero opaco",
    color: "#171817",
    roughness: 0.78,
    clearcoat: 0.08,
    clearcoatRoughness: 0.68,
    sheen: 0.08
  },
  bianco_lucido: {
    label: "Bianco lucido",
    color: "#eeeDE7",
    roughness: 0.16,
    clearcoat: 1.0,
    clearcoatRoughness: 0.08,
    sheen: 0.16
  },
  verde_oliva_lucido: {
    label: "Verde oliva lucido",
    color: "#616742",
    roughness: 0.19,
    clearcoat: 0.92,
    clearcoatRoughness: 0.10,
    sheen: 0.14
  },
  tortora: {
    label: "Tortora",
    color: "#958879",
    roughness: 0.48,
    clearcoat: 0.32,
    clearcoatRoughness: 0.38,
    sheen: 0.13
  },
  marrone_lucido: {
    label: "Marrone lucido",
    color: "#7f3f21",
    roughness: 0.16,
    clearcoat: 1.0,
    clearcoatRoughness: 0.07,
    sheen: 0.18
  },
  sabbia: {
    label: "Sabbia",
    color: "#b99463",
    roughness: 0.57,
    clearcoat: 0.24,
    clearcoatRoughness: 0.46,
    sheen: 0.16
  },
  altro: {
    label: "Altro colore da concordare",
    color: "#aaa79f",
    roughness: 0.42,
    clearcoat: 0.38,
    clearcoatRoughness: 0.34,
    sheen: 0.12
  }
};

const viewer = document.querySelector("#viewer");
const scene = new THREE.Scene();
scene.background = null;

const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
camera.position.set(0, 0.1, 3.05);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2.5));
renderer.shadowMap.enabled = false;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.setClearColor(0x000000, 0);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.82;

viewer.appendChild(renderer.domElement);

// Ambiente neutro generato localmente: crea riflessi realistici sullo smalto
// senza caricare fotografie HDR esterne.
const pmremGenerator = new THREE.PMREMGenerator(renderer);
const roomEnvironment = new RoomEnvironment();
scene.environment = pmremGenerator.fromScene(roomEnvironment, 0.04).texture;
roomEnvironment.dispose();
pmremGenerator.dispose();


const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
let hasInitialCameraFrame = false;
let hasUserAdjustedCamera = false; // mantenuta solo per compatibilità futura
controls.target.set(0, 0, 0);
controls.minDistance = 0.55;
controls.maxDistance = 12;

controls.addEventListener("start", () => {
  hasUserAdjustedCamera = true;
});

const ambient = new THREE.AmbientLight(0xffffff, 1.7);
scene.add(ambient);

const key = new THREE.DirectionalLight(0xffffff, 1.8);
key.position.set(2.8, 3.5, 4);
scene.add(key);

const fill = new THREE.DirectionalLight(0xdfe9ff, 0.75);
fill.position.set(-3, 1.5, 3);
scene.add(fill);




const tileGroup = new THREE.Group();
tileGroup.rotation.x = -0.10;
tileGroup.rotation.y = 0.22;
scene.add(tileGroup);






function createCeramicNormalTexture(size = 256) {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  const image = ctx.createImageData(size, size);
  const data = image.data;

  // Micro-irregolarità molto fini, quasi impercettibili:
  // evitano l'effetto plastica perfettamente liscia.
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      const wave =
        Math.sin(x * 0.19) * 1.5 +
        Math.cos(y * 0.23) * 1.5 +
        Math.sin((x + y) * 0.07) * 1.0;
      const noise = (Math.random() - 0.5) * 5;
      const nx = Math.round(128 + wave + noise);
      const ny = Math.round(128 - wave + noise);

      data[i] = Math.max(0, Math.min(255, nx));
      data[i + 1] = Math.max(0, Math.min(255, ny));
      data[i + 2] = 255;
      data[i + 3] = 255;
    }
  }

  ctx.putImageData(image, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(5, 5);
  texture.colorSpace = THREE.NoColorSpace;
  texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  texture.needsUpdate = true;
  return texture;
}

const ceramicNormalTexture = createCeramicNormalTexture();

function createCrackleTexture(size = 512) {
  const canvas = document.createElement("canvas");
  canvas.width = size; canvas.height = size;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#808080"; ctx.fillRect(0,0,size,size);
  ctx.strokeStyle = "rgba(105,105,105,.28)"; ctx.lineWidth = 0.55;
  for (let i=0;i<280;i++){
    let x=Math.random()*size, y=Math.random()*size;
    ctx.beginPath(); ctx.moveTo(x,y);
    const steps=3+Math.floor(Math.random()*5);
    for(let s=0;s<steps;s++){x+=(Math.random()-.5)*28;y+=(Math.random()-.5)*28;ctx.lineTo(x,y)}
    ctx.stroke();
  }
  const t=new THREE.CanvasTexture(canvas);
  t.wrapS=t.wrapT=THREE.RepeatWrapping; t.repeat.set(2.5,2.5);
  t.colorSpace=THREE.NoColorSpace;
  t.anisotropy=Math.min(16,renderer.capabilities.getMaxAnisotropy());
  return t;
}
const ceramicCrackleTexture = createCrackleTexture();


const state = {
  width: 100,
  height: 100,
  glaze: "marrone_lucido",
  textureEnabled: false,
  imageRelief: 3,
  imageContrast: 100,
  invertRelief: true,
  heightData: null,
  heightWidth: 0,
  heightHeight: 0,
  originalFile: null,
  serviceType: "text",
  tileText: "",
  appliedText: "",
  textFont: "helvetiker",
  textSize: 14,
  textAlign: "center",
  textNegative: false,
  textDepth: 2,
  frameStyle: "classic"
};

function disposeObject(obj) {
  obj.userData?.disposableTexture?.dispose?.();
  obj.geometry?.dispose();
  if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose());
  else obj.material?.dispose();
}

function clearGroup(group) {
  while (group.children.length) {
    const obj = group.children.pop();
    obj.traverse?.(disposeObject);
    disposeObject(obj);
  }
}

function roundedRectShape(w, h, r) {
  const s = new THREE.Shape();
  const x = -w / 2, y = -h / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r);
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h);
  s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r);
  s.quadraticCurveTo(x, y, x + r, y);
  return s;
}

function extrudedShape(shape, depth, material, z) {
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelSegments: 3,
    steps: 1,
    bevelSize: Math.min(depth * .22, .012),
    bevelThickness: Math.min(depth * .18, .01)
  });
  geometry.center();
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.z = z;
  return mesh;
}

function makeFrameRing(
  w,
  h,
  inset,
  widthFactor,
  depth,
  radius,
  material,
  baseTop,
  zOffset = 0
) {
  const outerW = w * (1 - inset);
  const outerH = h * (1 - inset);

  const outer = roundedRectShape(outerW, outerH, radius);
  const inner = roundedRectShape(
    Math.max(0.05, outerW - w * widthFactor),
    Math.max(0.05, outerH - h * widthFactor),
    Math.max(0.005, radius * 0.74)
  );

  outer.holes.push(inner);

  return extrudedShape(
    outer,
    depth,
    material,
    baseTop + depth / 2 + zOffset
  );
}

function buildStandardFrame(w, h, material, baseTop) {
  const group = new THREE.Group();
  const minSide = Math.min(w, h);

  const addFrame = (
    frameW,
    frameH,
    inset,
    widthFactor,
    depth,
    radius,
    frameMaterial,
    zOffset = 0
  ) => {
    group.add(
      makeFrameRing(
        frameW,
        frameH,
        inset,
        widthFactor,
        depth,
        radius,
        frameMaterial,
        baseTop,
        zOffset
      )
    );
  };

  const g = group;
  const m = minSide;
  const a = addFrame;
  switch(state.frameStyle){
    case "none": return g;
    case "minimal": a(w,h,.10,.025,.010,m*.028,material); break;
    case "classic": a(w,h,.07,.040,.020,m*.040,material); a(w,h,.15,.020,.012,m*.026,material,.002); break;
    case "double": a(w,h,.08,.024,.014,m*.034,material); a(w,h,.15,.024,.014,m*.025,material); break;
    case "triple": a(w,h,.06,.020,.012,m*.036,material); a(w,h,.12,.018,.012,m*.030,material); a(w,h,.18,.016,.010,m*.024,material); break;
    case "beaded": a(w,h,.07,.030,.018,m*.045,material); a(w,h,.135,.014,.026,m*.024,material,.002); break;
    case "soft": a(w,h,.07,.055,.017,m*.060,material); break;
    case "architectural": a(w,h,.05,.050,.024,m*.020,material); a(w,h,.16,.018,.010,m*.014,material); break;
    case "deco": a(w,h,.05,.022,.016,m*.018,material); a(w,h,.10,.035,.020,m*.018,material); a(w,h,.18,.014,.010,m*.012,material); break;
    case "rustic": a(w,h,.045,.060,.022,m*.055,material); g.rotation.z=.002; break;
    case "thinInset": a(w,h,.14,.012,.006,m*.018,material); break;
    case "wideInset": a(w,h,.13,.040,.010,m*.026,material); break;
    case "museum": a(w,h,.045,.070,.030,m*.050,material); a(w,h,.18,.022,.016,m*.022,material,.004); break;
  }
  return g;
}


function sampleHeight(u, v) {
  if (!state.heightData) return 0;

  const fx = Math.min(state.heightWidth - 1, Math.max(0, u * (state.heightWidth - 1)));
  const fy = Math.min(state.heightHeight - 1, Math.max(0, (1 - v) * (state.heightHeight - 1)));

  const x0 = Math.floor(fx);
  const y0 = Math.floor(fy);
  const x1 = Math.min(state.heightWidth - 1, x0 + 1);
  const y1 = Math.min(state.heightHeight - 1, y0 + 1);
  const tx = fx - x0;
  const ty = fy - y0;

  const h00 = state.heightData[y0 * state.heightWidth + x0] / 255;
  const h10 = state.heightData[y0 * state.heightWidth + x1] / 255;
  const h01 = state.heightData[y1 * state.heightWidth + x0] / 255;
  const h11 = state.heightData[y1 * state.heightWidth + x1] / 255;

  const top = h00 * (1 - tx) + h10 * tx;
  const bottom = h01 * (1 - tx) + h11 * tx;
  let value = top * (1 - ty) + bottom * ty;

  value = (value - 0.5) * (state.imageContrast / 100) + 0.5;
  value = Math.min(1, Math.max(0, value));

  // Checked means black/dark graphics are raised.
  if (state.invertRelief) value = 1 - value;
  return value;
}

function gaussianBlurGray(source, width, height, radius = 2) {
  if (radius <= 0) return source;

  const kernelSize = radius * 2 + 1;
  const sigma = Math.max(0.8, radius / 1.6);
  const kernel = new Float32Array(kernelSize);
  let kernelSum = 0;

  for (let i = -radius; i <= radius; i++) {
    const value = Math.exp(-(i * i) / (2 * sigma * sigma));
    kernel[i + radius] = value;
    kernelSum += value;
  }

  for (let i = 0; i < kernel.length; i++) {
    kernel[i] /= kernelSum;
  }

  const temp = new Float32Array(source.length);
  const result = new Uint8Array(source.length);

  // Passaggio orizzontale
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let sum = 0;
      for (let k = -radius; k <= radius; k++) {
        const sx = Math.max(0, Math.min(width - 1, x + k));
        sum += source[y * width + sx] * kernel[k + radius];
      }
      temp[y * width + x] = sum;
    }
  }

  // Passaggio verticale
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let sum = 0;
      for (let k = -radius; k <= radius; k++) {
        const sy = Math.max(0, Math.min(height - 1, y + k));
        sum += temp[sy * width + x] * kernel[k + radius];
      }
      result[y * width + x] = Math.round(sum);
    }
  }

  return result;
}

function estimateMeshSegments(reliefWidth, reliefHeight) {
  const isMobile = window.matchMedia("(max-width: 900px)").matches;
  const maxSegments = isMobile ? 520 : 820;
  const minSegments = isMobile ? 300 : 420;

  const imageResolution = Math.max(state.heightWidth, state.heightHeight);
  const desired = Math.round(imageResolution * (isMobile ? 0.52 : 0.68));

  const longSide = Math.max(reliefWidth, reliefHeight);
  const shortSide = Math.min(reliefWidth, reliefHeight);
  const aspectCompensation = Math.sqrt(shortSide / longSide);

  return Math.max(
    minSegments,
    Math.min(maxSegments, Math.round(desired * aspectCompensation))
  );
}


function buildHeightmapRelief(w, h, material, baseTop) {
  // L'immagine viene contenuta e centrata senza deformazioni.
  const availableFactor = 0.88;
  const availableW = w * availableFactor;
  const availableH = h * availableFactor;
  const imageAspect = state.heightWidth / state.heightHeight;
  const availableAspect = availableW / availableH;

  let reliefW;
  let reliefH;

  if (imageAspect >= availableAspect) {
    reliefW = availableW;
    reliefH = availableW / imageAspect;
  } else {
    reliefH = availableH;
    reliefW = availableH * imageAspect;
  }

  const baseSegments = estimateMeshSegments(reliefW, reliefH);
  const longSide = Math.max(reliefW, reliefH);
  const segmentsX = Math.max(
    120,
    Math.round(baseSegments * (reliefW / longSide))
  );
  const segmentsY = Math.max(
    120,
    Math.round(baseSegments * (reliefH / longSide))
  );

  const geometry = new THREE.PlaneGeometry(
    reliefW,
    reliefH,
    segmentsX,
    segmentsY
  );

  const pos = geometry.attributes.position;
  const maxRelief = state.imageRelief / 100;

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const u = (x / reliefW) + 0.5;
    const v = (y / reliefH) + 0.5;

    // Il campionamento bilineare, combinato con la sfocatura gaussiana
    // preventiva, riduce nettamente scalini e pixel visibili.
    const z = 0.0012 + sampleHeight(u, v) * maxRelief;
    pos.setZ(i, z);
  }

  geometry.computeVertexNormals();
  geometry.normalizeNormals();

  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(0, 0, baseTop + 0.0025);
  return mesh;
}







const LOCAL_FONT_STACKS = {
  helvetiker: '"Helvetica Neue", Arial, sans-serif',
  optimer: '"Avenir Next", "Trebuchet MS", sans-serif',
  gentilis: 'Georgia, "Times New Roman", serif',
  droid_serif: '"Palatino Linotype", Palatino, Georgia, serif',
  cursive: '"Brush Script MT", "Segoe Script", "Apple Chancery", cursive'
};

function createTextRaster(text, fontKey, requestedSizeMm, alignment) {
  const canvas = document.createElement("canvas");
  canvas.width = 4096;
  canvas.height = 2048;

  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const fontStack =
    LOCAL_FONT_STACKS[fontKey] || LOCAL_FONT_STACKS.helvetiker;

  const lines = text
    .replace(/\r/g, "")
    .split("\n")
    .slice(0, 4)
    .map(line => line || " ");

  const normalizedSize = THREE.MathUtils.clamp(
    (requestedSizeMm - 6) / (32 - 6),
    0,
    1
  );

  let fontSize = Math.round(
    THREE.MathUtils.lerp(300, 860, normalizedSize)
  );

  const maxWidth = canvas.width * 0.90;
  const maxHeight = canvas.height * 0.84;
  const lineSpacingFactor = 1.10;

  function measureCurrentFont() {
    ctx.font = `700 ${fontSize}px ${fontStack}`;
    const widths = lines.map(line => ctx.measureText(line).width);
    return {
      widths,
      widest: Math.max(...widths, 1),
      blockHeight: fontSize * lineSpacingFactor * lines.length
    };
  }

  let metrics = measureCurrentFont();
  while (
    fontSize > 96 &&
    (metrics.widest > maxWidth || metrics.blockHeight > maxHeight)
  ) {
    fontSize -= 10;
    metrics = measureCurrentFont();
  }

  ctx.font = `700 ${fontSize}px ${fontStack}`;
  ctx.textBaseline = "middle";
  ctx.fillStyle = "rgba(255,255,255,1)";

  const blockWidth = metrics.widest;
  const lineHeight = fontSize * lineSpacingFactor;
  const firstY = canvas.height / 2 - ((lines.length - 1) * lineHeight) / 2;

  let anchorX = canvas.width / 2;
  if (alignment === "left") {
    ctx.textAlign = "left";
    anchorX = canvas.width / 2 - blockWidth / 2;
  } else if (alignment === "right") {
    ctx.textAlign = "right";
    anchorX = canvas.width / 2 + blockWidth / 2;
  } else {
    ctx.textAlign = "center";
  }

  lines.forEach((line, index) => {
    ctx.fillText(line, anchorX, firstY + index * lineHeight);
  });

  const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = image.data;

  let minX = canvas.width, minY = canvas.height, maxX = 0, maxY = 0;
  let found = false;

  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) {
      const alpha = data[(y * canvas.width + x) * 4 + 3];
      if (alpha > 10) {
        found = true;
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
  }

  if (!found) {
    minX = 0;
    minY = 0;
    maxX = canvas.width - 1;
    maxY = canvas.height - 1;
  }

  const contentWidth = Math.max(1, maxX - minX + 1);
  const contentHeight = Math.max(1, maxY - minY + 1);

  return {
    canvas,
    ctx,
    data,
    width: canvas.width,
    height: canvas.height,
    bounds: { minX, minY, maxX, maxY, contentWidth, contentHeight },
    aspect: contentWidth / contentHeight,
    lineCount: lines.length
  };
}


function isTextCellFilled(raster, x0, y0, x1, y1) {
  let hits = 0;
  let total = 0;

  for (let y = y0; y < y1; y += 1) {
    for (let x = x0; x < x1; x += 1) {
      const alpha = raster.data[(y * raster.width + x) * 4 + 3];
      if (alpha > 48) hits++;
      total++;
    }
  }

  return total > 0 && (hits / total) > 0.14;
}

function buildVoxelTextGeometry(textWidth, textHeight, textDepth, raster) {
  const isMobileText = window.matchMedia("(max-width: 900px)").matches;
  const rows = THREE.MathUtils.clamp(
    Math.round(textHeight * (isMobileText ? 1250 : 1750)),
    isMobileText ? 110 : 150,
    isMobileText ? 220 : 320
  );
  const cols = THREE.MathUtils.clamp(
    Math.round(rows * raster.aspect),
    isMobileText ? 140 : 180,
    isMobileText ? 720 : 1100
  );

  const cellW = textWidth / cols;
  const cellH = textHeight / rows;

  const geometries = [];
  const { minX, minY, contentWidth, contentHeight } = raster.bounds;

  for (let row = 0; row < rows; row++) {
    let runStart = -1;

    for (let col = 0; col <= cols; col++) {
      let filled = false;
      if (col < cols) {
        const px0 = Math.floor(minX + (col / cols) * contentWidth);
        const px1 = Math.ceil(minX + ((col + 1) / cols) * contentWidth);
        const py0 = Math.floor(minY + (row / rows) * contentHeight);
        const py1 = Math.ceil(minY + ((row + 1) / rows) * contentHeight);
        filled = isTextCellFilled(raster, px0, py0, px1, py1);
      }

      if (filled && runStart === -1) {
        runStart = col;
      }

      const shouldClose = (!filled || col === cols) && runStart !== -1;
      if (shouldClose) {
        const runEnd = col;
        const runCols = runEnd - runStart;
        const boxW = runCols * cellW;
        const boxH = cellH * 1.08;

        const geom = new THREE.BoxGeometry(
          boxW,
          boxH,
          textDepth
        );

        const centerX = -textWidth / 2 + (runStart * cellW) + boxW / 2;
        const centerY = textHeight / 2 - (row * cellH) - cellH / 2;

        geom.translate(centerX, centerY, textDepth / 2);
        geometries.push(geom);
        runStart = -1;
      }
    }
  }

  if (geometries.length === 0) return null;
  if (geometries.length === 1) return geometries[0];

  const merged = mergeGeometries(geometries, false);
  geometries.forEach(g => g.dispose());
  return merged;
}

function createRaisedTextMaterial(baseMaterial) {
  const color = baseMaterial.color.clone().offsetHSL(0, 0, 0.03);

  return new THREE.MeshPhysicalMaterial({
    color,
    roughness: Math.max(0.15, baseMaterial.roughness - 0.05),
    metalness: 0,
    clearcoat: baseMaterial.clearcoat,
    clearcoatRoughness: baseMaterial.clearcoatRoughness,
    sheen: baseMaterial.sheen,
    sheenColor: color.clone().lerp(new THREE.Color(0xffffff), 0.12),
    sheenRoughness: 0.66,
    reflectivity: 0.38,
    ior: 1.50,
    envMapIntensity: 0.36,
    side: THREE.DoubleSide
  });
}

function createInsetTextMaterial(baseMaterial) {
  const color = baseMaterial.color.clone().multiplyScalar(0.60);

  return new THREE.MeshPhysicalMaterial({
    color,
    roughness: Math.min(1, baseMaterial.roughness + 0.16),
    metalness: 0,
    clearcoat: Math.max(0.06, baseMaterial.clearcoat * 0.30),
    clearcoatRoughness: 0.55,
    sheen: 0.02,
    reflectivity: 0.18,
    ior: 1.46,
    envMapIntensity: 0.18,
    side: THREE.DoubleSide
  });
}



function createBooleanCutMaskTexture(raster, tileWidth, tileHeight, textWidth, textHeight) {
  const canvas = document.createElement("canvas");
  const resolution = 2048;
  canvas.width = resolution;
  canvas.height = Math.max(
    1024,
    Math.round(resolution * (tileHeight / tileWidth))
  );

  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "rgba(255,255,255,1)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const drawW = canvas.width * (textWidth / tileWidth);
  const drawH = canvas.height * (textHeight / tileHeight);
  const x = (canvas.width - drawW) / 2;
  const y = (canvas.height - drawH) / 2;

  ctx.globalCompositeOperation = "destination-out";
  ctx.drawImage(raster.canvas, x, y, drawW, drawH);
  ctx.globalCompositeOperation = "source-over";

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.NoColorSpace;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = true;
  texture.anisotropy = Math.min(
    16,
    renderer.capabilities.getMaxAnisotropy()
  );
  texture.needsUpdate = true;
  return texture;
}

function createBooleanCoverPlane(tileWidth, tileHeight, baseMaterial, baseTop, raster, textWidth, textHeight) {
  const alphaTexture = createBooleanCutMaskTexture(
    raster,
    tileWidth,
    tileHeight,
    textWidth,
    textHeight
  );

  const material = new THREE.MeshPhysicalMaterial({
    color: baseMaterial.color.clone(),
    alphaMap: alphaTexture,
    transparent: true,
    alphaTest: 0.22,
    roughness: baseMaterial.roughness,
    metalness: 0,
    clearcoat: baseMaterial.clearcoat,
    clearcoatRoughness: baseMaterial.clearcoatRoughness,
    sheen: baseMaterial.sheen,
    envMapIntensity: 0.28,
    side: THREE.DoubleSide,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2
  });

  const plane = new THREE.Mesh(
    new THREE.PlaneGeometry(tileWidth, tileHeight),
    material
  );
  plane.position.z = baseTop + 0.0013;
  plane.renderOrder = 11;
  plane.userData.disposableTexture = alphaTexture;
  return plane;
}


function buildTextObject(w, h, baseMaterial, baseTop) {
  const text = state.appliedText.trim();
  if (!text) return null;

  const raster = createTextRaster(text, state.textFont, state.textSize, state.textAlign);

  let textHeight = state.textSize / 100;
  textHeight = Math.min(textHeight * Math.max(1, raster.lineCount * 0.92), h * 0.46);

  let textWidth = textHeight * raster.aspect;
  const maxWidth = w * 0.70;

  if (textWidth > maxWidth) {
    const scale = maxWidth / textWidth;
    textWidth *= scale;
    textHeight *= scale;
  }

  const textDepth = Math.max(0.006, state.textDepth / 100);
  const textGeometry = buildVoxelTextGeometry(
    textWidth,
    textHeight,
    textDepth,
    raster
  );

  if (!textGeometry) return null;

  if (!state.textNegative) {
    const mesh = new THREE.Mesh(
      textGeometry,
      createRaisedTextMaterial(baseMaterial)
    );
    mesh.position.z = baseTop + 0.0015;
    mesh.renderOrder = 9;
    return mesh;
  }

  const group = new THREE.Group();

  // Fondo della cavità.
  const floorGeometry = textGeometry.clone();
  floorGeometry.scale(0.985, 0.985, 0.96);

  const floorMesh = new THREE.Mesh(
    floorGeometry,
    createInsetTextMaterial(baseMaterial)
  );
  floorMesh.position.z = baseTop - textDepth + 0.0011;
  floorMesh.renderOrder = 9;

  // Parete/bordo interno della cavità.
  const wallGeometry = textGeometry.clone();
  wallGeometry.scale(1.045, 1.045, 0.26);

  const wallMaterial = createRaisedTextMaterial(baseMaterial);
  wallMaterial.color.multiplyScalar(0.82);
  wallMaterial.roughness = Math.min(1, wallMaterial.roughness + 0.20);
  wallMaterial.clearcoat = 0.08;

  const wallMesh = new THREE.Mesh(wallGeometry, wallMaterial);
  wallMesh.position.z = baseTop - textDepth * 0.18 + 0.0010;
  wallMesh.renderOrder = 10;

  // Piano di copertura con foro del testo: simula un boolean in tempo reale.
  const coverPlane = createBooleanCoverPlane(
    w,
    h,
    baseMaterial,
    baseTop,
    raster,
    textWidth,
    textHeight
  );

  group.add(floorMesh);
  group.add(wallMesh);
  group.add(coverPlane);
  return group;
}


function flashViewer() {
  const panel = document.querySelector(".viewer-panel");
  panel.classList.remove("viewer-updated");
  void panel.offsetWidth;
  panel.classList.add("viewer-updated");
}

function rebuildTile() {
  clearGroup(tileGroup);

  // La base viene sempre costruita per prima: anche se una personalizzazione
  // genera un errore, la mattonella resta visibile.

  const w = state.width / 100;
  const h = state.height / 100;
  const thickness = 0.08;

  const glaze = GLAZES[state.glaze] || GLAZES.sabbia;
  const glazeColor = new THREE.Color(glaze.color);

  const ceramic = new THREE.MeshPhysicalMaterial({
    color: glazeColor,
    roughness: glaze.roughness,
    metalness: 0,
    clearcoat: glaze.clearcoat,
    clearcoatRoughness: glaze.clearcoatRoughness,
    sheen: glaze.sheen,
    sheenColor: glazeColor.clone().lerp(new THREE.Color(0xffffff), 0.18),
    sheenRoughness: 0.72,
    reflectivity: 0.46,
    ior: 1.52,
    normalMap: ceramicNormalTexture,
    normalScale: new THREE.Vector2(0.045, 0.045),
    roughnessMap: ceramicCrackleTexture,
    bumpMap: ceramicCrackleTexture,
    bumpScale: 0.0025,
    envMapIntensity: glaze.roughness < 0.3 ? 0.78 : 0.42,
    side: THREE.DoubleSide
  });

  const reliefMat = ceramic.clone();

  const baseShape = roundedRectShape(w, h, Math.min(w,h)*.055);
  const base = extrudedShape(baseShape, thickness, ceramic, 0);
  tileGroup.add(base);

  const baseTop = thickness / 2;
  try {
    tileGroup.add(buildStandardFrame(w, h, reliefMat, baseTop));
  } catch (frameError) {
    console.error("Errore nella cornice:", frameError);
  }

  if (state.serviceType === "image" && state.textureEnabled && state.heightData) {
    tileGroup.add(buildHeightmapRelief(w, h, reliefMat, baseTop));
  }

  if (state.serviceType === "text") {
    const textMesh = buildTextObject(w, h, reliefMat, baseTop);
    if (textMesh) tileGroup.add(textMesh);
  }

  const maxSide = Math.max(w,h);
  tileGroup.scale.setScalar(1.0 / maxSide);

  updateUi();
  flashViewer();
}

function estimatePricePerSquareMeter() {
  const minimumRate = 45;
  const reliefSurcharge = state.textureEnabled
    ? Math.max(0, state.imageRelief - 1) * 1.5
    : 0;
  const customReliefSurcharge = state.textureEnabled ? 4 : 0;

  return Math.max(
    minimumRate,
    minimumRate + reliefSurcharge + customReliefSurcharge
  );
}

function updateUi() {
  widthOut.textContent = `${state.width} mm`;
  heightOut.textContent = `${state.height} mm`;
  imageReliefOut.textContent = `${state.imageRelief.toFixed(1)} mm`;
  imageContrastOut.textContent = `${state.imageContrast}%`;
  textSizeOut.textContent = `${state.textSize} mm`;
  textDepthOut.textContent = `${state.textDepth.toFixed(1)} mm`;

  const glaze = GLAZES[state.glaze] || GLAZES.sabbia;
  const dimensions = `${state.width} × ${state.height} mm`;
  summaryText.textContent = dimensions;
  orderSummary.textContent = `${dimensions} · ${glaze.label}`;

  const pricePerSquareMeter = estimatePricePerSquareMeter();
  price.innerHTML =
    `${new Intl.NumberFormat("it-IT", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(pricePerSquareMeter)} € <small>/m²</small>`;
}

function bindRange(id, key, numeric = true) {
  document.querySelector(`#${id}`).addEventListener("input", e => {
    state[key] = numeric ? Number(e.target.value) : e.target.value;
    rebuildTile();
  });
}

bindRange("width", "width");
bindRange("height", "height");
document.querySelector("#imageRelief").addEventListener("input", event => {
  state.imageRelief = Number(event.target.value);
  document.querySelector("#imageReliefOut").textContent =
    `${state.imageRelief.toFixed(1)} mm`;
  rebuildTile();
});

document.querySelector("#imageContrast").addEventListener("input", event => {
  state.imageContrast = Number(event.target.value);
  document.querySelector("#imageContrastOut").textContent =
    `${state.imageContrast}%`;
  rebuildTile();
});


document.querySelector("#invertRelief").addEventListener("change", e => {
  state.invertRelief = e.target.checked;
  rebuildTile();
});



const textServiceTab = document.querySelector("#textServiceTab");
const imageServiceTab = document.querySelector("#imageServiceTab");
const textServicePanel = document.querySelector("#textServicePanel");
const imageServicePanel = document.querySelector("#imageServicePanel");

function updateServiceVisibility() {
  const isText = state.serviceType === "text";
  textServiceTab.classList.toggle("active", isText);
  imageServiceTab.classList.toggle("active", !isText);
  textServiceTab.setAttribute("aria-selected", String(isText));
  imageServiceTab.setAttribute("aria-selected", String(!isText));
  textServicePanel.hidden = !isText;
  imageServicePanel.hidden = isText;
}
textServiceTab.addEventListener("click",()=>{state.serviceType="text";updateServiceVisibility();rebuildTile()});
imageServiceTab.addEventListener("click",()=>{state.serviceType="image";updateServiceVisibility();rebuildTile()});

const applyTextButton = document.querySelector("#applyTextButton");
const textApplyStatus = document.querySelector("#textApplyStatus");

document.querySelector("#tileText").addEventListener("input", event => {
  state.tileText = event.target.value;
  textApplyStatus.textContent = "Premi “Applica scritta” per aggiornare la mattonella.";
  textApplyStatus.className = "text-apply-status";
});

applyTextButton.addEventListener("click", () => {
  const value = state.tileText.trim();

  if (!value) {
    state.appliedText = "";
    textApplyStatus.textContent = "Scritta rimossa dalla mattonella.";
    textApplyStatus.className = "text-apply-status success";
    rebuildTile();
    return;
  }

  state.appliedText = value;
  rebuildTile();

  textApplyStatus.textContent =
    "Modello 3D della scritta applicato.";
  textApplyStatus.className = "text-apply-status success";
});

const fontPicker = document.querySelector("#fontPicker");
const fontPickerButton = document.querySelector("#fontPickerButton");
const fontPickerMenu = document.querySelector("#fontPickerMenu");
const fontPickerLabel = document.querySelector("#fontPickerLabel");
const fontOptions = document.querySelectorAll(".font-option");

const FONT_CLASS_NAMES = [
  "font-modern",
  "font-elegant",
  "font-classic",
  "font-serif",
  "font-cursive"
];

function closeFontPicker() {
  fontPicker.classList.remove("open");
  fontPickerButton.setAttribute("aria-expanded", "false");
  fontPickerMenu.hidden = true;
}

fontPickerButton.addEventListener("click", () => {
  const willOpen = fontPickerMenu.hidden;

  if (willOpen) {
    fontPicker.classList.add("open");
    fontPickerButton.setAttribute("aria-expanded", "true");
    fontPickerMenu.hidden = false;
  } else {
    closeFontPicker();
  }
});

fontOptions.forEach(option => {
  option.addEventListener("click", () => {
    state.textFont = option.dataset.font;

    fontOptions.forEach(item => item.classList.remove("active"));
    option.classList.add("active");

    FONT_CLASS_NAMES.forEach(name => {
      fontPickerButton.classList.remove(name);
    });

    const selectedClass = FONT_CLASS_NAMES.find(name =>
      option.classList.contains(name)
    );

    if (selectedClass) {
      fontPickerButton.classList.add(selectedClass);
    }

    fontPickerLabel.textContent = option.dataset.label;
    closeFontPicker();

    if (state.appliedText) {
      rebuildTile();
      textApplyStatus.textContent = "Font aggiornato.";
      textApplyStatus.className = "text-apply-status success";
    }
  });
});

document.addEventListener("click", event => {
  if (!fontPicker.contains(event.target)) {
    closeFontPicker();
  }
});

document.querySelector("#textSize").addEventListener("input", event => {
  state.textSize = Number(event.target.value);

  document.querySelector("#textSizeOut").value =
    `${state.textSize} mm`;
  document.querySelector("#textSizeOut").textContent =
    `${state.textSize} mm`;

  if (state.appliedText) {
    rebuildTile();
    textApplyStatus.textContent =
      `Dimensione modello testo: ${state.textSize} mm`;
    textApplyStatus.className = "text-apply-status success";
  }
});


const alignmentButtons = document.querySelectorAll(".alignment-button");
alignmentButtons.forEach(button => {
  button.addEventListener("click", () => {
    state.textAlign = button.dataset.align;

    alignmentButtons.forEach(item => {
      const active = item === button;
      item.classList.toggle("active", active);
      item.setAttribute("aria-pressed", String(active));
    });

    if (state.appliedText) {
      rebuildTile();
      const label = {
        left: "sinistra",
        center: "centro",
        right: "destra"
      }[state.textAlign];
      textApplyStatus.textContent = `Allineamento: ${label}.`;
      textApplyStatus.className = "text-apply-status success";
    }
  });
});

document.querySelector("#textNegative").addEventListener("change", event => {
  state.textNegative = event.target.checked;

  if (state.appliedText) {
    rebuildTile();
    textApplyStatus.textContent = state.textNegative
      ? "Modalità incisa applicata."
      : "Modalità in rilievo applicata.";
    textApplyStatus.className = "text-apply-status success";
  }
});

document.querySelector("#textDepth").addEventListener("input", event => {
  state.textDepth = Number(event.target.value);

  const formattedDepth = `${state.textDepth.toFixed(1)} mm`;
  document.querySelector("#textDepthOut").value = formattedDepth;
  document.querySelector("#textDepthOut").textContent = formattedDepth;

  if (state.appliedText) {
    rebuildTile();
    textApplyStatus.textContent =
      `Profondità modello testo: ${formattedDepth}`;
    textApplyStatus.className = "text-apply-status success";
  }
});

document.querySelector("#frameStyle").addEventListener("change", event => {
  state.frameStyle = event.target.value;
  rebuildTile();
});
document.querySelector("#glaze").addEventListener("change", event => {
  state.glaze = event.target.value;
  rebuildTile();
});

document.querySelector("#resetView").addEventListener("click", () => {
  tileGroup.rotation.set(-0.10, 0.22, 0);
  fitCameraToTile();
  hasUserAdjustedCamera = false;
});

const textureFile = document.querySelector("#textureFile");
const textureEnabled = document.querySelector("#textureEnabled");
const removeTexture = document.querySelector("#removeTexture");
const texturePreview = document.querySelector("#texturePreview");
const texturePreviewWrap = document.querySelector("#texturePreviewWrap");
const imageRelief = document.querySelector("#imageRelief");
const imageContrast = document.querySelector("#imageContrast");
const invertRelief = document.querySelector("#invertRelief");

textureFile.addEventListener("change", event => {
  const file = event.target.files?.[0];
  if (!file) return;

  const allowedTypes = ["image/png", "image/jpeg", "image/webp"];
  if (!allowedTypes.includes(file.type)) {
    alert("Formato non supportato. Usa PNG, JPG o WEBP.");
    textureFile.value = "";
    return;
  }

  if (file.size > 16 * 1024 * 1024) {
    alert("Il file supera 16 MB.");
    textureFile.value = "";
    return;
  }

  state.originalFile = file;

  const reader = new FileReader();
  reader.onload = e => {
    const img = new Image();
    img.onload = () => {
      // Mantiene molta più informazione rispetto alla precedente
      // elaborazione a 256 px.
      const isMobileDevice = window.matchMedia("(max-width: 900px)").matches;
      const maxSize = isMobileDevice ? 1280 : 2048;
      const ratio = Math.min(maxSize / img.width, maxSize / img.height, 1);
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(2, Math.round(img.width * ratio));
      canvas.height = Math.max(2, Math.round(img.height * ratio));
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";

      // Transparent PNG areas are treated as white background.
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      const raw = new Float32Array(canvas.width * canvas.height);
      let minGray = 255;
      let maxGray = 0;

      for (let i = 0; i < raw.length; i++) {
        const r = pixels[i*4];
        const g = pixels[i*4+1];
        const b = pixels[i*4+2];
        const gray = 0.2126*r + 0.7152*g + 0.0722*b;
        raw[i] = gray;
        minGray = Math.min(minGray, gray);
        maxGray = Math.max(maxGray, gray);
      }

      const heights = new Uint8Array(raw.length);
      const range = Math.max(8, maxGray - minGray);

      // Normalize contrast so logos and thin lines remain clearly visible.
      for (let i = 0; i < heights.length; i++) {
        heights[i] = Math.round(((raw[i] - minGray) / range) * 255);
      }

      // Una sfocatura molto leggera elimina il gradino del singolo pixel
      // senza cancellare i dettagli del disegno.
      const longestSide = Math.max(canvas.width, canvas.height);
      const blurRadius =
        longestSide >= 1400 ? 4 :
        longestSide >= 1000 ? 3 :
        longestSide >= 700 ? 2 : 1;

      state.heightData = gaussianBlurGray(
        heights,
        canvas.width,
        canvas.height,
        blurRadius
      );
      state.heightWidth = canvas.width;
      state.heightHeight = canvas.height;
      state.textureEnabled = true;

      texturePreview.src = e.target.result;
      texturePreviewWrap.hidden = false;
      textureEnabled.checked = true;
      textureEnabled.disabled = false;
      invertRelief.checked = state.invertRelief;
      removeTexture.disabled = false;
      imageRelief.disabled = false;
      imageContrast.disabled = false;
      invertRelief.disabled = false;
      rebuildTile();
    };
    img.onerror = () => alert("Immagine non leggibile.");
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
});

textureEnabled.addEventListener("change", event => {
  state.textureEnabled = event.target.checked;
  rebuildTile();
});

removeTexture.addEventListener("click", () => {
  state.heightData = null;
  state.originalFile = null;
  state.heightWidth = 0;
  state.heightHeight = 0;
  state.textureEnabled = false;
  textureEnabled.checked = false;
  textureEnabled.disabled = true;
  removeTexture.disabled = true;
  imageRelief.disabled = true;
  imageContrast.disabled = true;
  invertRelief.disabled = true;
  invertRelief.checked = true;
  state.invertRelief = true;
  texturePreviewWrap.hidden = true;
  texturePreview.removeAttribute("src");
  textureFile.value = "";
  rebuildTile();
});


const orderForm = document.querySelector("#orderForm");
const submitOrder = document.querySelector("#submitOrder");
const orderStatus = document.querySelector("#orderStatus");
const orderSummary = document.querySelector("#orderSummary");

function isSupabaseConfigured() {
  const cfg = window.KANE_CONFIG || {};
  return Boolean(
    cfg.supabaseUrl &&
    cfg.supabaseAnonKey &&
    !cfg.supabaseUrl.includes("INSERISCI") &&
    !cfg.supabaseAnonKey.includes("INSERISCI")
  );
}

function safeExtension(file) {
  const map = {
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/webp": "webp"
  };
  return map[file?.type] || "bin";
}

function makeOrderCode() {
  const shortId = crypto.randomUUID().split("-")[0].toUpperCase();
  const year = new Date().getFullYear();
  return `KANE-${year}-${shortId}`;
}


orderForm.addEventListener("submit", async event => {
  event.preventDefault();

  if (document.querySelector("#websiteField").value) return;

  const email = document.querySelector("#customerEmail").value.trim().toLowerCase();
  const quantity = Number(document.querySelector("#orderQuantity").value);

  if (!email || !email.includes("@")) {
    orderStatus.textContent = "Inserisci un indirizzo email valido.";
    orderStatus.className = "order-status error";
    return;
  }

  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 10000) {
    orderStatus.textContent = "Inserisci una quantità valida.";
    orderStatus.className = "order-status error";
    return;
  }

  if (state.serviceType === "image" && (!state.originalFile || !state.heightData)) {
    orderStatus.textContent = "Carica prima l’immagine da trasformare in rilievo.";
    orderStatus.className = "order-status error";
    return;
  }

  if (state.serviceType === "text" && !state.appliedText.trim()) {
    orderStatus.textContent = "Inserisci prima la scritta da applicare alla mattonella.";
    orderStatus.className = "order-status error";
    return;
  }

  if (!isSupabaseConfigured()) {
    orderStatus.textContent =
      "Supabase non è ancora configurato. Compila il file config.js.";
    orderStatus.className = "order-status error";
    return;
  }

  submitOrder.disabled = true;
  submitOrder.textContent = "Invio in corso…";
  orderStatus.textContent = "Caricamento del file e salvataggio della richiesta…";
  orderStatus.className = "order-status";

  const cfg = window.KANE_CONFIG;
  const supabaseClient = window.supabase.createClient(
    cfg.supabaseUrl,
    cfg.supabaseAnonKey
  );

  const orderId = crypto.randomUUID();
  const orderCode = makeOrderCode();
  const extension = state.originalFile ? safeExtension(state.originalFile) : "txt";
  const filePath = state.serviceType === "image"
    ? `${orderId}/original.${extension}`
    : `${orderId}/text-order.txt`;

  try {
    if (state.serviceType === "image") {
      const { error: uploadError } = await supabaseClient.storage
        .from(cfg.storageBucket || "order-files")
        .upload(filePath, state.originalFile, {
          cacheControl: "3600",
          upsert: false,
          contentType: state.originalFile.type
        });

      if (uploadError) throw uploadError;
    }

    const configuration = {
      width_mm: state.width,
      height_mm: state.height,
      tile_thickness_mm: 8,
      image_relief_mm: state.imageRelief,
      image_contrast_percent: state.imageContrast,
      dark_areas_raised: state.invertRelief,
      glaze_code: state.glaze,
      glaze_label: (GLAZES[state.glaze] || GLAZES.sabbia).label,
      glaze_preview_color: (GLAZES[state.glaze] || GLAZES.sabbia).color,
      service_type: state.serviceType,
      custom_text: state.serviceType === "text" ? state.appliedText.trim() : "",
      text_font: state.serviceType === "text" ? state.textFont : null,
      text_size_mm: state.serviceType === "text" ? state.textSize : null,
      text_negative: state.serviceType === "text" ? state.textNegative : null,
      text_alignment: state.serviceType === "text" ? state.textAlign : null,
      text_depth_mm: state.serviceType === "text" ? state.textDepth : null,
      frame_style: state.frameStyle,
      estimated_price_per_sqm_eur: Number(
        estimatePricePerSquareMeter().toFixed(2)
      ),
      price_unit: "EUR/m2",
      minimum_price_per_sqm_eur: 45
    };

    const { error: insertError } = await supabaseClient
      .from("orders")
      .insert({
        id: orderId,
        order_code: orderCode,
        email,
        quantity,
        configuration,
        source_file_path: filePath,
        status: "nuovo"
      });

    if (insertError) {
      if (state.serviceType === "image") {
        await supabaseClient.storage
          .from(cfg.storageBucket || "order-files")
          .remove([filePath]);
      }
      throw insertError;
    }

    orderStatus.textContent =
      `Richiesta inviata. Il codice è ${orderCode}. Riceverai la risposta all’email indicata.`;
    orderStatus.className = "order-status success";
    submitOrder.textContent = "Proponi ordine";

    orderForm.reset();
    document.querySelector("#orderQuantity").value = "1";
    submitOrder.disabled = false;

  } catch (error) {
    console.error(error);
    orderStatus.textContent =
      "Invio non riuscito. Controlla la configurazione Supabase e riprova.";
    orderStatus.className = "order-status error";
    submitOrder.disabled = false;
    submitOrder.textContent = "Proponi ordine";
  }
});







function fitCameraToTile() {
  if (!tileGroup || tileGroup.children.length === 0) return;

  scene.updateMatrixWorld(true);

  const box = new THREE.Box3().setFromObject(tileGroup);
  if (box.isEmpty()) return;

  const size = new THREE.Vector3();
  const center = new THREE.Vector3();
  box.getSize(size);
  box.getCenter(center);

  const verticalFov = THREE.MathUtils.degToRad(camera.fov);
  const horizontalFov =
    2 * Math.atan(Math.tan(verticalFov / 2) * camera.aspect);

  const distanceForHeight =
    size.y / Math.max(0.001, 2 * Math.tan(verticalFov / 2));
  const distanceForWidth =
    size.x / Math.max(0.001, 2 * Math.tan(horizontalFov / 2));

  const isDesktop = window.matchMedia("(min-width: 901px)").matches;
  const framingMultiplier = isDesktop ? 1.92 : 1.58;
  const minimumDistance = isDesktop ? 2.85 : 2.30;

  const distance = Math.max(
    minimumDistance,
    Math.max(distanceForHeight, distanceForWidth) * framingMultiplier
  );

  controls.target.copy(center);
  camera.position.set(
    center.x + distance * 0.10,
    center.y + distance * 0.07,
    center.z + distance
  );

  camera.near = 0.01;
  camera.far = 100;
  camera.updateProjectionMatrix();
  controls.update();
}

function resize() {
  const w = Math.max(1, viewer.clientWidth);
  const h = Math.max(1, viewer.clientHeight);

  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
window.addEventListener("resize", resize);
if ("ResizeObserver" in window) {
  const viewerResizeObserver = new ResizeObserver(() => {
    resize();
  });
  viewerResizeObserver.observe(viewer);
}

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}

resize();
updateServiceVisibility();
rebuildTile();


requestAnimationFrame(() => {
  if (!hasInitialCameraFrame) {
    fitCameraToTile();
    hasInitialCameraFrame = true;
  }
  animate();
});
