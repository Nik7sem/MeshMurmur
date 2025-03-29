// TODO: Move here all helper functions

import {completeFileType, completeMessageType, completeTextType} from "@/utils/p2p-library/types.ts";

/**
 * Creates a chunk with metadata header and payload
 * @param payload ArrayBuffer of size chunk_size - metadata_size (or less)
 * @param metadata Object to store in the header (must serialize to ≤ metadata_size bytes)
 * @param chunk_size
 * @param metadata_size
 * @returns ArrayBuffer of size chunk_size
 */
export function createChunk(payload: ArrayBuffer, metadata: unknown, chunk_size: number, metadata_size: number): ArrayBuffer {
  // Validate payload size
  if (payload.byteLength > chunk_size - metadata_size) {
    throw new Error(`Payload must be less or equal ${chunk_size - metadata_size} bytes`);
  }

  // Serialize metadata
  const encoder = new TextEncoder();
  const metadataJson = JSON.stringify(metadata);
  const metadataBinary = encoder.encode(metadataJson);

  // Validate metadata size
  if (metadataBinary.byteLength > metadata_size) {
    throw new Error(`Metadata (${metadataBinary.byteLength} bytes) exceeds ${metadata_size} byte limit`);
  }

  // Create chunk with metadata + payload
  const chunk = new ArrayBuffer(chunk_size);
  const chunkView = new Uint8Array(chunk);

  // Copy metadata (leaving remaining bytes as zeros if metadata is smaller than metadata_size)
  chunkView.set(metadataBinary, 0);

  // Copy payload
  chunkView.set(new Uint8Array(payload), metadata_size);

  return chunk;
}

/**
 * Parses a chunk into its metadata and payload components
 * @param chunk ArrayBuffer of size chunk_size
 * @param chunk_size
 * @param metadata_size
 * @returns { metadata: object, payload: ArrayBuffer }
 */
export function parseChunk(chunk: ArrayBuffer, chunk_size: number, metadata_size: number): {
  metadata: object,
  payload: ArrayBuffer
} {
  if (chunk.byteLength !== chunk_size) {
    throw new Error(`Chunk must be exactly ${chunk_size} bytes`);
  }

  // Extract metadata bytes
  const metadataBytes = new Uint8Array(chunk, 0, metadata_size);

  // Find actual metadata length (until first null byte or end)
  let metadataLength = 0;
  while (metadataLength < metadata_size && metadataBytes[metadataLength] !== 0) {
    metadataLength++;
  }

  // Decode metadata
  const decoder = new TextDecoder();
  const metadataJson = decoder.decode(metadataBytes.subarray(0, metadataLength));
  const metadata = JSON.parse(metadataJson);

  // Extract payload
  const payload = chunk.slice(metadata_size);

  return {metadata, payload};
}

export function isCompleteText(data: completeMessageType): data is completeTextType {
  return typeof data.data === "string"
}

export function isCompleteFile(data: completeMessageType): data is completeFileType {
  return typeof data.data === "object" && "url" in data.data
}
