import { Handle, Position } from "@xyflow/react";

export function ClueNode({
  data,
}: {
  data: { label: string; rotation: number; isPlaced: boolean };
}) {
  return (
    <div
      className={`relative bg-[#e6e2d3] border-2 border-[#cec9b6] p-4 w-48 flex flex-col items-center justify-center transition-all ${
        data.isPlaced ? "shadow-xl" : "shadow-md opacity-80"
      }`}
      style={{
        transform: `rotate(${data.rotation || 0}deg)`,
      }}
    >
      {data.isPlaced && (
        <div className="absolute -top-2 w-4 h-4 rounded-full bg-red-800 shadow-[2px_4px_4px_rgba(0,0,0,0.5)] border border-red-950 z-20" />
      )}
      <div className="mt-2 text-sm text-black/80 font-medium text-center leading-snug font-serif">
        {data.label}
      </div>
      <Handle
        type="source"
        position={Position.Right}
        className="!w-full !h-full !opacity-0 !absolute !top-0 !left-0 z-10 cursor-crosshair"
      />
    </div>
  );
}
