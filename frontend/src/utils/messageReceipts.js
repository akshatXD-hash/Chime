const idOf = (value) => String(value?._id || value?.id || value || '');

export function mergeMessage(previous, incoming) {
  const result = { ...previous, ...incoming };
  for (const field of ['readBy', 'deliveredTo']) {
    result[field] = [...new Set([...(previous?.[field] || []).map(idOf), ...(incoming?.[field] || []).map(idOf)])];
  }
  return result;
}

export function applyReceipt(message, receipt) {
  if (!receipt.messageIds.includes(idOf(message._id))) return message;
  return mergeMessage(message, receipt.kind === 'delivered'
    ? { deliveredTo: [receipt.userId] } : { readBy: [receipt.userId], deliveredTo: [receipt.userId] });
}

export function isMessageRead(message, users) {
  const recipients = (users || []).map(idOf).filter((id) => id && id !== idOf(message.sender));
  const readers = new Set((message.readBy || []).map(idOf));
  return recipients.length > 0 && recipients.every((id) => readers.has(id));
}

export function isMessageDelivered(message, users) {
  const recipients = (users || []).map(idOf).filter((id) => id && id !== idOf(message.sender));
  const delivered = new Set([...(message.deliveredTo || []), ...(message.readBy || [])].map(idOf));
  return recipients.length > 0 && recipients.every((id) => delivered.has(id));
}

export function upsertMessage(messages, incoming) {
  const previous = messages.find((message) => message._id === incoming._id ||
    (incoming.clientMessageId && message.clientMessageId === incoming.clientMessageId));
  const merged = mergeMessage(previous, incoming);
  merged.isOptimistic = Boolean(incoming.isOptimistic);
  return [...messages.filter((message) => message._id !== incoming._id &&
    (!incoming.clientMessageId || message.clientMessageId !== incoming.clientMessageId)), merged]
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
}
