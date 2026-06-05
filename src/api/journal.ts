import { get, post, del } from './base'
import type { Journal, JournalListRequest, JournalListResponse, PublishJournalRequest } from '@/types'

export async function getJournalList(params: JournalListRequest): Promise<JournalListResponse> {
  return get<JournalListResponse>('/journal/list', params)
}

export async function getJournalDetail(id: number): Promise<Journal> {
  return get<Journal>(`/journal/${id}`)
}

export async function publishJournal(data: PublishJournalRequest): Promise<Journal> {
  return post<Journal>('/journal', data)
}

export async function deleteJournal(id: number): Promise<void> {
  return del<void>(`/journal/${id}`)
}

export async function collectJournal(journalId: number): Promise<void> {
  return post<void>('/collection', { journalId })
}

export async function cancelCollect(journalId: number): Promise<void> {
  return del<void>(`/collection/${journalId}`)
}

export async function getCollections(page: number = 1, pageSize: number = 10): Promise<JournalListResponse> {
  return get<JournalListResponse>('/collection/list', { page, pageSize })
}
