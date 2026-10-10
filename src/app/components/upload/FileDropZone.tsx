import { useId, useRef, useState, type DragEvent, type ReactNode } from "react";
import { cn } from "../ui/utils";

interface FileDropZoneProps {
  title: string;
  hint: string;
  accept: string;
  icon: ReactNode;
  selectLabel: string;
  error?: string | null;
  preview?: ReactNode;
  clearLabel?: string;
  onFileSelected: (file: File) => void;
  onClear?: () => void;
}

export function FileDropZone({
  title,
  hint,
  accept,
  icon,
  selectLabel,
  error,
  preview,
  clearLabel = "Remover",
  onFileSelected,
  onClear,
}: FileDropZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const errorId = useId();
  const [isDragging, setIsDragging] = useState(false);

  const openFilePicker = () => inputRef.current?.click();

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    const droppedFile = event.dataTransfer.files[0];
    if (droppedFile) onFileSelected(droppedFile);
  };

  return (
    <div className="flex flex-1 flex-col">
      <div
        onClick={openFilePicker}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={cn(
          "flex min-h-[240px] flex-1 cursor-pointer flex-col items-center justify-center gap-4 border-[2.7px] p-6 text-center transition-colors duration-200 sm:min-h-[280px]",
          isDragging || error ? "border-[#ff164c]" : "border-[#30292b] hover:border-[#ff164c]/50",
          error && "bg-[#ff164c]/[0.04]",
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={(event) => {
            const selectedFile = event.target.files?.[0];
            event.target.value = "";
            if (selectedFile) onFileSelected(selectedFile);
          }}
        />
        {preview ?? (
          <>
            {icon}
            <div className="flex flex-col items-center gap-2">
              <p className="text-[18px] font-bold leading-[1.5] text-[#f8f8f8]">{title}</p>
              <p className="text-[12px] leading-[1.25] text-[#bababa]">{hint}</p>
            </div>
          </>
        )}
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            openFilePicker();
          }}
          aria-describedby={error ? errorId : undefined}
          className="min-h-[44px] bg-gradient-to-r from-[#ff164c] from-[57%] to-[#ea5858] px-4 py-2 text-[16px] font-semibold leading-[1.5] text-[#f8f8f8] transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff164c]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#24191b]"
        >
          {selectLabel}
        </button>
        {preview && onClear && (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onClear();
            }}
            className="min-h-11 px-3 text-[13px] font-semibold text-[#bababa] underline-offset-4 transition-colors hover:text-[#ff164c] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff164c]/60"
          >
            {clearLabel}
          </button>
        )}
      </div>
      {error && (
        <p id={errorId} role="alert" className="mt-2 text-[12px] leading-[1.25] text-[#ff164c]">
          {error}
        </p>
      )}
    </div>
  );
}
