import {Signaler} from "@/utils/p2p-library/abstract.ts";
import {rtcConfig} from "@/utils/p2p-library/conf.ts";
import {Logger} from "../logger.ts";
import {rawMessageDataType} from "@/utils/p2p-library/types.ts";

export class WebRTCPeerConnection {
  private pc: RTCPeerConnection;
  private dataChannel?: RTCDataChannel;
  private makingOffer = false
  private ignoreOffer = false;

  constructor(
    private signaler: Signaler,
    private logger: Logger,
    private readonly targetPeerId: string,
    private readonly polite: boolean,
    private onData: (event: MessageEvent<rawMessageDataType>) => void,
    private onFinalState: (state: RTCPeerConnectionState) => void,
    private onChannelOpen: () => void
  ) {
    this.pc = new RTCPeerConnection(rtcConfig);
    this.connect()
  }

  connect() {
    this.logger.info(`START CONNECTION AS ${this.polite ? "POLITE" : "IMPOLITE"} PEER`)
    // this.startDebugListeners()

    this.pc.onconnectionstatechange = () => {
      if (this.pc.connectionState === "connecting" ||
        this.pc.connectionState === "new") return

      this.onFinalState(this.pc.connectionState);
    }

    // Log more errors
    this.pc.onicecandidateerror = (event) => {
      this.logger.info("Ice candidate error: ", event.errorText);
    }

    // Impolite peer creates a new data channel
    if (!this.polite) {
      this.createDataChannel()
    }

    // Handle ICE candidates
    this.pc.onicecandidate = ({candidate}) => {
      if (candidate) {
        this.signaler.send(this.targetPeerId, {candidate: candidate.toJSON()})
        this.logger.info(`Send ice candidate: `, candidate)
      }
    };

    // Handle incoming data channel (from remote peer)
    this.pc.ondatachannel = (event) => {
      if (this.dataChannel) {
        this.logger.warn("DATA CHANNEL DUPLICATE")
      }

      this.dataChannel = event.channel;
      this.setupDataChannel();
      this.logger.info(`Receive data channel`)
    };

    // offer
    this.pc.onnegotiationneeded = async () => {
      try {
        this.makingOffer = true;

        if (this.polite && !this.dataChannel) {
          // Polite peer creates a new data channel
          this.createDataChannel();
        }

        await this.pc.setLocalDescription();
        this.signaler.send(this.targetPeerId, {description: this.pc.localDescription?.toJSON()});
        this.logger.info(`Send offer: `, this.pc.localDescription)
      } catch (err) {
        this.logger.error("Error sending offer:", err);
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
            this.logger.info("Ignore offer: ", description);
            return;
          }

          await this.pc.setRemoteDescription(description);
          this.logger.info(`Receive ${description.type}: `, description);
          if (description.type === "offer") {
            await this.pc.setLocalDescription();
            this.signaler.send(this.targetPeerId, {description: this.pc.localDescription?.toJSON()});
            this.logger.info("Send answer: ", this.pc.localDescription);
          }
        } else if (candidate) {
          try {
            await this.pc.addIceCandidate(candidate);
            this.logger.info("Receive ice candidate: ", candidate);
          } catch (err) {
            if (!this.ignoreOffer) {
              this.logger.error("Error adding candidate: ", err);
            }
          }
        }
      } catch (err) {
        this.logger.error("Error with description receiving: ", err);
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
  createDataChannel(label: string = "data") {
    if (this.dataChannel) return
    this.dataChannel = this.pc.createDataChannel(label);
    this.setupDataChannel();
    this.logger.info("Create data channel")
  }

  private setupDataChannel() {
    if (!this.dataChannel) return;

    this.dataChannel.onopen = this.onChannelOpen;
    this.dataChannel.onmessage = (event) => this.onData(event)
    this.dataChannel.onclose = () => this.logger.info("Data channel closed.");
    this.dataChannel.onerror = (error) => this.logger.error("Data channel error:", error);
  }

  send(data: rawMessageDataType) {
    if (this.dataChannel && this.dataChannel.readyState === "open") {
      if (typeof data === "string") {
        this.dataChannel.send(data)
      } else if (data instanceof Blob) {
        this.dataChannel.send(data)
      } else if (data instanceof ArrayBuffer) {
        this.dataChannel.send(data)
      } else if (data satisfies ArrayBufferView) {
        this.dataChannel.send(data)
      }
    } else {
      this.logger.error("Data channel is not open!");
    }
  }

  async getStats() {
    return await this.pc.getStats(null)
  }

  cleanup() {
    this.pc.close()
    this.signaler.off(this.targetPeerId)
    this.signaler.cleanup(this.targetPeerId)
  }
}
