"use client";

import React, { useEffect, useState } from 'react';
import { useToast } from "../ui/ToastProvider";
import { InfoTooltip } from "../ui/Tooltip";

type Status = 'connected' | 'disconnected' | 'demo';

export default function QuickBooksCard({ companyId }: { companyId: string }) {
  const apiRoot = process.env.NEXT_PUBLIC_API_URL || '';
  const toast = useToast();

  const [status, setStatus] = useState<Status>('disconnected');
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [demoOnlyConnectTooltip, setDemoOnlyConnectTooltip] = useState<string | null>(null);
  const [statusLoadError, setStatusLoadError] = useState(false);

  async function fetchStatus() {
    setLoading(true);
    setStatusLoadError(false);
    try {
      // Prefer authoritative integrations status endpoint (POST)
      const sUrl = `${apiRoot.replace(/\/$/, '')}/api/settings/integrations/status`;
      const sRes = await fetch(sUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ company_id: companyId }), cache: 'no-store' });
      if (sRes.ok) {
        const sData = await sRes.json();
        const qbo = (sData.integrations || []).find((i: any) => i.id === 'qbo');
        if (companyId === 'demo' || (qbo && qbo.demo_only)) {
          setStatus('demo');
          if (qbo?.demo_only) setDemoOnlyConnectTooltip('Connect in a real account.');
        } else if (qbo && qbo.status === 'connected') {
          setStatus('connected');
        } else if (qbo) {
          setStatus('disconnected');
        }
        setLastSync(qbo?.last_sync || null);
        setLoading(false);
        return;
      }

      // fallback to older GET /connect endpoint if status endpoint isn't available
      const url = `${apiRoot.replace(/\/$/, '')}/api/integrations/qbo/connect?company_id=${encodeURIComponent(companyId)}`;
      const res = await fetch(url, { method: 'GET', cache: 'no-store' });
      if (!res.ok) throw new Error('status fetch failed');
      const data = await res.json();
      if (companyId === 'demo' || data.demo_only) {
        setStatus('demo');
      } else if (data.status === 'connected') {
        setStatus('connected');
      } else {
        setStatus('disconnected');
      }
      setLastSync(data.last_sync || null);
      if (data.demo_only) setDemoOnlyConnectTooltip('Connect in a real account.');
    } catch (err) {
      console.error(err);
      setStatus('disconnected');
      setLastSync(null);
      setDemoOnlyConnectTooltip(null);
      setStatusLoadError(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchStatus(); }, [companyId]);

  // Handle query param connected=1: show toast (UI consumer route should trigger this)
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get('integrations') === 'qbo' && params.get('connected') === '1') {
        toast.success('QuickBooks connected.');
        // remove params to avoid repeated toasts
        params.delete('connected');
        params.delete('integrations');
        const newUrl = window.location.pathname + (params.toString() ? `?${params.toString()}` : '');
        window.history.replaceState({}, '', newUrl);
      }
    } catch (_) {}
  }, []);

  async function handleConnect() {
    if (companyId === 'demo') {
      // demo mode -> disabled
      return;
    }

    setLoading(true);
    try {
      const url = `${apiRoot.replace(/\/$/, '')}/api/integrations/qbo/connect?company_id=${encodeURIComponent(companyId)}`;
      const res = await fetch(url, { method: 'GET' });
      const data = await res.json();

      if (data.demo_only) {
        setDemoOnlyConnectTooltip('Connect in a real account.');
        return;
      }

      if (data.url) {
        // redirect to Intuit consent screen
        window.location.href = data.url;
        return;
      }

      // fallback: refresh status
      await fetchStatus();
    } catch (err: any) {
      console.error(err);
      toast.error('Sync failed.', err?.message || undefined);
    } finally {
      setLoading(false);
    }
  }

  async function handleRunSync() {
    if (companyId === 'demo') {
      toast.error('Sync failed.', 'Demo accounts cannot run syncs.');
      return;
    }

    setSyncing(true);
    try {
      const url = `${apiRoot.replace(/\/$/, '')}/api/integrations/qbo/sync`;
      const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ company_id: companyId }) });
      if (!res.ok) {
        const text = await res.text().catch(() => 'Sync failed');
        throw new Error(text);
      }
      const data = await res.json();

      toast.success('QuickBooks sync complete.');

      // refresh status via settings status endpoint per spec
      try {
        const sUrl = `${apiRoot.replace(/\/$/, '')}/api/settings/integrations/status`;
        await fetch(sUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ company_id: companyId }) });
      } catch (e) {
        // ignore
      }

      // update last sync timestamp
      await fetchStatus();
    } catch (err: any) {
      console.error(err);
      toast.error('Sync failed.', err?.message || undefined);
    } finally {
      setSyncing(false);
    }
  }

  const statusPill = (
    <div aria-label={`QuickBooks status: ${status}`} className={`px-2 py-1 rounded-full text-xs font-semibold ${status === 'connected' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-700'}`}>
      {status === 'demo' ? 'Demo only' : status === 'connected' ? 'Connected' : 'Disconnected'}
    </div>
  );

  return (
    <div className="border rounded-xl bg-white p-4">
      <div className="flex items-start justify-between">
        <div>
          <div className="font-semibold">QuickBooks Online</div>
          <div className="text-xs text-gray-500">Read-only connection for financial summaries (no write-back).</div>
        </div>
        <div className="text-right">{statusPill}</div>
      </div>

      <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm text-gray-700">
        <div>
          <div className="text-xs text-gray-500">Last Sync</div>
          <div className="mt-1">{loading ? 'Loading...' : (lastSync ? new Date(lastSync).toLocaleString() : '—')}</div>
        </div>
        <div>
          <div className="text-xs text-gray-500">Mode</div>
          <div className="mt-1">{companyId === 'demo' ? 'Demo' : 'Real'}</div>
        </div>
        <div>
          <div className="text-xs text-gray-500">Scope</div>
          <div className="mt-1">Accounting (read-only)</div>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <div>
          {companyId === 'demo' || status === 'demo' ? (
            <div className="relative">
              <button disabled className="px-4 py-2 bg-gray-200 text-gray-600 rounded opacity-80">Connect QuickBooks</button>
              <div className="absolute left-0 top-full mt-1">
                <InfoTooltip content={"Connect in a real account."} />
              </div>
            </div>
          ) : (
            <button
              onClick={handleConnect}
              disabled={loading}
              className="px-4 py-2 bg-teal-600 text-white rounded disabled:opacity-50"
            >
              {status === 'connected' ? 'Reconnect QuickBooks' : 'Connect QuickBooks'}
            </button>
          )}
        </div>

        <button
          onClick={handleRunSync}
          disabled={syncing || status !== 'connected' || companyId === 'demo'}
          className="px-3 py-2 border rounded disabled:opacity-50"
        >
          {syncing ? 'Syncing...' : 'Run Sync Now'}
        </button>
      </div>

      {statusLoadError && (
        <div className="mt-3 text-xs text-rose-600">Couldn't load status</div>
      )}
    </div>
  );
}
