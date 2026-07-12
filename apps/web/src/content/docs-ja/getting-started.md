---
title: "はじめに"
description: "Oroya Animateのセットアップと最初のシーン作成のクイックスタートガイド"
order: 1
category: "guide"
---
# Oroya Animateをはじめよう

ようこそ！このガイドでは、Web向けのレンダラー非依存シーングラフエンジン **Oroya Animate** を使って、最初の3Dシーンを構築する方法を説明します。

Oroya Animateはシーンの定義とレンダリングバックエンドを分離しています。`@joroya/core` を使ってシーンを一度記述し、Three.jsによるWebGL、SVGによる静的グラフィックス、Canvas 2D、または将来のバックエンドからレンダリング方法を選択できます。

---

## インストール

お好みのパッケージマネージャーを使って、npmから必要なパッケージをインストールしてください：

```bash
# npm
npm install @joroya/core @joroya/renderer-three three

# yarn
yarn add @joroya/core @joroya/renderer-three three

# pnpm
pnpm add @joroya/core @joroya/renderer-three three
```

### 利用可能なパッケージ

| パッケージ | 説明 |
|---|---|
| `@joroya/core` | シーングラフ、ノード、コンポーネント、シリアライゼーション、数学ユーティリティ |
| `@joroya/renderer-three` | OroyaシーンをThree.jsオブジェクトへ変換するWebGLバックエンド |
| `@joroya/renderer-svg` | 2Dパスベースグラフィックス用SVGレンダラー |
| `@joroya/renderer-canvas2d` | 2Dラスターグラフィックス用Canvas 2Dレンダラー |
| `@joroya/loader-gltf` | glTFモデルをOroyaシーンに読み込み |

> **注意:** `@joroya/renderer-three` と `@joroya/loader-gltf` は `three` をpeer dependencyとして持っています。プロジェクトにインストールされていることを確認してください：`npm install three`

---

## クイックスタート — 回転するキューブ

この最小限の例では、カメラ、ライティング、赤いキューブを含むシーンを作成し、Three.jsでレンダリングします。

### 1. HTML

```html
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8" />
  <title>Oroya Animate - クイックスタート</title>
  <style>
    body { margin: 0; overflow: hidden; }
    canvas { display: block; }
  </style>
</head>
<body>
  <canvas id="oroya-canvas"></canvas>
  <script type="module" src="./main.ts"></script>
</body>
</html>
```

### 2. シーンのセットアップ (`main.ts`)

```typescript
import {
  Scene, Node, createBox, Material,
  Camera, CameraType, Light, LightType,
  setFromAxisAngle,
} from '@joroya/core';
import { ThreeRenderer } from '@joroya/renderer-three';

// --- シーン ---
const scene = new Scene();

// --- カメラ ---
const cameraNode = new Node('main-camera');
cameraNode.addComponent(new Camera({
  type: CameraType.Perspective,
  fov: 75,
  aspect: window.innerWidth / window.innerHeight,
  near: 0.1,
  far: 1000,
}));
cameraNode.transform.position.z = 5;
scene.add(cameraNode);

// --- ライティング ---
const ambient = new Node('ambient');
ambient.addComponent(new Light({ type: LightType.Ambient, intensity: 0.4 }));
scene.add(ambient);

const sun = new Node('sun');
sun.addComponent(new Light({
  type: LightType.Directional,
  intensity: 0.8,
  target: { x: 0, y: 0, z: 0 },
}));
sun.transform.position = { x: 3, y: 6, z: 4 };
scene.add(sun);

// --- キューブ ---
const cubeNode = new Node('my-cube');
cubeNode.addComponent(createBox(1, 1, 1));
cubeNode.addComponent(new Material({ color: { r: 1, g: 0.2, b: 0.2 } }));
scene.add(cubeNode);

// --- レンダラー ---
const canvas = document.getElementById('oroya-canvas') as HTMLCanvasElement;
const renderer = new ThreeRenderer({
  canvas,
  width: window.innerWidth,
  height: window.innerHeight,
});
renderer.mount(scene);

// --- アニメーションループ ---
function animate(time: number) {
  time *= 0.001; // 秒に変換
  requestAnimationFrame(animate);

  const speed = 0.5;
  cubeNode.transform.rotation = setFromAxisAngle(
    { x: 0.4, y: 1, z: 0 },
    time * speed,
  );
  cubeNode.transform.updateLocalMatrix();

  renderer.render();
}
requestAnimationFrame(animate);
```

これだけです！画面上に赤いキューブが回転して表示されるはずです。

---

## 主要コンセプト

### シーン (Scene)

`Scene` はトップレベルのコンテナです。ルート `Node` を保持し、ノードの追加/削除、グラフの走査、ワールド行列の更新のためのメソッドを提供します。

```typescript
const scene = new Scene();
scene.add(someNode);                    // ルートに追加
scene.add(childNode, parentNode);       // 特定の親の下に追加
scene.remove(someNode);                 // 親から削除
scene.findNodeByName('my-cube');        // 名前で検索
scene.findNodeById(id);                 // ユニークIDで検索
scene.traverse((node) => { /* ... */ });
```

### ノード (Nodes)

ノードはシーングラフの構成要素です。親子階層を形成し、子ノードは親のワールド変換を継承します。

```typescript
const parent = new Node('solar-system');
const earth  = new Node('earth');
const moon   = new Node('moon');

parent.add(earth);
earth.add(moon);   // 月は地球の変換を継承

scene.add(parent);
```

### コンポーネント (Components)

コンポーネントはノードにデータや動作を付加します。すべてのノードはデフォルトで `Transform` コンポーネントを持ちます。

| コンポーネント | 説明 |
|---|---|
| **Transform** | 位置 (`Vec3`)、回転 (`Quat`)、スケール (`Vec3`)。値を変更した後は `updateLocalMatrix()` を呼び出してください。 |
| **Geometry** | ノードの形状を定義します。ファクトリ関数で作成します。 |
| **Material** | 外観を定義 — 色、透明度、fill/stroke (SVG用)、metalness/roughness (PBR用)。 |
| **Camera** | 視点を定義 — パースペクティブまたはオルソグラフィック。 |
| **Light** | 光源を定義 — Ambient、Directional、Point、Spot。 |

```typescript
// コンポーネントの追加
node.addComponent(createBox(2, 2, 2));
node.addComponent(new Material({ color: { r: 0, g: 1, b: 0 }, opacity: 0.8 }));

// コンポーネントの取得
node.hasComponent(ComponentType.Geometry); // true
const geo = node.getComponent<Geometry>(ComponentType.Geometry);
```

---

## ジオメトリプリミティブ

Oroyaはジオメトリコンポーネントを作成するためのファクトリ関数を提供しています：

### ボックス (Box)

```typescript
import { createBox } from '@joroya/core';

const box = createBox(2, 1, 3); // 幅, 高さ, 奥行き
node.addComponent(box);
```

### 球 (Sphere)

```typescript
import { createSphere } from '@joroya/core';

const sphere = createSphere(0.5, 32, 32); // 半径, 横分割数, 縦分割数
node.addComponent(sphere);
```

### Path2D (SVG/Canvas2Dレンダリング用)

```typescript
import { createPath2D } from '@joroya/core';

const triangle = createPath2D([
  { command: 'M', args: [50, 0] },
  { command: 'L', args: [100, 100] },
  { command: 'L', args: [0, 100] },
  { command: 'Z', args: [] },
]);
node.addComponent(triangle);
```

### テキスト

```typescript
import { createText } from '@joroya/core';

const text = createText('こんにちは！', {
  fontSize: 24,
  fontFamily: 'sans-serif',
  fontWeight: 'bold',
  textAnchor: 'middle',
});
node.addComponent(text);
```

---

## マテリアル

`Material` コンポーネントはノードの視覚的な外観を制御します。そのプロパティは選択したレンダラーに応じて適応します。

```typescript
import { Material } from '@joroya/core';

// 3D用 (Three.jsレンダラー)
node.addComponent(new Material({
  color: { r: 0.2, g: 0.5, b: 1.0 },
  opacity: 0.9,
  metalness: 0.3,
  roughness: 0.5,
}));

// 2D用 (SVGまたはCanvas2Dレンダラー)
node.addComponent(new Material({
  fill: { r: 1, g: 0.8, b: 0 },
  stroke: { r: 0, g: 0, b: 0 },
  strokeWidth: 2,
}));
```

色は `ColorRGB` 形式を使用し、各チャンネルは `0` から `1` の範囲です。

---

## ライティング

`Light` コンポーネントはシーン内の光源を定義します。4つのタイプがサポートされています：

```typescript
import { Light, LightType } from '@joroya/core';

// アンビエントライト — すべての方向に均一な照明
const ambient = new Node('ambient');
ambient.addComponent(new Light({
  type: LightType.Ambient,
  color: { r: 1, g: 1, b: 1 },
  intensity: 0.4,
}));
scene.add(ambient);

// ディレクショナルライト — 平行光線（太陽光のような）
const sun = new Node('sun');
sun.addComponent(new Light({
  type: LightType.Directional,
  intensity: 0.9,
  target: { x: 0, y: 0, z: 0 },
}));
sun.transform.position = { x: 5, y: 10, z: 5 };
scene.add(sun);

// ポイントライト — ある点から全方向に発光
const bulb = new Node('bulb');
bulb.addComponent(new Light({
  type: LightType.Point,
  color: { r: 1, g: 0.8, b: 0.4 },
  intensity: 2.0,
  distance: 15,
  decay: 2,
}));
bulb.transform.position = { x: -3, y: 4, z: 2 };
scene.add(bulb);

// スポットライト — 円錐形の光（懐中電灯のような）
const spot = new Node('spot');
spot.addComponent(new Light({
  type: LightType.Spot,
  intensity: 3.0,
  angle: 0.5,
  penumbra: 0.4,
  target: { x: 0, y: 0, z: 0 },
}));
spot.transform.position = { x: 0, y: 8, z: 0 };
scene.add(spot);
```

---

## カメラ

カメラはシーンがレンダリングされる視点を定義します。ノードにアタッチし、ノードのtransformを使って位置を決定します。

```typescript
import { Camera, CameraType } from '@joroya/core';

const cameraNode = new Node('camera');
cameraNode.addComponent(new Camera({
  type: CameraType.Perspective,
  fov: 60,
  aspect: 16 / 9,
  near: 0.1,
  far: 500,
}));

// 位置と向き
cameraNode.transform.position = { x: 0, y: 3, z: 10 };
cameraNode.transform.updateLocalMatrix();

scene.add(cameraNode);
```

`ThreeRenderer` はシーン内で最初に見つかったカメラを使用します。存在しない場合は、`z = 5` にデフォルトのパースペクティブカメラを作成します。

---

## レンダラー

### Three.js (WebGL)

インタラクティブで高性能な3Dシーンには `@joroya/renderer-three` を使用します。

```typescript
import { ThreeRenderer } from '@joroya/renderer-three';

const renderer = new ThreeRenderer({
  canvas: document.getElementById('canvas') as HTMLCanvasElement,
  width: 800,
  height: 600,
  dpr: window.devicePixelRatio, // オプション
});

renderer.mount(scene);
renderer.enableOrbitControls(); // マウスによるカメラ操作

function loop() {
  renderer.render();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

// 完了時にクリーンアップ
renderer.dispose();
```

### SVG

スケーラブルな2Dベクター出力には `@joroya/renderer-svg` を使用します — ドキュメント、アイコン、静的イラストに最適です。

```typescript
import { renderToSVG } from '@joroya/renderer-svg';

const svgString = renderToSVG(scene, {
  width: 200,
  height: 200,
  viewBox: '0 0 200 200', // オプション
});

document.getElementById('svg-container')!.innerHTML = svgString;
```

### Canvas 2D

シェイプ、テキスト、パスを含む2Dラスターレンダリングには `@joroya/renderer-canvas2d` を使用します。

```typescript
import { renderToCanvas } from '@joroya/renderer-canvas2d';

renderToCanvas(scene, canvas, {
  width: 500,
  height: 500,
  backgroundColor: { r: 0.06, g: 0.07, b: 0.1 },
});
```

---

## シーン階層の例

変換はツリーを通じて伝播します。子のワールド行列は、親のワールド行列と自身のローカル行列の積です。

```typescript
const solarSystem = new Node('solar-system');

// 原点にある太陽
const sun = new Node('sun');
sun.addComponent(createSphere(2, 32, 32));
sun.addComponent(new Material({
  color: { r: 1, g: 0.9, b: 0.2 },
  emissive: { r: 1, g: 0.7, b: 0.1 },
}));
solarSystem.add(sun);

// 地球は太陽の周りを公転
const earth = new Node('earth');
earth.addComponent(createSphere(0.5, 32, 32));
earth.addComponent(new Material({ color: { r: 0.2, g: 0.5, b: 1.0 } }));
earth.transform.position.x = 5;
solarSystem.add(earth);

// 月は地球の周りを公転
const moon = new Node('moon');
moon.addComponent(createSphere(0.15, 16, 16));
moon.addComponent(new Material({ color: { r: 0.8, g: 0.8, b: 0.8 } }));
moon.transform.position.x = 1;
earth.add(moon);

scene.add(solarSystem);

// アニメーションループでシステムを回転
function animate(time: number) {
  time *= 0.001;
  requestAnimationFrame(animate);

  solarSystem.transform.rotation = setFromAxisAngle({ x: 0, y: 1, z: 0 }, time * 0.1);
  solarSystem.transform.updateLocalMatrix();

  earth.transform.rotation = setFromAxisAngle({ x: 0, y: 1, z: 0 }, time * 0.5);
  earth.transform.updateLocalMatrix();

  renderer.render();
}
requestAnimationFrame(animate);
```

---

## glTFモデルの読み込み

`@joroya/loader-gltf` パッケージを使用すると、標準的なglTF/GLBファイルを読み込んでOroyaのシーンノードに変換できます。

```bash
npm install @joroya/loader-gltf three
```

```typescript
import { loadGLTF } from '@joroya/loader-gltf';
import { ThreeRenderer } from '@joroya/renderer-three';

const { scene: gltfScene, animations } = await loadGLTF('/models/robot.glb');

const renderer = new ThreeRenderer({
  canvas: document.getElementById('canvas') as HTMLCanvasElement,
  width: 800,
  height: 600,
});
renderer.mount(gltfScene);

// アニメーションがあれば再生
if (animations.length > 0) {
  const mixer = new AnimationMixer(gltfScene);
  mixer.play(animations[0]);
}

function loop() {
  renderer.render();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
```

---

## シリアライゼーション

OroyaシーンはJSONにシリアライズし、デシリアライズして元に戻すことができます。シーンの保存/読み込みやネットワーク経由での送信が容易になります。

```typescript
import { serialize, deserialize } from '@joroya/core';

// シーンをJSONに保存
const json = serialize(scene);
localStorage.setItem('my-scene', json);

// JSONからシーンを読み込み
const restored = deserialize(localStorage.getItem('my-scene')!);
renderer.mount(restored);
```

---

## React統合

Oroyaをreactコンポーネントでラップして、UIに統合できます：

```tsx
import { useEffect, useRef } from 'react';
import {
  Scene, Node, createBox, Material,
  Camera, CameraType, Light, LightType,
} from '@joroya/core';
import { ThreeRenderer } from '@joroya/renderer-three';

function OroyaCanvas({ scene }: { scene: Scene }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const renderer = new ThreeRenderer({
      canvas,
      width: canvas.clientWidth,
      height: canvas.clientHeight,
    });
    renderer.mount(scene);

    let frameId: number;
    const animate = (time: number) => {
      renderer.render();
      frameId = requestAnimationFrame(animate);
    };
    frameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(frameId);
      renderer.dispose();
    };
  }, [scene]);

  return <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />;
}

// 使用例
function App() {
  const scene = new Scene();

  const cam = new Node('cam');
  cam.addComponent(new Camera({
    type: CameraType.Perspective, fov: 75,
    aspect: 16 / 9, near: 0.1, far: 1000,
  }));
  cam.transform.position.z = 5;
  scene.add(cam);

  // ライティング
  const ambient = new Node('ambient');
  ambient.addComponent(new Light({ type: LightType.Ambient, intensity: 0.4 }));
  scene.add(ambient);

  const cube = new Node('cube');
  cube.addComponent(createBox(1, 1, 1));
  cube.addComponent(new Material({ color: { r: 0.1, g: 0.6, b: 0.9 } }));
  scene.add(cube);

  return <OroyaCanvas scene={scene} />;
}
```

---

## Transformの詳細

すべての `Node` は3つのプロパティを持つ `Transform` コンポーネントを持ちます：

| プロパティ | 型 | デフォルト値 | 説明 |
|---|---|---|---|
| `position` | `Vec3 { x, y, z }` | `{ 0, 0, 0 }` | 3D空間での移動 |
| `rotation` | `Quat { x, y, z, w }` | `{ 0, 0, 0, 1 }` | クォータニオンとしての回転 |
| `scale` | `Vec3 { x, y, z }` | `{ 1, 1, 1 }` | スケール係数 |

**重要:** transformプロパティを変更した後は、ローカル行列を再計算するために `updateLocalMatrix()` を呼び出してください。レンダラーは毎フレーム `scene.updateWorldMatrices()` を呼び出して、階層全体に変換を伝播します。

```typescript
const node = new Node('box');
node.transform.position = { x: 2, y: 0, z: -3 };
node.transform.scale = { x: 2, y: 2, z: 2 };
node.transform.updateLocalMatrix();
```

---

## トラバーサルと検索

Oroyaはシーングラフをナビゲートする複数の方法を提供しています：

```typescript
// すべてのノードを深さ優先で走査
scene.traverse((node) => {
  console.log(node.name, node.id);
});

// 特定のノードを検索
const cam = scene.findNodeByName('main-camera');
const node = scene.findNodeById('some-uuid');

// 階層へのアクセス
const parent = node.parent;           // Node | null
const children = node.children;       // Node[]
```

---

## 次のステップ

- **[アーキテクチャ](architecture.md)** — 設計哲学とモジュール境界を理解する。
- **[レンダラー](renderers.md)** — レンダラーの実装を詳しく学ぶ。
- **[シーングラフ](scene-graph.md)** — ノード階層と変換の仕組みを学ぶ。
- **[シリアライゼーション](serialization.md)** — JSON形式の完全な詳細。
- **[APIリファレンス](api-reference.md)** — 完全なAPIドキュメント。
- **[コントリビュート](contributing.md)** — Oroya Animateへの貢献方法。
