# PROGRESS

> **種別**: 履歴（追記型）— 過去のエントリは書き換えない。現在の仕様は`.claude/living-docs.txt`に挙げた文書を参照。

このフォーク（mokita0329/nervous-system-atlas）での作業記録。原作は aycibatuhan/nervous-system-atlas（コードは Apache-2.0、内容は CC BY-SA 4.0）。
9/21〜9/23 の2エントリは、記録が無かったため 2026-10-08 に git log と会話ログから遡って書いた。

## 2026-09-21〜22 日本語化（遡って記録）

- **何を**
  - 画面: `src/i18n/ja.ts`（`en.ts` とキーを1対1で対応）を追加し、`src/i18n/index.ts` の言語切替を3言語に拡張（`8f2c264`）
  - 内容データ: 言語ごとの束 `content.<lang>.json` を `scripts/content/build.ts`・`scripts/content/languages.ts` で生成。構造名の対訳表 `content/i18n/ja/names.json` を追加（`c4aa236`）
  - 本文の翻訳: `content/i18n/ja/` に構造379・症候群125・伝導路25・脳神経12・用語集205・クイズ60・トピック19（計825件）。翻訳の文体ルールは `tools/i18n/STYLE-ja.md`
- **なぜ**
  - 立体で線維の走行と症状をつなげて学べるものを一から作るより、既存のオープンソースをフォークして日本語化する方が早く、すぐ自分の勉強に使えると判断した
  - 構造名を対訳表に分けたのは、原作の416ファイルに直接日本語名を書くと、原作の更新を取り込むたびに衝突するため

## 2026-09-22〜23 病巣シミュレータへの作り変え（遡って記録）

- **何を**
  - 伝導路を1本の線で描く `src/scene/TractLayer.ts` と `src/tracts/pathway-lateral-corticospinal.json`（`02118ee`、`a1c2e96` で線を細く）
  - 機能単位と○×判定: `src/sim/units.ts`、`src/sim/units/{central,internal-capsule,parietal}.ts`、`src/sim/probe.ts`（`5f1fce5`）
  - 起動時からシミュレータとして開く: `src/sim/mode.ts`（`?mode=atlas` でアトラスに戻る）、`src/sim/controller.ts`、`src/sim/symptoms.ts`、`src/config/hidden.ts`（`cc745cb`）
  - MRI水平断のクリックで病巣を置く: `src/picking/Picker.ts`、`src/ui/SimPanel.ts`（`4b37506`）
  - 第2段 Step A、病巣が実際に食い込んでいる構造の一覧と3D表示: `src/sim/anatomy.ts`、`src/sim/units/{thalamus,white-matter}.ts`（`bb54a84`）
  - 第2段 Step B、教科書の51病巣での自動採点: `tests/sim-anatomy.test.ts`（`efb1c42`）。採点できた病巣39/51、再現率68.2%（目標70%）、余計に出る構造は中央値10個
- **なぜ**
  - 日本語化して使ってみた結果、アトラスとしては機能が多すぎて伝導路の学習に向かなかった。リハビリ科に進むので解剖は簡素でよく、「病巣→伝導路→症状」のつながりが見えることを優先した
  - 判定を割合ではなく○×にしたのは、重い計算で使えなくなるのを避け、ホムンクルス単位で「体のどこに症状が出るか」を直接出すため
  - 採点できない12病巣はすべて脳幹。脳幹の個々の核のデータは再配布できず公開版に入っていないため、コードでは直せない

## 2026-10-08 GitHub の自動点検（checks）の失敗を修正

- **何を**: `.github/workflows/checks.yml` の `integration` ジョブで、公開データの取得（`npm run data`）の後に `npm run content` を足し、内容データを今のコミットから作り直してからテストするようにした。同じ前提を書いていた `AGENTS.md`・`docs/developing.md` も合わせて修正（`7033ae0`）
- **なぜ**: 原作 v1.0.3 の公開データに入っている `content.json` は日本語化より前のもので、日本語のテスト（`e2e/smoke.spec.ts` の `?lang=ja`）が「脳幹」を期待して「Brainstem」を受け取り、日本語化以降のすべての push で失敗していた。公開ページの反映（`pages.yml`）は `npm run build` の中で内容データを作り直すため、公開ページ自体は正常だった
- **確認**: 一時フォルダの複製で同じ条件を再現。修正前は40本中39本成功・1本失敗（日本語のテスト）、内容データを作り直した後は言語のテスト3本すべて成功
- **次にやること**
  - push 後、GitHub 上の自動点検が成功するか確認する（約25分）。GPU の無い環境特有の失敗が別に出たら、その時に調べる
  - 病巣シミュレータ第2段の Step C（グラスブレイン）→ D（切れた伝導路と下流の破線）→ E（線を4本追加）。計画は `~/.claude/plans/misty-doodling-quokka.md`
  - Step B で保留: 余計に出る構造（大半が伝導路）を別枠に分けるかは、触ってから決める
  - 記録の整備: 方向転換2件（自作→フォーク、アトラス→病巣シミュレータ）の `docs/decisions.md` への記録（文面は要承認）、`.claude/living-docs.txt` の作成、親フォルダ `neuro-atlas/README.md` の「状態」の更新

## 2026-10-08 病巣シミュレータ第2段 Step C（透かして見る表示）

- **何を**
  - 右パネル上部に「MRIで選ぶ／透かして見る」の切り替え `src/ui/SimViewSwitch.ts` を追加。状態は `AppState.simView`
  - 透かして見る表示 `src/sim/view.ts`（`wireSimView`）: 大脳と脳神経の系統・MRI断面・剥離を外し、病巣の側から斜めに見るカメラにする。脳の外形・脳幹・小脳・脳室は新しい表示状態 `context`（`src/scene/materials.ts`、最大10%）で薄く残す。戻すと切り替え前の系統・断面・剥離・カメラに戻る
  - 線維の束の確率地図と大脳白質は、関与には入れたまま `AppState.faint` で薄く描く（`src/state/actions.ts` の `applyStates`）
  - `src/sim/probe.ts` の `pointInMesh` を、描画設定に関係なく両面で交差を数える判定に修正。ここまで全部で `04606a4`
- **なぜ**
  - MRIの断面だけでは、病巣と食い込んだ構造が立体のどこにあるか見えなかった。大脳の部品は3%でも重なって白い壁になるため、外すことにした
  - 線維の束を薄くしたのは、実物より太い確率地図で、はっきり描くと重なって塊になり中が見えなくなったため（試作の画面で確認）
  - ボタン名は計画の「伝導路を見る」ではなく「透かして見る」にした。伝導路の線が出るのは Step D からのため
  - `pointInMesh` は剥離中（両面描画）と透かし表示（表面のみ）で「病巣はこの中」の答えが変わっていた。コードレビュー後の確認中に発見
- **確認**
  - コードレビュー（high）の指摘8件を修正: 白質だけに当たる病巣で壁が戻る、共有リンクがMRIも大脳も無い状態で開く、別画面へ移ると戻せなくなる、左右反転でカメラが反対側に残る、ほか
  - 単体テスト77本・画面のテスト43本すべて成功。`npm run build` 成功
  - Step B の採点: 再現率68.2%・余計な構造の中央値10は変化なし。最大は36→35（`pointInMesh` 修正による）
  - 前回のエントリで保留にした GitHub の自動点検は、`7033ae0` の push 後に3種類とも成功した
- **次にやること**
  - Step D: 病巣が切った伝導路を線で描き、切れた先を灰色の破線にする。計画は `~/.claude/plans/misty-doodling-quokka.md`
  - 保留: 余計に出る構造（大半が伝導路）を別枠に分けるか、触ってから決める
  - 記録の整備: 方向転換2件の `docs/decisions.md` への記録（文面は要承認）、`.claude/living-docs.txt` の作成、親フォルダ `neuro-atlas/README.md` の「状態」の更新
