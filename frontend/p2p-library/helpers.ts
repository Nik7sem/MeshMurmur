import {
  completeMessageType, completeTextType, completeFileType, chatMemberBadge
} from "@p2p-library/types.ts";
import {AppConfig} from "@p2p-library/conf.ts";

/**
 * Creates a chunk with metadata header and payload
 * @param payload ArrayBuffer of size chunk_size - metadata_size (or less)
 * @param metadata Object to store in the header (must serialize to ≤ metadata_size bytes)
 * @param chunkDataSize
 * @param chunkMetadataSize
 * @returns ArrayBuffer of size chunk_size
 */
export function createChunk(payload: ArrayBuffer, metadata: unknown, chunkDataSize: number, chunkMetadataSize: number): ArrayBuffer {
  // Validate payload size
  if (payload.byteLength > chunkDataSize) {
    throw new Error(`Payload must be less or equal ${chunkDataSize} bytes`);
  }

  // Serialize metadata
  const encoder = new TextEncoder();
  const metadataJson = JSON.stringify(metadata);
  const metadataBinary = encoder.encode(metadataJson);

  // Validate metadata size
  if (metadataBinary.byteLength > chunkMetadataSize) {
    throw new Error(`Metadata (${metadataBinary.byteLength} bytes) exceeds ${chunkMetadataSize} byte limit`);
  }

  // Create chunk with metadata + payload
  const chunk = new ArrayBuffer(Math.min(chunkDataSize, payload.byteLength) + chunkMetadataSize);
  const chunkView = new Uint8Array(chunk);

  // Copy metadata (leaving remaining bytes as zeros if metadata is smaller than metadata_size)
  chunkView.set(metadataBinary, 0);

  // Copy payload
  chunkView.set(new Uint8Array(payload), chunkMetadataSize);
  return chunk;
}

/**
 * Parses a chunk into its metadata and payload components
 * @param chunk ArrayBuffer of size chunk_size
 * @param chunkWholeSize
 * @param chunkMetadataSize
 * @returns { metadata: object, payload: ArrayBuffer }
 */
export function parseChunk(chunk: ArrayBuffer, chunkWholeSize: number, chunkMetadataSize: number): {
  metadata: object,
  payload: ArrayBuffer
} {

  if (chunk.byteLength > chunkWholeSize) {
    throw new Error(`Chunk must be less or equal ${chunkWholeSize} bytes`);
  }

  // Extract metadata bytes
  const metadataBytes = new Uint8Array(chunk, 0, chunkMetadataSize);

  // Find actual metadata length (until first null byte or end)
  let metadataLength = 0;
  while (metadataLength < chunkMetadataSize && metadataBytes[metadataLength] !== 0) {
    metadataLength++;
  }

  // Decode metadata
  const decoder = new TextDecoder();
  const metadataJson = decoder.decode(metadataBytes.subarray(0, metadataLength));
  const metadata = JSON.parse(metadataJson);

  // Extract payload
  const payload = chunk.slice(chunkMetadataSize);

  return {metadata, payload};
}

export function isCompleteText(data: completeMessageType): data is completeTextType {
  return "data" in data && typeof data.data === "string"
}

export function isCompleteFile(data: completeMessageType): data is completeFileType {
  return "data" in data && typeof data.data === "object" && "url" in data.data
}

export function isChatMemberBadge(data: completeMessageType): data is chatMemberBadge {
  return "status" in data && (data.status === 'enter' || data.status === 'exit');
}

export function getShort(str: string, slice = AppConfig.maxNameLength) {
  return str.slice(0, slice)
}

export function isPolite(peerId: string, targetPeerId: string) {
  return peerId < targetPeerId
}
