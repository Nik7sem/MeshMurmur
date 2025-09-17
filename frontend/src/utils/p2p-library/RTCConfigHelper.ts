import {z} from "zod";

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

  constructor(private DefaultRTCConfig: RTCConfiguration) {
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
      this.RTCConfig = RTCConfig
      return true
    } else {
      return false
    }
  }

  public get(): RTCConfiguration {
    return this.RTCConfig
  }

  public setDefault(): RTCConfiguration {
    return this.RTCConfig = JSON.parse(JSON.stringify(this.DefaultRTCConfig))
  }
}