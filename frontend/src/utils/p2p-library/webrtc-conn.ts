import {Signaler, Logger} from "@/utils/p2p-library/abstract.ts";
import {rtcConfig} from "@/utils/p2p-library/conf.ts";

export class PeerConnection {
  private pc: RTCPeerConnection;
  private dataChannel?: RTCDataChannel;
  private makingOffer = false
  private ignoreOffer = false;

  constructor(
    private signaler: Signaler,
    private logger: Logger,
    private readonly targetPeerId: string,
    private readonly polite: boolean,
    private onMessage: (message: string) => void,
  ) {
    logger.log(`START CONNECTION AS ${polite ? "POLITE" : "INPOLITE"} PEER`)
    this.pc = new RTCPeerConnection(rtcConfig);
    // this.startDebugListeners()

    // Creates a new data channel
    this.createDataChannel()

    // Handle ICE candidates
    this.pc.onicecandidate = ({candidate}) => {
      if (candidate) {
        this.logger.log(`Send ice candidate: `, candidate)
        this.signaler.sendCandidate(targetPeerId, candidate.toJSON())
      }
    };

    // Handle incoming data channel (from remote peer)
    this.pc.ondatachannel = (event) => {
      this.logger.log(`Receive data channel`)
      this.dataChannel = event.channel;
      this.setupDataChannel();
    };

    // offer
    this.pc.onnegotiationneeded = async () => {
      try {
        this.makingOffer = true;
        await this.pc.setLocalDescription();
        this.signaler.sendDescription(targetPeerId, this.pc.localDescription!.toJSON());
        this.logger.log(`Send offer: `, this.pc.localDescription)
      } catch (err) {
        this.logger.error(err);
      } finally {
        this.makingOffer = false;
      }
    };

    // on description
    this.signaler.onDescription(targetPeerId, async (description) => {
      try {
        const offerCollision = description.type === "offer" && (this.makingOffer || this.pc.signalingState !== "stable");

        this.ignoreOffer = !this.polite && offerCollision;
        if (this.ignoreOffer) {
          this.logger.log("Ignore receiving offer")
          return;
        }

        this.logger.log(`Receive ${description.type}: `, description)
        await this.pc.setRemoteDescription(description);
        if (description.type === "offer") {
          await this.pc.setLocalDescription();
          this.signaler.sendDescription(targetPeerId, this.pc.localDescription!.toJSON());
          this.logger.log(`Send answer: `, this.pc.localDescription)
        }
      } catch (err) {
        this.logger.error(err);
      }
    })

    // on candidate
    this.signaler.onCandidate(targetPeerId, async (candidate) => {
      try {
        this.logger.log(`Receive ice candidate: `, candidate)
        await this.pc.addIceCandidate(candidate);
      } catch (err) {
        if (!this.ignoreOffer) {
          this.logger.error(err);
        }
      }
    })
  }

  startDebugListeners() {
    this.pc.onconnectionstatechange = () => {
      this.logger.log("Connection state changed:", this.pc.connectionState);
    };

    this.pc.onsignalingstatechange = () => {
      this.logger.log("Signaling state changed:", this.pc.signalingState);
    };

    this.pc.onicegatheringstatechange = () => {
      this.logger.log("ICE gathering state changed:", this.pc.iceGatheringState);
    };
  }

  /**
   * Creates a new data channel
   */
  createDataChannel(label: string = "data"): void {
    this.dataChannel = this.pc.createDataChannel(label);
    this.setupDataChannel();
  }

  private setupDataChannel(): void {
    if (!this.dataChannel) return;

    this.dataChannel.onopen = () => this.logger.log("Data channel opened!");
    this.dataChannel.onclose = () => this.logger.log("Data channel closed.");
    this.dataChannel.onerror = (error) => this.logger.error("Data channel error:", error);
    this.dataChannel.onmessage = (event) => this.onMessage(event.data)
  }

  send(message: string): void {
    if (this.dataChannel && this.dataChannel.readyState === "open") {
      this.dataChannel.send(message);
    } else {
      this.logger.error("Data channel is not open. Cannot send message:", message);
    }
  }
}
