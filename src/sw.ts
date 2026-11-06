
/// <reference lib="webworker" />

import { precacheAndRoute } from "workbox-precaching";

declare let self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: Array<{
    url: string;
    revision: string | null;
  }>;
};

// 画像以外のファイルはWorkboxで保存する
// 文字列形式とオブジェクト形式の両方に対応する
const allEntries = self.__WB_MANIFEST.map((entry) =>
  typeof entry === "string"
    ? { url: entry, revision: null }
    : entry
);

const imageEntries = allEntries.filter((entry) =>
  /\/images\/.*\.(png|jpe?g|webp|avif|gif|bmp)$/i.test(
    new URL(entry.url, self.registration.scope).pathname
  )
);

const appEntries = allEntries.filter(
  (entry) => !imageEntries.includes(entry)
);

precacheAndRoute(appEntries);

// 画像一覧の更新内容に応じてキャッシュ名を変更する
const imageVersionText = imageEntries
  .map((entry) => `${entry.url}:${entry.revision ?? ""}`)
  .join("|");

let imageVersionHash = 0;

for (let i = 0; i < imageVersionText.length; i++) {
  imageVersionHash =
    (imageVersionHash * 31 + imageVersionText.charCodeAt(i)) | 0;
}

const IMAGE_CACHE_NAME =
  `question-flow-images-${Math.abs(imageVersionHash)}`;

// 古いバージョンの画像キャッシュを整理する
self.addEventListener("activate", (event: ExtendableEvent) => {
  event.waitUntil(
    (async () => {
      const cacheNames = await caches.keys();

      await Promise.all(
        cacheNames
          .filter(
            (name) =>
              name.startsWith("question-flow-images-") &&
              name !== IMAGE_CACHE_NAME
          )
          .map((name) => caches.delete(name))
      );
    })()
  );
});

// 保存済み画像があれば、ネット接続より優先して表示する
self.addEventListener("fetch", (event: FetchEvent) => {
  const url = new URL(event.request.url);
  const scopePath = new URL(self.registration.scope).pathname;

  if (
    event.request.method !== "GET" ||
    url.origin !== self.location.origin ||
    !url.pathname.startsWith(scopePath) ||
    !url.pathname.includes("/images/")
  ) {
    return;
  }

  event.respondWith(
    (async () => {
      const cache = await caches.open(IMAGE_CACHE_NAME);
      const cached = await cache.match(event.request);

      if (cached) {
        return cached;
      }

      return fetch(event.request);
    })()
  );
});

// 画像の保存状況を通知する
async function saveImages(client: Client | null) {
  const cache = await caches.open(IMAGE_CACHE_NAME);

  let totalBytes = 0;
  let savedBytes = 0;

  const sendProgress = (complete: boolean) => {
    client?.postMessage({
      type: "IMAGE_CACHE_PROGRESS",
      totalBytes,
      savedBytes,
      percent:
        totalBytes > 0
          ? Math.min(100, Math.floor((savedBytes / totalBytes) * 100))
          : complete
            ? 100
            : 0,
      complete,
    });
  };

  type ImageTask = {
    url: string;
    size: number;
    cached: boolean;
    pendingResponse?: Response;
  };

  const imageTasks: ImageTask[] = [];

  // まず画像の容量を調べる
  for (const entry of imageEntries) {
    const url = new URL(entry.url, self.registration.scope).href;

    try {
      // すでに専用キャッシュにある画像
      const cachedResponse = await cache.match(url);

      if (cachedResponse) {
        const size = (await cachedResponse.clone().blob()).size;

        imageTasks.push({
          url,
          size,
          cached: true,
        });

        totalBytes += size;
        sendProgress(false);
        continue;
      }

      // 画像をダウンロードせずに容量だけ確認する
      const headResponse = await fetch(url, {
        method: "HEAD",
      });

      const contentLength = Number(
        headResponse.headers.get("content-length")
      );

      if (
        headResponse.ok &&
        Number.isFinite(contentLength) &&
        contentLength > 0
      ) {
        imageTasks.push({
          url,
          size: contentLength,
          cached: false,
        });

        totalBytes += contentLength;
        sendProgress(false);
        continue;
      }

      // HEADで容量を取得できない場合は通常の取得方法に切り替える
      const response = await fetch(url);

      if (!response.ok) continue;

      const blob = await response.clone().blob();

      imageTasks.push({
        url,
        size: blob.size,
        cached: false,
        pendingResponse: response,
      });

      totalBytes += blob.size;
      sendProgress(false);
    } catch (error) {
      console.error("画像の容量確認に失敗しました:", url, error);
    }
  }

  sendProgress(false);

  // 画像を1枚ずつ保存し、保存のたびに進捗を通知する
  for (const task of imageTasks) {
    if (task.cached) {
      savedBytes += task.size;
      sendProgress(false);
      continue;
    }

    try {
      const response =
        task.pendingResponse ?? (await fetch(task.url));

      if (!response.ok) {
        totalBytes -= task.size;
        sendProgress(false);
        continue;
      }

      // 画像データを取得する
      const imageBuffer = await response.arrayBuffer();
      const actualSize = imageBuffer.byteLength;

      // 事前に調べた容量と実際の容量が異なる場合は調整する
      totalBytes += actualSize - task.size;

      // 専用キャッシュに保存する
      const savedResponse = new Response(imageBuffer, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
      });

      await cache.put(task.url, savedResponse);

      savedBytes += actualSize;

      // 保存完了のたびに進捗を通知
      sendProgress(false);
    } catch (error) {
      totalBytes -= task.size;
      console.error("画像の保存に失敗しました:", task.url, error);
      sendProgress(false);
    }
  }

  // 保存処理の終了を通知する
  sendProgress(true);
}

// アプリからの保存開始リクエストを受け取る
self.addEventListener("message", (event: ExtendableMessageEvent) => {
  if (event.data?.type === "START_IMAGE_CACHE") {
    const client =
      event.source && "postMessage" in event.source
        ? (event.source as Client)
        : null;

    event.waitUntil(saveImages(client));
  }
});
