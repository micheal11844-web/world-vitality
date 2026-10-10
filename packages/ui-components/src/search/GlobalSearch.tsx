"use client";

import { useEffect, useId, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { classifyQuery, extractPlaceCandidate, type SearchSuggestion } from "./search-core.js";

export interface GlobalSearchProps {
  /**
   * Where the form submits (GET, `?q=`). Defaults to the app's results
   * page. Like `GlobeToggleLink` and `AccountControls`, the defaults
   * point at fixed app routes — a deliberate coupling of this shell to
   * the host app, chosen over threading props through ~13 shells.
   */
  action?: string;
  /** JSON endpoint returning `{ suggestions: SearchSuggestion[] }` for workspace/page matches. */
  suggestEndpoint?: string;
  /** JSON endpoint returning `{ suggestions: SearchSuggestion[] }` for place matches. */
  placesEndpoint?: string;
}

const KIND_LABEL: Record<SearchSuggestion["kind"], string> = {
  workspace: "Workspace",
  page: "Page",
  setting: "Setting",
  tool: "Tool",
  place: "Place",
};

const TOPIC_DEBOUNCE_MS = 120;
const PLACE_DEBOUNCE_MS = 350;
const MIN_PLACE_CHARS = 3;

async function fetchSuggestions(
  endpoint: string,
  query: string,
  signal: AbortSignal,
): Promise<SearchSuggestion[]> {
  const url = `${endpoint}?q=${encodeURIComponent(query)}`;
  const response = await fetch(url, { signal, headers: { accept: "application/json" } });
  if (!response.ok) return [];
  const data = (await response.json()) as { suggestions?: SearchSuggestion[] };
  return Array.isArray(data.suggestions) ? data.suggestions.filter(isSafeSuggestion) : [];
}

/**
 * Defense in depth: suggestions come from this app's own endpoints,
 * but the client still only ever navigates to same-origin paths.
 */
function isSafeSuggestion(item: SearchSuggestion): boolean {
  return (
    typeof item?.href === "string" &&
    item.href.startsWith("/") &&
    !item.href.startsWith("//") &&
    typeof item.label === "string"
  );
}

/**
 * The header's global search (PRD B.4). A real `<form method="get">`
 * first — with JavaScript off or the suggestion endpoints down, typing
 * and pressing Enter still lands on the results page. The type-ahead
 * is an enhancement on top: workspace/page matches appear almost
 * immediately, place matches (a geocoder lookup, so slower and
 * best-effort) join them a moment later.
 *
 * Accessibility: the W3C combobox-with-listbox pattern — the input is
 * `role="combobox"` with `aria-activedescendant` pointing at the
 * highlighted option, so a screen reader announces options while focus
 * stays in the text field. Arrow keys move, Enter opens, Escape closes,
 * and `/` focuses the box from anywhere on the page (ignored while
 * typing in another field).
 *
 * The query is sent to the app's own endpoints, never logged by this
 * component, and a failed request just means fewer suggestions — there
 * is no error UI for type-ahead, because the Enter-to-search path is
 * always there.
 */
export function GlobalSearch({
  action = "/search",
  suggestEndpoint = "/api/search/suggest",
  placesEndpoint = "/api/search/places",
}: GlobalSearchProps) {
  const [query, setQuery] = useState("");
  const [topics, setTopics] = useState<SearchSuggestion[]>([]);
  const [places, setPlaces] = useState<SearchSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  const trimmed = query.trim();
  const items: SearchSuggestion[] = [...topics, ...places];
  const showList = open && trimmed.length > 0;

  // "/" focuses search, like most large apps.
  useEffect(() => {
    function onKeyDown(event: globalThis.KeyboardEvent) {
      if (event.key !== "/" || event.ctrlKey || event.metaKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      const tag = target?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || target?.isContentEditable) {
        return;
      }
      event.preventDefault();
      inputRef.current?.focus();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // Close when focus or a click lands outside the search.
  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  // Workspace/page suggestions — cheap, local to the server, near-instant.
  useEffect(() => {
    if (!trimmed) {
      setTopics([]);
      return;
    }
    const controller = new AbortController();
    const timer = setTimeout(() => {
      fetchSuggestions(suggestEndpoint, trimmed, controller.signal)
        .then((next) => {
          setTopics(next);
          setActiveIndex(-1);
        })
        .catch(() => {
          // Aborted or offline — keep whatever is showing.
        });
    }, TOPIC_DEBOUNCE_MS);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [trimmed, suggestEndpoint]);

  // Place suggestions — a geocoder lookup, debounced harder. For a
  // question ("will it flood near Lagos?") look up the place it names.
  useEffect(() => {
    const placeQuery =
      classifyQuery(trimmed) === "question" ? (extractPlaceCandidate(trimmed) ?? "") : trimmed;
    if (placeQuery.length < MIN_PLACE_CHARS) {
      setPlaces([]);
      return;
    }
    const controller = new AbortController();
    const timer = setTimeout(() => {
      fetchSuggestions(placesEndpoint, placeQuery, controller.signal)
        .then((next) => setPlaces(next))
        .catch(() => {
          // Same: best-effort only.
        });
    }, PLACE_DEBOUNCE_MS);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [trimmed, placesEndpoint]);

  function openItem(item: SearchSuggestion) {
    setOpen(false);
    window.location.assign(item.href);
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    const active = activeIndex >= 0 ? items[activeIndex] : undefined;
    if (active) {
      event.preventDefault();
      openItem(active);
      return;
    }
    if (!trimmed) event.preventDefault(); // nothing to search for
    setOpen(false);
  }

  function onInputKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      if (items.length === 0) return;
      event.preventDefault();
      setOpen(true);
      setActiveIndex((i) => (i + 1) % items.length);
    } else if (event.key === "ArrowUp") {
      if (items.length === 0) return;
      event.preventDefault();
      setOpen(true);
      setActiveIndex((i) => (i <= 0 ? items.length - 1 : i - 1));
    } else if (event.key === "Escape") {
      if (open) {
        event.preventDefault();
        setOpen(false);
        setActiveIndex(-1);
      } else if (query) {
        setQuery("");
      }
    }
  }

  const activeId = activeIndex >= 0 ? `${listId}-opt-${activeIndex}` : undefined;

  return (
    <div
      ref={rootRef}
      style={{
        position: "relative",
        flex: "1 1 14rem",
        minWidth: "9rem",
        maxWidth: "20rem",
        fontFamily: "var(--wv-font-sans)",
      }}
    >
      <form role="search" action={action} method="get" onSubmit={onSubmit} style={{ margin: 0 }}>
        <input
          ref={inputRef}
          type="search"
          name="q"
          role="combobox"
          aria-label="Search World Vitality"
          aria-expanded={showList}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={activeId}
          autoComplete="off"
          maxLength={200}
          placeholder="Search places, topics…"
          title="Search (press / to focus)"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            setActiveIndex(-1);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onInputKeyDown}
          style={{
            width: "100%",
            boxSizing: "border-box",
            padding: "0.375rem 0.75rem",
            borderRadius: "var(--wv-radius-sm)",
            border: "1px solid var(--wv-border)",
            backgroundColor: "var(--wv-surface)",
            color: "var(--wv-text-primary)",
            fontFamily: "var(--wv-font-sans)",
            fontSize: "0.875rem",
          }}
        />
      </form>

      <div
        hidden={!showList}
        style={{
          position: "absolute",
          top: "calc(100% + 0.25rem)",
          left: 0,
          right: 0,
          minWidth: "18rem",
          zIndex: 30,
          borderRadius: "var(--wv-radius-sm)",
          border: "1px solid var(--wv-border)",
          backgroundColor: "var(--wv-surface)",
          boxShadow: "0 8px 24px rgba(0, 0, 0, 0.18)",
        }}
      >
        <ul
          id={listId}
          role="listbox"
          aria-label="Search suggestions"
          style={{
            margin: 0,
            padding: "0.25rem",
            listStyle: "none",
            maxHeight: "20rem",
            overflowY: "auto",
          }}
        >
          {items.map((item, index) => (
            <li
              key={`${item.kind}-${item.id}`}
              id={`${listId}-opt-${index}`}
              role="option"
              aria-selected={index === activeIndex}
              style={{
                borderRadius: "var(--wv-radius-sm)",
                backgroundColor: index === activeIndex ? "var(--wv-bg)" : "transparent",
              }}
            >
              <a
                href={item.href}
                tabIndex={-1}
                style={{
                  display: "block",
                  padding: "0.4rem 0.6rem",
                  textDecoration: "none",
                  color: "var(--wv-text-primary)",
                  fontSize: "0.875rem",
                }}
              >
                <span style={{ display: "flex", justifyContent: "space-between", gap: "0.75rem" }}>
                  <span>{item.label}</span>
                  <span style={{ color: "var(--wv-text-secondary)", fontSize: "0.75rem" }}>
                    {KIND_LABEL[item.kind]}
                  </span>
                </span>
                {item.description && (
                  <span
                    style={{
                      display: "block",
                      color: "var(--wv-text-secondary)",
                      fontSize: "0.75rem",
                    }}
                  >
                    {item.description}
                  </span>
                )}
              </a>
            </li>
          ))}
        </ul>
        <div
          style={{
            padding: "0.375rem 0.85rem",
            borderTop: items.length > 0 ? "1px solid var(--wv-border)" : undefined,
            color: "var(--wv-text-secondary)",
            fontSize: "0.75rem",
          }}
        >
          {items.length === 0
            ? `No quick matches — press Enter to search for “${trimmed}”`
            : `Press Enter for all results for “${trimmed}”`}
        </div>
      </div>
    </div>
  );
}
