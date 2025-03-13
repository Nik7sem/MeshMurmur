import React from 'react';
import {darkTheme, GraphCanvas, GraphEdge, GraphNode} from "reagraph";
import {connector} from "@/init.ts";
import {getShort} from "@/utils/p2p-library/shortId.ts";

const PeerGraph = () => {
  const nodes: GraphNode[] = connector.peerIds.map((peerId) => {
    return {id: peerId, label: getShort(peerId)}
  }).concat([{id: 'me', label: 'me'}])

  const edges: GraphEdge[] = connector.peers.map(({peerId, info}) => {
    return {
      id: `me->${peerId}`,
      source: `me`,
      target: `${peerId}`,
      label: info.type,
      fill: info.connected ? "green" : "red"
    }
  })

  return (
    <GraphCanvas theme={darkTheme} labelType="all" edgeArrowPosition="none" nodes={nodes} edges={edges}/>
  );
};

export default PeerGraph;