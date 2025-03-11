import {Signaler} from "@/utils/p2p-library/abstract.ts";
import {rtcConfig} from "@/utils/p2p-library/conf.ts";
import {Logger} from "./logger.ts";
import {messageDataType} from "@/utils/p2p-library/types.ts";

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
    private onData: ({peerId, text}: messageDataType) => void,
    private onFinalState: (state: RTCPeerConnectionState) => void
  ) {
    this.pc = new RTCPeerConnection(rtcConfig);
    this.connect()
  }

  connect() {
    this.logger.info(`START CONNECTION AS ${this.polite ? "POLITE" : "INPOLITE"} PEER`)
    // this.startDebugListeners()

    this.pc.onconnectionstatechange = () => {
      if (this.pc.connectionState === "connecting" ||
        this.pc.connectionState === "new") return

      this.onFinalState(this.pc.connectionState);
    }

    // Creates a new data channel
    // TODO: remove data channel duplicates
    this.createDataChannel()

    // Handle ICE candidates
    this.pc.onicecandidate = ({candidate}) => {
      if (candidate) {
        this.logger.info(`Send ice candidate: `, candidate)
        this.signaler.send(this.targetPeerId, {candidate: candidate.toJSON()})
      }
    };

    // Handle incoming data channel (from remote peer)
    this.pc.ondatachannel = (event) => {
      this.logger.info(`Receive data channel`)
      this.dataChannel = event.channel;
      this.setupDataChannel();
    };

    // offer
    this.pc.onnegotiationneeded = async () => {
      try {
        this.makingOffer = true;
        await this.pc.setLocalDescription();
        this.signaler.send(this.targetPeerId, {description: this.pc.localDescription?.toJSON()});
        this.logger.info(`Send offer: `, this.pc.localDescription)
      } catch (err) {
        this.logger.error(err);
      } finally {
        this.makingOffer = false;
      }
    };

    // on candidate or description
    this.signaler.on(this.targetPeerId, async ({description, candidate}) => {
      try {
        if (description) {
          const offerCollision = description.type === "offer" && (this.makingOffer || this.pc.signalingState !== "stable");

          this.ignoreOffer = !this.polite && offerCollision;
          if (this.ignoreOffer) {
            return;
          }

          await this.pc.setRemoteDescription(description);
          if (description.type === "offer") {
            await this.pc.setLocalDescription();
            this.signaler.send(this.targetPeerId, {description: this.pc.localDescription?.toJSON()});
          }
        } else if (candidate) {
          try {
            await this.pc.addIceCandidate(candidate);
          } catch (err) {
            if (!this.ignoreOffer) {
              this.logger.error(err);
            }
          }
        }
      } catch (err) {
        this.logger.error(err);
      }
    })
  }

  startDebugListeners() {
    this.pc.onconnectionstatechange = () => {
      this.logger.info("Connection state changed:", this.pc.connectionState);
    };

    this.pc.onsignalingstatechange = () => {
      this.logger.info("Signaling state changed:", this.pc.signalingState);
    };

    this.pc.onicegatheringstatechange = () => {
      this.logger.info("ICE gathering state changed:", this.pc.iceGatheringState);
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

    this.dataChannel.onopen = () => this.logger.info("Data channel opened!");
    this.dataChannel.onclose = () => this.logger.info("Data channel closed.");
    this.dataChannel.onerror = (error) => this.logger.error("Data channel error:", error);
    this.dataChannel.onmessage = (event) => {
      if (event.data) {
        this.onData({peerId: this.targetPeerId, text: event.data})
      }
    }
  }

  send(message: string): void {
    if (this.dataChannel && this.dataChannel.readyState === "open") {
      this.dataChannel.send(message);
    } else {
      this.logger.error("Data channel is not open. Cannot send message:", message);
    }
  }

  cleanup() {
  }
}
