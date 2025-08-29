import {Middleware} from "@/utils/p2p-library/abstract.ts";
import {eventDataType} from "@/utils/p2p-library/types.ts";

export class TypingEventMiddleware extends Middleware {
  private lastTypingEventSent: number = 0;
  private readonly typingDebounceDelay: number = 300; // ms
  private readonly typingTimeout: number = 2000; // ms
  private typingTimeoutId: NodeJS.Timeout | null = null;
  private isTargetPeerTyping = false
  public onTyping?: (data: { typing: boolean, peerId: string }) => void

  call(eventData: eventDataType): boolean {
    if (eventData.datatype !== 'json' || eventData.channelType !== 'unreliable') return true
    if (eventData.type === 'typing-event') {
      this.handleTypingEvent()
      return false
    }
    return true
  }

  private handleTypingEvent() {
    this.resetTypingTimeout();

    if (!this.isTargetPeerTyping) {
      this.isTargetPeerTyping = true
      this.onTyping?.({peerId: this.targetPeerId, typing: this.isTargetPeerTyping})
    }
  }

  private resetTypingTimeout(): void {
    if (this.typingTimeoutId) {
      clearTimeout(this.typingTimeoutId);
    }

    this.typingTimeoutId = setTimeout(() => {
      this.isTargetPeerTyping = false
      this.onTyping?.({peerId: this.targetPeerId, typing: this.isTargetPeerTyping})
    }, this.typingTimeout);
  }

  public emitTypingEvent() {
    const now = Date.now();

    // Only send event if enough time has passed since last event
    if (now - this.lastTypingEventSent > this.typingDebounceDelay) {
      this.sendTypingNotification();
      this.lastTypingEventSent = now;
    }
  }

  private sendTypingNotification(): void {
    this.channel.unreliable.send({type: "typing-event", data: null})
  }
}