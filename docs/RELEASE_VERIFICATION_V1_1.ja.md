# Web Serial Terminal v1.1.0 リリース前確認

対象: [PR #14](https://github.com/ttomohisa/htmlapps-web-serial-terminal/pull/14) のv1.1.0候補。確認日: 2026-11-24。

この文書では、コード・自動検証で確認できたことと、物理的なシリアル機器で未確認のことを分けて記載します。過去の実機テスト結果をv1.1.0の実機合格とはみなしません。

## 自動検証の対象

| 項目 | 確認方法 |
| --- | --- |
| ソース・単一HTML | PowerShell構文、通常版・自己展開版のビルド、CSP、埋込アイコン、生成物の整合性 |
| 文字列表示 | CR / LF / CRLFをまたぐ分割受信、UTF-8、Text / HEX、RX/TX、ローカルエコー |
| フィルター・検索 | 一致行の抽出、強調表示、特殊記号とUnicode、選択範囲の保持、受信中の新着表示 |
| 目印とログ | 目印の非送信、TXT / JSONLへの保存、生バイトの保持、ログ消去とClear/Undo |
| 送信と保存 | Text / HEXの送信内容、バイト数、無効HEX、保存名の変更と安全な名前への変換 |
| 表示 | 日英、PCと320〜393pxのスマホ幅、短い画面、ダイアログ、横スクロール |
| 通信先 | 生成HTMLの`connect-src 'none'`と、模擬ポート試験中に外部HTTPリクエストがないこと |

回帰テストはGitHub Actionsの [Validate standalone HTML](../.github/workflows/build-standalone.yml) と [Deploy PR preview](../.github/workflows/preview.yml) から実行します。マージ後の [Pagesデプロイ／Release](../.github/workflows/deploy-pages.yml) でも、タグ作成前に同じブラウザ試験を実行します。テストの成否は対象コミットのActions結果を確認してください。

READMEに掲載する日英・PC/スマホの4画像は、**模擬シリアル機器のサンプル通信を使って撮影**したものです。実機での動作確認の証拠ではありません。

## v1.1.0で未実施の確認

- Raspberry Pi Picoなど**物理機器での送受信、連続受信、抜去・再接続**の再テスト
- 実UART通信条件（baud / data / parity / stop bits / flow control）、DTR / RTS / BREAK、制御キーの実信号
- Firefox実機のサイト権限とWeb Serial接続、Androidの対応機器、iPhone / iPadの案内の実機表示
- 長時間・高レート受信時のメモリ、スクロール、検索、フィルターの動作
- 実端末でのキーボード表示、縦横回転、ダイアログ、タップ領域
- Web公開ページのDevToolsで初回HTML取得とシリアルデータの外部送信を区別して確認
- **v1.1.0のタグとGitHub Releaseの実作成**（PRマージ後にのみ実行）

2026-10-13のPico USB CDC実機テストは旧版の記録です。結果は[当時の検証表](RC_VERIFICATION.ja.md)に残していますが、上記の未確認を埋めるものではありません。

## 手動確認の手順

1. 対応ブラウザで機器を選び、接続条件を確認してから接続する。自動接続されないことも確認する。
2. 改行なし・CR・LF・CRLFを送受信し、Textの行結合とHEXの元データを見比べる。
3. 受信しながら検索・フィルターを切り替え、追従を止めてから「最新へ」で戻る。ClearのUndoも確認する。
4. 時刻付きの「目印」を追加し、機器に送信されないことを確認する。TXT / JSONLに保存して内容を比較する。
5. 「ファイル名」で保存名を変更し、TXT/JSONLの拡張子が正しいこと、ファイル名に使えない文字が処理されることを確認する。
6. スマホとPC、日英、通常版と自己展開版、オフラインでの読み込み・保存・エラー表示を確認する。

詳細な機器試験は[実機テスト手順](HARDWARE_TEST_PICO.ja.md)、通信制限は[オフライン確認表](../VERIFY_OFFLINE.md)を参照してください。