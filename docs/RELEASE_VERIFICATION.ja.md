# v1.0.0 リリース検証

対象: Web Serial Terminal / `release/v1.0.0-finalize`

## 自動検証

PowerShell構文、Readable / Self-extract単一HTML、直下HTMLコピー、CSP、favicon埋め込み、再接続回帰、ヘルプ背景スクロール、EN/JA切替、ログ失敗状態、v1.0.0版数と日英READMEの整合性をGitHub Actionsで確認します。PreviewのデプロイとprobeもPRで実施します。

## スクリーンショット

| ファイル | 内容 |
| --- | --- |
| `assets/screenshot.png` | PC、日本語 |
| `assets/screenshot-en.png` | PC、英語 |
| `assets/screenshot-mobile.png` | スマホ幅、日本語 |
| `assets/screenshot-mobile-en.png` | スマホ幅、英語 |

4枚とも実際にビルド済み単一HTMLをChromiumで開き、未接続状態を撮影しました。モバイル画像は**ビューポートの模擬**であり、スマートフォン実機テストの代用にはなりません。

## Raspberry Pi Pico USB CDCで合格（ユーザー報告、2026-10-13）

Text/HEX送受信、`RAW 4` による `00 01 7F FF`の一致、`BURST 300 80`全300行、`STREAM 10`追従/検索、Text/HEXマクロ、TXT/JSONL保存、マクロ再読込後の永続化、USB抜去/再接続、および概算20MiBログ上限/記録再開。詳細は `docs/HARDWARE_TEST_PICO.ja.md`。

## 未検証の実機・環境

実UARTのbaud/parity/stop bits、DTR/RTS/BREAK・制御キーの正確な信号、Firefox 151+とサイト権限アドオンでの接続、Androidの各通信方式、実スマホのソフトウェアキーボード/回転、30〜60分の定量的な高レート試験、同型USB複数台の再接続。v1.0.0という番号はこれらが合格したという意味ではありません。
