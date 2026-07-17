'use client'

import { createContext, useContext, useState } from 'react'

const AppDataContext = createContext(null)

export function AppDataProvider({ children }) {
    const [storeConfigData, setStoreConfigData] = useState(null)
    const [orderDetails, setOrderDetails] = useState(null)
    const [customerInfo, setCustomerInfo] = useState(null)
    const [accessCode, setAccessCode] = useState(null)
    const [selectedItemsList, setSelectedItemsList] = useState([])
    const [refundPaymentAccountInfo, setRefundPaymentAccountInfo] = useState(null)
    const [paymentInfo, setPaymentInfo] = useState(null)
    const [requestSubmissionResponse, setRequestSubmissionResponse] = useState(null)

    const value = {
        storeConfigData, setStoreConfigData,
        orderDetails, setOrderDetails,
        customerInfo, setCustomerInfo,
        accessCode, setAccessCode,
        selectedItemsList, setSelectedItemsList,
        refundPaymentAccountInfo, setRefundPaymentAccountInfo,
        paymentInfo, setPaymentInfo,
        requestSubmissionResponse, setRequestSubmissionResponse,
    }

    return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>
}

export function useAppData() {
    const ctx = useContext(AppDataContext)
    if (!ctx) throw new Error('useAppData must be used within AppDataProvider')
    return ctx
}
