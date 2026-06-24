import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";
import { fetchAccounts, updateAccount as apiUpdateAccount } from "../lib/api";

function accountLog(level, message, data) {
  const prefix = `[BLS-ACCOUNTS][${new Date().toISOString()}]`;
  if (level === 'error') console.error(prefix, message, data ?? '');
  else if (level === 'warn') console.warn(prefix, message, data ?? '');
  else console.log(prefix, message, data ?? '');
}

export function useAccounts() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const abortControllerRef = useRef(null);

  const loadAccounts = useCallback(async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    accountLog('info', 'Loading accounts...');
    setLoading(true);
    setError(null);

    try {
      const data = await fetchAccounts();
      const safeData = Array.isArray(data) ? data : [];
      accountLog('info', `Loaded ${safeData.length} accounts`);
      setAccounts(safeData);
    } catch (err) {
      if (err.name !== 'AbortError') {
        accountLog('error', 'Failed to load accounts', err.message);
        setError(err.message);
        toast.error(`Failed to load accounts: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAccounts();
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [loadAccounts]);

  // Update Credit and/or tags for one account (optimistic update)
  const updateAccount = useCallback(async (sheetRow, updates) => {
    accountLog('info', 'Updating account', { sheetRow, updates });
    const result = await apiUpdateAccount(sheetRow, updates);

    // Optimistic: update local state immediately
    setAccounts(prev =>
      prev.map(acc =>
        acc.sheetRow === sheetRow ? { ...acc, ...updates } : acc
      )
    );

    return result;
  }, []);

  return {
    accounts,
    loading,
    error,
    refresh: loadAccounts,
    updateAccount,
  };
}
