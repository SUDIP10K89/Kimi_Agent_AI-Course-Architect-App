// Push Notification Service for PWA
// Handles push subscriptions, notifications, and background sync

const VAPID_PUBLIC_KEY = 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U'

export interface PushNotificationPayload {
  title: string
  body: string
  icon?: string
  badge?: string
  tag?: string
  data?: Record<string, unknown>
  actions?: Array<{
    action: string
    title: string
    icon?: string
  }>
}

class PushNotificationService {
  private registration: ServiceWorkerRegistration | null = null
  private subscription: PushSubscription | null = null

  // Initialize the push notification service
  async init(): Promise<boolean> {
    if (!('serviceWorker' in navigator)) {
      console.warn('Service workers are not supported in this browser')
      return false
    }

    if (!('PushManager' in window)) {
      console.warn('Push notifications are not supported in this browser')
      return false
    }

    try {
      this.registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      })
      console.log('Service Worker registered successfully')
      
      // Check for existing subscription
      this.subscription = await this.registration.pushManager.getSubscription()
      
      return true
    } catch (error) {
      console.error('Service Worker registration failed:', error)
      return false
    }
  }

  // Request notification permission
  async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      console.warn('Notifications are not supported in this browser')
      return 'denied'
    }

    if (Notification.permission === 'granted') {
      return 'granted'
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission()
      return permission
    }

    return Notification.permission
  }

  // Subscribe to push notifications
  async subscribe(): Promise<PushSubscription | null> {
    try {
      const permission = await this.requestPermission()
      if (permission !== 'granted') {
        console.warn('Notification permission not granted')
        return null
      }

      if (!this.registration) {
        await this.init()
      }

      if (!this.registration) {
        console.error('Service Worker not registered')
        return null
      }

      // Check if already subscribed
      const existingSubscription = await this.registration.pushManager.getSubscription()
      if (existingSubscription) {
        this.subscription = existingSubscription
        return existingSubscription
      }

      // Subscribe to push notifications
      this.subscription = await this.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as unknown as ArrayBuffer
      })

      // In a real app, send subscription to your server
      await this.sendSubscriptionToServer(this.subscription)

      return this.subscription
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error)
      return null
    }
  }

  // Unsubscribe from push notifications
  async unsubscribe(): Promise<boolean> {
    try {
      if (this.subscription) {
        await this.subscription.unsubscribe()
        this.subscription = null
        return true
      }
      return false
    } catch (error) {
      console.error('Failed to unsubscribe from push notifications:', error)
      return false
    }
  }

  // Show a local notification
  async showNotification(options: PushNotificationPayload): Promise<boolean> {
    if (!this.registration) {
      await this.init()
    }

    if (!this.registration) {
      return false
    }

    const permission = await this.requestPermission()
    if (permission !== 'granted') {
      return false
    }

    try {
      const notificationOptions: NotificationOptions = {
        body: options.body,
        icon: options.icon || '/pwa-192x192.png',
        badge: options.badge || '/badge-72x72.png',
        tag: options.tag || 'default',
        data: options.data,
        requireInteraction: false
      }
      await this.registration.showNotification(options.title, notificationOptions)
      return true
    } catch (error) {
      console.error('Failed to show notification:', error)
      return false
    }
  }

  // Check if background sync is supported
  isBackgroundSyncSupported(): boolean {
    return 'sync' in (ServiceWorkerRegistration.prototype as unknown as Record<string, unknown>)
  }

  // Register for background sync
  async registerBackgroundSync(tag: string): Promise<boolean> {
    if (!this.registration) {
      await this.init()
    }

    if (!this.registration) {
      return false
    }

    if (!this.isBackgroundSyncSupported()) {
      console.warn('Background sync is not supported in this browser')
      return false
    }

    try {
      await (this.registration as unknown as { sync: { register: (tag: string) => Promise<void> } }).sync.register(tag)
      return true
    } catch (error) {
      console.error('Background sync registration failed:', error)
      return false
    }
  }

  // Check if push notifications are supported
  isSupported(): boolean {
    return 'serviceWorker' in navigator && 'PushManager' in window
  }

  // Get current subscription status
  async getSubscriptionStatus(): Promise<{
    isSupported: boolean
    isSubscribed: boolean
    permission: NotificationPermission
  }> {
    const isSupported = this.isSupported()
    let isSubscribed = false
    let permission: NotificationPermission = 'default'

    if (isSupported) {
      permission = Notification.permission
      if (this.registration) {
        const subscription = await this.registration.pushManager.getSubscription()
        isSubscribed = !!subscription
      }
    }

    return { isSupported, isSubscribed, permission }
  }

  // Send subscription to server (implement your own endpoint)
  private async sendSubscriptionToServer(subscription: PushSubscription): Promise<void> {
    // In a real application, send this to your backend
    console.log('Push subscription:', JSON.stringify(subscription))
    
    try {
      // Example: await fetch('/api/push/subscribe', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(subscription)
      // })
    } catch (error) {
      console.error('Failed to send subscription to server:', error)
    }
  }

  // Utility: Convert VAPID key to Uint8Array
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/')

    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i)
    }
    return outputArray
  }
}

// Export singleton instance
export const pushNotificationService = new PushNotificationService()

export default pushNotificationService
