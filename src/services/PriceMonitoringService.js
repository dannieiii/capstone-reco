import {
  collection,
  addDoc,
  updateDoc,
  doc,
  query,
  where,
  getDocs,
  serverTimestamp,
  orderBy,
  limit,
} from "firebase/firestore"
import { db } from "@/firebase/firebaseConfig"

export class PriceMonitoringService {
  constructor() {
    this.autoNotificationSettings = {
      enabled: true,
      daysBetweenWarnings: 3,
      autoDeactivateEnabled: false,
      maxWarnings: 3,
    }

    this.loadSettings()
  }

  loadSettings() {
    const saved = localStorage.getItem("autoNotificationSettings")
    if (saved) {
      this.autoNotificationSettings = { ...this.autoNotificationSettings, ...JSON.parse(saved) }
    }
  }

  saveSettings() {
    localStorage.setItem("autoNotificationSettings", JSON.stringify(this.autoNotificationSettings))
  }

  updateSettings(newSettings) {
    this.autoNotificationSettings = { ...this.autoNotificationSettings, ...newSettings }
    this.saveSettings()
  }

  async sendPriceWarning(product, adminId) {
    const warningCount = (product.warningCount || 0) + 1
    const isFinalWarning = warningCount >= this.autoNotificationSettings.maxWarnings

    try {
      // Create notification for seller
      const notificationData = {
        sellerId: product.sellerId,
        type: "price_warning",
        title: isFinalWarning ? "FINAL PRICE WARNING" : `Price Warning #${warningCount}`,
        message: this.generateWarningMessage(product, warningCount),
        productId: product.id,
        productName: product.productName,
        currentPrice: product.currentPrice.price,
        maxAllowedPrice: product.daReference.maxPrice,
        excessAmount: product.excessAmount,
        deviation: product.deviation,
        warningLevel: product.warningLevel,
        warningCount: warningCount,
        isFinalWarning: isFinalWarning,
        read: false,
        acknowledged: false,
        createdAt: serverTimestamp(),
        expiresAt: this.getWarningExpiryDate(),
        link: `/seller/products/edit/${product.id}`,
      }

      await addDoc(collection(db, "notifications"), notificationData)

      // Update product warning count
      await updateDoc(doc(db, "products", product.id), {
        warningCount: warningCount,
        lastWarning: serverTimestamp(),
        lastWarningType: isFinalWarning ? "final" : "standard",
      })

      // Create warning history record
      await addDoc(collection(db, "warningHistory"), {
        productId: product.id,
        sellerId: product.sellerId,
        adminId: adminId,
        type: isFinalWarning ? "final_warning" : "price_warning",
        message: notificationData.message,
        warningLevel: product.warningLevel,
        warningCount: warningCount,
        priceAtTime: product.currentPrice.price,
        maxAllowedPrice: product.daReference.maxPrice,
        excessAmount: product.excessAmount,
        deviation: product.deviation,
        sentAt: serverTimestamp(),
        responded: false,
      })

      // Schedule auto-deactivation if final warning and auto-deactivate is enabled
      if (isFinalWarning && this.autoNotificationSettings.autoDeactivateEnabled) {
        await this.scheduleAutoDeactivation(product.id, 24) // 24 hours
      }

      return { success: true, warningCount, isFinalWarning }
    } catch (error) {
      console.error("Error sending price warning:", error)
      throw error
    }
  }

  generateWarningMessage(product, warningCount) {
    const isFinalWarning = warningCount >= this.autoNotificationSettings.maxWarnings
    const deviation = this.formatDeviation(product.deviation)
    const excess = this.formatPrice(product.excessAmount)

    let message = `Dear ${product.sellerName},\n\n`

    if (isFinalWarning) {
      message += `🚨 FINAL WARNING - IMMEDIATE ACTION REQUIRED 🚨\n\n`
      message += `This is your FINAL WARNING regarding the pricing of your product "${product.productName}".\n\n`
      message += `Your product is currently priced at ₱${this.formatPrice(product.currentPrice.price)} ${product.currentPrice.unitLabel}, which is ${deviation} above the Department of Agriculture's maximum recommended price of ₱${product.daReference.maxPrice} ${product.daReference.unit}.\n\n`
      message += `Excess amount: ₱${excess}\n\n`
      message += `⚠️ CRITICAL: If you do not adjust your pricing within 24 hours, your product will be automatically deactivated from the marketplace.\n\n`
      message += `To avoid deactivation:\n`
      message += `1. Log into your seller dashboard immediately\n`
      message += `2. Navigate to your products section\n`
      message += `3. Edit "${product.productName}"\n`
      message += `4. Adjust the price to ₱${product.daReference.maxPrice} or below\n\n`
      message += `This is your last opportunity to maintain compliance.\n\n`
    } else {
      message += `We have detected that your product "${product.productName}" is priced above the Department of Agriculture's recommended guidelines.\n\n`
      message += `📊 PRICING DETAILS:\n`
      message += `• Your Current Price: ₱${this.formatPrice(product.currentPrice.price)} ${product.currentPrice.unitLabel}\n`
      message += `• D.A. Maximum Price: ₱${product.daReference.maxPrice} ${product.daReference.unit}\n`
      message += `• Price Deviation: ${deviation}\n`
      message += `• Excess Amount: ₱${excess}\n\n`
      message += `⚠️ WARNING STATUS: This is warning ${warningCount} of ${this.autoNotificationSettings.maxWarnings}\n\n`
      message += `Please adjust your pricing to comply with D.A. guidelines within ${this.autoNotificationSettings.daysBetweenWarnings} days to avoid further warnings.\n\n`

      if (warningCount === 2) {
        message += `🔔 NOTICE: The next warning will be your FINAL WARNING. After that, your product may be deactivated.\n\n`
      }
    }

    message += `For questions about pricing guidelines, please contact our support team.\n\n`
    message += `Thank you for your cooperation in maintaining fair pricing for consumers.\n\n`
    message += `Best regards,\nAgricultural Marketplace Administration`

    return message
  }

  async scheduleAutoDeactivation(productId, hoursDelay) {
    // In a real application, you would use a job scheduler or cloud function
    // For this example, we'll create a scheduled task record
    await addDoc(collection(db, "scheduledTasks"), {
      type: "auto_deactivate_product",
      productId: productId,
      scheduledFor: new Date(Date.now() + hoursDelay * 60 * 60 * 1000),
      status: "pending",
      createdAt: serverTimestamp(),
    })
  }

  async deactivateProduct(productId, reason = "manual", adminId = null) {
    try {
      // Update product status
      await updateDoc(doc(db, "products", productId), {
        status: "inactive",
        deactivatedAt: serverTimestamp(),
        deactivationReason: reason,
        deactivatedBy: adminId || "system",
      })

      // Get product details for notification
      const productQuery = query(collection(db, "products"), where("__name__", "==", productId))
      const productSnapshot = await getDocs(productQuery)

      if (!productSnapshot.empty) {
        const productData = productSnapshot.docs[0].data()

        // Create deactivation notification for seller
        await addDoc(collection(db, "notifications"), {
          sellerId: productData.sellerId,
          type: "product_deactivated",
          title: "Product Deactivated",
          message: `Your product "${productData.productName}" has been deactivated due to repeated pricing violations. The product exceeded the Department of Agriculture's maximum recommended price despite multiple warnings.`,
          productId: productId,
          productName: productData.productName,
          reason: reason === "auto" ? "Automatic deactivation after 3 warnings" : "Manual deactivation by admin",
          read: false,
          createdAt: serverTimestamp(),
          link: "/seller/products",
        })

        // Create deactivation history record
        await addDoc(collection(db, "productDeactivations"), {
          productId: productId,
          sellerId: productData.sellerId,
          adminId: adminId,
          reason: reason,
          productName: productData.productName,
          warningCount: productData.warningCount || 0,
          deactivatedAt: serverTimestamp(),
          priceAtDeactivation: productData.currentPrice?.price || 0,
          maxAllowedPrice: productData.daReference?.maxPrice || 0,
        })
      }

      return { success: true }
    } catch (error) {
      console.error("Error deactivating product:", error)
      throw error
    }
  }

  async reactivateProduct(productId, adminId) {
    try {
      // Update product status and reset warnings
      await updateDoc(doc(db, "products", productId), {
        status: "active",
        reactivatedAt: serverTimestamp(),
        reactivatedBy: adminId,
        warningCount: 0,
        lastWarning: null,
      })

      // Get product details for notification
      const productQuery = query(collection(db, "products"), where("__name__", "==", productId))
      const productSnapshot = await getDocs(productQuery)

      if (!productSnapshot.empty) {
        const productData = productSnapshot.docs[0].data()

        // Create reactivation notification for seller
        await addDoc(collection(db, "notifications"), {
          sellerId: productData.sellerId,
          type: "product_reactivated",
          title: "Product Reactivated",
          message: `Your product "${productData.productName}" has been reactivated. Please ensure your pricing complies with Department of Agriculture guidelines to avoid future warnings.`,
          productId: productId,
          productName: productData.productName,
          read: false,
          createdAt: serverTimestamp(),
          link: `/seller/products/edit/${productId}`,
        })
      }

      return { success: true }
    } catch (error) {
      console.error("Error reactivating product:", error)
      throw error
    }
  }

  async checkForAutoWarnings() {
    if (!this.autoNotificationSettings.enabled) return

    try {
      // Get all active overpriced products
      const productsQuery = query(
        collection(db, "products"),
        where("status", "==", "active"),
        where("priceStatus", "==", "overpriced"),
      )

      const productsSnapshot = await getDocs(productsQuery)
      const productsNeedingWarnings = []

      productsSnapshot.forEach((doc) => {
        const product = { id: doc.id, ...doc.data() }

        if (this.shouldSendAutoWarning(product)) {
          productsNeedingWarnings.push(product)
        }
      })

      // Send auto-warnings
      for (const product of productsNeedingWarnings) {
        try {
          await this.sendPriceWarning(product, "auto-system")
          console.log(`Auto-warning sent for product: ${product.productName}`)
        } catch (error) {
          console.error(`Failed to send auto-warning for product ${product.productName}:`, error)
        }
      }

      return { processed: productsNeedingWarnings.length }
    } catch (error) {
      console.error("Error checking for auto-warnings:", error)
      throw error
    }
  }

  shouldSendAutoWarning(product) {
    if (!product.lastWarning || product.status === "inactive") return false

    const warningCount = product.warningCount || 0
    if (warningCount >= this.autoNotificationSettings.maxWarnings) return false

    const lastWarningDate = product.lastWarning.toDate ? product.lastWarning.toDate() : new Date(product.lastWarning)
    const now = new Date()
    const daysSinceLastWarning = Math.floor((now - lastWarningDate) / (1000 * 60 * 60 * 24))

    return daysSinceLastWarning >= this.autoNotificationSettings.daysBetweenWarnings
  }

  async processScheduledTasks() {
    try {
      const tasksQuery = query(
        collection(db, "scheduledTasks"),
        where("status", "==", "pending"),
        where("scheduledFor", "<=", new Date()),
        orderBy("scheduledFor"),
        limit(50),
      )

      const tasksSnapshot = await getDocs(tasksQuery)

      for (const taskDoc of tasksSnapshot.docs) {
        const task = { id: taskDoc.id, ...taskDoc.data() }

        try {
          if (task.type === "auto_deactivate_product") {
            await this.deactivateProduct(task.productId, "auto")

            // Mark task as completed
            await updateDoc(doc(db, "scheduledTasks", task.id), {
              status: "completed",
              completedAt: serverTimestamp(),
            })
          }
        } catch (error) {
          console.error(`Error processing scheduled task ${task.id}:`, error)

          // Mark task as failed
          await updateDoc(doc(db, "scheduledTasks", task.id), {
            status: "failed",
            error: error.message,
            failedAt: serverTimestamp(),
          })
        }
      }

      return { processed: tasksSnapshot.docs.length }
    } catch (error) {
      console.error("Error processing scheduled tasks:", error)
      throw error
    }
  }

  getWarningExpiryDate() {
    const expiryDate = new Date()
    expiryDate.setDate(expiryDate.getDate() + this.autoNotificationSettings.daysBetweenWarnings)
    return expiryDate
  }

  formatPrice(price) {
    return Number.parseFloat(price).toFixed(2)
  }

  formatDeviation(deviation) {
    if (deviation === null || deviation === undefined) return "N/A"
    return deviation > 0 ? `+${deviation.toFixed(1)}%` : `${deviation.toFixed(1)}%`
  }

  // Start the monitoring service
  startMonitoring() {
    // Check for auto-warnings every hour
    setInterval(
      () => {
        this.checkForAutoWarnings()
      },
      60 * 60 * 1000,
    )

    // Process scheduled tasks every 10 minutes
    setInterval(
      () => {
        this.processScheduledTasks()
      },
      10 * 60 * 1000,
    )

    console.log("Price monitoring service started")
  }
}

// Export singleton instance
export const priceMonitoringService = new PriceMonitoringService()
