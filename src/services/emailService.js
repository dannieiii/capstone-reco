import emailjs from 'emailjs-com';

class EmailService {
  constructor() {
    // Hardcoded values since env variables aren't working
    try {
      emailjs.init('c--OaIL9_e5FQF8Vp');
      
    } catch (error) {
      console.error('❌ EmailJS initialization failed:', error);
    }
  }

  async sendOrderConfirmation(orderData) {
    const templateParams = {
      // EmailJS specific fields
      to_email: orderData.customerEmail,
      to_name: orderData.customerName,
      from_name: "FarmXpress",
      reply_to: "noreply@farmXpress.com",
      
      // Your custom template variables
      customer_name: orderData.customerName,
      order_code: orderData.orderCode,
      order_date: orderData.orderDate,
      delivery_address: orderData.deliveryAddress,
      payment_method: orderData.paymentMethod,
      delivery_option: orderData.deliveryOption,
      order_items: this.formatOrderItems(orderData.items),
      subtotal: orderData.subtotal,
      delivery_fee: orderData.deliveryFee,
      tax: orderData.tax,
      total: orderData.total,
      estimated_delivery: orderData.estimatedDelivery
    };

    console.log('Sending email with params:', templateParams); // Debug log

    try {
      const response = await emailjs.send(
        'service_7rkwdan', // Your service ID
        'template_5j6rlw8', // Your template ID
        templateParams
      );
      
      console.log('Email sent successfully:', response);
      return { success: true, response };
    } catch (error) {
      console.error('Failed to send email:', error);
      return { success: false, error };
    }
  }
  formatOrderItems(items) {
    return items.map(item => 
      `• ${item.productName} - ${item.quantity} ${item.unit} - ₱${item.totalPrice}`
    ).join('\n');
  }

  calculateEstimatedDelivery(deliveryOption) {
    const currentDate = new Date();
    let deliveryDays;
    
    switch(deliveryOption) {
      case 'express':
        deliveryDays = 1;
        break;
      case 'standard':
        deliveryDays = 3;
        break;
      default:
        deliveryDays = 3;
    }
    
    const deliveryDate = new Date(currentDate);
    deliveryDate.setDate(currentDate.getDate() + deliveryDays);
    
    return deliveryDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  async sendSellerApprovalEmail(sellerData) {
    const templateParams = {
      // EmailJS specific fields
      to_email: sellerData.email,
      to_name: sellerData.firstName || sellerData.farmName || 'Valued Seller',
      from_name: "FarmXpress Admin",
      reply_to: "admin@farmxpress.com",
      
      // Seller specific template variables - using multiple naming conventions to ensure compatibility
      seller_name: sellerData.firstName ? `${sellerData.firstName} ${sellerData.lastName || ''}`.trim() : sellerData.farmName,
      sellerName: sellerData.firstName ? `${sellerData.firstName} ${sellerData.lastName || ''}`.trim() : sellerData.farmName,
      name: sellerData.firstName ? `${sellerData.firstName} ${sellerData.lastName || ''}`.trim() : sellerData.farmName,
      
      farm_name: sellerData.farmName || 'Your Farm',
      farmName: sellerData.farmName || 'Your Farm',
      
      approval_date: new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      approvalDate: new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      date: new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      
      dashboard_url: window.location.origin + '/seller-dashboard',
      dashboardUrl: window.location.origin + '/seller-dashboard',
      
      login_url: window.location.origin + '/login',
      loginUrl: window.location.origin + '/login',
      
      support_email: 'support@farmxpress.com',
      supportEmail: 'support@farmxpress.com',
      
      support_phone: '+63 123 456 7890',
      supportPhone: '+63 123 456 7890',
      
      // Additional useful fields for the template
      company_name: 'FarmXpress',
      companyName: 'FarmXpress',
      
      website_url: window.location.origin,
      websiteUrl: window.location.origin,
      
      // Subject line for the email
      subject: 'Welcome to FarmXpress - Your Seller Account is Approved!',
      
      // Additional common template variables
      firstName: sellerData.firstName || '',
      lastName: sellerData.lastName || '',
      email: sellerData.email,
      
      // Most common EmailJS template patterns based on standard practices
      user_name: sellerData.firstName ? `${sellerData.firstName} ${sellerData.lastName || ''}`.trim() : sellerData.farmName,
      full_name: sellerData.firstName ? `${sellerData.firstName} ${sellerData.lastName || ''}`.trim() : sellerData.farmName,
      first_name: sellerData.firstName || '',
      last_name: sellerData.lastName || ''
    };

    console.log('🔍 Debug: Sending seller approval email...');
    console.log('📧 Email recipient:', sellerData.email);
    console.log('📋 Template ID: template_lassd0o');
    console.log('🔧 Service ID: service_3q900le');
    console.log('📝 Template params keys:', Object.keys(templateParams));
    console.log('📝 Template params:', templateParams);
    console.log('🔍 Checking critical fields:');
    console.log('  - to_email:', templateParams.to_email);
    console.log('  - seller_name:', templateParams.seller_name);
    console.log('  - farm_name:', templateParams.farm_name);
    console.log('  - approval_date:', templateParams.approval_date);

    try {
      const response = await emailjs.send(
        'service_7rkwdan', // Your service ID
        'template_3lps6qc', // Your seller approval template ID
        templateParams
      );
      
      console.log('✅ Seller approval email sent successfully:', response);
      console.log('📨 Response status:', response.status);
      console.log('📨 Response text:', response.text);
      console.log('🎯 EmailJS Response Details:', {
        status: response.status,
        text: response.text,
        timestamp: new Date().toISOString()
      });
      return { success: true, response };
    } catch (error) {
      console.error('❌ Failed to send seller approval email:', error);
      console.error('🔍 Error details:', {
        message: error.message,
        status: error.status,
        text: error.text
      });
      return { success: false, error };
    }
  }

  async sendSellerRejectionEmail(sellerData, rejectionReason = '') {
    const templateParams = {
      to_email: sellerData.email,
      to_name: sellerData.firstName || sellerData.farmName || 'Applicant',
      from_name: "FarmXpress Admin",
      reply_to: "admin@farmXpress.com",
      
      seller_name: sellerData.firstName ? `${sellerData.firstName} ${sellerData.lastName || ''}`.trim() : sellerData.farmName,
      farm_name: sellerData.farmName || 'Your Farm',
      rejection_date: new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      rejection_reason: rejectionReason || 'Please contact our support team for more details.',
      reapply_url: window.location.origin + '/seller-register',
      support_email: 'support@farmXpress.com',
      support_phone: '+63 123 456 7890',
      
      // Generic email content for template fallback
      subject: 'Update on Your Seller Application',
      message: `Dear ${sellerData.firstName || 'Valued Applicant'},

Thank you for your interest in becoming a seller on FarmXpress.

After careful review, we regret to inform you that we are unable to approve your seller application at this time.

Reason: ${rejectionReason || 'Please contact our support team for more details.'}

What You Can Do:
📧 Contact our support team for detailed feedback: support@farmXpress.com
📞 Call us at: +63 123 456 7890
🔄 You may reapply in the future: ${window.location.origin}/seller-register

We appreciate your interest in FarmXpress and encourage you to address any concerns and reapply when ready.

Best regards,
The FarmXpress Team

Support: support@farmXpress.com`
    };

    console.log('Sending seller rejection email with params:', templateParams);

    try {
      // Try with specific seller rejection template first
      let response;
      try {
        response = await emailjs.send(
          'service_7rkwdan', // Your service ID
          'template_seller_rejection', // Specific seller rejection template
          templateParams
        );
      } catch (error) {
        console.log('Specific template not found, using generic template...');
        // Fallback to generic template if seller-specific template doesn't exist
        response = await emailjs.send(
          'service_7rkwdan', // Your service ID
          'template_5j6rlw8', // Generic template as fallback
          templateParams
        );
      }
      
      console.log('Seller rejection email sent successfully:', response);
      return { success: true, response };
    } catch (error) {
      console.error('Failed to send seller rejection email:', error);
      return { success: false, error };
    }
  }

  // Generic seller notification method that can handle both approval and rejection
  async sendSellerStatusNotification(sellerData, status, rejectionReason = '') {
    if (status === 'approved' || status === 'Accepted') {
      return await this.sendSellerApprovalEmail(sellerData);
    } else if (status === 'rejected' || status === 'Declined') {
      return await this.sendSellerRejectionEmail(sellerData, rejectionReason);
    } else {
      console.warn('Unknown seller status for email notification:', status);
      return { success: false, error: 'Unknown status' };
    }
  }

  // Test email function to verify EmailJS setup
  async testSellerApprovalEmail() {
    console.log('🧪 Testing seller approval email...');
    
    const testSellerData = {
      email: 'mrtnzjnss0723@gmail.com', // Your test email
      firstName: 'Test',
      lastName: 'Seller',
      farmName: 'Test Farm'
    };
    
    console.log('📧 Sending comprehensive test email to:', testSellerData.email);
    console.log('🧪 Test seller data:', testSellerData);
    
    try {
      const result = await this.sendSellerApprovalEmail(testSellerData);
      console.log('🧪 Test email result:', result);
      
      if (result.success) {
        console.log('🎉 Test email sent successfully! Check your email inbox.');
        console.log('📬 If you don\'t receive the email, check:');
        console.log('  1. Spam/Junk folder');
        console.log('  2. EmailJS template variable names');
        console.log('  3. EmailJS service configuration');
      }
      
      return result;
    } catch (error) {
      console.error('🧪 Test email failed:', error);
      return { success: false, error };
    }
  }

  // Comprehensive debug function to test email template variables
  async debugEmailTemplate() {
    console.log('🔬 Starting comprehensive email template debug...');
    
    const debugSellerData = {
      email: 'mrtnzjnss0723@gmail.com',
      firstName: 'Debug',
      lastName: 'TestSeller',
      farmName: 'Debug Test Farm'
    };
    
    // Create an extensive template params object with all possible variable names
    const debugTemplateParams = {
      // Standard EmailJS fields
      to_email: debugSellerData.email,
      to_name: debugSellerData.firstName,
      from_name: "FarmXpress Debug",
      reply_to: "debug@farmxpress.com",
      
      // All possible naming conventions for seller name
      seller_name: 'Debug TestSeller',
      sellerName: 'Debug TestSeller',
      sellername: 'Debug TestSeller',
      name: 'Debug TestSeller',
      user_name: 'Debug TestSeller',
      userName: 'Debug TestSeller',
      username: 'Debug TestSeller',
      
      // All possible naming conventions for first name
      first_name: 'Debug',
      firstName: 'Debug',
      firstname: 'Debug',
      fname: 'Debug',
      
      // All possible naming conventions for last name
      last_name: 'TestSeller',
      lastName: 'TestSeller',
      lastname: 'TestSeller',
      lname: 'TestSeller',
      
      // All possible naming conventions for farm name
      farm_name: 'Debug Test Farm',
      farmName: 'Debug Test Farm',
      farmname: 'Debug Test Farm',
      business_name: 'Debug Test Farm',
      businessName: 'Debug Test Farm',
      
      // All possible naming conventions for email
      email: debugSellerData.email,
      user_email: debugSellerData.email,
      userEmail: debugSellerData.email,
      seller_email: debugSellerData.email,
      sellerEmail: debugSellerData.email,
      
      // All possible naming conventions for date
      date: new Date().toLocaleDateString(),
      approval_date: new Date().toLocaleDateString(),
      approvalDate: new Date().toLocaleDateString(),
      current_date: new Date().toLocaleDateString(),
      currentDate: new Date().toLocaleDateString(),
      timestamp: new Date().toISOString(),
      
      // Company and support info
      company: 'FarmXpress',
      company_name: 'FarmXpress',
      companyName: 'FarmXpress',
      support_email: 'support@farmxpress.com',
      supportEmail: 'support@farmxpress.com',
      support_phone: '+63 123 456 7890',
      supportPhone: '+63 123 456 7890',
      
      // URLs
      website: window.location.origin,
      website_url: window.location.origin,
      websiteUrl: window.location.origin,
      dashboard_url: window.location.origin + '/seller-dashboard',
      dashboardUrl: window.location.origin + '/seller-dashboard',
      login_url: window.location.origin + '/login',
      loginUrl: window.location.origin + '/login',
      
      // Subject
      subject: '[DEBUG] FarmXpress Email Template Test',
      
      // Debug message
      message: 'This is a debug email to test template variables. If you receive this, the email system is working!',
      
      // Status-related
      status: 'approved',
      registration_status: 'approved',
      registrationStatus: 'approved'
    };
    
    console.log('🔬 Debug template params:', debugTemplateParams);
    console.log('📊 Total template variables:', Object.keys(debugTemplateParams).length);
    console.log('📝 Template variable names:', Object.keys(debugTemplateParams));
    
    try {
      console.log('📤 Sending debug email...');
      const response = await emailjs.send(
        'service_3q900le',
        'template_3lps6qc', // Using the seller approval template
        debugTemplateParams
      );
      
      console.log('✅ Debug email sent successfully!');
      console.log('📨 EmailJS Response:', response);
      console.log('🎯 Check your email (mrtnzjnss0723@gmail.com) for the debug message');
      console.log('📋 If email is received, all template variables are working correctly');
      console.log('📋 If no email is received, check spam folder and EmailJS dashboard');
      
      return { success: true, response, templateParams: debugTemplateParams };
    } catch (error) {
      console.error('❌ Debug email failed:', error);
      console.error('🔍 Error details:', {
        message: error.message,
        status: error.status,
        text: error.text,
        templateParams: debugTemplateParams
      });
      return { success: false, error, templateParams: debugTemplateParams };
    }
  }
}

export default new EmailService();