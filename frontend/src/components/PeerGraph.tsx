import React from 'react';
import {darkTheme, GraphCanvas, GraphEdge, GraphNode} from "reagraph";
import {connector} from "@/init.ts";
import {getShort} from "@/utils/p2p-library/shortId.ts";

const PeerGraph = () => {
  const nodes: GraphNode[] = connector.peers.map((conn) => {
    return {id: conn.targetPeerId, label: getShort(conn.targetPeerId)}
  }).concat([{id: 'me', label: 'me'}])

  const edges: GraphEdge[] = connector.peers.map((conn) => {
    return {
      id: `me->${conn.targetPeerId}`,
      source: `me`,
      target: `${conn.targetPeerId}`,
      label: conn.connectionType,
      fill: conn.connected ? "green" : "red"
    }
  })

  return (
    <GraphCanvas theme={darkTheme} labelType="all" edgeArrowPosition="none" nodes={nodes} edges={edges}/>
  );
};

export default PeerGraph;