'use client';

import { useState, useEffect, Suspense, useRef, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { Link2, RefreshCw, AlertCircle, CheckCircle, Loader2, Building2, Upload, Plus, X, CreditCard, Trash2, AlertTriangle, Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import type { BankConnection } from '@/types';
import { formatDateTime, cn } from '@/lib/utils';
import { useImport } from '@/components/import/ImportContext';

function formatIban(iban: string): string {
  // Remove all spaces and format as groups of 4
  const clean = iban.replace(/\s/g, '');
  return clean.match(/.{1,4}/g)?.join(' ') || clean;
}

function validateIban(iban: string): { valid: boolean; error?: string } {
  const clean = iban.replace(/\s/g, '').toUpperCase();

  if (!clean) return { valid: false };

  // Check if starts with PL
  if (!clean.startsWith('PL')) {
    return { valid: false, error: 'IBAN musi zaczynać się od PL' };
  }

  // Check length (PL + 26 digits = 28)
  if (clean.length !== 28) {
    return { valid: false, error: `Nieprawidłowa długość (${clean.length}/28)` };
  }

  // Check if rest is digits
  if (!/^PL\d{26}$/.test(clean)) {
    return { valid: false, error: 'IBAN może zawierać tylko cyfry po PL' };
  }

  // MOD 97 validation
  // Move first 4 chars to end, convert letters to numbers (A=10, B=11, etc.)
  const rearranged = clean.slice(4) + clean.slice(0, 4);
  const numericStr = rearranged.replace(/[A-Z]/g, (char) =>
    (char.charCodeAt(0) - 55).toString()
  );

  // Calculate mod 97 (handle big numbers by processing in chunks)
  let remainder = 0;
  for (let i = 0; i < numericStr.length; i++) {
    remainder = (remainder * 10 + parseInt(numericStr[i])) % 97;
  }

  if (remainder !== 1) {
    return { valid: false, error: 'Nieprawidłowa suma kontrolna' };
  }

  return { valid: true };
}

const INGIcon = () => (
  <img src="/banks/ing.svg" alt="ING" className="w-10 h-10 rounded-lg" />
);

// Polish bank codes (first 4 digits after check digits in IBAN)
const BANK_CODES: Record<string, { name: string; color: string; logo?: string }> = {
  '1050': { name: 'ING Bank Śląski', color: '#FF6200', logo: '/banks/ing.svg' },
  '1020': { name: 'PKO Bank Polski', color: '#004B87' },
  '1140': { name: 'mBank', color: '#D71920' },
  '1090': { name: 'Santander', color: '#EC0000' },
  '1240': { name: 'Bank Pekao', color: '#C8102E' },
  '2490': { name: 'Alior Bank', color: '#E4002B' },
  '1160': { name: 'Bank Millennium', color: '#6B2C91' },
  '1600': { name: 'BNP Paribas', color: '#00915A' },
};

function getBankFromIban(iban: string): { name: string; color: string; logo?: string } | null {
  const clean = iban.replace(/\s/g, '').toUpperCase();
  if (clean.length < 8) return null;
  const bankCode = clean.substring(4, 8);
  return BANK_CODES[bankCode] || null;
}

const SUPPORTED_BANKS = [
  { id: 'ING', name: 'ING Bank Śląski', enabled: true, color: '#FF6200', icon: INGIcon },
  { id: 'PKO', name: 'PKO Bank Polski', enabled: false, color: '#004B87' },
  { id: 'MBANK', name: 'mBank', enabled: false, color: '#D71920' },
  { id: 'SANTANDER', name: 'Santander Bank Polska', enabled: false, color: '#EC0000' },
  { id: 'PEKAO', name: 'Bank Pekao', enabled: false, color: '#C8102E' },
  { id: 'ALIOR', name: 'Alior Bank', enabled: false, color: '#E4002B' },
  { id: 'MILLENNIUM', name: 'Bank Millennium', enabled: false, color: '#6B2C91' },
  { id: 'BNP', name: 'BNP Paribas', enabled: false, color: '#00915A' },
];

function SettingsContent() {
  const searchParams = useSearchParams();
  const [connection, setConnection] = useState<BankConnection | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showBankModal, setShowBankModal] = useState(false);
  const [selectedBank, setSelectedBank] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [ignoredIbans, setIgnoredIbans] = useState<string[]>([]);
  const [newIban, setNewIban] = useState('');
  const [savingIbans, setSavingIbans] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const { startImport, isImporting } = useImport();

  const ibanValidation = useMemo(() => {
    if (!newIban.trim()) return null;
    return validateIban(newIban);
  }, [newIban]);

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

    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/settings');
        const data = await response.json();
        if (data.ignored_ibans && Array.isArray(data.ignored_ibans)) {
          setIgnoredIbans(data.ignored_ibans);
        }
      } catch (error) {
        console.error('Failed to fetch settings:', error);
      }
    };

    fetchConnection();
    fetchSettings();
  }, []);

  const handleConnect = async (bankId: string) => {
    setConnecting(true);
    setSelectedBank(bankId);
    try {
      const response = await fetch('/api/bank/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          aspspName: bankId,
          redirectUri: `${window.location.origin}/api/bank/callback`,
        }),
      });

      const data = await response.json();

      if (data.authUrl) {
        window.location.href = data.authUrl;
      } else {
        setMessage({ type: 'error', text: 'Nie udało się uzyskać URL autoryzacji' });
        setShowBankModal(false);
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Błąd podczas łączenia z bankiem' });
      setShowBankModal(false);
    } finally {
      setConnecting(false);
      setSelectedBank(null);
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
        const parts = [`Zaimportowano ${data.imported} nowych transakcji`];
        if (data.skipped > 0) parts.push(`pominięto ${data.skipped} duplikatów`);
        if (data.filteredInternal > 0) parts.push(`${data.filteredInternal} transferów wewnętrznych`);
        setMessage({
          type: 'success',
          text: parts.join(', '),
        });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Błąd podczas synchronizacji' });
    } finally {
      setSyncing(false);
    }
  };

  const saveIgnoredIbans = async (ibans: string[]) => {
    setSavingIbans(true);
    try {
      await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'ignored_ibans', value: ibans }),
      });
      setIgnoredIbans(ibans);
    } catch (error) {
      setMessage({ type: 'error', text: 'Błąd podczas zapisywania IBAN-ów' });
    } finally {
      setSavingIbans(false);
    }
  };

  const handleAddIban = () => {
    const trimmed = newIban.trim().toUpperCase().replace(/\s/g, '');
    if (!trimmed || !ibanValidation?.valid) return;
    if (ignoredIbans.includes(trimmed)) {
      setMessage({ type: 'error', text: 'Ten IBAN jest już na liście' });
      return;
    }
    saveIgnoredIbans([...ignoredIbans, trimmed]);
    setNewIban('');
  };

  const handleRemoveIban = (iban: string) => {
    saveIgnoredIbans(ignoredIbans.filter((i) => i !== iban));
  };

  const handleCsvImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setMessage(null);
    startImport(file);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDeleteAllTransactions = async () => {
    if (deleteConfirmText !== 'usuń') return;

    setDeleting(true);
    try {
      const response = await fetch('/api/transactions/clear', {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.error) {
        setMessage({ type: 'error', text: data.error });
      } else {
        setMessage({ type: 'success', text: 'Wszystkie transakcje zostały usunięte' });
        setShowDeleteModal(false);
        setDeleteConfirmText('');
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Błąd podczas usuwania transakcji' });
    } finally {
      setDeleting(false);
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
                <div className="flex items-center gap-3">
                  {(() => {
                    const bank = SUPPORTED_BANKS.find(b => connection.aspsp_name?.includes(b.id));
                    const IconComponent = bank?.icon;
                    return IconComponent ? (
                      <IconComponent />
                    ) : (
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
                        style={{ backgroundColor: bank?.color || '#6b7280' }}
                      >
                        {(connection.aspsp_name || 'B').charAt(0)}
                      </div>
                    );
                  })()}
                  <div>
                    <p className="font-medium">{connection.aspsp_name || 'Bank'}</p>
                    <p className="text-sm text-gray-500">
                      Ostatnia synchronizacja:{' '}
                      {connection.last_sync_at
                        ? formatDateTime(connection.last_sync_at)
                        : 'Nigdy'}
                    </p>
                  </div>
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

              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  onClick={handleSync}
                  loading={syncing}
                  disabled={isConsentExpired}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Synchronizuj teraz
                </Button>
                <Button onClick={() => setShowBankModal(true)}>
                  <Link2 className="h-4 w-4 mr-2" />
                  {isConsentExpired ? 'Połącz ponownie' : 'Zmień bank'}
                </Button>
              </div>
            </>
          ) : (
            <>
              <p className="text-gray-500">
                Połącz swoje konto bankowe, aby automatycznie importować transakcje.
                Wspieramy polskie banki przez Enable Banking (PSD2).
              </p>
              <Button onClick={() => setShowBankModal(true)}>
                <Building2 className="h-4 w-4 mr-2" />
                Połącz z bankiem
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Import CSV</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-500">
            Zaimportuj transakcje z pliku CSV z ING Banku. Format: eksport listy transakcji.
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleCsvImport}
            className="hidden"
          />
          <Button
            variant="secondary"
            onClick={() => fileInputRef.current?.click()}
            disabled={isImporting}
          >
            <Upload className="h-4 w-4 mr-2" />
            Wybierz plik CSV
          </Button>
          <p className="text-xs text-gray-400">
            Obsługiwany format: ING Bank Śląski (separacja średnikiem, kodowanie Windows-1250)
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Własne konta (ignorowane)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-500 text-sm">
            Transfery między tymi kontami nie będą importowane podczas synchronizacji.
            Dodaj IBAN-y swoich innych kont ING.
          </p>

          <div className="space-y-2">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  placeholder="PL00 0000 0000 0000 0000 0000 0000"
                  value={newIban}
                  onChange={(e) => setNewIban(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddIban()}
                  className={cn(
                    'font-mono text-sm pr-10',
                    ibanValidation && (ibanValidation.valid
                      ? 'border-green-500 focus:border-green-500 focus:ring-green-500'
                      : 'border-red-400 focus:border-red-400 focus:ring-red-400')
                  )}
                />
                {ibanValidation && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {ibanValidation.valid ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-red-400" />
                    )}
                  </div>
                )}
              </div>
              <Button
                variant="secondary"
                onClick={handleAddIban}
                disabled={!newIban.trim() || !ibanValidation?.valid || savingIbans}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {ibanValidation && !ibanValidation.valid && ibanValidation.error && (
              <p className="text-xs text-red-500">{ibanValidation.error}</p>
            )}
          </div>

          {ignoredIbans.length > 0 ? (
            <div className="space-y-2">
              {ignoredIbans.map((iban) => {
                const bank = getBankFromIban(iban);
                return (
                <div
                  key={iban}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {bank?.logo ? (
                      <img src={bank.logo} alt={bank.name} className="w-6 h-6 rounded" />
                    ) : bank ? (
                      <div
                        className="w-6 h-6 rounded flex items-center justify-center text-white text-[10px] font-bold"
                        style={{ backgroundColor: bank.color }}
                        title={bank.name}
                      >
                        {bank.name.charAt(0)}
                      </div>
                    ) : (
                      <CreditCard className="h-5 w-5 text-gray-400" />
                    )}
                    <span className="font-mono text-sm">{formatIban(iban)}</span>
                  </div>
                  <button
                    onClick={() => handleRemoveIban(iban)}
                    disabled={savingIbans}
                    className="p-1 hover:bg-gray-200 rounded text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-gray-400 italic">
              Brak dodanych IBAN-ów
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="text-red-600 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Strefa zagrożenia
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 bg-red-50 rounded-lg border border-red-100">
            <div className="flex-1">
              <p className="font-medium text-red-900">Usuń wszystkie transakcje</p>
              <p className="text-sm text-red-600 mt-1">
                Ta akcja jest nieodwracalna. Wszystkie transakcje zostaną trwale usunięte.
              </p>
            </div>
            <Button
              variant="ghost"
              onClick={() => setShowDeleteModal(true)}
              className="text-red-600 hover:bg-red-100 hover:text-red-700 shrink-0"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Usuń wszystko
            </Button>
          </div>
        </CardContent>
      </Card>

      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setDeleteConfirmText('');
        }}
        title="Usuń wszystkie transakcje"
        size="lg"
      >
        <div className="space-y-4">
          <div className="p-4 bg-red-50 rounded-lg border border-red-200">
            <div className="flex gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600 shrink-0" />
              <p className="text-sm text-red-700">
                Ta akcja jest <strong>nieodwracalna</strong>. Kategorie, budżety i kontrahenci pozostaną zachowani.
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Wpisz <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded">usuń</span> aby potwierdzić
            </label>
            <Input
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && deleteConfirmText === 'usuń' && handleDeleteAllTransactions()}
              placeholder="usuń"
              className="font-mono"
            />
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <Button
              variant="secondary"
              onClick={() => {
                setShowDeleteModal(false);
                setDeleteConfirmText('');
              }}
            >
              Anuluj
            </Button>
            <Button
              variant="ghost"
              onClick={handleDeleteAllTransactions}
              disabled={deleteConfirmText !== 'usuń' || deleting}
              loading={deleting}
              className="bg-red-600 text-white hover:bg-red-700 disabled:bg-red-300"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Usuń wszystkie transakcje
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showBankModal}
        onClose={() => setShowBankModal(false)}
        title="Wybierz bank"
        size="md"
      >
        <div className="space-y-2">
          <p className="text-sm text-gray-500 mb-4">
            Wybierz swój bank, aby połączyć konto przez bezpieczne API PSD2.
          </p>
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {SUPPORTED_BANKS.map((bank) => (
              <button
                key={bank.id}
                onClick={() => bank.enabled && handleConnect(bank.id)}
                disabled={!bank.enabled || connecting}
                className={cn(
                  'w-full flex items-center gap-3 p-3 rounded-lg border transition-all text-left',
                  bank.enabled
                    ? 'border-gray-200 hover:border-blue-500 hover:bg-blue-50 cursor-pointer'
                    : 'border-gray-100 bg-gray-50 cursor-not-allowed opacity-60'
                )}
              >
                {bank.icon ? (
                  <bank.icon />
                ) : (
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                    style={{ backgroundColor: bank.color }}
                  >
                    {bank.name.charAt(0)}
                  </div>
                )}
                <div className="flex-1">
                  <p className={cn('font-medium', !bank.enabled && 'text-gray-400')}>
                    {bank.name}
                  </p>
                  {!bank.enabled && (
                    <p className="text-xs text-gray-400">Wkrótce</p>
                  )}
                </div>
                {connecting && selectedBank === bank.id && (
                  <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                )}
              </button>
            ))}
          </div>
        </div>
      </Modal>
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
