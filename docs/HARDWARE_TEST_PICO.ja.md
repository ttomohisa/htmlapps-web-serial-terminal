# Raspberry Pi Pico 実機テスト手順

Web Serial Terminal を Raspberry Pi Pico で実機確認するための手順です。

## 1. まず理解しておくこと

PicoへMicroPythonを書き込み、Pico本体のUSB端子を使う方法はUSB CDCの仮想シリアルです。

この方法で確認しやすいもの:

- Web Serialの機器選択 / 接続 / 切断
- Text / HEX送受信
- LF / CR / CRLF / None
- UTF-8表示
- Local Echo / Timestamp
- 検索 / 自動追従 / 最新へ
- コマンド履歴
- マクロ
- TXT / JSONLログ
- 長時間・大量RX
- USB抜去 / 再接続

USB CDCではbaud rate、parity、data bits、stop bitsが物理UARTの信号条件として使われないため、それらの厳密な確認には後半のUSB-UARTアダプタ方式を使います。

MicroPythonのUSB REPLは制御文字を解釈することがあります。Ctrl+C / Ctrl+Dなどを「単なる1 byte」として厳密に確認したい場合もUSB-UARTアダプタ方式を使います。

## 2. PicoへMicroPythonを入れる

1. PicoのBOOTSELを押したままPCへUSB接続します。
2. RPI-RP2ドライブが表示されたらBOOTSELを離します。
3. Raspberry Pi公式のPico用MicroPython UF2を書き込みます。
4. Picoが再起動し、USB Serialとして認識されることを確認します。

## 3. USB直結テストfixtureを入れる

`examples/pico-usb-web-serial-test.py` をThonnyで開き、Picoへ `main.py` という名前で保存します。

一度実行して構文エラーがないことを確認したら、Web Serialから接続する前にThonnyのPico接続を切るか、Thonnyを閉じてください。同じシリアルポートを複数アプリで同時に開かないようにします。

Picoをリセットするとfixtureが自動起動します。

## 4. Browser Kittyから接続

1. PR PreviewまたはビルドしたWeb Serial TerminalをChrome / Edgeなど対応ブラウザで開きます。
2. 「機器を選択」を押します。
3. Raspberry Pi PicoのUSB Serialを選びます。
4. まずは 115200 / 8 data bits / 1 stop bit / parity none / flow control none のまま接続します。
5. Local Echoは最初はOFFにします。

USB CDCでは115200自体は物理baudの検証にはなりません。ここではWeb Serial接続プロファイルの基本動作を確認します。

## 5. 基本送受信

送信形式をText、改行をLFにして:

```
PING
```

期待例:

```
RXLINE eol=LF bytes=4 hex=50 49 4E 47
PONG ticks=... led=...
```

次に改行をCR、CRLFへ変え、同じPINGを送ります。

期待:

- CR -> `eol=CR`
- CRLF -> `eol=CRLF`

### None

LFへ戻して:

```
TRACE ON
```

を送ったあと、改行をNoneにして:

```
ABC
```

を送ります。

期待:

```
RXBYTE 0x41
RXBYTE 0x42
RXBYTE 0x43
```

Noneなので行コマンドとしてはまだ確定しません。最後にLFなどを送ると行が確定します。

## 6. HEX送信

Text / LFで:

```
RAW 4
```

を送ります。

`RAW READY bytes=4` が出たら送信形式をHEXへ変更し:

```
00 01 7F FF
```

を送ります。

期待:

```
RAW bytes=4 hex=00 01 7F FF
```

これでHEX入力が余分な改行なしで4 byteそのまま届いていることを確認できます。

## 7. UTF-8 / LED / マクロ

Text / LFで:

```
UTF8
```

期待:

```
UTF8 日本語 café Ω
```

LED:

```
LED TOGGLE
LED ON
LED OFF
```

マクロ例:

- 名前: PING
- Text
- payload: `PING`
- LF

もう1つ:

- 名前: LED Toggle
- Text
- payload: `LED TOGGLE`
- LF

マクロ実行でも通常TXと同じようにTX byte数・ログが更新されることを確認します。

## 8. 自動追従 / 検索 / 履歴

```
BURST 300 80
```

を送ります。

確認:

- RXが連続表示される
- 上へスクロールすると自動追従が止まる
- 新着行数が増える
- 「最新へ」で末尾へ戻る
- 検索が動く
- Clear後のUndoが動く
- ↑ / ↓で手入力コマンド履歴を辿れる

継続出力:

```
STREAM 10
```

停止:

```
STREAM STOP
```

## 9. ログ上限 / 長時間

まず:

```
FLOOD 2048
```

で約2 MiBずつ出力します。

数回繰り返しながら:

- ログ使用量が増える
- 16 MiB相当付近で警告
- 20 MiB概算上限で「ログ停止」
- ログ停止後もターミナルRXが続く
- RX byte数が増え続ける
- TXT / JSONL保存ができる
- 「ログ消去」で表示を残したままログ記録が再開する

を確認します。

fixture側の1回のFLOODは最大4096 KiBに制限しています。

## 10. USB抜去 / 再接続

通信中にPicoのUSBを抜きます。

確認:

- 接続中表示から離れる
- 既存ターミナル表示が消えない
- 再接続導線が出る

同じPicoを挿し直し、明示的に再接続してPINGが再び通ることを確認します。

## 11. Ctrlキーについて

MicroPythonのUSB REPL経路ではCtrl+CなどをMicroPython自身が解釈することがあります。

fixtureはCtrl+Cを受けた場合に可能な範囲でテストループを再起動しますが、以下の「送った1 byteがそのままPicoアプリへ届いた」という厳密な判定には使いません。

- ESC
- Ctrl+C
- Ctrl+D
- Ctrl+Z
- Tab
- BREAK
- DTR / RTS

これらはUSB-UARTアダプタ方式で別途確認します。

# 実UARTを確認する場合

## 12. 必要なもの

- Raspberry Pi Pico
- 3.3 Vロジック対応USB-UARTアダプタ
- ジャンパ線

Picoは通常のUSBから給電します。USB-UARTアダプタのVCCは接続しません。

配線:

| USB-UART | Pico |
| --- | --- |
| TXD | GP1 / UART0 RX |
| RXD | GP0 / UART0 TX |
| GND | GND |

ロジック電圧は3.3 Vを使用してください。

## 13. UART echo fixture

`examples/pico-uart-echo-test.py` をPicoへ `main.py` として保存します。

Browser Kitty側ではPicoのUSB Serialではなく、USB-UARTアダプタを選択します。

初期値:

- baud: 115200
- bits: 8
- parity: none
- stop: 1

Local EchoをOFFにしてTextまたはHEXを送ると、Picoが受信したbyteをそのままUARTへ返します。

HEXで:

```
00 01 7F FF
```

を送った場合、同じ4 byteがRXへ戻ることを確認します。

PicoのUSB側をThonnyなどで開いている場合、デバッグ出力として受信byteのHEXも確認できます。

## 14. baud / parity / stop bits

`pico-uart-echo-test.py` の先頭を変更して、Browser Kitty側と同じ設定にします。

例:

```python
BAUD = 9600
BITS = 8
PARITY = None
STOP = 1
```

次に115200、230400、921600などを試します。

parity:

```python
PARITY = 0  # even
PARITY = 1  # odd
```

stop bits:

```python
STOP = 2
```

data bitsやフロー制御はMicroPythonのRP2ビルド、USB-UARTアダプタの機能にも依存するため、v0.9.0の実機マトリクスで対応可否を記録します。

## 15. v0.8.0で最優先の実機確認

まずは以下だけ実施すれば十分です。

1. Pico USB + `pico-usb-web-serial-test.py`
2. PING / LF / CR / CRLF
3. RAW 4 + `00 01 7F FF`
4. BURST 300 80
5. STREAM 10中に上スクロール → 最新へ → STREAM STOP
6. PINGマクロ
7. TXT / JSONL保存
8. USB抜去 → 挿し直し → 再接続
9. FLOOD 2048を数回実行しログ上限挙動
10. 可能ならUSB-UARTアダプタで115200のexact echo

結果はブラウザ名 / バージョン、OS、Pico / MicroPython版と一緒に残します。
