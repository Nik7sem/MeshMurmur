export class PeerConnection {
  private pc: RTCPeerConnection;
  private dataChannel?: RTCDataChannel;

  constructor(
    private onIceCandidate: (candidate: RTCIceCandidate) => void,
    private onMessage: (message: string) => void,
    rtcConfig: RTCConfiguration = {iceServers: [{urls: "stun:stun.l.google.com:19302"}]}
  ) {
    this.onIceCandidate = onIceCandidate;
    this.onMessage = onMessage;

    // Initialize WebRTC connection
    this.pc = new RTCPeerConnection(rtcConfig);

    // Handle ICE candidates
    this.pc.onicecandidate = (event) => {
      if (event.candidate && this.onIceCandidate) {
        this.onIceCandidate(event.candidate);
      }
    };

    // Handle incoming data channel (from remote peer)
    this.pc.ondatachannel = (event) => {
      this.dataChannel = event.channel;
      this.setupDataChannel();
    };
  }

  /**
   * Creates a new data channel (only for the peer that initiates the connection).
   */
  createDataChannel(label: string = "chat"): void {
    this.dataChannel = this.pc.createDataChannel(label);
    this.setupDataChannel();
  }

  /**
   * Configures data channel event listeners.
   */
  private setupDataChannel(): void {
    if (!this.dataChannel) return;

    this.dataChannel.onopen = () => console.log("Data channel opened!");
    this.dataChannel.onclose = () => console.log("Data channel closed.");
    this.dataChannel.onerror = (error) => console.error("Data channel error:", error);
    this.dataChannel.onmessage = (event) => {
      console.log("Received message:", event.data);
      this.onMessage?.(event.data);
    };
  }

  /**
   * Creates an SDP offer.
   */
  async createOffer(): Promise<RTCSessionDescriptionInit> {
    const offer = await this.pc.createOffer();
    await this.pc.setLocalDescription(offer);
    return offer;
  }

  /**
   * Handles an SDP offer from a remote peer and generates an answer.
   */
  async handleOffer(offer: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit> {
    // await this.pc.setRemoteDescription(new RTCSessionDescription(offer));
    if (this.pc.signalingState === "have-local-offer") {
      await this.pc.setRemoteDescription(new RTCSessionDescription(offer));
    } else {
      console.warn("Received answer but peer connection is in state:", this.pc.signalingState);
    }

    const answer = await this.pc.createAnswer();
    await this.pc.setLocalDescription(answer);
    return answer;
  }

  /**
   * Handles an SDP answer from the remote peer.
   */
  async handleAnswer(answer: RTCSessionDescriptionInit): Promise<void> {
    await this.pc.setRemoteDescription(new RTCSessionDescription(answer));
  }

  /**
   * Adds an ICE candidate received from the signaling channel.
   */
  async addIceCandidate(candidate: RTCIceCandidateInit): Promise<void> {
    // If both sdpMid and sdpMLineIndex are null or undefined, skip this candidate.
    // if ((candidate?.sdpMid == null && candidate?.sdpMLineIndex == null) ||
    //   (candidate.candidate && candidate.candidate.includes("typ end-of-candidates"))) {
    //   console.warn("Skipping invalid or end-of-candidates candidate:", candidate);
    //   return;
    // }
    try {
      await this.pc.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (error) {
      console.error("Error adding ICE candidate:", error);
    }
  }

  /**
   * Sends a message via the WebRTC data channel.
   */
  send(message: string): void {
    if (this.dataChannel && this.dataChannel.readyState === "open") {
      this.dataChannel.send(message);
    } else {
      console.error("Data channel is not open. Cannot send message:", message);
    }
  }
}
