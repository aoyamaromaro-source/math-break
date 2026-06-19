"use client";

import { useRef, useState, DragEvent, ChangeEvent } from "react";

interface ImageUploaderProps {
  label: string;
  onImageSelect: (file: File | null) => void;
  file: File | null;
}

export default function ImageUploader({
  label,
  onImageSelect,
  file,
}: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped && isValidImageType(dropped)) {
      onImageSelect(dropped);
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected && isValidImageType(selected)) {
      onImageSelect(selected);
    }
  };

  const isValidImageType = (f: File) =>
    ["image/jpeg", "image/png", "image/webp", "image/heic"].includes(f.type) ||
    f.name.toLowerCase().endsWith(".heic");

  const previewUrl = file ? URL.createObjectURL(file) : null;

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <div
        onClick={() => inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        className={`relative cursor-pointer rounded-xl border-2 border-dashed p-4 text-center transition-colors ${
          dragging
            ? "border-blue-500 bg-blue-50"
            : file
            ? "border-green-400 bg-green-50"
            : "border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50"
        }`}
      >
        {previewUrl ? (
          <div className="flex flex-col items-center gap-2">
            <img
              src={previewUrl}
              alt="preview"
              className="max-h-40 max-w-full rounded-lg object-contain"
            />
            <span className="text-xs text-gray-500">{file!.name}</span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onImageSelect(null);
              }}
              className="text-xs text-red-500 underline"
            >
              削除
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 py-4">
            <svg
              className="h-10 w-10 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <p className="text-sm text-gray-500">
              クリックまたはドラッグで画像を選択
            </p>
            <p className="text-xs text-gray-400">JPEG, PNG, HEIC対応</p>
          </div>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,.heic"
        className="hidden"
        onChange={handleChange}
      />
    </div>
  );
}
