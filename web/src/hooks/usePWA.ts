// Custom hook for PWA functionality
import { useState, useEffect, useCallback } from 'react'
import { pushNotificationService } from '@/services/pushNotificationService'
import { backgroundSyncService } from '@/services/backgroundSyncService'

export interface PWAState {
  isOnline: boolean
  isStandalone: boolean
  pushSupported: boolean
  pushSubscribed: boolean
  notificationPermission: NotificationPermission
  pendingSyncCount: number
}

export function usePWA() {
  const [state, setState] = useState<PWAState>({
    isOnline: navigator.onLine,
    isStandalone: false,
    pushSupported: false,
    pushSubscribed: false,
    notificationPermission: 'default',
    pendingSyncCount: 0
  })

  // Check if app is running in standalone mode
  useEffect(() => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
      (window.navigator as unknown as { standalone?: boolean }).standalone === true
    
    setState(prev => ({ ...prev, isStandalone }))
  }, [])

  // Initialize PWA services
  useEffect(() => {
    const initPWA = async () => {
      // Initialize push notification service
      const pushSupported = await pushNotificationService.init()
      
      // Get subscription status
      const { isSubscribed, permission } = await pushNotificationService.getSubscriptionStatus()
      
      // Initialize background sync service
      await backgroundSyncService.init()
      
      // Get sync queue status
      const { pendingCount } = backgroundSyncService.getQueueStatus()
      
      setState(prev => ({
        ...prev,
        isOnline: navigator.onLine,
        pushSupported,
        pushSubscribed: isSubscribed,
        notificationPermission: permission,
        pendingSyncCount: pendingCount
      }))
    }

    initPWA()

    // Set up online/offline listeners
    const handleOnline = () => {
      setState(prev => ({ ...prev, isOnline: true }))
    }
    
    const handleOffline = () => {
      setState(prev => ({ ...prev, isOnline: false }))
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Subscribe to push notifications
  const subscribeToPush = useCallback(async (): Promise<boolean> => {
    const subscription = await pushNotificationService.subscribe()
    const isSubscribed = !!subscription
    setState(prev => ({ ...prev, pushSubscribed: isSubscribed }))
    return isSubscribed
  }, [])

  // Unsubscribe from push notifications
  const unsubscribeFromPush = useCallback(async (): Promise<boolean> => {
    const success = await pushNotificationService.unsubscribe()
    if (success) {
      setState(prev => ({ ...prev, pushSubscribed: false }))
    }
    return success
  }, [])

  // Show a notification
  const showNotification = useCallback(async (
    title: string, 
    body: string, 
    options?: Record<string, unknown>
  ): Promise<boolean> => {
    return pushNotificationService.showNotification({ title, body, ...options })
  }, [])

  // Queue data for background sync
  const queueForSync = useCallback(async (
    type: 'course_create' | 'course_update' | 'course_delete' | 'progress_update',
    payload: Record<string, unknown>
  ): Promise<void> => {
    await backgroundSyncService.addToQueue({ type, payload })
    const { pendingCount } = backgroundSyncService.getQueueStatus()
    setState(prev => ({ ...prev, pendingSyncCount: pendingCount }))
  }, [])

  // Refresh sync status
  const refreshSyncStatus = useCallback(() => {
    const { pendingCount, isOnline } = backgroundSyncService.getQueueStatus()
    setState(prev => ({ 
      ...prev, 
      pendingSyncCount: pendingCount,
      isOnline 
    }))
  }, [])

  return {
    ...state,
    subscribeToPush,
    unsubscribeFromPush,
    showNotification,
    queueForSync,
    refreshSyncStatus
  }
}

export default usePWA
