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
    color: "#f4f3ed",
    roughness: 0.14
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
    color: "#d8c4a8",
    roughness: 0.56
  },
  altro: {
    label: "Altro colore da concordare",
    color: "#aaa79f",
    roughness: 0.42
  }
};

const viewer = document.querySelector("#viewer");
const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
camera.position.set(0, 2.4, 3.8);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
viewer.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.target.set(0, 0, 0);
controls.minDistance = 2;
controls.maxDistance = 7;

scene.add(new THREE.HemisphereLight(0xffffff, 0x6f6a60, 2.1));

const key = new THREE.DirectionalLight(0xffffff, 4.5);
key.position.set(3.5, 5, 4);
key.castShadow = true;
key.shadow.mapSize.set(2048, 2048);
scene.add(key);

const fill = new THREE.DirectionalLight(0xcfe3ff, 1.8);
fill.position.set(-4, 2, 1);
scene.add(fill);

const grazing = new THREE.DirectionalLight(0xfff0d5, 3.2);
grazing.position.set(-3.5, 0.6, 4.5);
scene.add(grazing);

const floor = new THREE.Mesh(
  new THREE.CircleGeometry(2.4, 96),
  new THREE.ShadowMaterial({ opacity: 0.16 })
);
floor.rotation.x = -Math.PI / 2;
floor.position.y = -0.34;
floor.receiveShadow = true;
scene.add(floor);

const tileGroup = new THREE.Group();
tileGroup.rotation.x = -0.42;
tileGroup.rotation.y = 0.42;
scene.add(tileGroup);

const state = {
  width: 100,
  height: 100,
  relief: 2.5,
  motif: "diamond",
  glaze: "sabbia",
  border: true,
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
  mesh.castShadow = true;
  mesh.receiveShadow = true;
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
  const availableFactor = state.border ? 0.76 : 0.88;
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
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function addBar(group, material, x, y, w, h, z, rotation = 0, depth = .045) {
  const shape = roundedRectShape(w, h, Math.min(w, h) * .18);
  const mesh = extrudedShape(shape, depth, material, z);
  mesh.position.x += x;
  mesh.position.y += y;
  mesh.rotation.z = rotation;
  group.add(mesh);
}

function buildDefaultMotif(material, z, scale) {
  const motif = new THREE.Group();
  const d = .045 + state.relief / 1000 * 1.2;

  if (state.motif === "diamond") {
    addBar(motif, material, 0, 0, .52 * scale, .12 * scale, z, Math.PI / 4, d);
    addBar(motif, material, 0, 0, .52 * scale, .12 * scale, z, -Math.PI / 4, d);
  } else if (state.motif === "sun") {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(.22 * scale, .045 * scale, 12, 64), material);
    ring.position.z = z;
    motif.add(ring);
    for (let i = 0; i < 12; i++) {
      const a = i / 12 * Math.PI * 2;
      addBar(motif, material, Math.cos(a)*.38*scale, Math.sin(a)*.38*scale, .19*scale, .055*scale, z, a, d);
    }
  } else if (state.motif === "waves") {
    for (let row = -2; row <= 2; row++) {
      for (let i = -2; i <= 2; i++) {
        const curve = new THREE.CatmullRomCurve3([
          new THREE.Vector3((-0.16+i*.19)*scale, (row*.14)*scale, z),
          new THREE.Vector3((-0.08+i*.19)*scale, (row*.14+.055)*scale, z),
          new THREE.Vector3((i*.19)*scale, (row*.14)*scale, z),
          new THREE.Vector3((0.08+i*.19)*scale, (row*.14-.055)*scale, z),
          new THREE.Vector3((0.16+i*.19)*scale, (row*.14)*scale, z)
        ]);
        const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 24, .018*scale, 8, false), material);
        tube.castShadow = true;
        motif.add(tube);
      }
    }
  } else {
    addBar(motif, material, 0, 0, .72*scale, .075*scale, z, 0, d);
    addBar(motif, material, 0, 0, .72*scale, .075*scale, z, Math.PI/2, d);
    addBar(motif, material, 0, 0, .48*scale, .075*scale, z, Math.PI/4, d);
    addBar(motif, material, 0, 0, .48*scale, .075*scale, z, -Math.PI/4, d);
  }

  tileGroup.add(motif);
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
  const thickness = .16;
  const reliefDepth = .028 + state.relief / 1000 * 1.8;

  const glaze = GLAZES[state.glaze] || GLAZES.sabbia;
  const glazeColor = new THREE.Color(glaze.color);

  const ceramic = new THREE.MeshStandardMaterial({
    color: glazeColor,
    roughness: glaze.roughness,
    metalness: 0
  });

  const reliefMat = new THREE.MeshStandardMaterial({
    color: glazeColor.clone().offsetHSL(0, 0, -0.045),
    roughness: Math.min(1, glaze.roughness + 0.08),
    metalness: 0
  });

  const baseShape = roundedRectShape(w, h, Math.min(w,h)*.055);
  const base = extrudedShape(baseShape, thickness, ceramic, 0);
  tileGroup.add(base);

  const baseTop = thickness / 2;
  const reliefZ = baseTop + reliefDepth / 2;

  if (state.border) {
    const borderShape = roundedRectShape(w*.90, h*.90, Math.min(w,h)*.035);
    const hole = roundedRectShape(w*.82, h*.82, Math.min(w,h)*.025);
    borderShape.holes.push(hole);
    tileGroup.add(extrudedShape(borderShape, reliefDepth, reliefMat, reliefZ));
  }

  if (state.textureEnabled && state.heightData) {
    tileGroup.add(buildHeightmapRelief(w, h, reliefMat, baseTop));
  } else {
    buildDefaultMotif(reliefMat, reliefZ, Math.min(w,h));
  }

  const maxSide = Math.max(w,h);
  tileGroup.scale.setScalar(1.25 / maxSide);
  updateUi();
  flashViewer();
}

function estimatePrice() {
  const areaFactor = (state.width * state.height) / 10000;
  const reliefFactor = state.textureEnabled ? state.imageRelief * 1.8 : state.relief * 1.2;
  return 20 + areaFactor * 6 + reliefFactor + (state.border ? 2 : 0) + (state.textureEnabled ? 8 : 0);
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

  price.textContent = new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR"
  }).format(estimatePrice());
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
bindRange("motif", "motif", false);
bindRange("imageRelief", "imageRelief");
bindRange("imageContrast", "imageContrast");

document.querySelector("#border").addEventListener("change", e => {
  state.border = e.target.checked;
  rebuildTile();
});

document.querySelector("#invertRelief").addEventListener("change", e => {
  state.invertRelief = e.target.checked;
  rebuildTile();
});

document.querySelector("#glaze").addEventListener("change", event => {
  state.glaze = event.target.value;
  rebuildTile();
});

document.querySelector("#resetView").addEventListener("click", () => {
  camera.position.set(0, 2.4, 3.8);
  controls.target.set(0, 0, 0);
  tileGroup.rotation.set(-0.42, 0.42, 0);
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
      base_relief_mm: state.relief,
      image_relief_mm: state.imageRelief,
      image_contrast_percent: state.imageContrast,
      dark_areas_raised: state.invertRelief,
      border: state.border,
      glaze_code: state.glaze,
      glaze_label: (GLAZES[state.glaze] || GLAZES.sabbia).label,
      glaze_preview_color: (GLAZES[state.glaze] || GLAZES.sabbia).color,
      estimated_unit_price_eur: Number(estimatePrice().toFixed(2))
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
const viewerResizeObserver = new ResizeObserver(resize);
viewerResizeObserver.observe(viewer);

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}

resize();
rebuildTile();
animate();
