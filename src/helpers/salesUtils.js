// Shared sales normalization utilities
// Rule set:
// - Seller scoping: include line items that match the seller (covers multi‑seller orders)
// - Status whitelist: only include orders/items with status in STATUS_WHITELIST
// - Price source precedence: itemPrice → totalPrice → unitPrice*quantity → amount
// - Time: prefer `timestamp` over `createdAt` (fall back to `date`), robust parsing

// Added 'order received' to include orders that have been acknowledged but not yet marked completed/delivered.
export const STATUS_WHITELIST = ['paid', 'completed', 'delivered', 'order received']

export const toJSDate = (value) => {
  try {
    if (!value) return new Date()
    if (typeof value?.toDate === 'function') return value.toDate()
    if (typeof value === 'number') return new Date(value)
    if (typeof value === 'string') return new Date(value)
    if (typeof value === 'object' && typeof value.seconds === 'number') return new Date(value.seconds * 1000)
  } catch (_) {}
  return new Date()
}

// Prefer timestamp > createdAt > date
export const pickDate = (data) => {
  return toJSDate(data?.timestamp ?? data?.createdAt ?? data?.date ?? null)
}

export const getPriceFromEntry = (entry) => {
  // Accept either an order object or an item object
  const unit = Number(entry.unitPrice)
  const qty = Number(entry.quantity ?? 1)
  return (
    Number(entry.itemPrice) ||
    Number(entry.totalPrice) ||
    (isFinite(unit) && isFinite(qty) ? unit * qty : 0) ||
    Number(entry.amount) ||
    0
  )
}

const lower = (v) => (v == null ? '' : String(v)).trim().toLowerCase()

// Normalize various status spellings/typos to canonical forms in STATUS_WHITELIST
export const normalizeStatus = (raw) => {
  const s0 = lower(raw)
  if (!s0) return ''
  // collapse underscores/dashes, multiple spaces
  const s = s0.replace(/[_-]/g, ' ').replace(/\s+/g, ' ').trim()

  const map = {
    'delivered': 'delivered',
    'deliver': 'delivered',
    'delivery': 'delivered',
    'completed': 'completed',
    'complete': 'completed',
    'paid': 'paid',
    'payment received': 'paid',
    'paid order': 'paid',
    'order received': 'order received',
    'order recieved': 'order received',
    'received': 'order received',
    'recieved': 'order received'
  }

  if (map[s]) return map[s]

  // fuzzy contains matching as a fallback
  if (s.includes('deliver')) return 'delivered'
  if (s.includes('complet')) return 'completed'
  if (s.includes('paid') || s.includes('pay')) return 'paid'
  if (s.includes('receiv') || s.includes('reciev')) return 'order received'

  return s
}

const isStatusAllowed = (status, whitelist) => {
  if (!status) return false
  const canon = normalizeStatus(status)
  return whitelist.includes(canon)
}

// Normalize orders/items to seller-scoped sale entries under a consistent rule set
// docs: Firestore QuerySnapshot.docs array or array of plain order objects
// sellerId: string
// options.statusWhitelist: array of lowercase status strings
export const normalizeOrdersForSeller = (docs, sellerId, options = {}) => {
  const { statusWhitelist = STATUS_WHITELIST } = options
  const entries = []

  const randId = () => Math.random().toString(36).slice(2, 10)

  docs.forEach((d) => {
    const data = d?.data ? d.data() : d || {}
    const orderId = d?.id || data.id || randId()
    const orderDate = pickDate(data)

  const orderStatus = normalizeStatus(data.status || data.orderStatus)
    const orderAllowed = isStatusAllowed(orderStatus, statusWhitelist)

    // If the whole order belongs to the seller (top-level seller field)
    const topSeller = data.sellerId || data.sellerID || data.sellerUid || data.sellerUID
    if (topSeller === sellerId) {
      if (orderAllowed) {
        const price = getPriceFromEntry(data)
        entries.push({
          id: orderId,
          itemPrice: price,
          price, // alias for convenience
          productId: data.productId || data.productID || data.product_id || data.pid || data.itemId || '',
          productName: data.productName || data.name || data.title || (data.product && (data.product.name || data.product.title)) || '',
          unit: data.unit || data.unitType || data.unit_name || '',
          quantity: Number(data.quantity ?? 1) || 1,
          productImage: data.productImage || data.image || (Array.isArray(data.images) && data.images[0]) || '',
          images: Array.isArray(data.images) ? data.images : [],
          profit: typeof data.profit === 'number' ? data.profit : undefined,
          status: orderStatus || '',
          category: data.category || data.categoryName || '',
          normalizedDate: orderDate,
          saleDate: orderDate,
          timestamp: data.timestamp,
          createdAt: data.createdAt
        })
      }
      // When order-level status is not allowed, skip entirely (per rule set)
      return
    }

    // Otherwise, inspect line items
    const items = data.items || data.orderItems || data.cartItems || []
    items.forEach((it, idx) => {
      const itSeller = it?.sellerId || it?.sellerID || it?.sellerUid || it?.sellerUID
      if (itSeller !== sellerId) return

  const itemStatus = normalizeStatus(it?.status || it?.orderStatus || it?.itemStatus)
      // Include item if order is allowed OR the item itself is allowed; otherwise skip
      if (!orderAllowed && !isStatusAllowed(itemStatus, statusWhitelist)) return

      const price = getPriceFromEntry(it)
      entries.push({
        id: `${orderId}_${idx}`,
        itemPrice: price,
        price, // alias
        productId: it?.productId || it?.productID || it?.product_id || it?.pid || it?.itemId || '',
        productName: it?.productName || it?.name || it?.title || '',
        unit: it?.unit || it?.unitType || it?.unit_name || '',
        quantity: Number(it?.quantity ?? 1) || 1,
        productImage: it?.productImage || it?.image || (Array.isArray(it?.images) && it.images[0]) || '',
        images: Array.isArray(it?.images) ? it.images : [],
        profit: typeof it?.profit === 'number' ? it.profit : undefined,
        status: itemStatus || orderStatus || '',
        category: it?.category || it?.productCategory || data.category || data.categoryName || '',
        normalizedDate: orderDate,
        saleDate: orderDate,
        timestamp: data.timestamp,
        createdAt: data.createdAt
      })
    })
  })

  return entries
}
