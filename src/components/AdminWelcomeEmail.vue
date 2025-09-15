<template>
  <div class="admin-email-preview">
    <h3>Admin Welcome Email Preview</h3>
    <p>This component demonstrates the context and payload we send when a new admin is added.</p>
    <pre>{{ payload }}</pre>
    <button @click="send" :disabled="sending">
      {{ sending ? 'Sending…' : 'Send Test Email' }}
    </button>
    <p v-if="result" class="result">{{ result }}</p>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import EmailService from '@/services/emailService';

const props = defineProps({
  email: { type: String, required: true },
  firstName: { type: String, default: '' },
  lastName: { type: String, default: '' },
  position: { type: String, default: 'Administrator' },
  username: { type: String, default: '' }
});

const payload = computed(() => ({
  email: props.email,
  firstName: props.firstName,
  lastName: props.lastName,
  position: props.position,
  username: props.username
}));

const sending = ref(false);
const result = ref('');

const send = async () => {
  sending.value = true;
  result.value = '';
  const res = await EmailService.sendAdminWelcomeEmail(payload.value);
  result.value = res.success ? 'Email sent successfully' : `Email failed: ${res.error?.message || 'Unknown error'}`;
  sending.value = false;
};
</script>

<style scoped>
.admin-email-preview { border: 1px solid #eee; padding: 12px; border-radius: 8px; }
pre { background: #fafafa; padding: 8px; border-radius: 6px; max-height: 200px; overflow: auto; }
.result { margin-top: 8px; color: #2e5c31; }
button { padding: 8px 12px; background: #2e5c31; color: #fff; border: none; border-radius: 6px; cursor: pointer; }
button:disabled { opacity: 0.6; cursor: not-allowed; }
</style>
