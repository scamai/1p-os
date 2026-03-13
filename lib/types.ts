// =============================================================================
// 1P OS - Complete Type Definitions
// =============================================================================

// -----------------------------------------------------------------------------
// Utility Types
// -----------------------------------------------------------------------------

export type UUID = string;
export type Timestamp = string; // ISO 8601
export type DateString = string; // YYYY-MM-DD

// -----------------------------------------------------------------------------
// Database Row Types
// -----------------------------------------------------------------------------

export interface Business {
  id: UUID;
  user_id: UUID;
  business_name: string;
  state: string;
  entity_type: string;
  ein_encrypted: string | null;
  industry: string | null;
  industry_template: string | null;
  description: string | null;
  health_score: number;
  preferences: BusinessPreferences;
  onboarding_completed: boolean;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface BusinessPreferences {
  risk_tolerance: 'conservative' | 'moderate' | 'aggressive';
  default_payment_terms: number;
  auto_approve_threshold: number;
  communication_style: string;
  working_hours: string;
  model_routing_strategy: ModelRoutingStrategy;
  [key: string]: unknown;
}

export interface BusinessMemory {
  id: UUID;
  business_id: UUID;
  content: string;
  category: string | null;
  tags: string[] | null;
  importance: number;
  source_agent_id: UUID | null;
  created_at: Timestamp;
}

export interface Relationship {
  id: UUID;
  business_id: UUID;
  name: string;
  email: string | null;
  type: RelationshipType;
  status: RelationshipStatus;
  notes: string | null;
  last_interaction: Timestamp | null;
  total_revenue: number;
  metadata: Record<string, unknown>;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export type RelationshipType = 'client' | 'lead' | 'vendor' | 'contractor' | 'partner' | 'sponsor' | string;
export type RelationshipStatus = 'active' | 'inactive' | 'churned' | 'prospect' | string;

export interface Deadline {
  id: UUID;
  business_id: UUID;
  title: string;
  description: string | null;
  due_date: DateString;
  type: DeadlineType;
  status: DeadlineStatus;
  handled_by_agent: UUID | null;
  created_at: Timestamp;
}

export type DeadlineType = 'tax' | 'compliance' | 'milestone' | 'review' | 'billing' | 'planning' | 'operations' | string;
export type DeadlineStatus = 'upcoming' | 'in_progress' | 'completed' | 'overdue' | 'cancelled';

export interface Invoice {
  id: UUID;
  business_id: UUID;
  client_name: string;
  client_email: string | null;
  amount: number;
  currency: string;
  description: string | null;
  status: InvoiceStatus;
  stripe_payment_link: string | null;
  stripe_payment_id: string | null;
  due_date: DateString | null;
  paid_at: Timestamp | null;
  created_by_agent: UUID | null;
  created_at: Timestamp;
}

export type InvoiceStatus = 'draft' | 'sent' | 'viewed' | 'paid' | 'overdue' | 'cancelled' | 'refunded';

export interface Agent {
  id: UUID;
  business_id: UUID;
  name: string;
  role: AgentRole;
  avatar: string | null;
  status: AgentStatus;
  system_prompt: string;
  context_permissions: ContextPermission[];
  allowed_actions: AgentAction[];
  triggers: AgentTrigger[];
  budget_daily_usd: number;
  budget_monthly_usd: number;
  spent_today_usd: number;
  spent_this_month_usd: number;
  level: number;
  xp: number;
  tasks_completed: number;
  decisions_escalated: number;
  overrides_by_human: number;
  cost_total_usd: number;
  hours_saved_estimated: number;
  source: AgentSource;
  marketplace_agent_id: UUID | null;
  failure_count: number;
  last_failure_at: Timestamp | null;
  circuit_open: boolean;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export type AgentRole =
  | 'project-manager'
  | 'billing'
  | 'communication'
  | 'compliance'
  | 'revenue'
  | 'customer-success'
  | 'analytics'
  | 'operations'
  | string;

export type AgentStatus = 'idle' | 'working' | 'waiting' | 'error' | 'disabled';

export type ContextPermission =
  | 'relationships'
  | 'deadlines'
  | 'invoices'
  | 'documents'
  | 'memory'
  | 'preferences'
  | 'agent_data'
  | string;

export type AgentAction =
  | 'create_invoice'
  | 'create_deadline'
  | 'create_decision_card'
  | 'send_agent_message'
  | 'create_memory'
  | 'update_agent_data'
  | 'create_achievement'
  | 'upload_document'
  | 'read_document'
  | 'share_document'
  | string;

export type AgentSource = 'custom' | 'template' | 'marketplace';

export interface AgentTrigger {
  event: TriggerEvent;
  conditions: Record<string, unknown>;
}

export type TriggerEvent =
  | 'relationship_created'
  | 'relationship_updated'
  | 'deadline_approaching'
  | 'deadline_completed'
  | 'invoice_paid'
  | 'invoice_overdue'
  | 'schedule'
  | 'manual';

export interface AgentMessage {
  id: UUID;
  business_id: UUID;
  from_agent_id: UUID | null;
  to_agent_id: UUID | null;
  chain_id: UUID | null;
  chain_depth: number;
  message_type: AgentMessageType;
  content: AgentMessageContent;
  processed: boolean;
  created_at: Timestamp;
}

export type AgentMessageType = 'request' | 'response' | 'notification' | 'handoff' | 'escalation';

export interface AgentMessageContent {
  text?: string;
  data?: Record<string, unknown>;
  action_requested?: string;
  context?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface DecisionCard {
  id: UUID;
  business_id: UUID;
  agent_id: UUID | null;
  type: DecisionCardType;
  title: string;
  description: string | null;
  options: DecisionOption[] | null;
  urgency: DecisionUrgency;
  status: DecisionStatus;
  decided_at: Timestamp | null;
  decision_payload: Record<string, unknown> | null;
  expires_at: Timestamp | null;
  created_at: Timestamp;
}

export type DecisionCardType = 'approval' | 'choice' | 'fyi' | 'alert';
export type DecisionUrgency = 'low' | 'normal' | 'high' | 'critical';
export type DecisionStatus = 'pending' | 'approved' | 'rejected' | 'dismissed' | 'expired' | 'acted';

export interface DecisionOption {
  id: string;
  label: string;
  description?: string;
  action?: string;
  payload?: Record<string, unknown>;
  recommended?: boolean;
}

export interface AgentData {
  id: UUID;
  business_id: UUID;
  agent_id: UUID;
  key: string;
  value: unknown;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface MarketplaceAgent {
  id: UUID;
  slug: string;
  name: string;
  description: string;
  role: AgentRole;
  avatar: string | null;
  category: MarketplaceCategory;
  author_id: UUID | null;
  author_name: string | null;
  author_verified: boolean;
  manifest: MarketplaceManifest;
  install_count: number;
  rating: number;
  review_status: MarketplaceReviewStatus;
  pricing: MarketplacePricing;
  estimated_daily_cost: number;
  flag_count: number;
  disabled: boolean;
  created_at: Timestamp;
}

export type MarketplaceCategory =
  | 'finance'
  | 'operations'
  | 'marketing'
  | 'sales'
  | 'compliance'
  | 'customer-success'
  | 'analytics'
  | 'communication'
  | 'industry-specific'
  | string;

export type MarketplaceReviewStatus = 'pending' | 'approved' | 'rejected' | 'suspended';
export type MarketplacePricing = 'free' | 'premium' | 'enterprise';

export interface MarketplaceManifest {
  version: string;
  system_prompt: string;
  context_permissions: ContextPermission[];
  allowed_actions: AgentAction[];
  triggers: AgentTrigger[];
  budget_daily_usd: number;
  budget_monthly_usd: number;
  setup_instructions?: string;
  required_integrations?: string[];
  supported_industries?: string[];
  changelog?: ManifestChangelogEntry[];
}

export interface ManifestChangelogEntry {
  version: string;
  date: DateString;
  changes: string[];
}

export interface Achievement {
  id: UUID;
  business_id: UUID;
  type: string;
  title: string;
  description: string | null;
  unlocked_at: Timestamp;
}

export interface AuditLogEntry {
  id: UUID;
  business_id: UUID;
  actor: string;
  actor_agent_id: UUID | null;
  action: string;
  resource_type: string | null;
  resource_id: UUID | null;
  input_summary: string | null;
  output_summary: string | null;
  cost_usd: number | null;
  model_used: string | null;
  tokens_used: number | null;
  context_accessed: string[] | null;
  success: boolean;
  error_message: string | null;
  ip_address: string | null;
  created_at: Timestamp;
}

export interface SafetyConfig {
  id: UUID;
  business_id: UUID;
  global_daily_budget_usd: number;
  global_monthly_budget_usd: number;
  kill_switch_active: boolean;
  lockdown_mode: boolean;
  circuit_breaker_max_failures: number;
  circuit_breaker_window_seconds: number;
  loop_max_chain_depth: number;
  loop_repeat_threshold: number;
  model_routing_strategy: ModelRoutingStrategy;
  human_gate_overrides: HumanGateOverride[];
  updated_at: Timestamp;
}

export interface HumanGateOverride {
  action: string;
  agent_id?: UUID;
  always_require_approval: boolean;
}

export interface CostSnapshot {
  id: UUID;
  business_id: UUID;
  date: DateString;
  total_cost_usd: number;
  by_agent: Record<string, number>;
  by_model: Record<string, number>;
  by_task_type: Record<string, number>;
  api_calls_count: number;
  tokens_input: number;
  tokens_output: number;
  agents_active: number;
}

export interface IndustryTemplate {
  id: UUID;
  slug: string;
  name: string;
  description: string | null;
  icon: string | null;
  default_agents: TemplateAgent[];
  default_deadlines: TemplateDeadline[];
  default_preferences: Partial<BusinessPreferences>;
  sort_order: number;
}

export interface TemplateAgent {
  name: string;
  role: AgentRole;
  avatar: string;
  system_prompt: string;
  context_permissions: ContextPermission[];
  allowed_actions: AgentAction[];
  triggers: AgentTrigger[];
  budget_daily_usd: number;
  budget_monthly_usd: number;
}

export interface TemplateDeadline {
  title: string;
  description: string;
  due_date_template: string;
  type: DeadlineType;
  recurring: 'annual' | 'quarterly' | 'monthly' | 'weekly';
}

// -----------------------------------------------------------------------------
// Document / Vault Types
// -----------------------------------------------------------------------------

export type DocumentAccessLevel = 'owner' | 'restricted' | 'internal' | 'team';
export type DocumentSource = 'upload' | 'gmail' | 'google_drive' | 'outlook' | 'slack' | 'notion' | 'dropbox' | 'agent';
export type DocumentCategory = 'contract' | 'receipt' | 'report' | 'legal' | 'tax' | 'proposal' | 'invoice' | 'correspondence' | 'other';

export interface Document {
  id: UUID;
  business_id: UUID;
  name: string;
  file_type: string;
  file_size_bytes: number;
  storage_path: string | null;
  category: DocumentCategory;
  tags: string[];
  description: string | null;
  access_level: DocumentAccessLevel;
  created_by_user_id: UUID | null;
  created_by_agent_id: UUID | null;
  allowed_agent_ids: UUID[];
  source: DocumentSource;
  source_integration_id: UUID | null;
  source_external_id: string | null;
  source_url: string | null;
  source_synced_at: Timestamp | null;
  linked_entity_type: string | null;
  linked_entity_id: UUID | null;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface DocumentAccessLogEntry {
  id: UUID;
  document_id: UUID;
  business_id: UUID;
  accessed_by_user_id: UUID | null;
  accessed_by_agent_id: UUID | null;
  action: 'view' | 'download' | 'share' | 'edit';
  created_at: Timestamp;
}

export type CreateDocument = Pick<Document, 'name'> &
  Partial<Pick<Document, 'file_type' | 'category' | 'tags' | 'description' | 'access_level' | 'allowed_agent_ids' | 'source' | 'linked_entity_type' | 'linked_entity_id'>>;

export type UpdateDocument = Partial<
  Pick<Document, 'name' | 'category' | 'tags' | 'description' | 'access_level' | 'allowed_agent_ids' | 'linked_entity_type' | 'linked_entity_id'>
>;

// -----------------------------------------------------------------------------
// Business Context (assembled for agent consumption)
// -----------------------------------------------------------------------------

export interface BusinessContext {
  identity: BusinessIdentity;
  financials: BusinessFinancials;
  relationships: Relationship[];
  deadlines: Deadline[];
  preferences: BusinessPreferences;
  memory: BusinessMemory[];
}

export interface BusinessIdentity {
  id: UUID;
  business_name: string;
  state: string;
  entity_type: string;
  industry: string | null;
  description: string | null;
  health_score: number;
  onboarding_completed: boolean;
}

export interface BusinessFinancials {
  total_revenue: number;
  outstanding_invoices: number;
  overdue_invoices: number;
  monthly_revenue_trend: number[];
  top_clients_by_revenue: Array<{ name: string; revenue: number }>;
  recent_invoices: Invoice[];
}

// -----------------------------------------------------------------------------
// Cost & Efficiency Types
// -----------------------------------------------------------------------------

export type ModelRoutingStrategy = 'cost-optimized' | 'balanced' | 'quality-first';

export interface CostEstimate {
  model: string;
  estimated_tokens_input: number;
  estimated_tokens_output: number;
  estimated_cost_usd: number;
  confidence: 'low' | 'medium' | 'high';
}

export interface ModelConfig {
  id: string;
  name: string;
  provider: 'openai' | 'anthropic' | 'google' | string;
  cost_per_1k_input_tokens: number;
  cost_per_1k_output_tokens: number;
  max_context_tokens: number;
  max_output_tokens: number;
  capabilities: ModelCapability[];
  tier: 'fast' | 'standard' | 'premium';
}

export type ModelCapability = 'reasoning' | 'coding' | 'creative' | 'structured-output' | 'vision' | 'long-context';

export interface TaskRoutingDecision {
  task_type: string;
  complexity: 'low' | 'medium' | 'high';
  selected_model: string;
  reasoning: string;
  estimated_cost: CostEstimate;
  strategy_used: ModelRoutingStrategy;
  agent_id: UUID;
  budget_remaining_daily: number;
  budget_remaining_monthly: number;
}

// -----------------------------------------------------------------------------
// Safety Types
// -----------------------------------------------------------------------------

export interface CircuitBreakerState {
  agent_id: UUID;
  failure_count: number;
  last_failure_at: Timestamp | null;
  circuit_open: boolean;
  window_start: Timestamp;
  max_failures: number;
  window_seconds: number;
}

export interface AuditEntry {
  actor: string;
  actor_agent_id?: UUID;
  action: string;
  resource_type?: string;
  resource_id?: UUID;
  input_summary?: string;
  output_summary?: string;
  cost_usd?: number;
  model_used?: string;
  tokens_used?: number;
  context_accessed?: string[];
  success: boolean;
  error_message?: string;
}

export interface SafetyCheckResult {
  allowed: boolean;
  reason?: string;
  checks: {
    budget_ok: boolean;
    circuit_breaker_ok: boolean;
    kill_switch_ok: boolean;
    lockdown_ok: boolean;
    chain_depth_ok: boolean;
    human_gate_required: boolean;
  };
}

// -----------------------------------------------------------------------------
// Achievement Types
// -----------------------------------------------------------------------------

export interface AchievementDefinition {
  type: string;
  title: string;
  description: string;
  condition: AchievementCondition;
  icon?: string;
}

export interface AchievementCondition {
  metric: string;
  threshold: number;
  comparison: 'gte' | 'lte' | 'eq';
}

export type AchievementCategory =
  | 'revenue'
  | 'efficiency'
  | 'consistency'
  | 'growth'
  | 'milestone';

// -----------------------------------------------------------------------------
// API Response Types
// -----------------------------------------------------------------------------

export interface ApiResponse<T> {
  data: T | null;
  error: ApiError | null;
  meta?: ApiMeta;
}

export interface ApiListResponse<T> {
  data: T[];
  error: ApiError | null;
  meta?: ApiListMeta;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  status: number;
}

export interface ApiMeta {
  request_id: string;
  timestamp: Timestamp;
}

export interface ApiListMeta extends ApiMeta {
  total: number;
  page: number;
  per_page: number;
  has_more: boolean;
}

// -----------------------------------------------------------------------------
// Input / Create Types (for forms and API calls)
// -----------------------------------------------------------------------------

export type CreateBusiness = Pick<Business, 'business_name' | 'state'> &
  Partial<Pick<Business, 'entity_type' | 'industry' | 'industry_template' | 'description'>>;

export type UpdateBusiness = Partial<
  Pick<Business, 'business_name' | 'state' | 'entity_type' | 'industry' | 'description' | 'preferences'>
>;

export type CreateRelationship = Pick<Relationship, 'name' | 'type'> &
  Partial<Pick<Relationship, 'email' | 'notes' | 'metadata'>>;

export type UpdateRelationship = Partial<
  Pick<Relationship, 'name' | 'email' | 'type' | 'status' | 'notes' | 'metadata'>
>;

export type CreateDeadline = Pick<Deadline, 'title' | 'due_date' | 'type'> &
  Partial<Pick<Deadline, 'description'>>;

export type CreateInvoice = Pick<Invoice, 'client_name' | 'amount'> &
  Partial<Pick<Invoice, 'client_email' | 'currency' | 'description' | 'due_date'>>;

export type CreateAgent = Pick<Agent, 'name' | 'role' | 'system_prompt' | 'context_permissions' | 'allowed_actions'> &
  Partial<Pick<Agent, 'avatar' | 'triggers' | 'budget_daily_usd' | 'budget_monthly_usd'>>;

export type CreateDecisionCard = Pick<DecisionCard, 'type' | 'title'> &
  Partial<Pick<DecisionCard, 'description' | 'options' | 'urgency' | 'expires_at' | 'agent_id'>>;

export type CreateMemory = Pick<BusinessMemory, 'content'> &
  Partial<Pick<BusinessMemory, 'category' | 'tags' | 'importance'>>;

// -----------------------------------------------------------------------------
// Event Types (for triggers and real-time)
// -----------------------------------------------------------------------------

export interface BusinessEvent {
  event: TriggerEvent;
  business_id: UUID;
  payload: Record<string, unknown>;
  timestamp: Timestamp;
}

export interface AgentTaskRequest {
  agent_id: UUID;
  business_id: UUID;
  trigger: AgentTrigger;
  context: Partial<BusinessContext>;
  chain_id?: UUID;
  chain_depth?: number;
}

export interface AgentTaskResult {
  agent_id: UUID;
  success: boolean;
  actions_taken: AgentActionTaken[];
  cost_usd: number;
  model_used: string;
  tokens_used: number;
  duration_ms: number;
  error?: string;
}

export interface AgentActionTaken {
  action: AgentAction;
  resource_type: string;
  resource_id?: UUID;
  summary: string;
}
