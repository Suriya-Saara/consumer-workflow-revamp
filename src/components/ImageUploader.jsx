'use client'

import { useEffect, useState } from 'react'
import { api, getEndpoints } from '@/lib/api'

const MAX_SLOTS = 10
const ACCEPT = '.png,.jpg,.jpeg,.gif,.mp4,.mov,.webm,video/mp4,video/quicktime,video/webm'
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'video/quicktime', 'video/webm']
const ALLOWED_EXT = ['.jpg', '.jpeg', '.png', '.gif', '.mp4', '.mov', '.webm']

const mediaKind = (file) => {
    const name = (file?.name || '').toLowerCase()
    if ((file?.type || '').startsWith('video/') || ['.mp4', '.mov', '.webm'].some((e) => name.endsWith(e))) return 'video'
    return 'image'
}

const readAsDataURL = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
})

export default function ImageUploader({ requirements = [], minRequired = 0, images = [], onChange, storeConfigData, reasonId, productName }) {
    const [slots, setSlots] = useState([])
    const [uploading, setUploading] = useState({ status: false, index: -1 })
    const [error, setError] = useState('')

    const { uploadImageEndpoint } = getEndpoints(storeConfigData?.platform)

    useEffect(() => {
        const initial = []
        const count = Math.max(requirements.length, minRequired)
        for (let i = 0; i < count; i++) {
            initial.push({
                src: images[i] || null,
                mediaType: images[i] ? 'image' : null,
                caption: requirements[i]?.caption || `Image ${i + 1}`,
                description: requirements[i]?.description || '',
                isRequired: requirements[i]?.is_required ?? i < minRequired,
            })
        }
        setSlots(initial)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [requirements, minRequired])

    if (slots.length === 0 && requirements.length === 0 && minRequired === 0) return null

    const commitImages = (nextSlots) => {
        onChange(nextSlots.map((s) => s.src || ''))
    }

    const uploadFiles = async (allSlots, targetIndex) => {
        setUploading({ status: true, index: targetIndex })
        try {
            const files = allSlots.filter((s) => s.src).map((s) => s.src)
            const response = await api.post(`/${uploadImageEndpoint}/`, {
                files,
                store_id: storeConfigData?.store_unique_id,
                reason_id: reasonId,
                product_name: productName,
            })
            const uploaded = Array.isArray(response.data) ? response.data : response.data?.urls
            if (!uploaded) throw new Error(response.data?.message || 'Upload failed. Please try again.')
            setError('')
        } catch (err) {
            setError(err.response?.data?.message || err.message || 'Upload failed. Please try again.')
            setSlots((prev) => {
                const reverted = [...prev]
                reverted[targetIndex] = { ...reverted[targetIndex], src: images[targetIndex] || null, mediaType: images[targetIndex] ? 'image' : null }
                commitImages(reverted)
                return reverted
            })
        } finally {
            setUploading({ status: false, index: -1 })
        }
    }

    const onFileChange = async (e, index) => {
        const file = e.target.files?.[0]
        e.target.value = null
        if (!file) return

        const typeOk = ALLOWED_TYPES.includes(file.type)
        const extOk = ALLOWED_EXT.some((ext) => file.name.toLowerCase().endsWith(ext))
        if (!typeOk && !extOk) {
            setError('Invalid file type. Please upload PNG, JPG, GIF, MP4, MOV or WEBM.')
            return
        }

        try {
            const dataUrl = await readAsDataURL(file)
            const nextSlots = [...slots]
            while (nextSlots.length <= index) nextSlots.push({ src: null, mediaType: null, caption: `Image ${nextSlots.length + 1}`, isRequired: false })
            nextSlots[index] = { ...nextSlots[index], src: dataUrl, mediaType: mediaKind(file) }
            setSlots(nextSlots)
            commitImages(nextSlots)
            await uploadFiles(nextSlots, index)
        } catch {
            setError('Could not read that file. Please try again.')
        }
    }

    const onDelete = (index) => {
        setSlots((prev) => {
            let next
            if (index < minRequired) {
                next = prev.map((s, i) => (i === index ? { ...s, src: null, mediaType: null } : s))
            } else {
                next = prev.filter((_, i) => i !== index)
                while (next.length > minRequired && !next[next.length - 1]?.src) next.pop()
            }
            commitImages(next)
            return next
        })
    }

    return (
        <div className="flex w-full flex-col gap-2">
            <div className="text-[#0f172a] font-['Inter'] text-xs font-semibold">Upload photos</div>
            <div className="flex flex-wrap gap-2.5">
                {slots.map((slot, index) => {
                    const isLoading = uploading.status && uploading.index === index
                    const missingRequired = slot.isRequired && !slot.src
                    return (
                        <div key={index} className="relative size-20 shrink-0">
                            {slot.src ? (
                                <div className="relative size-20 rounded-xl overflow-hidden border border-[#e3e5f0] group">
                                    {slot.mediaType === 'video' ? (
                                        <video src={slot.src} className="size-20 object-cover" muted playsInline />
                                    ) : (
                                        <img src={slot.src} alt={slot.description || slot.caption} className="size-20 object-cover" />
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => onDelete(index)}
                                        aria-label="Remove image"
                                        className="absolute top-1 right-1 size-5 flex justify-center items-center bg-[#0f172a]/70 rounded-full text-white"
                                    >
                                        <svg className="size-3" stroke="currentColor" fill="none" strokeWidth="2.5" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                    </button>
                                    {isLoading && (
                                        <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                                            <div className="size-4 border-2 border-[#4338CA] border-t-transparent rounded-full animate-spin"></div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <label
                                    htmlFor={`upload-slot-${index}`}
                                    className={`flex size-20 flex-col justify-center items-center gap-0.5 rounded-xl border border-dashed cursor-pointer ${missingRequired ? 'border-[#f87171] bg-[#fef2f2]' : 'border-[#c7cadf] bg-[#f5f6fa]'}`}
                                >
                                    <svg className="size-4 text-[#55655c]" stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>
                                    <div className="text-[#55655c] font-['Inter'] text-[10px] font-medium text-center px-1 leading-tight">{slot.caption}</div>
                                    {slot.isRequired && <div className="text-[#dc2626] font-['Inter'] text-[9px] font-semibold">Required</div>}
                                </label>
                            )}
                            <input
                                id={`upload-slot-${index}`}
                                type="file"
                                accept={ACCEPT}
                                className="hidden"
                                disabled={Boolean(slot.src) || uploading.status}
                                onChange={(e) => onFileChange(e, index)}
                            />
                        </div>
                    )
                })}
                {slots.length < MAX_SLOTS && (
                    <div className="size-20 shrink-0">
                        <label htmlFor={`upload-slot-${slots.length}`} className="flex size-20 flex-col justify-center items-center gap-0.5 rounded-xl border border-dashed border-[#c7cadf] bg-[#f5f6fa] cursor-pointer">
                            <svg className="size-4 text-[#55655c]" stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                            <div className="text-[#55655c] font-['Inter'] text-[10px] font-medium">Add</div>
                        </label>
                        <input id={`upload-slot-${slots.length}`} type="file" accept={ACCEPT} className="hidden" disabled={uploading.status} onChange={(e) => onFileChange(e, slots.length)} />
                    </div>
                )}
            </div>
            {error && (
                <div className="bg-[#fef2f2] border border-[#fecaca] rounded-[10px] px-3.5 py-2 text-[#b91c1c] font-['Inter'] text-xs">{error}</div>
            )}
        </div>
    )
}
