import { SupabaseClient } from '@supabase/supabase-js';

const MAX_CHAIN_DEPTH = 10;

interface AgentMessage {
  id: string;
  from_agent_id: string;
  to_agent_id: string;
  business_id: string;
  message_type: string;
  content: string;
  chain_id: string | null;
  chain_depth: number;
  processed: boolean;
  created_at: string;
}

export async function sendMessage(
  fromAgentId: string,
  toAgentId: string,
  businessId: string,
  messageType: string,
  content: string,
  chainId: string | null,
  supabase: SupabaseClient
): Promise<AgentMessage | null> {
  try {
    // Determine chain depth
    let chainDepth = 0;
    if (chainId) {
      const { data: lastMessage } = await supabase
        .from('agent_messages')
        .select('chain_depth')
        .eq('chain_id', chainId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      chainDepth = lastMessage ? (lastMessage.chain_depth as number) + 1 : 0;
    }

    // Check chain depth before sending
    if (chainDepth >= MAX_CHAIN_DEPTH) {
      console.warn(
        `[agents/message-bus] Chain depth limit (${MAX_CHAIN_DEPTH}) reached for chain ${chainId}. Message not sent.`
      );
      return null;
    }

    const resolvedChainId = chainId ?? crypto.randomUUID();

    const { data, error } = await supabase
      .from('agent_messages')
      .insert({
        from_agent_id: fromAgentId,
        to_agent_id: toAgentId,
        business_id: businessId,
        message_type: messageType,
        content,
        chain_id: resolvedChainId,
        chain_depth: chainDepth,
        processed: false,
      })
      .select()
      .single();

    if (error) throw error;
    return data as AgentMessage;
  } catch (error) {
    console.error('[agents/message-bus] sendMessage failed:', error);
    return null;
  }
}

export async function getUnprocessedMessages(
  agentId: string,
  supabase: SupabaseClient
): Promise<AgentMessage[]> {
  try {
    const { data, error } = await supabase
      .from('agent_messages')
      .select('*')
      .eq('to_agent_id', agentId)
      .eq('processed', false)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return (data as AgentMessage[]) ?? [];
  } catch (error) {
    console.error('[agents/message-bus] getUnprocessedMessages failed:', error);
    return [];
  }
}

export async function markProcessed(
  messageId: string,
  supabase: SupabaseClient
): Promise<void> {
  try {
    const { error } = await supabase
      .from('agent_messages')
      .update({ processed: true, processed_at: new Date().toISOString() })
      .eq('id', messageId);

    if (error) throw error;
  } catch (error) {
    console.error('[agents/message-bus] markProcessed failed:', error);
  }
}

export async function getChainHistory(
  chainId: string,
  supabase: SupabaseClient
): Promise<AgentMessage[]> {
  try {
    const { data, error } = await supabase
      .from('agent_messages')
      .select('*')
      .eq('chain_id', chainId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return (data as AgentMessage[]) ?? [];
  } catch (error) {
    console.error('[agents/message-bus] getChainHistory failed:', error);
    return [];
  }
}
