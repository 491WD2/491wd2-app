import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  HELP_CATEGORY_LABELS,
  HELP_CHAPTERS,
  type HelpArticle,
  type HelpBlock,
  type HelpCategory,
  searchHelpChapters,
  flattenArticlesForToc,
} from "../lib/helpCenterContent";

type CategoryFilter = HelpCategory | "all";

function renderBlock(block: HelpBlock, key: string): ReactNode {
  if (block.type === "p") {
    return (
      <p key={key} className="wd-help-article__p">
        {block.text}
      </p>
    );
  }
  if (block.type === "h4") {
    return (
      <h4 key={key} className="wd-help-article__h4">
        {block.text}
      </h4>
    );
  }
  return (
    <ul key={key} className="wd-help-article__ul">
      {block.items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

export default function HelpCenterPage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<CategoryFilter>("all");
  const [activeArticleId, setActiveArticleId] = useState<string>(() => HELP_CHAPTERS[0]?.articles[0]?.id ?? "");

  const filteredChapters = useMemo(() => searchHelpChapters(query, category), [query, category]);

  const toc = useMemo(() => flattenArticlesForToc(filteredChapters), [filteredChapters]);

  const activeEntry = useMemo(() => {
    const found = toc.find((e) => e.article.id === activeArticleId);
    if (found) return found;
    return toc[0] ?? null;
  }, [toc, activeArticleId]);

  useEffect(() => {
    if (toc.length === 0) return;
    if (!toc.some((e) => e.article.id === activeArticleId)) {
      setActiveArticleId(toc[0].article.id);
    }
  }, [toc, activeArticleId]);

  const activeArticle: HelpArticle | null = activeEntry?.article ?? null;
  const activeChapter = activeEntry?.chapter ?? null;

  return (
    <div className="wd-help-center">
      <header className="wd-help-center__hero">
        <div>
          <p className="wd-help-center__eyebrow">491WD documentation</p>
          <h1 className="wd-help-center__title">Help Center</h1>
          <p className="wd-help-center__lede">
            Static documentation for My Build, UI Builder, Saved UI Preview, import/export, React export, component settings, and troubleshooting — all in the app, no external services.
          </p>
        </div>
      </header>

      <div className="wd-help-center__toolbar">
        <label className="wd-help-center__search">
          <span className="wd-visually-hidden">Search documentation</span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search titles and topics…"
            autoComplete="off"
          />
        </label>
        <div className="wd-help-center__filters" role="group" aria-label="Documentation category">
          {(["all", "referential", "procedural", "conceptual", "workflows"] as const).map((key) => (
            <button
              key={key}
              type="button"
              className={category === key ? "wd-help-filter wd-help-filter--active" : "wd-help-filter"}
              onClick={() => setCategory(key)}
            >
              {key === "all" ? "All" : HELP_CATEGORY_LABELS[key]}
            </button>
          ))}
        </div>
      </div>

      <div className="wd-help-center__layout">
        <nav className="wd-help-center__toc" aria-label="Table of contents">
          {filteredChapters.map((chapter) => (
            <div key={chapter.id} className="wd-help-toc-group">
              <p className="wd-help-toc-group__label">
                {chapter.letter}. {chapter.title}
              </p>
              <ul>
                {chapter.articles.map((article) => (
                  <li key={article.id}>
                    <button
                      type="button"
                      className={
                        article.id === activeArticleId ? "wd-help-toc-link wd-help-toc-link--active" : "wd-help-toc-link"
                      }
                      onClick={() => setActiveArticleId(article.id)}
                    >
                      {article.title}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          {filteredChapters.length === 0 ? (
            <p className="wd-help-center__empty">No articles match your search and filters.</p>
          ) : null}
        </nav>

        <article className="wd-help-center__article" aria-live="polite">
          {activeArticle && activeChapter ? (
            <>
              <header className="wd-help-article__header">
                <p className="wd-help-article__meta">
                  {activeChapter.letter}. {activeChapter.title} · {HELP_CATEGORY_LABELS[activeChapter.category]}
                </p>
                <h2 id={`help-article-${activeArticle.id}`} className="wd-help-article__title">
                  {activeArticle.title}
                </h2>
              </header>
              <div className="wd-help-article__body">
                {activeArticle.blocks.map((block, i) => renderBlock(block, `${activeArticle.id}-${i}`))}
              </div>
            </>
          ) : (
            <p className="wd-help-center__empty">Select an article from the sidebar.</p>
          )}
        </article>
      </div>
    </div>
  );
}
