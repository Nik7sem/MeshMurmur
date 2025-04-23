import React, {useCallback, useEffect, useState} from 'react';
import {darkTheme, GraphCanvas, GraphEdge, GraphNode} from "reagraph";
import {connector, peerId} from "@/init.ts";
import labelFont from "../assets/Alice-Regular.ttf"

const PeerGraph = () => {
  const [graphNodes, setGraphNodes] = useState<GraphNode[]>([]);
  const [graphEdges, setGraphEdges] = useState<GraphEdge[]>([]);

  const updateGraph = useCallback(() => {
    const newGraphNodes: GraphNode[] = []
    const newGraphEdges: GraphEdge[] = []

    const nodes = Object.keys(connector.actions.peerDiscoveryCoordinator.peerMap)
    for (const targetPeerId of nodes) {
      if (targetPeerId === peerId) newGraphNodes.push({id: peerId, fill: 'green', label: 'me'})
      newGraphNodes.push({id: targetPeerId, fill: 'gray', label: connector.actions.targetPeerNickname(targetPeerId)})
    }

    for (const from of nodes) {
      for (const v of connector.actions.peerDiscoveryCoordinator.peerMap[from].connections) {
        newGraphEdges.push({
          id: `${from}->${v.peerId}`,
          source: from,
          target: v.peerId,
          label: v.connectionType,
          fill: v.connected ? "green" : "red"
        })
      }
    }

    setGraphNodes(newGraphNodes)
    setGraphEdges(newGraphEdges)
  }, [])

  useEffect(() => {
    updateGraph()
    connector.actions.peerDiscoveryCoordinator.eventEmitter.on('mapChanged', updateGraph)
    return () => {
      connector.actions.peerDiscoveryCoordinator.eventEmitter.off('mapChanged', updateGraph)
    }
  }, [updateGraph])

  return (
    <GraphCanvas theme={darkTheme} edgeArrowPosition="end" edgeInterpolation="curved" edgeLabelPosition="inline"
                 labelFontUrl={labelFont} labelType="all" nodes={graphNodes} edges={graphEdges}
                 layoutOverrides={{linkDistance: 150, nodeStrength: -100}}/>
  );
};

export default PeerGraph;