import { useEffect, useState } from "react";
import { flow, startNodeId } from "./data/flow";
import { resultImages } from "./data/images";

export default function App() {
  const [currentId, setCurrentId] = useState(startNodeId);
  const [history, setHistory] = useState<string[]>([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(
    null
  );
  const [activeTab, setActiveTab] = useState<"diagnosis" | "search">(
    "diagnosis"
  );

  // 検索欄の入力内容
  const [searchQuery, setSearchQuery] = useState("");

  // 拡大表示中の画像一覧
  const [modalImages, setModalImages] = useState<typeof resultImages>([]);

  const node = flow[currentId];

  // 画像ファイルのURLを作成する
  function getImageUrl(imageSrc: string) {
    return `${import.meta.env.BASE_URL}${imageSrc.replace(/^\/+/, "")}`;
  }

  // 現在の診断結果に対応する画像一覧
  const imagesForResult =
    node?.type === "result"
      ? resultImages.filter((image) => image.tag === node.tag)
      : [];

  // 全画像から検索する
  const normalizedQuery = searchQuery.trim().toLowerCase();
  const searchResults = normalizedQuery
    ? resultImages.filter((image) => {
        const searchableText = [image.alt, ...(image.keywords ?? [])]
          .join(" ")
          .toLowerCase();

        return searchableText.includes(normalizedQuery);
      })
    : [];

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

    return `${import.meta.env.BASE_URL}${imageB.replace(/^\/+/, "")}`;
  }

  // Escキーと左右矢印キーで操作
  useEffect(() => {
    if (selectedImageIndex === null) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setSelectedImageIndex(null);
      }

      if (event.key === "ArrowLeft") {
        setSelectedImageIndex((previous) => {
          if (previous === null || modalImages.length === 0) {
            return previous;
          }

          return (
            previous - 1 + modalImages.length
          ) % modalImages.length;
        });
      }

      if (event.key === "ArrowRight") {
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
  }, [selectedImageIndex, modalImages.length]);

  function goTo(nextId: string) {
    setSelectedImageIndex(null);
    setHistory((previous) => [...previous, currentId]);
    setCurrentId(nextId);
  }

  function goBack() {
    if (history.length === 0) return;

    const previousId = history[history.length - 1];

    setSelectedImageIndex(null);
    setHistory((previous) => previous.slice(0, -1));
    setCurrentId(previousId);
  }

  function restart() {
    setCurrentId(startNodeId);
    setHistory([]);
    setSelectedImageIndex(null);
  }

  if (!node) {
    return (
      <main className="app">
        <p>表示する項目が見つかりません。</p>
        <button onClick={restart}>最初に戻る</button>
      </main>
    );
  }

  return (
    <main className="app">
      <header className="site-header">
        <p className="eyebrow">Ver.26.10.02</p>
        <h1>ちよこ/かぼちゃ大作戦早押しチャート（お試し）</h1>
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
          }}
        >
          画像検索
        </button>
      </nav>

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

          {searchQuery.trim() !== "" && (
            <>
              <p className="search-count">
                検索結果：{searchResults.length}枚
              </p>

              {searchResults.length > 0 ? (
                <div className="image-grid">
                  {searchResults.map((image, index) => (
                    <button
                      className="image-card"
                      key={image.id}
                      type="button"
                      onClick={() => {
                        setModalImages(searchResults);
                        setSelectedImageIndex(index);
                      }}
                      aria-label={`${image.alt}を拡大表示`}
                    >
                      <img
                        src={getImageUrl(image.src)}
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
          )}
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

              <h2 id="question-title">{node.title}</h2>

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
