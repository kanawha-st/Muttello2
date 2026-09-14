# Chromebookで使う

ChromeOSのLinux開発環境でLinux版Muttello2を起動します。ブラウザー版と異なり、Electronによる実機通信とカメラ機能を含みます。Chromebook上での起動・実機飛行・映像受信は未検証です。

## ダウンロードと起動

1. ChromeOSの設定からLinux開発環境を有効にします。
2. Linuxターミナルで `uname -m` を実行します。`x86_64` ならx64版、`aarch64` ならarm64版を選びます。32bit環境は対象外です。
3. GitHub Releasesから `Muttello2-<バージョン>-x64-linux.tar.gz` または `Muttello2-<バージョン>-arm64-linux.tar.gz` をダウンロードし、ファイルアプリで「Linuxファイル」へコピーします。
4. ターミナルで展開します。以下のファイル名はダウンロードしたものに置き換えてください。

```bash
mkdir -p ~/apps/muttello2
tar -xzf ~/Muttello2-0.1.1-x64-linux.tar.gz -C ~/apps/muttello2
find ~/apps/muttello2 -name muttello2 -type f
```

表示された実行ファイルのあるディレクトリへ `cd` して起動します。アーカイブ内のほかのファイルも必要なので、一緒に保持してください。Node.jsを別途インストールする必要はありません。

```bash
./muttello2 --tello-ip 192.168.1.42
```

IPは実際の機体のIPに置き換えます。IP指定なしならシミュレーション専用で起動します。共有ライブラリ不足のエラーが出る場合は、Linux環境に対応するライブラリのインストールが必要です。エラー全文を確認してください。

## 実機通信の設定

Tello EDUをステーションモードでChromebookと同じWi-Fiネットワークに接続します。設定方法は[README](../README.md)を参照してください。端末同士の通信が禁止されたネットワークでは利用できません。

ChromeOSの「Linux」→「ポート転送」で次を追加し、有効にします。設定画面の場所はChromeOSのバージョンによって異なります。

| ポート | 種類 | 用途 |
|---|---|---|
| 8890 | UDP | 電池・高度などの状態受信 |
| 11111 | UDP | カメラ映像受信 |

機体のUDP 8889番への送信と応答受信も必要です。アプリ側のコマンド受信ポートは動的に割り当てられます。8890番・11111番の転送だけで、すべてのChromebookの通信が保証されるわけではありません。

接続後、地上に置いた機体の電池・高度が継続して表示されることを確認します。状態が届かない場合、現在の実装は飛行を開始しません。カメラONで映像、写真の保存先を選んで撮影も確認してください。状態や映像が届かない場合は、ポート転送・ネットワーク設定・診断ログを確認します。受信元IPの検証や状態受信のチェックはそのまま有効です。

## 配布ビルド

`v`で始まるタグをpushすると、GitHub ActionsがLinux x64・arm64を各CPUのランナーでビルドし、Releasesへアップロードします。ffmpegも各CPU向けのものを同梱します。ローカルのLinux環境では `npm ci` の後に `npm run dist:linux` で、その環境のCPU向けに生成できます。

## 参考

- [Google: ChromebookでLinuxをセットアップする](https://support.google.com/chromebook/answer/9145439?hl=ja)
- [Google: Linuxのポート転送](https://support.google.com/chromebook/answer/10057656?hl=ja)
- [GitHub: 利用可能なランナー](https://docs.github.com/en/actions/reference/runners/github-hosted-runners)
