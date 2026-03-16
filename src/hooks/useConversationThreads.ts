import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export interface ConversationThread {
  leadId: string;
  leadName: string;
  leadPhone: string;
  leadBudget?: string;
  leadLocation?: string;
  leadStatus?: string;
  lastMessage: string;
  lastMessageAt: string;
  channel: string;
  messageCount: number;
}

export const useConversationThreads = () =>
  useQuery({
    queryKey: ['conversation-threads'],
    queryFn: async () => {
      const res = await fetch('/api/conversations');
      if (!res.ok) throw new Error('Failed to fetch conversations');
      const data = await res.json();

      // Group by leadId
      const grouped: Record<string, ConversationThread> = {};
      for (const c of data || []) {
        const lid = c.leadId?._id || c.leadId || 'unknown';
        if (!grouped[lid]) {
          grouped[lid] = {
            leadId: lid,
            leadName: c.leadId?.name || 'Unknown',
            leadPhone: c.leadId?.phone || '',
            leadBudget: c.leadId?.budget || '',
            leadLocation: c.leadId?.preferredLocation || '',
            leadStatus: c.leadId?.status || 'new',
            lastMessage: c.message,
            lastMessageAt: c.createdAt,
            channel: c.channel || 'whatsapp',
            messageCount: 0,
          };
        }
        grouped[lid].messageCount++;
      }
      return Object.values(grouped).sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());
    },
  });

export const useConversationMessages = (leadId: string | null) =>
  useQuery({
    queryKey: ['conversation-messages', leadId],
    enabled: !!leadId,
    queryFn: async () => {
      const res = await fetch(`/api/conversations?leadId=${leadId}`);
      if (!res.ok) throw new Error('Failed to fetch conversation messages');
      return res.json();
    },
  });

export const useSendMessage = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (msg: { lead_id: string; message: string; channel?: string; agent_id?: string }) => {
      const res = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId: msg.lead_id,
          message: msg.message,
          direction: 'outbound',
          source: 'manual', // Mapping channel to source/channel
          agentId: msg.agent_id || null,
        }),
      });
      if (!res.ok) throw new Error('Failed to send message');
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['conversation-threads'] });
      qc.invalidateQueries({ queryKey: ['conversation-messages'] });
    },
  });
};

export const useMessageTemplates = () =>
  useQuery({
    queryKey: ['message-templates'],
    queryFn: async () => {
      const res = await fetch('/api/message-templates');
      if (!res.ok) throw new Error('Failed to fetch templates');
      return res.json();
    },
  });

