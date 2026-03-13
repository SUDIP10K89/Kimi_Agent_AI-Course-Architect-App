// Background Sync Service for Course Data
// Handles offline data synchronization when connection is restored

import { pushNotificationService } from './pushNotificationService'

export interface SyncQueueItem {
  id: string
  type: 'course_create' | 'course_update' | 'course_delete' | 'progress_update'
  payload: Record<string, unknown>
  timestamp: number
  retryCount: number
}

const SYNC_QUEUE_KEY = 'pwa_sync_queue'
const MAX_RETRY_COUNT = 3

class BackgroundSyncService {
  private syncQueue: SyncQueueItem[] = []

  // Initialize the background sync service
  async init(): Promise<void> {
    // Load any pending items from localStorage
    this.loadQueue()
    
    // Set up online/offline listeners
    window.addEventListener('online', this.handleOnline)
    window.addEventListener('offline', this.handleOffline)
    
    // Check if we need to sync immediately
    if (navigator.onLine) {
      await this.processQueue()
    }
  }

  // Add item to sync queue
  async addToQueue(item: Omit<SyncQueueItem, 'id' | 'timestamp' | 'retryCount'>): Promise<void> {
    const queueItem: SyncQueueItem = {
      ...item,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      retryCount: 0
    }

    this.syncQueue.push(queueItem)
    this.saveQueue()

    // Try to sync immediately if online
    if (navigator.onLine) {
      await this.processQueue()
    } else {
      // Register for background sync
      await this.registerSync()
    }
  }

  // Process the sync queue
  async processQueue(): Promise<void> {
    if (!navigator.onLine) {
      return
    }

    const pendingItems = [...this.syncQueue]
    
    for (const item of pendingItems) {
      try {
        await this.processItem(item)
        // Remove successful item from queue
        this.removeFromQueue(item.id)
        
        // Show notification for successful sync
        await pushNotificationService.showNotification({
          title: 'Sync Complete',
          body: 'Your data has been synchronized successfully.',
          tag: 'sync-success'
        })
      } catch (error) {
        console.error('Failed to process sync item:', error)
        
        // Increment retry count
        item.retryCount++
        
        if (item.retryCount >= MAX_RETRY_COUNT) {
          // Remove failed item after max retries
          this.removeFromQueue(item.id)
          
          await pushNotificationService.showNotification({
            title: 'Sync Failed',
            body: 'Some data could not be synchronized. Please try again.',
            tag: 'sync-failed'
          })
        } else {
          // Save updated retry count
          this.saveQueue()
        }
      }
    }
  }

  // Process individual sync item
  private async processItem(item: SyncQueueItem): Promise<void> {
    // In a real app, send to your API
    // This is a placeholder that simulates an API call
    
    switch (item.type) {
      case 'course_create':
        await this.syncCourseCreate(item.payload)
        break
      case 'course_update':
        await this.syncCourseUpdate(item.payload)
        break
      case 'course_delete':
        await this.syncCourseDelete(item.payload)
        break
      case 'progress_update':
        await this.syncProgressUpdate(item.payload)
        break
      default:
        console.warn('Unknown sync item type:', item.type)
    }
  }

  // Sync course creation
  private async syncCourseCreate(payload: Record<string, unknown>): Promise<void> {
    // Simulate API call
    console.log('Syncing course create:', payload)
    await this.simulateApiCall('/api/courses', 'POST', payload)
  }

  // Sync course update
  private async syncCourseUpdate(payload: Record<string, unknown>): Promise<void> {
    const courseId = payload.id
    console.log('Syncing course update:', courseId)
    await this.simulateApiCall(`/api/courses/${courseId}`, 'PUT', payload)
  }

  // Sync course deletion
  private async syncCourseDelete(payload: Record<string, unknown>): Promise<void> {
    const courseId = payload.id
    console.log('Syncing course delete:', courseId)
    await this.simulateApiCall(`/api/courses/${courseId}`, 'DELETE', null)
  }

  // Sync progress update
  private async syncProgressUpdate(payload: Record<string, unknown>): Promise<void> {
    const courseId = payload.courseId
    console.log('Syncing progress update:', courseId)
    await this.simulateApiCall(`/api/courses/${courseId}/progress`, 'PUT', payload)
  }

  // Simulate API call
  private async simulateApiCall(
    _endpoint: string, 
    _method: string, 
    _body: Record<string, unknown> | null
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      // Simulate network delay
      setTimeout(() => {
        // Simulate 90% success rate
        if (Math.random() > 0.1) {
          resolve()
        } else {
          reject(new Error('Simulated network error'))
        }
      }, 500 + Math.random() * 1000)
    })
  }

  // Register for background sync
  private async registerSync(): Promise<void> {
    await pushNotificationService.registerBackgroundSync('sync-course-data')
  }

  // Handle online event
  private handleOnline = async (): Promise<void> => {
    console.log('Connection restored, processing sync queue...')
    await this.processQueue()
  }

  // Handle offline event
  private handleOffline = (): void => {
    console.log('Connection lost, queuing data for later sync')
  }

  // Load queue from localStorage
  private loadQueue(): void {
    try {
      const stored = localStorage.getItem(SYNC_QUEUE_KEY)
      if (stored) {
        this.syncQueue = JSON.parse(stored)
      }
    } catch (error) {
      console.error('Failed to load sync queue:', error)
      this.syncQueue = []
    }
  }

  // Save queue to localStorage
  private saveQueue(): void {
    try {
      localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(this.syncQueue))
    } catch (error) {
      console.error('Failed to save sync queue:', error)
    }
  }

  // Remove item from queue
  private removeFromQueue(id: string): void {
    this.syncQueue = this.syncQueue.filter(item => item.id !== id)
    this.saveQueue()
  }

  // Get queue status
  getQueueStatus(): { pendingCount: number; isOnline: boolean } {
    return {
      pendingCount: this.syncQueue.length,
      isOnline: navigator.onLine
    }
  }

  // Clear all queued items
  clearQueue(): void {
    this.syncQueue = []
    this.saveQueue()
  }

  // Cleanup event listeners
  destroy(): void {
    window.removeEventListener('online', this.handleOnline)
    window.removeEventListener('offline', this.handleOffline)
  }
}

// Export singleton instance
export const backgroundSyncService = new BackgroundSyncService()

export default backgroundSyncService
