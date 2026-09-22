'use client'

import { useEffect, useState } from 'react'
import { installPublicConfig } from './runtimeConfig'

// Gate hydration as well as wallet initialization: no request may use build-time
// fallback addresses before the deployment's runtime configuration is installed.
export default function RuntimeConfigGate({ config, children }: {
  config: Record<string, string> | null
  children: React.ReactNode
}) {
  const [ready, setReady] = useState(false)
  useEffect(() => {
    installPublicConfig(config)
    setReady(true)
  }, [config])
  return ready ? <>{children}</> : <p role="status">Loading network configuration…</p>
}
