import {ConnectorConfig} from "@/utils/p2p-library/connection/connector.ts";

export type UserData = {
  connectorConfig: ConnectorConfig;
  nickname: string
  associatedNicknames: { [key: string]: string }
}