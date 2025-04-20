import React, {useCallback, useEffect, useState} from 'react';
import {darkTheme, GraphCanvas, GraphEdge, GraphNode} from "reagraph";
import {connector, peerId} from "@/init.ts";

import {getShort} from "@/utils/p2p-library/helpers.ts";

function toEdge(from: string, to: string) {
  return `${from}->${to}`
}

const PeerGraph = () => {
  const [graphNodes, setGraphNodes] = useState<GraphNode[]>([]);
  const [graphEdges, setGraphEdges] = useState<GraphEdge[]>([]);

  const updateGraph = useCallback(() => {
    const nodes: Set<string> = new Set([peerId])
    const edges: { [key: string]: { from: string, to: string, label: string, fill: string } } = {};

    for (const to of connector.actions.peerDiscoveryCoordinator.peerMap[peerId].connections) {
      const conn = connector.connections[to]
      nodes.add(to)
      edges[toEdge(peerId, to)] = {
        from: peerId,
        to,
        label: conn.connectionType,
        fill: conn.connected && !conn.managerMiddleware.isBlocked() ? "green" : "red"
      }
    }

    for (const from of Object.keys(connector.actions.peerDiscoveryCoordinator.peerMap)) {
      if (from === peerId) continue;
      for (const to of connector.actions.peerDiscoveryCoordinator.peerMap[from].connections) {
        if (toEdge(from, to) in edges || toEdge(to, from) in edges) continue;
        nodes.add(from)
        nodes.add(to)
        edges[toEdge(from, to)] = {from, to, label: '', fill: 'white'}
      }
    }

    const newGraphNodes: GraphNode[] = []
    const newGraphEdges: GraphEdge[] = []

    for (const targetPeerId of nodes) {
      if (targetPeerId === peerId) newGraphNodes.push({id: peerId, label: 'me'})
      newGraphNodes.push({id: targetPeerId, label: getShort(targetPeerId)})
    }

    for (const [id, {from, to, label, fill}] of Object.entries(edges)) {
      newGraphEdges.push({id, source: from, target: to, label, fill})
    }

    setGraphNodes(newGraphNodes)
    setGraphEdges(newGraphEdges)
  }, [])

  useEffect(() => {
    updateGraph()
    connector.actions.peerDiscoveryCoordinator.onMapChange = updateGraph
    return () => {
      connector.actions.peerDiscoveryCoordinator.onMapChange = undefined
    }
  }, [updateGraph])

  return (
    <GraphCanvas theme={darkTheme} labelType="all" edgeArrowPosition="none" nodes={graphNodes} edges={graphEdges}/>
  );
};

export default PeerGraph;