import { useState, useEffect } from 'react'
import { WifiOff, RefreshCw, Home, BookOpen, ArrowRight } from 'lucide-react'

interface OfflinePageProps {
  onRetry?: () => void
  onAccessAnyway?: () => void
}

export function OfflinePage({ onRetry, onAccessAnyway }: OfflinePageProps) {
  const [isRetrying, setIsRetrying] = useState(false)
  const [countdown, setCountdown] = useState(0)

  useEffect(() => {
    // Check connection status periodically
    const interval = setInterval(() => {
      if (navigator.onLine) {
        window.location.reload()
      }
    }, 3000)

    return () => clearInterval(interval)
  }, [])

  const handleRetry = async () => {
    setIsRetrying(true)
    setCountdown(3)
    
    const countdownInterval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownInterval)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    setTimeout(() => {
      setIsRetrying(false)
      if (onRetry) {
        onRetry()
      } else {
        window.location.reload()
      }
    }, 3000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-slate-100 dark:bg-slate-800 mb-6">
            <WifiOff className="w-12 h-12 text-slate-400" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            You're Offline
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            It looks like you've lost your internet connection. 
            Some features may not be available until you're back online.
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
            What's Available Offline
          </h2>
          <div className="space-y-3 text-left">
            <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
              <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <BookOpen className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <span>Previously viewed course content</span>
            </div>
            <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
              <div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <Home className="w-4 h-4 text-green-600 dark:text-green-400" />
              </div>
              <span>App interface and navigation</span>
            </div>
          </div>
        </div>

        <button
          onClick={onAccessAnyway}
          className="w-full flex items-center justify-center gap-2 py-3 px-6 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-medium rounded-xl transition-colors mb-3"
        >
          <ArrowRight className="w-5 h-5" />
          Access App Anyway
        </button>

        <button
          onClick={handleRetry}
          disabled={isRetrying}
          className="w-full flex items-center justify-center gap-2 py-3 px-6 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-xl transition-colors"
        >
          {isRetrying ? (
            <>
              <RefreshCw className="w-5 h-5 animate-spin" />
              Retrying in {countdown}s...
            </>
          ) : (
            <>
              <RefreshCw className="w-5 h-5" />
              Try Again
            </>
          )}
        </button>

        <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
          Your progress will sync automatically when you're back online
        </p>
      </div>
    </div>
  )
}

export default OfflinePage
