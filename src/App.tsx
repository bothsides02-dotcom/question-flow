
import { useEffect, useState } from "react";
import { flow, startNodeId } from "./data/flow";
import { resultImages } from "./data/images";

// 質問IDと模式図の対応
const questionDiagrams: Record<string, string> = {
  q1: "K-1.PNG",
  q2: "M.PNG",
  q3: "O.PNG",
  q4: "N.PNG",
  q5: "K-2.PNG",
  q6: "L.PNG",
};

const GUIDE_STORAGE_KEY = "question-flow-guide-seen";

export default function App() {
  const [currentId, setCurrentId] = useState(startNodeId);
  const [history, setHistory] = useState<string[]>([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(
    null
  );
  const [activeTab, setActiveTab] = useState<"diagnosis" | "search">(
    "diagnosis"
  );

  // 初回使い方ポップアップ
  const [showGuide, setShowGuide] = useState(false);

  // 拡大表示中の模式図
  const [selectedDiagram, setSelectedDiagram] = useState<string | null>(null);

  // 検索欄の入力内容
  const [searchQuery, setSearchQuery] = useState("");

// 画像検索のサムネイル表示（false：画像b、true：画像a）
const [showImageA, setShowImageA] = useState(false);

// 画像のタグによる絞り込み
const [imageTagFilter, setImageTagFilter] = useState<
  "all" | "A-E" | "F-K"
>("all");

// 画像保存の進捗状況
const [cacheProgress, setCacheProgress] = useState<{
  totalBytes: number;
  savedBytes: number;
  percent: number;
  complete: boolean;
} | null>(null);

// 末尾の点滅表示
const [savingDots, setSavingDots] = useState("…");

  // 拡大表示中の画像一覧
  const [modalImages, setModalImages] = useState<typeof resultImages>([]);

  const node = flow[currentId];

  // 画像ファイルのURLを作成する
  function getImageUrl(imageSrc: string) {
    return `/question-flow/${imageSrc.replace(/^\/+/, "")}`;
  }

  // 現在の診断結果に対応する画像一覧
  const imagesForResult =
    node?.type === "result"
      ? resultImages.filter((image) => image.tag === node.tag)
      : [];

// タグとキーワードで画像を絞り込む
const normalizedQuery = searchQuery.trim().toLowerCase();

// まずタグで絞り込む
const tagFilteredImages = resultImages.filter((image) => {
  if (imageTagFilter === "A-E") {
    return ["A", "B", "C", "D", "E"].includes(image.tag);
  }

  if (imageTagFilter === "F-K") {
    return ["F", "G", "H", "I", "J", "K"].includes(image.tag);
  }

  return true;
});

// 次にキーワードで絞り込む
const searchResults = normalizedQuery
  ? tagFilteredImages.filter((image) => {
      const searchableText = [image.alt, ...(image.keywords ?? [])]
        .join(" ")
        .toLowerCase();

      return searchableText.includes(normalizedQuery);
    })
  : tagFilteredImages;

  // 拡大表示する画像の情報
  const selectedImage =
    selectedImageIndex !== null
      ? modalImages[selectedImageIndex] ?? null
      : null;

  // 画像aのファイル名から、対応する画像bのURLを作る
  function getImageBUrl(imageSrc: string) {
    const imageB = imageSrc.replace(/_a(\.[^./]+)$/i, "_b$1");

    if (imageB === imageSrc) {
      return null;
    }

    return `/question-flow/${imageB.replace(/^\/+/, "")}`;
  }

  // 初回アクセス時だけ使い方を表示
  useEffect(() => {
    try {
      const hasSeenGuide = window.localStorage.getItem(GUIDE_STORAGE_KEY);

      if (hasSeenGuide !== "true") {
        setShowGuide(true);
      }
    } catch (error) {
      // localStorageが利用できない場合も使い方を表示する
      console.warn("初回表示の確認ができませんでした:", error);
      setShowGuide(true);
    }
  }, []);

  // 使い方を閉じて診断を開始
  function startDiagnosis() {
    try {
      window.localStorage.setItem(GUIDE_STORAGE_KEY, "true");
    } catch (error) {
      console.warn("表示済み情報を保存できませんでした:", error);
    }

    setShowGuide(false);
  }

  // Escキーと左右矢印キーで操作
  useEffect(() => {
    if (selectedImageIndex === null && selectedDiagram === null) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setSelectedImageIndex(null);
        setSelectedDiagram(null);
      }

      // 左右矢印キーは画像bの拡大表示中だけ使用
      if (selectedImageIndex !== null && event.key === "ArrowLeft") {
        setSelectedImageIndex((previous) => {
          if (previous === null || modalImages.length === 0) {
            return previous;
          }

          return (previous - 1 + modalImages.length) % modalImages.length;
        });
      }

      if (selectedImageIndex !== null && event.key === "ArrowRight") {
        setSelectedImageIndex((previous) => {
          if (previous === null || modalImages.length === 0) {
            return previous;
          }

          return (previous + 1) % modalImages.length;
        });
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedImageIndex, selectedDiagram, modalImages.length]);


  // Ctrl + ↑ / Ctrl + ↓ で画像検索の絞り込みを切り替える
  useEffect(() => {
    function handleFilterShortcut(event: KeyboardEvent) {
      // 画像検索タブ以外では無効
      if (activeTab !== "search") return;

      // 画像や模式図の拡大表示中は無効
      if (selectedImageIndex !== null || selectedDiagram !== null) return;

      // Ctrlキー以外の修飾キーが押されている場合は無効
      if (!event.ctrlKey || event.altKey || event.metaKey || event.shiftKey) {
        return;
      }

      // キーを押し続けた場合の連続切り替えを防止
      if (event.repeat) return;

      // 入力欄や文字入力可能な場所では無効
      const target = event.target;

      if (
        target instanceof HTMLElement &&
        (
          target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable
        )
      ) {
        return;
      }

      // Ctrl + ↑：上半身のみ
      if (event.key === "ArrowUp") {
        event.preventDefault();

        setImageTagFilter((previous) =>
          previous === "A-E" ? "all" : "A-E"
        );
      }

      // Ctrl + ↓：下半身のみ
      if (event.key === "ArrowDown") {
        event.preventDefault();

        setImageTagFilter((previous) =>
          previous === "F-K" ? "all" : "F-K"
        );
      }

// Ctrl + →：画像a / 画像bを切り替える
if (event.key === "ArrowRight") {
  event.preventDefault();

  setShowImageA((previous) => !previous);
}

    }

    window.addEventListener("keydown", handleFilterShortcut);

    return () => {
      window.removeEventListener("keydown", handleFilterShortcut);
    };
  }, [activeTab, selectedImageIndex, selectedDiagram]);


  function goTo(nextId: string) {
    setSelectedImageIndex(null);
    setSelectedDiagram(null);
    setHistory((previous) => [...previous, currentId]);
    setCurrentId(nextId);
  }

  function goBack() {
    if (history.length === 0) return;

    const previousId = history[history.length - 1];

    setSelectedImageIndex(null);
    setSelectedDiagram(null);
    setHistory((previous) => previous.slice(0, -1));
    setCurrentId(previousId);
  }

  function restart() {
    setCurrentId(startNodeId);
    setHistory([]);
    setSelectedImageIndex(null);
    setSelectedDiagram(null);
  }

// 画像保存の進捗状況を受け取る
useEffect(() => {
  if (!("serviceWorker" in navigator)) return;

  let cancelled = false;

  function handleMessage(event: MessageEvent) {
    if (event.data?.type === "IMAGE_CACHE_PROGRESS") {
      setCacheProgress({
        totalBytes: event.data.totalBytes,
        savedBytes: event.data.savedBytes,
        percent: event.data.percent,
        complete: event.data.complete,
      });
    }
  }

  navigator.serviceWorker.addEventListener("message", handleMessage);

  navigator.serviceWorker.ready.then((registration) => {
    if (cancelled) return;

    registration.active?.postMessage({
      type: "START_IMAGE_CACHE",
    });
  });

  return () => {
    cancelled = true;
    navigator.serviceWorker.removeEventListener(
      "message",
      handleMessage
    );
  };
}, []);

// 末尾の点をアニメーションさせる
useEffect(() => {
  const dots = ["…", "……", "………"];
  let index = 0;

  const timer = window.setInterval(() => {
    index = (index + 1) % dots.length;
    setSavingDots(dots[index]);
  }, 500);

  return () => window.clearInterval(timer);
}, []);

  if (!node) {
    return (
      <main className="app">
        <p>表示する項目が見つかりません。</p>
        <button onClick={restart}>最初に戻る</button>
      </main>
    );
  }

  // 現在の質問に対応する模式図
  const currentDiagram =
    node.type === "question" ? questionDiagrams[node.id] : undefined;

  return (
    <main className="app">
      <header className="site-header">
        <p className="eyebrow">Ver.26.10.05</p>
        <h1>ちよこ/かぼちゃ大作戦早押しチャート（試作）</h1>
      </header>

      {/* タブ切り替え */}
      <nav className="tab-navigation" aria-label="表示する機能">
        <button
          type="button"
          className={
            activeTab === "diagnosis" ? "tab-button active" : "tab-button"
          }
          aria-pressed={activeTab === "diagnosis"}
          onClick={() => {
            setActiveTab("diagnosis");
            setSelectedImageIndex(null);
            setSelectedDiagram(null);
          }}
        >
          チャート
        </button>

        <button
          type="button"
          className={
            activeTab === "search" ? "tab-button active" : "tab-button"
          }
          aria-pressed={activeTab === "search"}
          onClick={() => {
            setActiveTab("search");
            setSelectedImageIndex(null);
            setSelectedDiagram(null);
          }}
        >
          画像検索
        </button>
      </nav>

      {/* 画像の保存状況 */}
      {cacheProgress && !cacheProgress.complete && (
        <div className="cache-progress">
          <p className="cache-progress-title">
		<span>画像を端末に保存しています</span>
		<span className="cache-progress-dots">{savingDots}</span>
</p>

          <div className="cache-progress-info">
            <strong>{cacheProgress.percent}%</strong>
            <span>
              {(cacheProgress.savedBytes / (1024 * 1024)).toFixed(1)}
              {" MB / "}
              {(cacheProgress.totalBytes / (1024 * 1024)).toFixed(1)}
              {" MB"}
            </span>
          </div>

          <div className="cache-progress-track">
            <div
              className="cache-progress-bar"
              style={{ width: `${cacheProgress.percent}%` }}
            />
          </div>
        </div>
      )}

      {/* 画像検索タブ */}
      {activeTab === "search" && (
        <section className="search-panel">
          <h2>画像検索（部分一致）</h2>

          <input
            className="search-input"
            type="search"
            placeholder="男士名・刀派で検索"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
          />

<div className="image-filter-buttons">
  <button
    type="button"
    className={
      imageTagFilter === "A-E"
        ? "filter-button active"
        : "filter-button"
    }
    aria-pressed={imageTagFilter === "A-E"}
    onClick={() =>
      setImageTagFilter((previous) =>
        previous === "A-E" ? "all" : "A-E"
      )
    }
  >
    上半身のみ
  </button>

  <button
    type="button"
    className={
      imageTagFilter === "F-K"
        ? "filter-button active"
        : "filter-button"
    }
    aria-pressed={imageTagFilter === "F-K"}
    onClick={() =>
      setImageTagFilter((previous) =>
        previous === "F-K" ? "all" : "F-K"
      )
    }
  >
    下半身のみ
  </button>

<button
  type="button"
  className={
    showImageA ? "filter-button active" : "filter-button"
  }
  aria-pressed={showImageA}
  onClick={() => setShowImageA((previous) => !previous)}
>
  1マス表示
</button>
</div>

          <>

              {searchResults.length > 0 ? (
                <div className="image-grid">
                  {searchResults.map((image, index) => (
                    <button
                      className="image-card"
                      key={image.id}
                      type="button"
                      onClick={() => {
                        setSelectedDiagram(null);
                        setModalImages(searchResults);
                        setSelectedImageIndex(index);
                      }}
                      aria-label={`${image.alt}を拡大表示`}
                    >
                      <img
src={
  showImageA
    ? getImageUrl(image.src)
    : getImageBUrl(image.src) ?? getImageUrl(image.src)
}
                        alt={image.alt}
                        loading="lazy"
                      />
                    </button>
                  ))}
                </div>
              ) : (
                <p className="empty-message">
                  該当する画像が見つかりませんでした。
                </p>
              )}
          </>
        </section>
      )}

      {/* 診断チャートタブ */}
      {activeTab === "diagnosis" && (
        <>
          {node.type === "question" ? (
            <section
              className="question-panel"
              aria-labelledby="question-title"
            >
              <p className="step-label">QUESTION</p>

              {/* 質問タイトルと模式図 */}
              <div className="question-title-row">
                <h2 id="question-title">{node.title}</h2>

                {currentDiagram && (
                  <button
                    type="button"
                    className="question-diagram-button"
                    onClick={() => setSelectedDiagram(currentDiagram)}
                    aria-label="模式図を拡大表示"
                  >
                    <img
                      src={getImageUrl(`images/${currentDiagram}`)}
                      alt={`${currentDiagram}の模式図`}
                    />
                  </button>
                )}
              </div>

              <div className="choices">
                {node.choices.map((choice) => (
                  <button
                    className="choice-button"
                    key={choice.label}
                    onClick={() => goTo(choice.nextId)}
                  >
                    {choice.label}
                  </button>
                ))}
              </div>

              <div className="footer-actions">
                <button
                  className="text-button"
                  onClick={goBack}
                  disabled={history.length === 0}
                >
                  ← ひとつ戻る
                </button>

                <button className="text-button" onClick={restart}>
                  最初からやり直す
                </button>
              </div>
            </section>
          ) : (
            <section
              className="result-panel"
              aria-labelledby="result-title"
            >
              <p className="step-label">YOUR RESULT</p>

              <h2 id="result-title">{node.title}</h2>

              <p className="result-description">
                全{imagesForResult.length}枚
              </p>

              <div className="image-grid">
                {imagesForResult.map((image, index) => (
                  <button
                    className="image-card"
                    key={image.id}
                    type="button"
                    onClick={() => {
                      setSelectedDiagram(null);
                      setModalImages(imagesForResult);
                      setSelectedImageIndex(index);
                    }}
                    aria-label={`${image.alt}を拡大表示`}
                  >
                    <img
                      src={getImageUrl(image.src)}
                      alt={image.alt}
                      loading="lazy"
                      onError={(event) => {
                        console.error(
                          "画像の読み込みに失敗しました:",
                          event.currentTarget.src
                        );
                      }}
                    />
                  </button>
                ))}
              </div>

              {imagesForResult.length === 0 && (
                <p className="empty-message">
                  この結果に分類された画像はまだありません。
                  src/data/images.ts の設定を確認してください。
                </p>
              )}

              <div className="footer-actions result-actions">
                <button className="secondary-button" onClick={goBack}>
                  ← 前の質問に戻る
                </button>

                <button className="primary-button" onClick={restart}>
                  最初からやり直す
                </button>
              </div>
            </section>
          )}
        </>
      )}

      <footer className="site-footer">
        これは非公式のファンサイトです。著作権は権利者様側へ帰属しております。画像の転載・流用はご遠慮下さい。なんかあれば→https://forms.gle/ZmYJUcZWiZaVAtcT9
      </footer>

      {/* 初回アクセス時の使い方ポップアップ */}
      {showGuide && (
        <div className="guide-modal">
          <section
            className="guide-modal-content"
            role="dialog"
            aria-modal="true"
            aria-labelledby="guide-title"
          >
            <p className="step-label">HOW TO USE</p>
            <h2 id="guide-title">このツールの使い方</h2>

            <p className="guide-intro">
              指定されたマスを開き、条件に合う選択肢を選んでください。
              該当するパネルの一覧が表示されます。
            </p>

            <div className="guide-images">
              <figure className="guide-figure">
                <img
                  src={getImageUrl("images/IMG_0275.PNG")}
                  alt="ゲーム内パネル"
                />
                <figcaption>
                  <strong>① 上段・中央を開く</strong>
                  <span>
                    まず、上段・中央のマスを開けてください。
                  </span>
                </figcaption>
              </figure>

              <figure className="guide-figure">
                <img
                  src={getImageUrl("images/K-1.PNG")}
                  alt="上段・中央の模式図"
                />
                <figcaption>
                  <strong>② 表示に従う</strong>
                  <span>
                    次に開ける（見る）マスは、右上に表示されます。
                  </span>
                </figcaption>
              </figure>
            </div>

            <p className="guide-note">
              各画像は、クリック / タップで拡大できます。
            </p>

            <button
              type="button"
              className="guide-start-button"
              onClick={startDiagnosis}
            >
              はじめる
            </button>
          </section>
        </div>
      )}

      {/* 模式図の拡大表示 */}
      {selectedDiagram && (
        <div
          className="image-modal"
          onClick={() => setSelectedDiagram(null)}
          role="presentation"
        >
          <img
            className="image-modal-image diagram-modal-image"
            src={getImageUrl(`images/${selectedDiagram}`)}
            alt="模式図の拡大表示"
            onClick={(event) => event.stopPropagation()}
          />
        </div>
      )}

      {/* 画像bの拡大表示 */}
      {selectedImage && selectedImageIndex !== null && (
        <div
          className="image-modal"
          onClick={() => setSelectedImageIndex(null)}
          role="presentation"
        >
          <div
            className="image-modal-content"
            role="dialog"
            aria-modal="true"
            aria-label="画像の拡大表示"
          >
            {/* 画像bそのものをクリックした場合だけ閉じない */}
            {getImageBUrl(selectedImage.src) ? (
              <img
                className="image-modal-image"
                src={getImageBUrl(selectedImage.src)!}
                alt={selectedImage.alt}
                onClick={(event) => event.stopPropagation()}
                onError={(event) => {
                  console.error(
                    "対応する画像bの読み込みに失敗しました:",
                    event.currentTarget.src
                  );
                }}
              />
            ) : (
              <p className="image-modal-error">
                対応する画像bのファイル名を確認してください。
              </p>
            )}

            <p className="image-modal-caption">
              {selectedImage.alt}
            </p>

            <p className="image-modal-counter">
              {selectedImageIndex + 1} / {modalImages.length}
            </p>
          </div>
        </div>
      )}
    </main>
  );
}
