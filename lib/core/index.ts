/**
 * AI Core — the brain of 1P OS.
 *
 * Algorithm-first, AI-last. Controls the entire application
 * through intent parsing, action execution, and proactive insights.
 */

export { parseIntent, processCommand, getInsights, getQuickStatus } from './engine';
export type { ParsedIntent, CoreResponse } from './engine';

export { ACTION_REGISTRY, getAction, listActions } from './actions';
export type { ActionResult, ActionDef } from './actions';

export { analyzeForSection } from './analyzer';
export type { Insight } from './analyzer';

export { runAutomation, AUTOMATION_RULES } from './automation';
