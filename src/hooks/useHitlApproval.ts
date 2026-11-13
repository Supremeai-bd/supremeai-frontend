import { useState, useEffect, useCallback } from 'react';
import { hitlService, HitlPendingRecord } from '../services/hitlService';
import { env } from '../config/env';

export function useHitlApproval() {
  const [pendingRequests, setPendingRequests] = useState<HitlPendingRecord[]>([]);
  const [activeRequest, setActiveRequest] = useState<HitlPendingRecord | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchPending = useCallback(async () => {
    const list = await hitlService.getPending();
    setPendingRequests(list);
    if (list.length > 0 && !activeRequest) {
      setActiveRequest(list[0]);
    } else if (list.length === 0) {
      setActiveRequest(null);
    }
  }, [activeRequest]);

  useEffect(() => {
    if (env.isMockEnabled) return;

    fetchPending();
    const interval = setInterval(fetchPending, 15000);

    // Optional SSE listener for live push
    let eventSource: EventSource | null = null;
    try {
      const sseUrl = `${env.apiBaseUrl}/api/v1/stream/hitl`;
      eventSource = new EventSource(sseUrl, { withCredentials: true });
      eventSource.addEventListener('hitl', (event) => {
        try {
          const data = JSON.parse(event.data);
          const newRecord: HitlPendingRecord = {
            id: data.context?.record_id || `hitl_${Date.now()}`,
            action_name: data.message || 'Sensitive Action Requires Approval',
            command: data.context?.command,
            module: data.module,
            severity: data.severity || 'high',
            context: data.context,
            created_at: new Date().toISOString(),
            status: 'pending',
          };
          setPendingRequests((prev) => [newRecord, ...prev.filter((r) => r.id !== newRecord.id)]);
          setActiveRequest(newRecord);
        } catch {}
      });
    } catch {}

    return () => {
      clearInterval(interval);
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [fetchPending]);

  const approve = async (recordId: string) => {
    setIsProcessing(true);
    try {
      const ok = await hitlService.approve(recordId);
      if (ok) {
        setPendingRequests((prev) => prev.filter((r) => r.id !== recordId));
        setActiveRequest(null);
      }
      return ok;
    } finally {
      setIsProcessing(false);
    }
  };

  const reject = async (recordId: string, reason: string) => {
    setIsProcessing(true);
    try {
      const ok = await hitlService.reject(recordId, reason);
      if (ok) {
        setPendingRequests((prev) => prev.filter((r) => r.id !== recordId));
        setActiveRequest(null);
      }
      return ok;
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    pendingRequests,
    activeRequest,
    isProcessing,
    approve,
    reject,
    dismiss: () => setActiveRequest(null),
    triggerManualCheck: fetchPending,
  };
}
