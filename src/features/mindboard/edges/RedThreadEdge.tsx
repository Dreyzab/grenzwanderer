import { BaseEdge, EdgeProps, getBezierPath } from "@xyflow/react";

export function RedThreadEdge({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    style = {},
    markerEnd,
}: EdgeProps) {
    const [edgePath] = getBezierPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetPosition,
        targetX,
        targetY,
    });

    return (
        <>
            <BaseEdge
                path={edgePath}
                markerEnd={markerEnd}
                style={{
                    ...style,
                    strokeWidth: 4,
                    stroke: "#aa0000",
                    filter: "drop-shadow(2px 6px 4px rgba(0,0,0,0.5))",
                }}
            />
        </>
    );
}
