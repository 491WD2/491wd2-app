/**
 * Integration adapters must never own core household data.
 * External systems (AI, Home Assistant, devices) communicate through these boundaries.
 */

export type IntegrationKind = "ai" | "home-assistant" | "device";

export type IntegrationReadiness =
  | { ready: true }
  | { ready: false; reason: string };

/** Minimal contract for optional external integrations. */
export type IntegrationAdapter = {
  kind: IntegrationKind;
  /** Non-blocking probe — integrations may be disabled or unconfigured. */
  getReadiness(): IntegrationReadiness;
};
