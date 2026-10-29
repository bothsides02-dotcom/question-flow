# 診断サイト（question-flow）

TypeScript + React + Vite で作った診断サイトのひな形です。GitHub Pages で公開できます。

## まず行うこと

1. Node.js の LTS 版をインストール: https://nodejs.org/
2. このフォルダを展開し、`question-flow` フォルダを開きます。
3. `public/images/` に手持ちの画像を20枚入れます。
4. `src/data/images.ts` を開き、各画像のファイル名とタグ（A〜F）を設定します。
5. ターミナルでこのフォルダに移動し、`npm install`、続けて `npm run dev` を実行します。

## 画像の入れ方

最初は `image01.jpg` 〜 `image20.jpg` という名前を想定しています。実際のファイル名が違う場合は、`src/data/images.ts` の `src` も実際の名前に合わせて変更してください。画像ファイル名は大文字・小文字も一致させます。

各画像には A〜F のいずれか1つのタグを設定します。例:

```ts
{ id: "image01", src: "images/image01.jpg", tag: "A", alt: "画像01" }
```

この場合、`public/images/image01.jpg` が結果Aに表示されます。A〜Fの割り当てはサンプルなので、実際の画像に合わせて変更してください。

## ローカルで確認

```bash
npm install
npm run dev
```

ターミナルに表示された `http://localhost:...` のアドレスをブラウザで開きます。停止するときはターミナルで `Ctrl + C` を押します。

## GitHub Pages に公開

- GitHub リポジトリ名を `question-flow` にする場合、`vite.config.ts` の `base: "/question-flow/"` はそのままです。
- リポジトリ名が別なら `base` を `"/リポジトリ名/"` に変更します。
- リポジトリ名を `ユーザー名.github.io` にする場合は `base: "/"` に変更します。
- `.github/workflows/deploy.yml` を含めて GitHub にアップロードします。
- GitHub のリポジトリ画面で **Settings → Pages → Build and deployment → Source → GitHub Actions** を選びます。
- `main` ブランチに変更を push すると、自動でデプロイされます。

## 質問の分岐を変更

`src/data/flow.ts` の `choices` 内にある `nextId` を編集します。`nextId` は移動先のノードID（例: `q2`、`resultA`）と一致させます。
