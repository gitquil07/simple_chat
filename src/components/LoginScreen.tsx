import { useState, type FormEvent } from 'react';
import { apiUrlForInstance, getStateInstance } from '../api/greenApi';
import type { Credentials } from '../types';
import { Logo } from './Logo';

export function LoginScreen({ onLogin }: { onLogin: (creds: Credentials) => void }) {
  const [idInstance, setIdInstance] = useState('');
  const [apiTokenInstance, setApiTokenInstance] = useState('');
  // Empty means "derive from idInstance".
  const [apiUrl, setApiUrl] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const creds: Credentials = {
      apiUrl: apiUrl.trim() || apiUrlForInstance(idInstance),
      idInstance: idInstance.trim(),
      apiTokenInstance: apiTokenInstance.trim(),
    };
    setError(null);
    setLoading(true);
    try {
      const { stateInstance } = await getStateInstance(creds);
      if (stateInstance !== 'authorized') {
        setError(`Instance state is "${stateInstance}". Authorize it in the GREEN-API console first.`);
        return;
      }
      onLogin(creds);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not reach GREEN-API');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login">
      <form className="login-card" onSubmit={handleSubmit}>
        <Logo size={56} />
        <h1>Sign in to MAX</h1>
        <p className="login-hint">
          Enter your GREEN-API instance credentials from{' '}
          <a href="https://console.green-api.com" target="_blank" rel="noreferrer">
            console.green-api.com
          </a>
        </p>

        <label className="field">
          <span>idInstance</span>
          <input
            value={idInstance}
            onChange={(e) => setIdInstance(e.target.value)}
            inputMode="numeric"
            placeholder="3100000001"
            autoComplete="username"
            required
            autoFocus
          />
        </label>

        <label className="field">
          <span>apiTokenInstance</span>
          <input
            type="password"
            value={apiTokenInstance}
            onChange={(e) => setApiTokenInstance(e.target.value)}
            placeholder="d75b3a66374942c5b3c019c698abc2067e151558acbd412345"
            autoComplete="current-password"
            required
          />
        </label>

        {showAdvanced ? (
          <label className="field">
            <span>apiUrl</span>
            <input
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
              placeholder={apiUrlForInstance(idInstance)}
            />
          </label>
        ) : (
          <button type="button" className="link-button" onClick={() => setShowAdvanced(true)}>
            Change API host
          </button>
        )}

        {error && <div className="form-error">{error}</div>}

        <button type="submit" className="primary-button" disabled={loading}>
          {loading ? 'Connecting…' : 'Continue'}
        </button>
      </form>
    </div>
  );
}
