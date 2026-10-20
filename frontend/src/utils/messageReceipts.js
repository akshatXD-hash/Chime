const idOf = (value) => String(value?._id || value?.id || value || '');

export function mergeMessage(previous, incoming) {
  return { ...previous, ...incoming, readBy: [...new Set([
    ...(previous?.readBy || []).map(idOf), ...(incoming?.readBy || []).map(idOf),
  ])] };
}

export function applyReceipt(message, receipt) {
  if (!receipt.messageIds.includes(idOf(message._id))) return message;
  return mergeMessage(message, { readBy: [receipt.userId] });
}

export function isMessageRead(message, users) {
  const recipients = (users || []).map(idOf).filter((id) => id && id !== idOf(message.sender));
  const readers = new Set((message.readBy || []).map(idOf));
  return recipients.length > 0 && recipients.every((id) => readers.has(id));
}
