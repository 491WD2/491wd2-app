import { useEffect, useRef, useState } from "react";
import Dropzone from "dropzone";
import "dropzone/dist/dropzone.css";
import { FeatherIconTile } from "../icons/FeatherIcon";

export type DroppedHouseholdFile = {
  id: string;
  name: string;
  size: number;
  type: string;
  dataUrl: string;
  addedAt: string;
};

type Props = {
  onFilesReady?: (files: DroppedHouseholdFile[]) => void;
  accept?: string;
  maxFiles?: number;
  title?: string;
  subtitle?: string;
};

/**
 * AdminUX-style Dropzone (local preview / data URL — no remote upload URL required).
 */
export function AdminUxDropzone({
  onFilesReady,
  accept = "image/*,.pdf,.txt,.csv",
  maxFiles = 8,
  title = "Upload files",
  subtitle = "Drag & drop receipts, photos, or docs here",
}: Props) {
  const formRef = useRef<HTMLFormElement>(null);
  const onFilesReadyRef = useRef(onFilesReady);
  const [previews, setPreviews] = useState<DroppedHouseholdFile[]>([]);

  useEffect(() => {
    onFilesReadyRef.current = onFilesReady;
  }, [onFilesReady]);

  useEffect(() => {
    const el = formRef.current;
    if (!el) return;

    const dz = new Dropzone(el, {
      url: "/local-dropzone",
      autoProcessQueue: false,
      maxFiles,
      acceptedFiles: accept,
      addRemoveLinks: true,
      dictDefaultMessage: subtitle,
      dictRemoveFile: "Remove",
      clickable: true,
      createImageThumbnails: true,
      thumbnailWidth: 120,
      thumbnailHeight: 120,
    });

    const readFile = (file: File) =>
      new Promise<DroppedHouseholdFile>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          resolve({
            id: crypto.randomUUID(),
            name: file.name,
            size: file.size,
            type: file.type || "application/octet-stream",
            dataUrl: String(reader.result || ""),
            addedAt: new Date().toISOString(),
          });
        };
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
      });

    dz.on("addedfiles", (files: File[]) => {
      void (async () => {
        try {
          const mapped = await Promise.all(files.map((f) => readFile(f)));
          setPreviews((prev) => {
            const next = [...mapped, ...prev].slice(0, maxFiles);
            onFilesReadyRef.current?.(next);
            return next;
          });
        } catch {
          /* ignore read errors */
        }
      })();
    });

    dz.on("removedfile", (file: File) => {
      setPreviews((prev) => {
        const next = prev.filter((p) => p.name !== file.name || p.size !== file.size);
        onFilesReadyRef.current?.(next);
        return next;
      });
    });

    return () => {
      dz.destroy();
    };
  }, [accept, maxFiles, subtitle]);

  return (
    <div className="aux-card mb-4">
      <div className="aux-card-header flex-wrap">
        <FeatherIconTile name="upload-cloud" tone="mint" size={18} />
        <div className="min-w-0 flex-1">
          <h3 className="text-base">{title}</h3>
          <p className="aux-muted">{subtitle}</p>
        </div>
        <span className="badge badge-light rounded-pill text-bg-theme">{previews.length} files</span>
      </div>
      <div className="aux-card-body">
        <form
          ref={formRef}
          className="dropzone aux-dropzone"
          id="householdDropzone"
          action="/local-dropzone"
          method="post"
          encType="multipart/form-data"
        >
          <div className="dz-message needsclick">
            <FeatherIconTile name="image" tone="cyan" size={22} />
            <p className="mb-1 mt-2 fw-medium">Drop files to upload</p>
            <p className="aux-muted mb-0 text-sm">Images, PDF, TXT, CSV · max {maxFiles}</p>
          </div>
        </form>

        {previews.length > 0 ? (
          <ul className="aux-dropzone-list mt-3">
            {previews.map((file) => (
              <li key={file.id} className="aux-dropzone-list__item">
                {file.type.startsWith("image/") ? (
                  <img src={file.dataUrl} alt="" className="aux-dropzone-thumb" />
                ) : (
                  <span className="aux-dropzone-fileicon" aria-hidden>
                    <i className="bi bi-file-earmark" />
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="mb-0 fw-medium truncate">{file.name}</p>
                  <p className="aux-muted mb-0 text-sm">
                    {(file.size / 1024).toFixed(1)} KB · stored locally
                  </p>
                </div>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  );
}
