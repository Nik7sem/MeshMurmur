import {Signaler} from "@/utils/p2p-library/abstract.ts";
import {rtcConfig} from "@/utils/p2p-library/conf.ts";
import {Logger} from "../../logger.ts";
import {DataChannels} from "@/utils/p2p-library/connection/DataChannel.ts";
import {ChannelEventHandlers} from "@/utils/p2p-library/types.ts";

export class WebRTCPeerConnection {
  private readonly pc: RTCPeerConnection;
  private readonly polite: boolean = false;
  private makingOffer = false
  private ignoreOffer = false;
  private isSettingRemoteAnswerPending = false;

  public readonly channel: DataChannels;

  constructor(
    peerId: string,
    private readonly targetPeerId: string,
    private readonly signaler: Signaler,
    private readonly logger: Logger,
    private readonly onFinalState: (state: RTCPeerConnectionState) => void,
    onData: ChannelEventHandlers['ondata'],
    onChannelOpen: ChannelEventHandlers['onopen']
  ) {
    this.polite = peerId < this.targetPeerId
    this.pc = new RTCPeerConnection(rtcConfig);
    this.channel = new DataChannels(this.pc,
      {
        onopen: onChannelOpen,
        ondata: onData,
        onclose: ({channelType}) => this.logger.info(`${channelType} channel closed`),
        onerror: ({error}) => this.logger.info(error)
      }
    )
    this.connect()
  }

  connect() {
    this.logger.info(`START CONNECTION AS ${this.polite ? "POLITE" : "IMPOLITE"} PEER`)
    this.startDebugListeners()

    // TODO: Leave only one: on final state or on data channel open
    this.pc.onconnectionstatechange = () => {
      if (this.pc.connectionState === "connecting" ||
        this.pc.connectionState === "new") return

      this.onFinalState(this.pc.connectionState);
    }

    // Handle ICE candidates
    this.pc.onicecandidate = ({candidate}) => {
      this.signaler.send(this.targetPeerId, {candidate: candidate ? candidate.toJSON() : null})
      this.logger.info(`Send ice candidate: `, candidate)
    };

    // offer
    this.pc.onnegotiationneeded = async () => {
      try {
        this.makingOffer = true;
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
          const readyForOffer = !this.makingOffer &&
            (this.pc.signalingState === "stable" || this.isSettingRemoteAnswerPending);
          const offerCollision = description.type === "offer" && !readyForOffer;

          this.ignoreOffer = !this.polite && offerCollision;
          if (this.ignoreOffer) {
            this.logger.info("Ignore offer: ", description);
            return;
          }

          this.isSettingRemoteAnswerPending = description.type === "answer";
          await this.pc.setRemoteDescription(description);
          this.isSettingRemoteAnswerPending = false;

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

    this.pc.oniceconnectionstatechange = () => {
      console.log('ICE connection state changed:', this.pc.iceConnectionState)
    };

    this.pc.onicecandidateerror = (event) => {
      this.logger.info("Ice candidate error: ", event.errorText, event.url);
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
