import React, { useState } from 'react';
import { Box, Text, useInput, useApp } from 'ink';
import TextInput from 'ink-text-input';
import { AuthService } from '../services/AuthService';

type Field = 'email' | 'password' | 'submit';
const FIELDS: Field[] = ['email', 'password', 'submit'];

interface Props {
  auth: AuthService;
  columns: number;
  onAuthenticated: (email: string) => void;
}

export default function SignUpScreen({ auth, columns, onAuthenticated }: Props) {
  const { exit } = useApp();
  const [mode, setMode] = useState<'signup' | 'signin'>('signup');
  const [focus, setFocus] = useState<Field>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const move = (d: number) => {
    const i = FIELDS.indexOf(focus);
    setFocus(FIELDS[(i + d + FIELDS.length) % FIELDS.length]);
  };

  const submit = async () => {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      const user =
        mode === 'signup'
          ? await auth.signUp(email.trim(), password)
          : await auth.signIn(email.trim(), password);
      onAuthenticated(user.email ?? email);
    } catch (e: any) {
      setError(String(e?.code ?? e?.message ?? e).replace('auth/', '').replace(/-/g, ' '));
    } finally {
      setBusy(false);
    }
  };

  useInput((input, key) => {
    if (key.escape) exit();
    if (key.tab && key.shift) return move(-1);
    if (key.tab || key.downArrow) return move(1);
    if (key.upArrow) return move(-1);
    if (key.ctrl && input === 'l') setMode((m) => (m === 'signup' ? 'signin' : 'signup'));
    if (key.return && focus === 'submit') submit();
  });

  const width = Math.min(60, Math.max(30, columns - 4));
  const label = (f: Field, text: string) => (
    <Text color={focus === f ? 'cyan' : 'gray'} bold={focus === f}>
      {focus === f ? '› ' : '  '}
      {text}
    </Text>
  );

  return (
    <Box width={columns} justifyContent="center" marginTop={1}>
      <Box flexDirection="column" borderStyle="round" borderColor="cyan" width={width} paddingX={2} paddingY={1}>
        <Text bold color="cyan">
          {mode === 'signup' ? 'Create account' : 'Sign in'}
        </Text>
        <Box marginTop={1} flexDirection="column">
          {label('email', 'Email')}
          <Box marginLeft={2}>
            <TextInput
              value={email}
              onChange={setEmail}
              focus={focus === 'email'}
              onSubmit={() => setFocus('password')}
              placeholder="you@example.com"
            />
          </Box>
        </Box>
        <Box marginTop={1} flexDirection="column">
          {label('password', 'Password')}
          <Box marginLeft={2}>
            <TextInput
              value={password}
              onChange={setPassword}
              focus={focus === 'password'}
              mask="*"
              onSubmit={() => setFocus('submit')}
              placeholder="min 6 characters"
            />
          </Box>
        </Box>
        <Box marginTop={1}>
          <Text
            inverse={focus === 'submit'}
            color={focus === 'submit' ? 'green' : 'white'}
          >
            {busy ? ' Please wait… ' : mode === 'signup' ? ' [ Sign up ] ' : ' [ Sign in ] '}
          </Text>
        </Box>
        {error ? (
          <Box marginTop={1}>
            <Text color="red">✖ {error}</Text>
          </Box>
        ) : null}
        <Box marginTop={1} flexDirection="column">
          <Text dimColor>Tab/↑↓ move · Enter select · Ctrl+L switch mode · Esc quit</Text>
        </Box>
      </Box>
    </Box>
  );
}