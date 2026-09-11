export function extractTelegramCommand(text?: string): string | null {
  const firstToken = text?.trim().split(/\s+/)[0]

  if (!firstToken?.startsWith('/')) return null

  return firstToken.split('@')[0].toLowerCase()
}
