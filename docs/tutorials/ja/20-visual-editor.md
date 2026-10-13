# Tutorial 20: 基本ビジュアルエディター
> **レベル:** 初級
> **時間:** 10 分

Node 24 で依存関係をインストールし、`pnpm build` の後に `pnpm --filter editor dev` を実行します。デスクトップの基本フローは Chromium、Firefox、WebKit で検証しています。

1. 階層または viewport で node を選択します。
2. group、box、sphere、plane を選択中の node または root に追加します。
3. 名前・parent を編集します。循環する reparent は変更前に拒否します。
4. 位置、XYZ Euler 回転（度）、scale を編集します。core は quaternion を維持します。
5. material の色、opacity、roughness、metalness、両面描画を変更します。
6. W/E/R の gizmo を使用します。操作用カメラは保存するカメラと独立しています。
7. 複製・削除、Ctrl/Cmd+Z の undo、Ctrl/Cmd+Shift+Z または Ctrl+Y の redo を使用します。ドラッグ全体が一つの操作です。
8. JSON を保存します。再構築が必要なデータはダウンロード前に警告します。
9. 正常なファイルは viewport、階層、選択、inspector を同時に交換し履歴を初期化します。不正ファイルでは既存 scene を保持し、未保存の変更を置換する前に確認します。

`EditorController` が scene・選択・履歴を一元管理します。unmount は renderer、gizmo、observer、listener、RAF を解放します。

従来の公開 `serialize()` JSON 形式を維持します。外部 asset、script、正確な再生時刻、物理状態は再構築が必要です。複製は ID を再生成しますが animation/bone 名を自動変更しません。

timeline、project asset 梱包、共同編集は対象外です。[機能と受け入れ基準](../../stability-1.2-ja.md)を参照してください。
