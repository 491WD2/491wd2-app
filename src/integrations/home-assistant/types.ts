/**
 * Home Assistant integration boundary (types only).
 * 491 household state remains authoritative; HA owns device/sensor state.
 */

export type HomeAssistantEntityId = string;

export type HomeAssistantDeviceState = {
  entityId: HomeAssistantEntityId;
  state: string;
  attributes?: Record<string, unknown>;
  lastUpdated?: string;
};

/** Future adapter surface — not wired to React components in this foundation pass. */
export type HomeAssistantAdapter = {
  /** Read external device state; must not mutate FamilyData directly. */
  readEntityState(entityId: HomeAssistantEntityId): Promise<HomeAssistantDeviceState | null>;
};

import type { IntegrationAdapter } from "../types";

export const homeAssistantIntegrationAdapter: IntegrationAdapter = {
  kind: "home-assistant",
  getReadiness() {
    return { ready: false, reason: "Home Assistant adapter not configured." };
  },
};
