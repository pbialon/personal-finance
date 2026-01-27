'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Link2, RefreshCw, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import type { BankConnection } from '@/types';
import { formatDate } from '@/lib/utils';

function SettingsContent() {
  const searchParams = useSearchParams();
  const [connection, setConnection] = useState<BankConnection | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const success = searchParams.get('success');
    const error = searchParams.get('error');

    if (success === 'bank_connected') {
      setMessage({ type: 'success', text: 'Pomyślnie połączono z bankiem!' });
    } else if (error) {
      const errorMessages: Record<string, string> = {
        bank_auth_failed: 'Autoryzacja bankowa nie powiodła się',
        missing_params: 'Brakujące parametry w odpowiedzi',
        invalid_state: 'Nieprawidłowy stan sesji',
        callback_failed: 'Błąd podczas przetwarzania odpowiedzi',
      };
      setMessage({ type: 'error', text: errorMessages[error] || 'Wystąpił nieznany błąd' });
    }
  }, [searchParams]);

  useEffect(() => {
    const fetchConnection = async () => {
      try {
        const response = await fetch('/api/bank/connect');
        const data = await response.json();
        setConnection(data);
      } catch (error) {
        console.error('Failed to fetch connection:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchConnection();
  }, []);

  const handleConnect = async () => {
    setConnecting(true);
    try {
      const response = await fetch('/api/bank/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          aspspName: 'ING',
          redirectUri: `${window.location.origin}/api/bank/callback`,
        }),
      });

      const data = await response.json();

      if (data.authUrl) {
        window.location.href = data.authUrl;
      } else {
        setMessage({ type: 'error', text: 'Nie udało się uzyskać URL autoryzacji' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Błąd podczas łączenia z bankiem' });
    } finally {
      setConnecting(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    setMessage(null);

    try {
      const response = await fetch('/api/bank/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      const data = await response.json();

      if (data.needsReauth) {
        setMessage({ type: 'error', text: 'Zgoda bankowa wygasła. Połącz ponownie z bankiem.' });
      } else if (data.error) {
        setMessage({ type: 'error', text: data.error });
      } else {
        setMessage({
          type: 'success',
          text: `Zaimportowano ${data.imported} nowych transakcji (pominięto ${data.skipped} duplikatów)`,
        });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Błąd podczas synchronizacji' });
    } finally {
      setSyncing(false);
    }
  };

  const isConsentExpired = connection?.consent_valid_until
    ? new Date(connection.consent_valid_until) < new Date()
    : false;

  const daysUntilExpiry = connection?.consent_valid_until
    ? Math.ceil((new Date(connection.consent_valid_until).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Ustawienia</h1>
        <p className="text-sm text-gray-500">
          Zarządzaj połączeniem z bankiem i konfiguracją
        </p>
      </div>

      {message && (
        <div
          className={`p-4 rounded-lg flex items-center gap-3 ${
            message.type === 'success'
              ? 'bg-green-50 text-green-800'
              : 'bg-red-50 text-red-800'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle className="h-5 w-5" />
          ) : (
            <AlertCircle className="h-5 w-5" />
          )}
          {message.text}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Połączenie z bankiem</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <p className="text-gray-500">Ładowanie...</p>
          ) : connection && connection.status === 'active' ? (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{connection.aspsp_name || 'Bank'}</p>
                  <p className="text-sm text-gray-500">
                    Ostatnia synchronizacja:{' '}
                    {connection.last_sync_at
                      ? formatDate(connection.last_sync_at)
                      : 'Nigdy'}
                  </p>
                </div>
                <Badge
                  variant={isConsentExpired ? 'danger' : daysUntilExpiry && daysUntilExpiry < 14 ? 'warning' : 'success'}
                >
                  {isConsentExpired
                    ? 'Wygasło'
                    : daysUntilExpiry
                    ? `Ważne ${daysUntilExpiry} dni`
                    : 'Aktywne'}
                </Badge>
              </div>

              {isConsentExpired && (
                <div className="p-3 bg-yellow-50 text-yellow-800 rounded-lg text-sm">
                  <AlertCircle className="h-4 w-4 inline mr-2" />
                  Zgoda PSD2 wygasła. Połącz ponownie z bankiem, aby kontynuować synchronizację.
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  onClick={handleSync}
                  loading={syncing}
                  disabled={isConsentExpired}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Synchronizuj teraz
                </Button>
                <Button onClick={handleConnect} loading={connecting}>
                  <Link2 className="h-4 w-4 mr-2" />
                  {isConsentExpired ? 'Połącz ponownie' : 'Odnów połączenie'}
                </Button>
              </div>
            </>
          ) : (
            <>
              <p className="text-gray-500">
                Połącz swoje konto bankowe, aby automatycznie importować transakcje.
                Wspieramy polskie banki przez Enable Banking (PSD2).
              </p>
              <Button onClick={handleConnect} loading={connecting}>
                <Link2 className="h-4 w-4 mr-2" />
                Połącz z ING
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Informacje</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-gray-600">
          <p>
            <strong>Enable Banking</strong> - Europejski agregator PSD2 zapewniający
            bezpieczny dostęp do danych bankowych.
          </p>
          <p>
            <strong>Zgoda PSD2</strong> - Ważna maksymalnie 90 dni. Po wygaśnięciu
            konieczna jest ponowna autoryzacja.
          </p>
          <p>
            <strong>Automatyczna synchronizacja</strong> - Transakcje są pobierane
            automatycznie raz dziennie.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    }>
      <SettingsContent />
    </Suspense>
  );
}
