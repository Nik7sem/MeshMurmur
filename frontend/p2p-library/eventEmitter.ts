export class TypedEventEmitter<T extends Record<string, any>> {
  private events: {
    [K in keyof T]?: Array<(payload: T[K]) => void>
  } = {};

  // Single unified on method using conditional types
  on<K extends keyof T>(
    eventName: K,
    callback: T[K] extends void ? () => void : (payload: T[K]) => void
  ): () => void {
    if (!this.events[eventName]) {
      this.events[eventName] = [];
    }
    this.events[eventName]!.push(callback as (payload: T[K]) => void);

    return () => this.off(eventName, callback as (payload: T[K]) => void);
  }

  // Emit using rest parameters with conditional type
  emit<K extends keyof T>(
    eventName: K,
    ...args: T[K] extends void ? [] : [T[K]]
  ): void {
    const callbacks = this.events[eventName];
    if (callbacks) {
      const payload = args[0] as T[K];
      callbacks.forEach(cb => cb(payload));
    }
  }

  off<K extends keyof T>(
    eventName: K,
    callback: (payload: T[K]) => void
  ): void {
    if (this.events[eventName]) {
      this.events[eventName] = this.events[eventName].filter(
        cb => cb !== callback
      );
    }
  }

  offEvent<K extends keyof T>(
    eventName: K,
  ): void {
    this.events[eventName] = []
  }

  offAll() {
    this.events = {};
  }
}