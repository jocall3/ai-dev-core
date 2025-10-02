// Copyright James Burvel O’Callaghan III
// President Citibank Demo Business Inc.

import React, { useState, useEffect, useRef } from 'react';
import { DataStructureVisualizerIcon } from './icons.tsx';

const exampleJson = `{
  "nodes": [
    { "id": "A", "group": 1 },
    { "id": "B", "group": 1 },
    { "id": "C", "group": 1 },
    { "id": "D", "group": 2 },
    { "id": "E", "group": 2 }
  ],
  "links": [
    { "source": "A", "target": "B", "value": 1 },
    { "source": "B", "target": "C", "value": 1 },
    { "source": "C", "target": "A", "value": 1 },
    { "source": "C", "target": "D", "value": 2 },
    { "source": "D", "target": "E", "value": 2 }
  ]
}`;

// D3 will be loaded dynamically via importScripts in a worker or via esm.sh
const useD3Graph = (data: any, containerRef: React.RefObject<SVGSVGElement>) => {
    useEffect(() => {
        if (!data || !containerRef.current) return;

        let isMounted = true;
        const svg = containerRef.current;
        const width = svg.clientWidth;
        const height = svg.clientHeight;

        const renderGraph = async () => {
            try {
                // @ts-ignore
                const d3 = (await import('https://esm.sh/d3@7.9.0')).default;

                if (!isMounted) return;

                // Clear previous graph
                d3.select(svg).selectAll("*").remove();
                
                const simulation = d3.forceSimulation(data.nodes)
                    .force("link", d3.forceLink(data.links).id((d: any) => d.id).distance(50))
                    .force("charge", d3.forceManyBody().strength(-200))
                    .force("center", d3.forceCenter(width / 2, height / 2));

                const link = d3.select(svg).append("g")
                    .attr("stroke", "#999")
                    .attr("stroke-opacity", 0.6)
                    .selectAll("line")
                    .data(data.links)
                    .join("line")
                    .attr("stroke-width", (d: any) => Math.sqrt(d.value));

                const node = d3.select(svg).append("g")
                    .attr("stroke", "#fff")
                    .attr("stroke-width", 1.5)
                    .selectAll("circle")
                    .data(data.nodes)
                    .join("circle")
                    .attr("r", 10)
                    .attr("fill", (d: any) => d.group === 1 ? 'var(--color-primary)' : '#f59e0b')
                    .call(d3.drag()
                        .on("start", (event: any) => {
                            if (!event.active) simulation.alphaTarget(0.3).restart();
                            event.subject.fx = event.subject.x;
                            event.subject.fy = event.subject.y;
                        })
                        .on("drag", (event: any) => {
                            event.subject.fx = event.x;
                            event.subject.fy = event.y;
                        })
                        .on("end", (event: any) => {
                            if (!event.active) simulation.alphaTarget(0);
                            event.subject.fx = null;
                            event.subject.fy = null;
                        }));
                
                node.append("title").text((d: any) => d.id);
                
                simulation.on("tick", () => {
                    link
                        .attr("x1", (d: any) => d.source.x)
                        .attr("y1", (d: any) => d.source.y)
                        .attr("x2", (d: any) => d.target.x)
                        .attr("y2", (d: any) => d.target.y);

                    node
                        .attr("cx", (d: any) => d.x)
                        .attr("cy", (d: any) => d.y);
                });

            } catch (error) {
                console.error("D3 rendering error:", error);
            }
        };

        renderGraph();

        return () => { isMounted = false; }
    }, [data, containerRef]);
};

export const DataStructureVisualizer: React.FC = () => {
    const [jsonInput, setJsonInput] = useState(exampleJson);
    const [error, setError] = useState('');
    const [graphData, setGraphData] = useState<any>(null);
    const svgRef = useRef<SVGSVGElement>(null);

    useEffect(() => {
        try {
            const parsed = JSON.parse(jsonInput);
            if (parsed.nodes && parsed.links) {
                setGraphData(parsed);
                setError('');
            } else {
                setError('JSON must contain "nodes" and "links" arrays.');
            }
        } catch (e) {
            setError('Invalid JSON format.');
        }
    }, [jsonInput]);

    useD3Graph(graphData, svgRef);

    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8 text-text-primary">
            <header className="mb-6">
                <h1 className="text-3xl font-bold flex items-center">
                    <DataStructureVisualizerIcon />
                    <span className="ml-3">Data Structure Visualizer</span>
                </h1>
                <p className="text-text-secondary mt-1">Visualize graph data structures (nodes and links) using a force-directed layout.</p>
            </header>
            <div className="flex-grow grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0">
                <div className="flex flex-col h-full">
                    <label htmlFor="json-input" className="text-sm font-medium text-text-secondary mb-2">Graph JSON Input</label>
                    <textarea
                        id="json-input"
                        value={jsonInput}
                        onChange={(e) => setJsonInput(e.target.value)}
                        className="flex-grow p-4 bg-surface border border-border rounded-md resize-y font-mono text-sm"
                    />
                     {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
                </div>
                <div className="lg:col-span-2 flex flex-col h-full">
                    <label className="text-sm font-medium text-text-secondary mb-2">Interactive Graph</label>
                    <div className="flex-grow p-2 bg-white border-2 border-dashed border-border rounded-md overflow-hidden">
                        <svg ref={svgRef} width="100%" height="100%"></svg>
                    </div>
                </div>
            </div>
        </div>
    );
};