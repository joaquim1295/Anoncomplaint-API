/** Nomes de canal alinhados com o servidor Pusher (canais `private-*` autenticados). */
export function privateUserChannel(userId: string): string {
  return `private-user-${userId}`;
}

export function privateInboxChannel(conversationId: string): string {
  return `private-inbox-${conversationId}`;
}
