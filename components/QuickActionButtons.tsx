"use client";

interface QuickActionButtonsProps {
  onMoreDetail: () => void;
  onRephrase: () => void;
  onReset: () => void;
  disabled: boolean;
}

export default function QuickActionButtons({
  onMoreDetail,
  onRephrase,
  onReset,
  disabled,
}: QuickActionButtonsProps) {
  const btnBase =
    "rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50";

  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={onMoreDetail}
        disabled={disabled}
        className={`${btnBase} border-blue-300 bg-white text-blue-700 hover:bg-blue-50`}
      >
        もっと詳しく
      </button>
      <button
        onClick={onRephrase}
        disabled={disabled}
        className={`${btnBase} border-purple-300 bg-white text-purple-700 hover:bg-purple-50`}
      >
        別の言い方で
      </button>
      <button
        onClick={onReset}
        disabled={disabled}
        className={`${btnBase} border-green-400 bg-green-50 text-green-700 hover:bg-green-100`}
      >
        わかった！
      </button>
    </div>
  );
}
