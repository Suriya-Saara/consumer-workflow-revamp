'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

// selectItems is now a single responsive page (mobile + desktop).
// This route is kept only so old links don't 404.
export default function SelectItemsDesktopRedirect() {
    const router = useRouter()
    useEffect(() => {
        router.replace('/selectItems')
    }, [router])
    return null
}
