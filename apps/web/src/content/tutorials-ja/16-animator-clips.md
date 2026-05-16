---
title: "Animator: クリップライブラリ、クロスフェード、キーフレームイベント"
description: "play() / crossFade() で名前付きアニメーションクリップを駆動し、キーフレームの足音イベントに反応する。"
order: 16
level: "intermediate"
duration: "20 min"
---

# チュートリアル 16: Animator — クリップライブラリ、クロスフェード、キーフレームイベント

> **レベル:** 中級
> **時間:** 20 分
> **学ぶこと:** `Animator` コンポーネントがクリップライブラリを駆動する方法、`crossFade` がトランジションをブレンドする方法、キーフレームから足音 / 命中フレームイベントを発火する方法。

`Animator` コンポーネントはノードに乗り、`AnimationMixer` を所有して*ターゲット*ノード（名前で参照）の `node.transform` を変更します。ミキサーはシーングラフレベルで動作するため、アニメーションは **3 つのバックエンド**（Three.js、SVG、Canvas2D）すべてで動作します。

---

## ステップ 1 — クリップライブラリを作る

クリップはエンジン非依存のデータ: キーフレームトラック（`times` + `values` を `Float32Array` として）+ オプションの名前付きイベント。

```ts
const walk: AnimationClip = {
    name: "walk",
    duration: 2.0,
    tracks: [{
        targetNodeName: "hero",
        property: "position",
        times: new Float32Array([0, 0.5, 1.0, 1.5, 2.0]),
        values: new Float32Array([
            -2, 1.0, 0,
             0, 1.2, 0,
             2, 1.0, 0,
             0, 1.2, 0,
            -2, 1.0, 0,
        ]),
        interpolation: "linear",
    }],
    events: [
        { time: 0.5, name: "footstep", data: { foot: "right" } },
        { time: 1.5, name: "footstep", data: { foot: "left" } },
    ],
};
```

---

## ステップ 2 — Animator を取り付ける

```ts
const animator = new Animator({
    animations: { idle, walk, spin },
    autoplay: "idle",
});
hero.addComponent(animator);
animator.bindToScene(scene);   // ミキサーが名前で "hero" を解決するため必須
```

---

## ステップ 3 — レンダーループから自動ティック

`ThreeRenderer.render(dt)` は最初に `scene.update(dt)` を呼び、各コンポーネントの `onUpdate(dt)` を実行 — Animator も含めて。手動で何も呼ぶ必要はありません。

---

## ステップ 4 — crossFade でクリップを切り替え

```ts
animator.crossFade("walk", 0.4);
animator.crossFade("spin", 0.4);
```

クォータニオンブレンディングは正規化された nlerp と半球補正を使うので、回転が長い方向にスナップしません。

---

## ステップ 5 — キーフレームイベントに反応

```ts
animator.on("keyframe-event", (e) => {
    if (e.event.name === "footstep") {
        const foot = (e.event.data as { foot: string }).foot;
        console.log(`歩み (${foot})`);
    }
});

animator.on("finished", (e) => {
    console.log(`${e.clip.name} 完了`);
});
```

イベントはループの反復ごとに重複排除されます — `dt` が大きくジャンプしても 1 回しか発火しません。

---

## 次のステップ

- **Cubicspline 補間**: glTF が使用。`interpolation: "cubicspline"` に `[in-tangent, value, out-tangent]` レイアウトの値を設定。
- **同時複数クリップ**: 別の fade の途中で `crossFade("walk")` を呼ぶ — ミキサーは N 個のアクティブクリップをブレンド。
- **glTF からアニメーションをロード**: `@joroya/loader-gltf` がシーンと一緒に `AnimationClip[]` を返す。
