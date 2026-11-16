"use client";

import { useId, useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import type { NoteVersion } from "../lib/notes";

const FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-blue-300 dark:focus-visible:ring-offset-zinc-950";

const BUTTON_BASE = `inline-flex min-h-11 min-w-11 w-full items-center justify-center rounded-lg border px-3 py-2 text-sm font-medium transition-colors sm:w-auto ${FOCUS_RING}`;

const SECONDARY_BUTTON =
  "border-zinc-300 bg-white text-zinc-900 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800";

const PRIMARY_BUTTON =
  "border-blue-700 bg-blue-700 text-white hover:bg-blue-800 dark:border-blue-400 dark:bg-blue-400 dark:text-zinc-950 dark:hover:bg-blue-300";

export interface VersionHistoryProps {
  versions: readonly NoteVersion[];
  noteTitle?: string;
  timeZone?: string;
  onSaveVersion: () => void;
  onRestore: (versionIndex: number) => void;
}

function formatTimestamp(
  timestamp: string,
  formatter: Intl.DateTimeFormat,
): string {
  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) {
    return "Fecha no válida";
  }

  return formatter.format(date);
}

export default function VersionHistory({
  versions,
  noteTitle,
  timeZone = "UTC",
  onSaveVersion,
  onRestore,
}: VersionHistoryProps) {
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const id = useId();
  const headingId = `${id}-heading`;
  const formatter = useMemo(
    () =>
      new Intl.DateTimeFormat("es-ES", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone,
      }),
    [timeZone],
  );

  const entries = versions
    .map((version, index) => ({ version, index }))
    .reverse();

  function handleTogglePreview(versionIndex: number) {
    setPreviewIndex((current) =>
      current === versionIndex ? null : versionIndex,
    );
  }

  function handleSaveVersion() {
    onSaveVersion();
    setAnnouncement("Se guardó la versión actual de la nota.");
  }

  function handleRestore(versionIndex: number, formattedTimestamp: string) {
    onRestore(versionIndex);
    setAnnouncement(`Se restauró la versión del ${formattedTimestamp}.`);
  }

  return (
    <section
      data-testid="version-history"
      aria-labelledby={headingId}
      className="min-w-0 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
    >
      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2
            id={headingId}
            className="text-base font-semibold text-zinc-950 dark:text-zinc-50"
          >
            Historial de versiones
          </h2>
          {noteTitle ? (
            <p className="break-words text-sm text-zinc-700 dark:text-zinc-300">
              Nota activa: {noteTitle}
            </p>
          ) : null}
        </div>

        <button
          type="button"
          aria-label={
            noteTitle
              ? `Guardar versión actual de «${noteTitle}»`
              : "Guardar versión actual"
          }
          onClick={handleSaveVersion}
          className={`${BUTTON_BASE} ${PRIMARY_BUTTON}`}
        >
          Guardar versión
        </button>
      </div>

      <p
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="mt-2 min-h-5 break-words text-sm text-blue-800 dark:text-blue-200"
      >
        {announcement}
      </p>

      {entries.length === 0 ? (
        <p className="mt-2 text-sm text-zinc-700 dark:text-zinc-300">
          Aún no hay versiones guardadas.
        </p>
      ) : (
        <ol className="mt-3 space-y-3">
          {entries.map(({ version, index }) => {
            const formattedTimestamp = formatTimestamp(
              version.timestamp,
              formatter,
            );
            const isPreviewing = previewIndex === index;
            const previewId = `${id}-preview-${index}`;

            return (
              <li
                key={`${version.timestamp}-${index}`}
                data-testid="version-item"
                className="min-w-0 break-words rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-950"
              >
                <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <time
                      dateTime={version.timestamp}
                      className="block break-words text-sm font-medium text-zinc-950 dark:text-zinc-50"
                    >
                      {formattedTimestamp}
                    </time>
                    <p className="text-xs text-zinc-700 dark:text-zinc-300">
                      Versión {index + 1}
                    </p>
                  </div>

                  <div
                    data-testid="version-actions"
                    className="flex min-w-0 flex-col gap-2 sm:flex-row"
                  >
                    <button
                      type="button"
                      aria-expanded={isPreviewing}
                      aria-controls={previewId}
                      aria-label={`${isPreviewing ? "Ocultar" : "Ver"} versión del ${formattedTimestamp}`}
                      onClick={() => handleTogglePreview(index)}
                      className={`${BUTTON_BASE} ${SECONDARY_BUTTON}`}
                    >
                      {isPreviewing ? "Ocultar" : "Ver versión"}
                    </button>
                    <button
                      type="button"
                      aria-label={`Restaurar versión del ${formattedTimestamp}`}
                      onClick={() =>
                        handleRestore(index, formattedTimestamp)
                      }
                      className={`${BUTTON_BASE} ${PRIMARY_BUTTON}`}
                    >
                      Restaurar
                    </button>
                  </div>
                </div>

                <div
                  id={previewId}
                  role="region"
                  aria-label={`Vista previa de la versión del ${formattedTimestamp}`}
                  hidden={!isPreviewing}
                  className="mt-3 min-w-0 rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900"
                >
                  <div className="markdown-preview max-h-64 min-w-0 overflow-auto break-words text-sm text-zinc-950 dark:text-zinc-50">
                    {version.content.trim() === "" ? (
                      <p className="text-sm text-zinc-700 dark:text-zinc-300">
                        Esta versión no tiene contenido.
                      </p>
                    ) : (
                      <ReactMarkdown>{version.content}</ReactMarkdown>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
