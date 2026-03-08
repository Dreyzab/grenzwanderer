import { useCallback, useEffect, useMemo, useState } from "react";
import {
    ReactFlow,
    Background,
    Controls,
    addEdge,
    useNodesState,
    useEdgesState,
    Connection,
    Edge,
    Node,
    BackgroundVariant,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { useReducer, useTable } from "spacetimedb/react";
import { useIdentity } from "../../shared/spacetime/useIdentity";
import { reducers, tables } from "../../shared/spacetime/bindings";
import { useToast } from "../../shared/hooks/useToast";
import {
  deriveHypothesisState,
  parseRequiredFactIds,
  parseRequiredVars,
} from "../mindpalace/model/readiness";

import { ClueNode } from "./nodes/ClueNode";
import { HypothesisNode } from "./nodes/HypothesisNode";
import { RedThreadEdge } from "./edges/RedThreadEdge";
import { usePlayerVars } from "../../entities/player/hooks/usePlayerVars";

const nodeTypes = {
    clue: ClueNode,
    hypothesis: HypothesisNode,
};

const edgeTypes = {
    redThread: RedThreadEdge,
};

const createRequestId = () => `req-${Date.now()}-${Math.floor(Math.random() * 1000000)}`;

export function MindBoardCanvas({ caseId }: { caseId: string }) {
    const { identityHex } = useIdentity();
    const toast = useToast();
    const varsByKey = usePlayerVars();

    const [mindCases] = useTable(tables.mindCase);
    const [mindFacts] = useTable(tables.mindFact);
    const [mindHypotheses] = useTable(tables.mindHypothesis);
    const [playerMindFacts] = useTable(tables.playerMindFact);
    const [playerMindHypotheses] = useTable(tables.playerMindHypothesis);

    const validateHypothesis = useReducer(reducers.validateHypothesis);

    const factsForCase = useMemo(
        () => mindFacts.filter((entry) => entry.caseId === caseId),
        [mindFacts, caseId]
    );

    const hypothesesForCase = useMemo(
        () => mindHypotheses.filter((entry) => entry.caseId === caseId),
        [mindHypotheses, caseId]
    );

    const discoveredFactIds = useMemo(() => {
        const ids = new Set<string>();
        for (const row of playerMindFacts) {
            if (row.playerId.toHexString() === identityHex && row.caseId === caseId) {
                ids.add(row.factId);
            }
        }
        return ids;
    }, [identityHex, playerMindFacts, caseId]);

    const playerHypothesisMap = useMemo(() => {
        const map = new Map<string, { status: string }>();
        for (const row of playerMindHypotheses) {
            if (row.playerId.toHexString() === identityHex && row.caseId === caseId) {
                map.set(row.hypothesisId, { status: row.status });
            }
        }
        return map;
    }, [identityHex, playerMindHypotheses, caseId]);

    // Derive Nodes
    const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

    // Keep `nodes` out of deps to avoid node-position reset loop.
    useEffect(() => {
        if (!caseId) return;

        const initialNodes: Node[] = [];

        // Inbox Facts
        let factY = 50;
        for (const fact of factsForCase) {
            if (!discoveredFactIds.has(fact.factId)) continue;

            const existingNode = nodes.find(n => n.id === `fact-${fact.factId}`);

            initialNodes.push(existingNode || {
                id: `fact-${fact.factId}`,
                type: "clue",
                position: { x: 50, y: factY },
                data: {
                    label: fact.text,
                    rotation: Math.random() * 8 - 4, // Random between -4 and 4 degrees
                    isPlaced: false
                },
            });
            if (!existingNode) factY += 150;
        }

        // Hypotheses
        let hypY = 300;
        for (const hyp of hypothesesForCase) {
            const pMap = playerHypothesisMap.get(hyp.hypothesisId);
            const validated = pMap?.status === "validated";
            const existingNode = nodes.find(n => n.id === `hyp-${hyp.hypothesisId}`);

            initialNodes.push(existingNode || {
                id: `hyp-${hyp.hypothesisId}`,
                type: "hypothesis",
                position: { x: 600, y: hypY },
                data: { label: hyp.text, validated },
            });
            if (!existingNode) hypY += 300;
        }

        // Update nodes that changed data (like validation status)
        setNodes(prev => initialNodes.map(inNode => {
            const pNode = prev.find(p => p.id === inNode.id);
            if (pNode) {
                // Keep position if dragged, but update validation/text data
                return {
                    ...inNode,
                    position: pNode.position,
                    data: {
                        ...inNode.data,
                        // Calculate if placed based on being dragged out of the inbox zone (x > 250)
                        isPlaced: pNode.type === 'clue' ? pNode.position.x > 250 : inNode.data.isPlaced
                    }
                };
            }
            return inNode;
        }));
    }, [caseId, factsForCase, hypothesesForCase, discoveredFactIds, playerHypothesisMap]); // eslint-disable-line react-hooks/exhaustive-deps

    const onConnect = useCallback(
        async (params: Connection) => {
            // Allow only Fact -> Hypothesis connections
            if (!params.source.startsWith("fact-") || !params.target.startsWith("hyp-")) {
                toast.showToast({
                    message: "Can only connect evidence to a hypothesis.",
                    type: "info",
                    source: "system",
                });
                return;
            }

            const newEdge: Edge = { ...params, id: `edge-${params.source}-${params.target}`, type: "redThread", animated: false };
            setEdges((eds) => addEdge(newEdge, eds));

            // After adding edge, check if hypothesis is ready to complete
            const hypId = params.target.replace("hyp-", "");
            const hypData = hypothesesForCase.find(h => h.hypothesisId === hypId);

            if (hypData) {
                const requiredFacts = parseRequiredFactIds(hypData.requiredFactIdsJson);
                const reqVars = parseRequiredVars(hypData.requiredVarsJson);

                // Find all edges currently targeting this hypothesis
                // Note: we use functional state update or re-query edges, but here we just check existing + new
                setEdges(currentEdges => {
                    const allHypEdges = [...currentEdges, newEdge].filter(e => e.target === params.target);
                    const connectedFactIds = allHypEdges.map(e => e.source.replace("fact-", ""));

                    const isAlreadyValid = playerHypothesisMap.get(hypId)?.status === "validated";
                    const state = deriveHypothesisState({
                        requiredFactIds: requiredFacts,
                        requiredVars: reqVars,
                        discoveredFactIds: new Set(connectedFactIds),
                        varsByKey,
                        validated: isAlreadyValid,
                    });

                    if (state.ready && !isAlreadyValid && caseId) {
                        validateHypothesis({
                            requestId: createRequestId(),
                            caseId: caseId,
                            hypothesisId: hypId
                        }).catch(e => toast.showToast({
                            message: `Validation failed: ${e.message}`,
                            type: "info",
                            source: "system",
                        }));
                    }

                    return [...currentEdges, newEdge]; // Actually return the updated state
                });
            }
        },
        [setEdges, hypothesesForCase, varsByKey, validateHypothesis, caseId, playerHypothesisMap, toast]
    );

    return (
        <div className="w-full h-full relative bg-[#1c1c1f]">
            {/* Inbox visual zone */}
            <div className="absolute top-0 left-0 w-[250px] h-full bg-black/40 border-r border-[#333] z-0 flex flex-col items-center pt-8">
                <div className="text-white/30 uppercase tracking-[0.2em] font-mono text-sm font-bold rotate-90 origin-left mt-24">
                    Evidence Inbox
                </div>
            </div>

            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                nodeTypes={nodeTypes}
                edgeTypes={edgeTypes}
                fitView
            >
                <Background
                    variant={BackgroundVariant.Dots}
                    gap={24}
                    size={2}
                    color="#ffffff"
                    style={{ opacity: 0.05 }}
                />
                <Controls
                    className="bg-black/80 border-[#333] fill-white"
                />
            </ReactFlow>

            {/* CSS Grain Overlay */}
            <div className="pointer-events-none absolute inset-0 z-50 opacity-[0.03] mix-blend-overlay" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}></div>
        </div>
    );
}
