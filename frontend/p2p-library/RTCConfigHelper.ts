import {z} from "zod";
import {DefaultRTCConfig} from "@p2p-library/conf.ts";
import {SecureStorageManager} from "@p2p-library/secureStorageManager.ts";

const RTCConfigSchema = z.object({
  iceTransportPolicy: z.enum(["all", "relay"]).optional(),
  iceServers: z.array(z.object({
    credential: z.string().optional(),
    urls: z.union([z.string(), z.array(z.string())]),
    username: z.string().optional()
  })).optional()
}).strict()

export class RTCConfigHelper {
  private RTCConfig: RTCConfiguration

  constructor(
    private readonly storageManager: SecureStorageManager,
    RTCConfig?: object
  ) {
    if (RTCConfig) {
      const config = this.set(RTCConfig)
      if (config) {
        this.RTCConfig = config
        return
      }
    }
    this.RTCConfig = this.setDefault()
  }

  private checkConfig(config: object): RTCConfiguration | null {
    const result = RTCConfigSchema.safeParse(config)
    if (result.success) {
      return result.data
    } else {
      return null
    }
  }

  public set(config: object) {
    const RTCConfig = this.checkConfig(config)
    if (RTCConfig) {
      void this.storageManager.storeRTCConfig(JSON.stringify(RTCConfig))
      return this.RTCConfig = RTCConfig
    } else {
      return null
    }
  }

  public get(): RTCConfiguration {
    return this.RTCConfig
  }

  public setDefault(): RTCConfiguration {
    void this.storageManager.storeRTCConfig(JSON.stringify(DefaultRTCConfig))
    return this.RTCConfig = JSON.parse(JSON.stringify(DefaultRTCConfig))
  }
}