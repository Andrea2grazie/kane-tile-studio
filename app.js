import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";


const GLAZES = {
  nero_opaco: {
    label: "Nero opaco",
    color: "#171918",
    roughness: 0.86
  },
  bianco_lucido: {
    label: "Bianco lucido",
    color: "#e8e6df",
    roughness: 0.18
  },
  verde_oliva_lucido: {
    label: "Verde oliva lucido",
    color: "#626a43",
    roughness: 0.18
  },
  tortora: {
    label: "Tortora",
    color: "#988b7c",
    roughness: 0.46
  },
  sabbia: {
    label: "Sabbia",
    color: "#b99463",
    roughness: 0.62
  },
  altro: {
    label: "Altro colore da concordare",
    color: "#aaa79f",
    roughness: 0.42
  }
};

const viewer = document.querySelector("#viewer");
const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
camera.position.set(0, 0.1, 3.05);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = false;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.95;
viewer.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.target.set(0, 0, 0);
controls.minDistance = 2;
controls.maxDistance = 7;

const ambient = new THREE.AmbientLight(0xffffff, 1.7);
scene.add(ambient);

const key = new THREE.DirectionalLight(0xffffff, 1.8);
key.position.set(2.8, 3.5, 4);
scene.add(key);

const fill = new THREE.DirectionalLight(0xdfe9ff, 0.75);
fill.position.set(-3, 1.5, 3);
scene.add(fill);




const tileGroup = new THREE.Group();
tileGroup.rotation.x = -0.12;
tileGroup.rotation.y = 0.24;
scene.add(tileGroup);

const state = {
  width: 100,
  height: 100,
  relief: 8,
  glaze: "sabbia",
  textureEnabled: false,
  imageRelief: 3,
  imageContrast: 100,
  invertRelief: true,
  heightData: null,
  heightWidth: 0,
  heightHeight: 0,
  originalFile: null
};

function disposeObject(obj) {
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

function buildHeightmapRelief(w, h, material, baseTop) {
  const segments = 180;

  // L'immagine viene contenuta nell'area utile senza deformazioni.
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

  const geometry = new THREE.PlaneGeometry(reliefW, reliefH, segments, segments);
  const pos = geometry.attributes.position;
  const maxRelief = state.imageRelief / 100;

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const u = (x / reliefW) + 0.5;
    const v = (y / reliefH) + 0.5;
    const z = 0.0015 + sampleHeight(u, v) * maxRelief;
    pos.setZ(i, z);
  }

  geometry.computeVertexNormals();

  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(0, 0, baseTop + 0.003);
  return mesh;
}

function flashViewer() {
  const panel = document.querySelector(".viewer-panel");
  panel.classList.remove("viewer-updated");
  void panel.offsetWidth;
  panel.classList.add("viewer-updated");
}

function rebuildTile() {
  clearGroup(tileGroup);

  const w = state.width / 100;
  const h = state.height / 100;
  const thickness = state.relief / 100;

  const glaze = GLAZES[state.glaze] || GLAZES.sabbia;
  const glazeColor = new THREE.Color(glaze.color);

  const ceramic = new THREE.MeshPhysicalMaterial({
    color: glazeColor,
    roughness: glaze.roughness,
    metalness: 0,
    clearcoat: glaze.roughness < 0.3 ? 0.9 : 0.28,
    clearcoatRoughness: glaze.roughness < 0.3 ? 0.12 : 0.45,
    sheen: 0.18,
    sheenRoughness: 0.72,
    reflectivity: 0.4,
    side: THREE.DoubleSide
  });

  // Stesso identico materiale per base e rilievo:
  // il colore cambia uniformemente su tutta la mattonella.
  const reliefMat = ceramic.clone();

  const baseShape = roundedRectShape(w, h, Math.min(w,h)*.055);
  const base = extrudedShape(baseShape, thickness, ceramic, 0);
  tileGroup.add(base);

  const baseTop = thickness / 2;
  if (state.textureEnabled && state.heightData) {
    tileGroup.add(buildHeightmapRelief(w, h, reliefMat, baseTop));
  }

  const maxSide = Math.max(w,h);
  tileGroup.scale.setScalar(1.72 / maxSide);
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
  reliefOut.textContent = `${state.relief.toFixed(1)} mm`;
  imageReliefOut.textContent = `${state.imageRelief.toFixed(1)} mm`;
  imageContrastOut.textContent = `${state.imageContrast}%`;

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
bindRange("relief", "relief");
bindRange("imageRelief", "imageRelief");
bindRange("imageContrast", "imageContrast");


document.querySelector("#invertRelief").addEventListener("change", e => {
  state.invertRelief = e.target.checked;
  rebuildTile();
});

document.querySelector("#glaze").addEventListener("change", event => {
  state.glaze = event.target.value;
  rebuildTile();
});

document.querySelector("#resetView").addEventListener("click", () => {
  camera.position.set(0, 0.1, 3.05);
  controls.target.set(0, 0, 0);
  tileGroup.rotation.set(-0.12, 0.24, 0);
  controls.update();
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

  if (file.size > 8 * 1024 * 1024) {
    alert("Il file supera 8 MB.");
    textureFile.value = "";
    return;
  }

  state.originalFile = file;

  const reader = new FileReader();
  reader.onload = e => {
    const img = new Image();
    img.onload = () => {
      const maxSize = 256;
      const ratio = Math.min(maxSize / img.width, maxSize / img.height, 1);
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(2, Math.round(img.width * ratio));
      canvas.height = Math.max(2, Math.round(img.height * ratio));
      const ctx = canvas.getContext("2d", { willReadFrequently: true });

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

      state.heightData = heights;
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

  if (!state.originalFile || !state.heightData) {
    orderStatus.textContent = "Carica prima l’immagine da trasformare in rilievo.";
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
  const extension = safeExtension(state.originalFile);
  const filePath = `${orderId}/original.${extension}`;

  try {
    const { error: uploadError } = await supabaseClient.storage
      .from(cfg.storageBucket || "order-files")
      .upload(filePath, state.originalFile, {
        cacheControl: "3600",
        upsert: false,
        contentType: state.originalFile.type
      });

    if (uploadError) throw uploadError;

    const configuration = {
      width_mm: state.width,
      height_mm: state.height,
      tile_thickness_mm: state.relief,
      image_relief_mm: state.imageRelief,
      image_contrast_percent: state.imageContrast,
      dark_areas_raised: state.invertRelief,
      glaze_code: state.glaze,
      glaze_label: (GLAZES[state.glaze] || GLAZES.sabbia).label,
      glaze_preview_color: (GLAZES[state.glaze] || GLAZES.sabbia).color,
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
      await supabaseClient.storage
        .from(cfg.storageBucket || "order-files")
        .remove([filePath]);
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





function resize() {
  const w = viewer.clientWidth;
  const h = viewer.clientHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
window.addEventListener("resize", resize);
if ("ResizeObserver" in window) {
  const viewerResizeObserver = new ResizeObserver(resize);
  viewerResizeObserver.observe(viewer);
}

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}

resize();
rebuildTile();
animate();
