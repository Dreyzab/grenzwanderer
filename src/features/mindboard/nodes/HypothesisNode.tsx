import { Handle, Position } from "@xyflow/react";

export function HypothesisNode({
    data,
}: {
    data: { label: string; validated: boolean };
}) {
    return (
        <div
            className={`relative p-5 w-64 border-l-8 shadow-2xl flex flex-col transition-colors ${data.validated
                    ? "bg-amber-950/90 border-amber-500 text-amber-100"
                    : "bg-red-950/90 border-red-600 text-red-100"
                }`}
        >
            <div className="uppercase tracking-widest text-xs opacity-70 mb-2 font-bold font-mono">
                {data.validated ? "CONFIRMED" : "CLASSIFIED"}
            </div>
            <div className="text-lg font-bold leading-tight font-serif">
                {data.label}
            </div>
            <Handle
                type="target"
                position={Position.Left}
                className="!w-full !h-full !opacity-0 !absolute !top-0 !left-0 z-10 cursor-crosshair"
            />
        </div>
    );
}
