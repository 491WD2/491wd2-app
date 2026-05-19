import { ImageIcon } from "lucide-react";
import type { Dispatch, SetStateAction } from "react";
import { useRef, useState } from "react";
import type { CleaningPhotoReference, FamilyData, KitchenChecklistItem } from "../../data/familyData";
import { Button } from "../ui/Button";
import { Textarea } from "../ui/Field";
import {
  DrawerBackdrop,
  DrawerBody,
  DrawerFooter,
  DrawerHeader,
  DrawerPanel,
} from "../workspace/DrawerShell";
import { getKitchenTaskNotesLines } from "../../lib/kitchenTaskNotes";
import { compressJpegFileToDataUrl } from "../../lib/kitchenChecklistPhotos";
import { cn } from "../../lib/utils";

const MIN_PHOTO_SLOTS = 3;

function ensureMinPhotoSlots(existing: CleaningPhotoReference[] | undefined): CleaningPhotoReference[] {
  const now = new Date().toISOString();
  const list: CleaningPhotoReference[] = [...(existing ?? [])];
  while (list.length < MIN_PHOTO_SLOTS) {
    list.push({ id: crypto.randomUUID(), createdAt: now, updatedAt: now });
  }
  return list;
}

function serializeForDirtyCompare(input: {
  stepsText: string;
  notesText: string;
  photos: CleaningPhotoReference[];
}): string {
  return JSON.stringify({
    stepsText: input.stepsText,
    notesText: input.notesText,
    photos: input.photos.map((p) => ({
      id: p.id,
      imageLen: p.imageDataUrl?.length ?? 0,
      instructions: p.instructions ?? "",
      objectPositionX: p.objectPositionX ?? 0,
      objectPositionY: p.objectPositionY ?? 0,
      scale: p.scale ?? 1,
    })),
  });
}

function buildInitial(item: KitchenChecklistItem) {
  const bundled = getKitchenTaskNotesLines(item.label);
  return {
    stepsText: (item.stepsLines ?? bundled).join("\n"),
    notesText: item.notesText ?? "",
    photos: ensureMinPhotoSlots(item.photoReferences),
  };
}

type Props = {
  item: KitchenChecklistItem;
  titleIdBase: string;
  onClose: () => void;
  setData: Dispatch<SetStateAction<FamilyData>>;
};

export function KitchenTaskNotesDrawer({ item, titleIdBase, onClose, setData }: Props) {
  const panelTitleId = `${titleIdBase}-notes-detail`;
  const seedRef = useRef<ReturnType<typeof buildInitial> | null>(null);
  if (seedRef.current === null) {
    seedRef.current = buildInitial(item);
  }
  const seed = seedRef.current;

  const [stepsText, setStepsText] = useState(seed.stepsText);
  const [notesText, setNotesText] = useState(seed.notesText);
  const [photos, setPhotos] = useState(seed.photos);
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const [adjustOpenId, setAdjustOpenId] = useState<string | null>(null);

  const snapshotRef = useRef(serializeForDirtyCompare(seed));

  const isDirty = serializeForDirtyCompare({ stepsText, notesText, photos }) !== snapshotRef.current;

  function requestClose() {
    if (isDirty) {
      if (!window.confirm("Discard unsaved changes?")) {
        return;
      }
    }
    onClose();
  }

  function updatePhoto(id: string, patch: Partial<CleaningPhotoReference>) {
    const now = new Date().toISOString();
    setPhotos((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...patch, updatedAt: now } : p)),
    );
  }

  function handleSave() {
    const lines = stepsText
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
    const now = new Date().toISOString();
    const mergedPhotos = photos.map((p) => ({ ...p, updatedAt: now }));

    setData((current) => ({
      ...current,
      kitchenChecklist: current.kitchenChecklist.map((row) =>
        row.id === item.id
          ? {
              ...row,
              stepsLines: lines.length > 0 ? lines : undefined,
              notesText: notesText.trim() || undefined,
              photoReferences: mergedPhotos,
            }
          : row,
      ),
    }));

    snapshotRef.current = serializeForDirtyCompare({
      stepsText,
      notesText,
      photos: mergedPhotos,
    });

    window.alert("Notes saved.");
    onClose();
  }

  async function handleFile(slotIndex: number, file: File | undefined) {
    if (!file) return;
    setUploadingIndex(slotIndex);
    try {
      const result = await compressJpegFileToDataUrl(file);
      if (!result.ok) {
        const msg =
          result.reason === "not_jpeg"
            ? "Please upload a JPEG image."
            : result.reason === "too_large"
              ? "Image is still too large after compression. Try a smaller photo."
              : result.reason === "decode_failed"
                ? "Could not read that image. Please upload a JPEG image."
                : "Could not process that image.";
        window.alert(msg);
        return;
      }
      const now = new Date().toISOString();
      const id = photos[slotIndex]?.id;
      if (!id) return;
      updatePhoto(id, {
        imageDataUrl: result.dataUrl,
        objectPositionX: undefined,
        objectPositionY: undefined,
        scale: undefined,
        updatedAt: now,
      });
    } finally {
      setUploadingIndex(null);
    }
  }

  const addPhoto = () => {
    const now = new Date().toISOString();
    setPhotos((prev) => [...prev, { id: crypto.randomUUID(), createdAt: now, updatedAt: now }]);
  };

  const deletePhotoSlot = (index: number) => {
    if (photos.length <= MIN_PHOTO_SLOTS || index < MIN_PHOTO_SLOTS) {
      return;
    }
    setPhotos((prev) => prev.filter((_, i) => i !== index));
    setAdjustOpenId(null);
  };

  return (
    <>
      <DrawerBackdrop ariaLabel="Close notes" onClick={requestClose} />
      <DrawerPanel
        aria-labelledby={panelTitleId}
        className="z-50 flex max-h-[100dvh] w-full max-w-full flex-col border-white/10 bg-[#0d131a] text-slate-100 shadow-2xl lg:max-w-[56rem]"
      >
        <DrawerHeader
          dark
          eyebrow="Kitchen task"
          title={item.label}
          titleId={panelTitleId}
          trailing={
            <Button
              type="button"
              variant="ghost"
              className="text-slate-300 hover:bg-white/10"
              onClick={requestClose}
            >
              Close
            </Button>
          }
        />
        <DrawerBody dark className="flex flex-col gap-6">
          <section className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">Steps</h3>
            <Textarea
              value={stepsText}
              onChange={(e) => setStepsText(e.target.value)}
              rows={6}
              className="min-h-[140px] border-white/10 bg-[#0a0f14] text-sm text-slate-100 placeholder:text-slate-600"
              placeholder="One step per line…"
            />
            <p className="text-xs text-slate-500">
              One step per line. Empty lines are removed when you save.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">Notes</h3>
            <Textarea
              value={notesText}
              onChange={(e) => setNotesText(e.target.value)}
              rows={4}
              className="min-h-[100px] border-white/10 bg-[#0a0f14] text-sm text-slate-100 placeholder:text-slate-600"
              placeholder="Household notes for this chore…"
            />
          </section>

          <section className="space-y-3">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">Photos</h3>
              <p className="mt-1 text-xs leading-relaxed text-slate-500">
                Add reference photos for how this area should look when finished.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {photos.map((ref, index) => (
                <KitchenPhotoSlotCard
                  key={ref.id}
                  index={index}
                  photoRef={ref}
                  uploading={uploadingIndex === index}
                  adjustOpen={adjustOpenId === ref.id}
                  onToggleAdjust={() =>
                    setAdjustOpenId((cur) => (cur === ref.id ? null : ref.id))
                  }
                  onPickFile={(file) => void handleFile(index, file)}
                  onRemoveImage={() =>
                    updatePhoto(ref.id, {
                      imageDataUrl: undefined,
                      objectPositionX: undefined,
                      objectPositionY: undefined,
                      scale: undefined,
                    })
                  }
                  onInstructionChange={(text) => updatePhoto(ref.id, { instructions: text || undefined })}
                  onPatch={updatePhoto}
                  canDeleteSlot={photos.length > MIN_PHOTO_SLOTS && index >= MIN_PHOTO_SLOTS}
                  onDeleteSlot={() => deletePhotoSlot(index)}
                />
              ))}
            </div>

            <Button
              type="button"
              variant="secondary"
              className="border-white/12 bg-white/[0.06] text-slate-100 hover:bg-white/10"
              onClick={addPhoto}
            >
              Add Photo
            </Button>
          </section>
        </DrawerBody>
        <DrawerFooter dark className="flex flex-wrap gap-2 border-white/10 bg-[#0d131a]">
          <Button type="button" variant="primary" className="min-h-11 px-6" onClick={handleSave}>
            Save Changes
          </Button>
          <Button
            type="button"
            variant="secondary"
            className="min-h-11 border-white/12 bg-white/[0.06] text-slate-100 hover:bg-white/10"
            onClick={requestClose}
          >
            Cancel
          </Button>
        </DrawerFooter>
      </DrawerPanel>
    </>
  );
}

function KitchenPhotoSlotCard({
  index,
  photoRef,
  uploading,
  adjustOpen,
  onToggleAdjust,
  onPickFile,
  onRemoveImage,
  onInstructionChange,
  onPatch,
  canDeleteSlot,
  onDeleteSlot,
}: {
  index: number;
  photoRef: CleaningPhotoReference;
  uploading: boolean;
  adjustOpen: boolean;
  onToggleAdjust: () => void;
  onPickFile: (file: File | undefined) => void;
  onRemoveImage: () => void;
  onInstructionChange: (text: string) => void;
  onPatch: (id: string, patch: Partial<CleaningPhotoReference>) => void;
  canDeleteSlot: boolean;
  onDeleteSlot: () => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const hasImage = Boolean(photoRef.imageDataUrl?.trim());

  const px = photoRef.objectPositionX ?? 0;
  const py = photoRef.objectPositionY ?? 0;
  const sc = photoRef.scale ?? 1;

  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-2xl border border-white/10 bg-[#141a22] p-3 shadow-lg shadow-black/30",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-slate-100">Photo {index + 1}</p>
        {canDeleteSlot ? (
          <Button
            type="button"
            variant="ghost"
            className="h-8 px-2 text-xs text-rose-300 hover:bg-rose-500/15"
            onClick={() => {
              if (window.confirm("Remove this photo slot?")) {
                onDeleteSlot();
              }
            }}
          >
            Delete card
          </Button>
        ) : null}
      </div>

      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl border border-white/10 bg-black/45">
        {hasImage ? (
          <img
            src={photoRef.imageDataUrl}
            alt=""
            className="h-full w-full object-cover"
            style={{
              transform: `translate(${px}px, ${py}px) scale(${sc})`,
              transformOrigin: "center center",
            }}
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 px-3 py-8 text-center">
            <ImageIcon className="h-10 w-10 text-slate-500" aria-hidden />
            <span className="text-xs font-medium text-slate-500">Upload JPEG</span>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,.jpg,.jpeg"
          className="sr-only"
          onChange={(e) => {
            const f = e.target.files?.[0];
            e.target.value = "";
            onPickFile(f);
          }}
        />
        <Button
          type="button"
          variant="secondary"
          className="h-9 border-[#FF6F28]/35 bg-[#F26522]/20 text-xs font-semibold text-orange-100 hover:bg-[#F26522]/30"
          disabled={uploading}
          onClick={() => fileInputRef.current?.click()}
        >
          {uploading ? "Working…" : "Upload JPEG"}
        </Button>
        {hasImage ? (
          <>
            <Button
              type="button"
              variant="secondary"
              className="h-9 border-white/12 bg-white/[0.06] text-xs text-slate-100 hover:bg-white/10"
              onClick={onToggleAdjust}
            >
              Adjust Image
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="h-9 text-xs text-rose-300 hover:bg-rose-500/15"
              onClick={onRemoveImage}
            >
              Remove
            </Button>
          </>
        ) : null}
      </div>

      {hasImage && adjustOpen ? (
        <div className="space-y-3 rounded-xl border border-white/10 bg-black/25 px-3 py-3">
          <p className="text-xs font-semibold text-slate-300">Adjust crop</p>
          <label className="block text-[0.65rem] font-medium uppercase tracking-wide text-slate-500">
            Move X
            <input
              type="range"
              min={-80}
              max={80}
              step={1}
              value={px}
              className="mt-1 block w-full accent-[#F26522]"
              onChange={(e) =>
                onPatch(photoRef.id, { objectPositionX: Number(e.target.value) })
              }
            />
          </label>
          <label className="block text-[0.65rem] font-medium uppercase tracking-wide text-slate-500">
            Move Y
            <input
              type="range"
              min={-80}
              max={80}
              step={1}
              value={py}
              className="mt-1 block w-full accent-[#F26522]"
              onChange={(e) =>
                onPatch(photoRef.id, { objectPositionY: Number(e.target.value) })
              }
            />
          </label>
          <label className="block text-[0.65rem] font-medium uppercase tracking-wide text-slate-500">
            Zoom / Size
            <input
              type="range"
              min={50}
              max={250}
              step={5}
              value={Math.round(sc * 100)}
              className="mt-1 block w-full accent-[#F26522]"
              onChange={(e) =>
                onPatch(photoRef.id, { scale: Number(e.target.value) / 100 })
              }
            />
          </label>
          <Button
            type="button"
            variant="ghost"
            className="h-9 w-full text-xs text-slate-300 hover:bg-white/10"
            onClick={() =>
              onPatch(photoRef.id, {
                objectPositionX: undefined,
                objectPositionY: undefined,
                scale: undefined,
              })
            }
          >
            Reset
          </Button>
        </div>
      ) : null}

      <label className="block text-[0.65rem] font-semibold uppercase tracking-wide text-slate-400">
        Instructions
        <Textarea
          value={photoRef.instructions ?? ""}
          onChange={(e) => onInstructionChange(e.target.value)}
          rows={3}
          className="mt-1 border-white/10 bg-[#0a0f14] text-sm text-slate-100 placeholder:text-slate-600"
          placeholder="Describe what this photo should show."
        />
      </label>
    </div>
  );
}
