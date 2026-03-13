// =============================================================================
// 1P OS — Device Node System
// Connect external devices (phone, desktop) as capability nodes
// =============================================================================

import type { Timestamp } from '@/lib/types';

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export type DevicePlatform = 'ios' | 'android' | 'macos' | 'linux' | 'windows';

export type DeviceCapability =
  | 'camera'
  | 'microphone'
  | 'location'
  | 'notifications'
  | 'sms'
  | 'contacts'
  | 'calendar'
  | 'screen'
  | 'files';

export type DeviceStatus = 'connected' | 'disconnected' | 'pairing';

export interface DeviceNode {
  id: string;
  name: string;
  platform: DevicePlatform;
  capabilities: DeviceCapability[];
  status: DeviceStatus;
  lastSeen: Timestamp;
  pairingCode?: string;
}

export interface DeviceCommand {
  nodeId: string;
  action: string; // e.g. "camera.snap", "location.get", "notification.send"
  params?: Record<string, unknown>;
}

export interface DeviceCommandResult {
  success: boolean;
  data?: unknown;
  error?: string;
}

export interface DeviceEvent {
  nodeId: string;
  event: string;
  payload: unknown;
  timestamp: Timestamp;
}

export type DeviceEventHandler = (event: DeviceEvent) => void;

// -----------------------------------------------------------------------------
// Pairing code generation
// No ambiguous characters: 0/O, 1/I/L, 2/Z, 5/S, 8/B
// -----------------------------------------------------------------------------

const PAIRING_CHARS = 'ACDEFGHJKMNPQRTUVWXY3467';
const PAIRING_CODE_LENGTH = 8;
const PAIRING_CODE_TTL_MS = 5 * 60 * 1000; // 5 minutes

function generatePairingCode(): string {
  let code = '';
  for (let i = 0; i < PAIRING_CODE_LENGTH; i++) {
    code += PAIRING_CHARS[Math.floor(Math.random() * PAIRING_CHARS.length)];
  }
  return code;
}

// -----------------------------------------------------------------------------
// Device Manager
// -----------------------------------------------------------------------------

interface PendingPairing {
  code: string;
  platform: DevicePlatform;
  createdAt: number;
}

export class DeviceManager {
  private nodes: Map<string, DeviceNode> = new Map();
  private eventHandlers: Set<DeviceEventHandler> = new Set();
  private pendingPairings: Map<string, PendingPairing> = new Map(); // code -> pairing

  // ---------------------------------------------------------------------------
  // Node Registration
  // ---------------------------------------------------------------------------

  registerNode(node: DeviceNode): void {
    this.nodes.set(node.id, { ...node });
    this.emit({
      nodeId: node.id,
      event: 'device.registered',
      payload: { name: node.name, platform: node.platform },
      timestamp: new Date().toISOString(),
    });
  }

  removeNode(id: string): boolean {
    const existed = this.nodes.delete(id);
    if (existed) {
      this.emit({
        nodeId: id,
        event: 'device.removed',
        payload: null,
        timestamp: new Date().toISOString(),
      });
    }
    return existed;
  }

  listNodes(): DeviceNode[] {
    return Array.from(this.nodes.values());
  }

  getNode(id: string): DeviceNode | undefined {
    return this.nodes.get(id);
  }

  // ---------------------------------------------------------------------------
  // Pairing
  // ---------------------------------------------------------------------------

  issuePairingCode(platform: DevicePlatform): string {
    // Clean up expired pairings
    const now = Date.now();
    for (const [code, pairing] of this.pendingPairings) {
      if (now - pairing.createdAt > PAIRING_CODE_TTL_MS) {
        this.pendingPairings.delete(code);
      }
    }

    const code = generatePairingCode();
    this.pendingPairings.set(code, {
      code,
      platform,
      createdAt: now,
    });
    return code;
  }

  verifyPairingCode(code: string, deviceId: string): boolean {
    const pairing = this.pendingPairings.get(code);
    if (!pairing) {
      return false;
    }

    // Check expiry
    if (Date.now() - pairing.createdAt > PAIRING_CODE_TTL_MS) {
      this.pendingPairings.delete(code);
      return false;
    }

    // Link device
    const node = this.nodes.get(deviceId);
    if (node) {
      node.status = 'connected';
      node.pairingCode = undefined;
      node.lastSeen = new Date().toISOString();
    }

    this.pendingPairings.delete(code);

    this.emit({
      nodeId: deviceId,
      event: 'device.paired',
      payload: { platform: pairing.platform },
      timestamp: new Date().toISOString(),
    });

    return true;
  }

  // ---------------------------------------------------------------------------
  // Commands
  // ---------------------------------------------------------------------------

  async sendCommand(cmd: DeviceCommand): Promise<DeviceCommandResult> {
    const node = this.nodes.get(cmd.nodeId);

    if (!node) {
      return { success: false, error: `Device "${cmd.nodeId}" not found` };
    }

    if (node.status !== 'connected') {
      return {
        success: false,
        error: `Device "${node.name}" is ${node.status}, cannot send command`,
      };
    }

    // Validate the action matches a device capability
    const capabilityPrefix = cmd.action.split('.')[0] as DeviceCapability;
    if (!node.capabilities.includes(capabilityPrefix)) {
      return {
        success: false,
        error: `Device "${node.name}" does not have capability "${capabilityPrefix}"`,
      };
    }

    // Stub: In production, this would dispatch the command over a WebSocket
    // or push notification channel to the target device and await its response.
    console.log(
      `[gateway/devices] Command dispatched to "${node.name}": ${cmd.action}`,
      cmd.params
    );

    this.emit({
      nodeId: cmd.nodeId,
      event: 'device.command.sent',
      payload: { action: cmd.action, params: cmd.params },
      timestamp: new Date().toISOString(),
    });

    return {
      success: true,
      data: { status: 'dispatched', action: cmd.action },
    };
  }

  // ---------------------------------------------------------------------------
  // Events
  // ---------------------------------------------------------------------------

  onDeviceEvent(handler: DeviceEventHandler): () => void {
    this.eventHandlers.add(handler);
    return () => {
      this.eventHandlers.delete(handler);
    };
  }

  private emit(event: DeviceEvent): void {
    for (const handler of this.eventHandlers) {
      try {
        handler(event);
      } catch (err) {
        console.error('[gateway/devices] Event handler error:', err);
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Status Updates
  // ---------------------------------------------------------------------------

  updateStatus(nodeId: string, status: DeviceStatus): boolean {
    const node = this.nodes.get(nodeId);
    if (!node) {
      return false;
    }

    node.status = status;
    node.lastSeen = new Date().toISOString();

    this.emit({
      nodeId,
      event: `device.${status}`,
      payload: null,
      timestamp: node.lastSeen,
    });

    return true;
  }
}

// -----------------------------------------------------------------------------
// Singleton
// -----------------------------------------------------------------------------

export const deviceManager = new DeviceManager();
