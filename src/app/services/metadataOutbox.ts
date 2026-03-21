const METADATA_OUTBOX_STORAGE_KEY = 'proposal-metadata-outbox'

export type PendingMetadataSubmissionKind =
  | 'proposal_extra_and_params'
  | 'proposal_params_only'
  | 'project_extra'
  | 'investment_extra'
  | 'token_release'

export interface PendingMetadataSubmission {
  key: string
  kind: PendingMetadataSubmissionKind
  txHash: string
  createdAt: number
  title?: string
  extra?: string
  params?: any[]
  pname?: string
  version?: string
  issueLink?: string
  addresses?: string[]
  amounts?: string[]
}

function canUseStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

function readOutbox(): PendingMetadataSubmission[] {
  if (!canUseStorage()) {
    return []
  }

  try {
    const raw = window.localStorage.getItem(METADATA_OUTBOX_STORAGE_KEY)
    if (!raw) {
      return []
    }

    const data = JSON.parse(raw)
    return Array.isArray(data) ? data : []
  } catch (error) {
    console.warn('failed to read metadata outbox', error)
    return []
  }
}

function writeOutbox(items: PendingMetadataSubmission[]) {
  if (!canUseStorage()) {
    return
  }

  window.localStorage.setItem(
    METADATA_OUTBOX_STORAGE_KEY,
    JSON.stringify(items),
  )
}

export function buildPendingMetadataKey(
  kind: PendingMetadataSubmissionKind,
  txHash: string,
) {
  return `${kind}:${txHash.toLowerCase()}`
}

export function upsertPendingMetadataSubmission(
  item: PendingMetadataSubmission,
) {
  const items = readOutbox()
  const nextItems = items.filter((current) => current.key !== item.key)
  nextItems.push(item)
  writeOutbox(nextItems)
}

export function removePendingMetadataSubmission(key: string) {
  const items = readOutbox()
  writeOutbox(items.filter((item) => item.key !== key))
}

export function getPendingMetadataSubmissions(txHash: string) {
  const normalizedTxHash = txHash.toLowerCase()
  return readOutbox()
    .filter((item) => item.txHash.toLowerCase() === normalizedTxHash)
    .sort((left, right) => left.createdAt - right.createdAt)
}

export function hasPendingMetadataSubmissions(txHash: string) {
  return getPendingMetadataSubmissions(txHash).length > 0
}
