export function getStatusLabel(
  status: string,
  t: (key: string) => string
): string {
  switch (status) {
    case 'sent': return t('status.sent');
    case 'completed': return t('status.completed');
    case 'in_progress': return t('status.inProgress');
    case 'draft': return t('status.draft');
    default: return status;
  }
}
