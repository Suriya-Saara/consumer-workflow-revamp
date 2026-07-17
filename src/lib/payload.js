// Builds the return_data / exchange_data payload expected by the ecoreturns
// calculate + submit endpoints. Simplified from the main consumer-workflow-v2
// repo's reviewRequest/apiHooks (no per-item bonus-splitting maths) since this
// design repo only needs to be "a little functional" for demo purposes.
export const buildRequestPayload = ({
    selectedItemsList,
    orderDetails,
    storeConfigData,
    customerInfo,
    accessCode,
    paymentMethod,
    refundPaymentAccountInfo,
    forSubmit = false,
}) => {
    const orderCountry = orderDetails?.order_data?.[0]?.country_code

    const optedForIncentiveToKeepItem = [
        'keep_item_with_store_credit_incentive',
        'keep_item_with_original_payment_incentive',
    ].includes(paymentMethod)

    let refundTo = paymentMethod
    if (paymentMethod === 'keep_item_with_store_credit_incentive' || paymentMethod === 'store_credit_additional_bonus') {
        refundTo = 'store_credit'
    } else if (paymentMethod === 'keep_item_with_original_payment_incentive' || paymentMethod === 'original_payment_additional_bonus') {
        refundTo = 'original_payment_method'
    }

    const incentiveType = optedForIncentiveToKeepItem
        ? 'keep_item'
        : (paymentMethod === 'store_credit_additional_bonus' || paymentMethod === 'original_payment_additional_bonus' ? 'return' : null)

    const returnItems = selectedItemsList.filter((item) => item.exchangeOrReturn === 'Return' || item.exchangeOrReturn === 'Return To Store')
    const exchangeItems = selectedItemsList.filter((item) => item.exchangeOrReturn === 'Exchange' || item.exchangeOrReturn === 'ExchangeCatalog')

    const returnData = returnItems.map((item) => ({
        test_mode: orderDetails.test_mode,
        store_name: storeConfigData.store_unique_id,
        email: customerInfo?.customer_email,
        order_number: orderDetails.order_number,
        order_id: orderDetails.recent_order_id,
        customer_id: orderDetails.customer_id,
        variant_id: item.variantId,
        product_id: item.productId,
        refund_to: refundTo,
        is_refund: !optedForIncentiveToKeepItem,
        image_list: (item.images || []).join(';'),
        reason_id: item.reasonId,
        sub_reason_detail: item.subReason || '',
        other_reason_desc: item.reasonNote || '',
        line_item_id: item.lineItemId,
        quantity: parseInt(item.qty, 10),
        access_code: accessCode,
        incentive: item.incentive,
        customer_data: customerInfo,
        currency: orderDetails.currency,
        ...(forSubmit ? { razorpay_payment_id: '' } : {}),
        account_number: refundPaymentAccountInfo?.accountNumber,
        beneficiary_name: refundPaymentAccountInfo?.beneficiaryName,
        ifsc: refundPaymentAccountInfo?.ifsc,
        customer_upi_id: refundPaymentAccountInfo?.upiId,
        opted_for_incentive_to_keep_item: optedForIncentiveToKeepItem,
        incentive_type: incentiveType,
        order_country: orderCountry,
        return_to_store: item.exchangeOrReturn,
    }))

    const exchangeData = exchangeItems.map((item) => ({
        customer_id: orderDetails.customer_id,
        shop: storeConfigData.store_unique_id,
        store: storeConfigData.store_unique_id,
        incentive: item.incentive,
        variant_id: item.variantId,
        product_id: item.productId,
        selected_variant_for_exchange: item.newVariantId,
        selected_product_for_exchange: item.newProductId,
        image_list: (item.images || []).join(';'),
        primary_reason: item.reasonId,
        reason_id: item.reasonId,
        sub_reason_detail: item.subReason || '',
        other_reason_desc: item.reasonNote || '',
        customer_email: customerInfo?.customer_email,
        email: customerInfo?.customer_email,
        test_mode: orderDetails.test_mode,
        order_id: orderDetails.recent_order_id,
        order_number: orderDetails.order_number,
        line_item_id: item.lineItemId,
        quantity: parseInt(item.qty, 10),
        access_code: accessCode,
        customer_data: customerInfo,
        currency: orderDetails.currency,
        order_country: orderCountry,
        refund_to: refundTo,
        account_number: refundPaymentAccountInfo?.accountNumber,
        beneficiary_name: refundPaymentAccountInfo?.beneficiaryName,
        ifsc: refundPaymentAccountInfo?.ifsc,
        customer_upi_id: refundPaymentAccountInfo?.upiId,
        opted_for_incentive_to_keep_item: optedForIncentiveToKeepItem,
        incentive_type: 'exchange',
    }))

    return {
        return_data: returnData,
        exchange_data: exchangeData,
        store_name: storeConfigData.store_unique_id,
        order_id: orderDetails.recent_order_id,
    }
}
