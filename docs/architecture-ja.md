# アーキテクチャ概要

Oroya Animateは、シーンの表現がレンダリング技術から完全に独立した疎結合アーキテクチャを採用しています。

---

## 基本原則

> **「一度定義すれば、どこでもレンダリング可能」**
> シーングラフが唯一の信頼できるソースです。レンダラーはトランスレーターです。

```mermaid
graph TD
    subgraph "入力レイヤー"
        UC["ユーザーコード"]
        GLTF["glTF / GLBファイル"]
        JSON["シリアライズされたJSON"]
    end

    subgraph "@joroya/core — エンジン非依存コア"
        SG["シーングラフ"]
        N["Node"]
        T["Transform"]
        G["Geometry"]
        M["Material"]
        C["Camera"]
        SER["Serializer"]
        MATH["Math (Matrix4)"]
    end

    subgraph "出力レイヤー"
        R3["@joroya/renderer-three"]
        RS["@joroya/renderer-svg"]
        R_FUTURE["将来: Canvas2D, WebGPU..."]
    end

    subgraph "結果"
        WEBGL["WebGLキャンバス（ピクセル）"]
        SVG["SVG文字列（ベクター）"]
    end

    UC -->|"構築"| SG
    GLTF -->|"@joroya/loader-gltf"| SG
    JSON -->|"deserialize()"| SG
    SG -->|"serialize()"| JSON

    SG --> N
    N --> T
    N --> G
    N --> M
    N --> C
    SG --> MATH

    SG -->|"mount + render"| R3
    SG -->|"renderToSVG()"| RS
    SG -.->|"将来"| R_FUTURE

    R3 --> WEBGL
    RS --> SVG
```

---

## アーキテクチャレイヤー

| レイヤー | パッケージ | 責務 | 依存関係 |
|---------|-----------|------|---------|
| **コア** | `@joroya/core` | シーングラフ、コンポーネント、トランスフォーム、シリアライゼーション、数学 | `uuid`（唯一の依存） |
| **3Dレンダラー** | `@joroya/renderer-three` | Three.js WebGLへの変換 | `@joroya/core`, `three` |
| **SVGレンダラー** | `@joroya/renderer-svg` | ピュアSVG生成 | `@joroya/core` |
| **glTFローダー** | `@joroya/loader-gltf` | 3Dモデルのインポート | `@joroya/core`, `three` |

### 依存関係グラフ

```mermaid
graph BT
    CORE["@joroya/core"]
    R3["@joroya/renderer-three"]
    RS["@joroya/renderer-svg"]
    LG["@joroya/loader-gltf"]
    THREE["three (npm)"]
    UUID["uuid (npm)"]
    DEMO["apps/demo-react"]

    CORE -->|"依存"| UUID
    R3 -->|"依存"| CORE
    R3 -->|"依存"| THREE
    RS -->|"依存"| CORE
    LG -->|"依存"| CORE
    LG -->|"依存"| THREE
    DEMO -->|"依存"| CORE
    DEMO -->|"依存"| R3
```

> **重要なルール:** 依存関係の矢印は**単方向**であり、常に`@joroya/core`を指します。コアはレンダラーやローダーからは**決して**インポートしません。

---

## 「コンパイラ」パターン

レンダラーは**コンパイラ**のように機能します：中間表現（シーングラフ）を特定の出力形式に変換します。

```mermaid
flowchart LR
    IR["シーングラフ\n（中間表現）"] -->|"ThreeRenderer"| OUT1["THREE.Scene\nTHREE.Mesh\nTHREE.Camera"]
    IR -->|"renderToSVG()"| OUT2["<svg>\n  <path/>\n</svg>"]
    IR -.->|"将来: WebGPU"| OUT3["GPUBuffer\nGPURenderPipeline"]
```

| 概念 | 古典的コンパイラ | Oroya Animate |
|------|----------------|---------------|
| ソースコード | `.c`ファイル | ユーザーコード（TypeScript） |
| 中間表現 | AST / IR | シーングラフ |
| バックエンド | x86, ARM, WASM | Three.js, SVG, WebGPU |
| 出力 | マシンコード | ピクセル、ベクター |

このパターンにより以下が可能になります：
- コアを変更せずに**バックエンドを追加**できる。
- **レンダラーなしでテスト**可能 — ロジックはシーングラフに存在する。
- **サーバーサイドレンダリング** — SVGレンダラーはDOMなしでNode.jsで動作する。

---

## レンダリングのライフサイクル

```mermaid
sequenceDiagram
    participant U as ユーザーコード
    participant S as Scene
    participant N as Node
    participant T as Transform
    participant R as Renderer

    Note over U,R: フェーズ1 — 準備
    U->>S: new Scene()
    U->>N: new Node('box')
    U->>N: addComponent(createBox(...))
    U->>N: addComponent(new Material(...))
    U->>S: scene.add(node)

    Note over U,R: フェーズ2 — マウント
    U->>R: renderer.mount(scene)
    R->>S: scene.traverse(callback)
    R->>R: バックエンドオブジェクトを作成
    R->>R: アクティブカメラを検出

    Note over U,R: フェーズ3 — レンダーループ
    loop requestAnimationFrame
        U->>T: transform.rotation = {...}
        U->>T: transform.updateLocalMatrix()
        U->>R: renderer.render()
        R->>S: scene.updateWorldMatrices()
        S->>N: node.updateWorldMatrix(parentMatrix)
        N->>T: worldMatrix = parent × local
        R->>R: バックエンドと同期
        R->>R: フレームを描画
    end

    Note over U,R: フェーズ4 — クリーンアップ
    U->>R: renderer.dispose()
```

### 各フェーズの詳細

| フェーズ | アクション | 実行者 |
|---------|-----------|--------|
| **1. 準備** | ノード、コンポーネント、親子関係でシーングラフを構築 | ユーザーコード |
| **2. マウント** | `renderer.mount(scene)` — ツリーを走査しバックエンドオブジェクトを作成 | レンダラー |
| **3. レンダーループ** | トランスフォームを変更 → `updateLocalMatrix()` → `renderer.render()` → 行列を伝播 → 描画 | ユーザーコード + レンダラー |
| **4. クリーンアップ** | `renderer.dispose()` — GPU/メモリリソースを解放 | ユーザーコード |

---

## 簡略化されたEntity-Component System（ECS）

Oroyaは**軽量ECS**を使用しています：

| ECS用語 | Oroyaの対応 | 説明 |
|---------|------------|------|
| **Entity** | `Node` | IDと階層を持つコンテナ |
| **Component** | `Transform`, `Geometry`, `Material`, `Camera` | ノードに付加されるデータ |
| **System** | レンダラー、`updateWorldMatrices()` | コンポーネントを処理するロジック |

```mermaid
graph LR
    subgraph "Entity (Node)"
        N["Node 'player'"]
    end

    subgraph "コンポーネント"
        T["Transform\nposition, rotation, scale"]
        G["Geometry\nBox 1×1×1"]
        M["Material\ncolor: blue"]
    end

    subgraph "システム"
        S1["updateWorldMatrices()\n行列を伝播"]
        S2["ThreeRenderer.render()\nThree.jsで描画"]
    end

    N --> T
    N --> G
    N --> M
    T --> S1
    G --> S2
    M --> S2
```

### ECSのルール

1. **ノードごとに各タイプのコンポーネントは1つのみ** — 同じノードに2つの`Geometry`を持つことはできません。
2. **Transformは自動** — すべてのノードは作成時にTransformを持ちます。
3. **コンポーネントはデータ** — レンダリングロジックを含みません。
4. **レンダラーが「システム」** — コンポーネントを読み取り、視覚的な出力を生成します。

---

## 拡張性

### 新しいレンダラーの追加

```typescript
class MyRenderer {
  private scene: Scene | null = null;

  mount(scene: Scene): void {
    this.scene = scene;
    scene.traverse(node => {
      const geo = node.getComponent<Geometry>(ComponentType.Geometry);
      const mat = node.getComponent<Material>(ComponentType.Material);
      // ターゲットエンジン/フレームワーク用のオブジェクトを作成
    });
  }

  render(): void {
    if (!this.scene) return;
    this.scene.updateWorldMatrices();
    this.scene.traverse(node => {
      // node.transform.worldMatrixを読み取り
      // エンジンオブジェクトと同期
    });
    // フレームを描画
  }

  dispose(): void { /* リソースを解放 */ }
}
```

### 新しいローダーの追加

```typescript
async function loadMyFormat(url: string): Promise<Scene> {
  const data = await fetch(url).then(r => r.json());
  const scene = new Scene();

  for (const obj of data.objects) {
    const node = new Node(obj.name);
    node.addComponent(createBox(obj.width, obj.height, obj.depth));
    node.addComponent(new Material({ color: obj.color }));
    node.transform.position = obj.position;
    scene.add(node);
  }

  return scene;
}
```

---

## モノレポ構成

```
oroya-animate/
├── packages/
│   ├── core/               → エンジン非依存コア（Scene, Node, Components, Math）
│   ├── renderer-three/      → Three.js WebGLバックエンド
│   ├── renderer-svg/        → ピュアSVGバックエンド
│   └── loader-gltf/         → glTFモデルインポーター
├── apps/
│   └── demo-react/          → デモアプリケーション（Vite + React）
├── docs/                    → プロジェクトドキュメント
└── package.json             → モノレポルート（pnpm workspaces）
```

---

## 設計上の決定

| 決定 | 却下された代替案 | 理由 |
|------|----------------|------|
| IRとしてのシーングラフ | Three.js上の直接API | 複数バックエンドとGPUなしテストが可能 |
| 簡略化ECS（1コンポーネント/タイプ） | 完全なECS with Systems | 現在のスコープでの低い複雑性 |
| 回転にクォータニオン | オイラー角 | ジンバルロックなし、自然な補間（SLERP） |
| 列優先行列 | 行優先行列 | WebGLおよびThree.jsとの互換性 |
| ノードIDに`uuid` | インクリメンタルID | グローバルに一意、シリアライゼーションに必要 |
| バンドラーに`tsup` | `tsc`, `rollup`, `esbuild` | 最小限の設定でDTS + CJS + ESMを1ツールで |
| pnpm workspaces | npm/yarn workspaces | 高速、厳密な重複排除、モノレポに最適 |
