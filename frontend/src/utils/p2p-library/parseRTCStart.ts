interface params {
  info: null | {
    local: { type: string, address: string, ip: string },
    remote: { type: string, address: string, ip: string }
    type: "" | "TURN" | "STUN"
  }
}

export function parseRTCStats(stats: RTCStatsReport): params {
  let info: params['info'] = null
  stats.forEach(report => {
    if (report.type === 'candidate-pair' && report.nominated && report.state === "succeeded") {
      const localCandidate = stats.get(report.localCandidateId);
      const remoteCandidate = stats.get(report.remoteCandidateId);
      if (!localCandidate || !remoteCandidate) return

      info = {
        type: (localCandidate.candidateType === 'relay' || remoteCandidate.candidateType === 'relay') ? "TURN" : "STUN",
        local: {
          type: localCandidate.candidateType,
          address: localCandidate.address,
          ip: localCandidate.ip
        }, remote: {
          type: remoteCandidate.candidateType,
          address: localCandidate.address,
          ip: remoteCandidate.ip
        }
      }
    }
  })
  return {info}
}