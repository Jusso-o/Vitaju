const apiBaseUrl = process.env.EXPO_PUBLIC_API_URL?.trim().replace(/\/+$/, '');

export async function saveExerciseSession(session) {
  if (!apiBaseUrl) {
    throw new Error(
      'O servidor não está configurado. Copie .env.example para .env, ajuste EXPO_PUBLIC_API_URL e reinicie o Expo.',
    );
  }

  let response;
  try {
    response = await fetch(`${apiBaseUrl}/api/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(session),
    });
  } catch {
    throw new Error(
      `Não foi possível conectar ao backend em ${apiBaseUrl}. Confira se o Spring Boot está ativo e se o celular e o computador estão na mesma rede.`,
    );
  }

  if (!response.ok) {
    const details = await response.text();
    throw new Error(
      details || `O backend recusou a sessão (HTTP ${response.status}).`,
    );
  }

  return response.json();
}
