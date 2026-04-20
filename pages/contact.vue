<template>
  <div class="max-w-2xl mx-auto px-4 py-8 md:py-12">
    <h1 class="text-2xl md:text-3xl font-extrabold text-surface-900 mb-2">
      Contact Us
    </h1>
    <p class="text-sm text-surface-600 leading-relaxed mb-6">
      Have a question, found a bug, or want to suggest a feature? We'd love to hear from you.
    </p>

    <!--
      Info block shown above the form — gives visitors the direct email
      option as a fallback and sets a clear response-time expectation.
    -->
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
      <div class="card">
        <p class="text-xs font-semibold uppercase tracking-wide text-surface-400 mb-1">Email</p>
        <a
          href="mailto:dev.spadilla@gmail.com"
          class="link text-sm font-medium break-all"
        >dev.spadilla@gmail.com</a>
        <p class="text-xs text-surface-500 mt-1">For all inquiries — support, partnerships, or DMCA.</p>
      </div>
      <div class="card">
        <p class="text-xs font-semibold uppercase tracking-wide text-surface-400 mb-1">Response time</p>
        <p class="text-sm font-medium text-surface-900">Usually within 2 business days</p>
        <p class="text-xs text-surface-500 mt-1">We read every message. Complex bugs may take a bit longer.</p>
      </div>
    </div>

    <!-- Session limit reached -->
    <div v-if="isSessionLimitReached" class="card text-center py-12">
      <h2 class="text-xl font-bold text-surface-900 mb-2">Limit reached</h2>
      <p class="text-sm text-surface-600">You've reached the maximum number of messages. Please try again later.</p>
    </div>

    <!-- Success state -->
    <div v-else-if="submitted" class="card text-center py-12">
      <div class="flex justify-center mb-4">
        <svg class="w-16 h-16" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="32" cy="32" r="30" stroke="rgb(var(--color-success-500))" stroke-width="3" fill="rgba(var(--color-success-500), 0.1)" />
          <path d="M20 33L28 41L44 25" stroke="rgb(var(--color-success-500))" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </div>
      <h2 class="text-xl font-bold text-surface-900 mb-2">Message sent!</h2>
      <p class="text-sm text-surface-600 mb-6">We'll get back to you soon.</p>
      <button class="btn btn-secondary" @click="resetForm">Send Another Message</button>
    </div>

    <!-- Form -->
    <form v-else class="space-y-5" @submit.prevent="handleSubmit" novalidate>
      <!-- Web3Forms honeypot — hidden from humans, traps bots -->
      <input type="checkbox" name="botcheck" class="hidden" style="display:none" tabindex="-1" autocomplete="off" />

      <div>
        <label class="label">Name</label>
        <input
          v-model="form.name"
          type="text"
          class="input"
          required
          minlength="2"
          placeholder="Your name"
          @blur="touchField('name')"
        />
        <p v-if="touched.name && validationErrors.name" class="error-text">{{ validationErrors.name }}</p>
      </div>
      <div>
        <label class="label">Email</label>
        <input
          v-model="form.email"
          type="email"
          class="input"
          required
          pattern="[^@\s]+@[^@\s]+\.[^@\s]+"
          placeholder="you@example.com"
          @blur="touchField('email')"
        />
        <p v-if="touched.email && validationErrors.email" class="error-text">{{ validationErrors.email }}</p>
      </div>
      <div>
        <label class="label">Subject</label>
        <input
          v-model="form.subject"
          type="text"
          class="input"
          required
          minlength="3"
          placeholder="Bug report, feature request, etc."
          @blur="touchField('subject')"
        />
        <p v-if="touched.subject && validationErrors.subject" class="error-text">{{ validationErrors.subject }}</p>
      </div>
      <div>
        <label class="label">Message</label>
        <textarea
          v-model="form.message"
          class="textarea"
          rows="5"
          required
          minlength="10"
          placeholder="Tell us what's on your mind..."
          @blur="touchField('message')"
        />
        <p v-if="touched.message && validationErrors.message" class="error-text">{{ validationErrors.message }}</p>
      </div>

      <div v-if="error" class="text-sm text-error-500">{{ error }}</div>

      <button
        type="submit"
        class="btn btn-primary w-full"
        :disabled="isSubmitting || cooldown > 0"
      >
        <template v-if="isSubmitting">Sending...</template>
        <template v-else-if="cooldown > 0">Please wait ({{ cooldown }}s)</template>
        <template v-else>Send Message</template>
      </button>
    </form>

    <!-- DMCA / Copyright Claims -->
    <div class="mt-12 pt-8 border-t border-surface-200/50">
      <h2 class="text-lg font-bold text-surface-900 mb-3">DMCA / Copyright Claims</h2>
      <p class="text-sm text-surface-600 leading-relaxed mb-3">
        If you are a rights holder and believe material accessible through our site infringes your copyright, please send a written DMCA notification to our designated agent at <a href="mailto:dev.spadilla@gmail.com" class="link">dev.spadilla@gmail.com</a> with the subject line "DMCA Notice". To be effective under 17 U.S.C. &sect; 512, your notice must include:
      </p>
      <ol class="list-decimal list-outside pl-6 text-sm text-surface-600 leading-relaxed space-y-1.5 mb-3">
        <li>Your physical or electronic signature (or that of an authorized agent).</li>
        <li>Identification of the copyrighted work claimed to have been infringed.</li>
        <li>The full URL on emotesizer.com where the allegedly infringing material is located.</li>
        <li>Your full legal name, mailing address, telephone number, and email address.</li>
        <li>A good-faith statement that use of the material is not authorized by the copyright owner, its agent, or the law.</li>
        <li>A statement, under penalty of perjury, that the information in the notice is accurate and that you are authorized to act on behalf of the owner.</li>
      </ol>
      <p class="text-sm text-surface-600 leading-relaxed">
        For the full takedown procedure, counter-notification process, and statutory references, see our <NuxtLink to="/terms#dmca" class="link">Terms of Service &mdash; DMCA section</NuxtLink>.
      </p>
    </div>

    <!-- General Inquiries & Partnership -->
    <div class="mt-10">
      <h2 class="text-lg font-bold text-surface-900 mb-3">General Inquiries &amp; Partnership</h2>
      <p class="text-sm text-surface-600 leading-relaxed mb-3">
        Press, business partnerships, integrations, and general questions are all welcome through the form above or directly at <a href="mailto:dev.spadilla@gmail.com" class="link">dev.spadilla@gmail.com</a>. If you're a creator, tool developer, or platform interested in collaborating, please include a brief description of what you have in mind and any relevant links (your channel, project, or company site) so we can respond with context. We review partnership requests weekly and reply to serious inquiries within two business days.
      </p>
    </div>

    <!-- Bug Reports -->
    <div class="mt-10">
      <h2 class="text-lg font-bold text-surface-900 mb-3">Bug Reports</h2>
      <p class="text-sm text-surface-600 leading-relaxed mb-3">
        Found something broken? A great bug report saves us both time. Please include: (1) the URL or tool where the issue occurred, (2) your browser and operating system (e.g., "Chrome 132 on Windows 11"), (3) a description of what you expected to happen versus what actually happened, (4) steps to reproduce the issue from a fresh page load, and (5) if possible, a sample GIF or screenshot demonstrating the problem. If the tool threw an error in the browser console, a quick copy-paste of that message is especially helpful. Attach details to the form above or email them to us directly.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
const form = reactive({
  name: '',
  email: '',
  subject: '',
  message: '',
})

const touched = reactive({
  name: false,
  email: false,
  subject: false,
  message: false,
})

const isSubmitting = ref(false)
const submitted = ref(false)
const error = ref('')
const cooldown = ref(0)
let cooldownInterval: ReturnType<typeof setInterval> | null = null

// --- Session-based submission counter ---

const isSessionLimitReached = ref(false)

function getSubmitCount(): number {
  return parseInt(sessionStorage.getItem('contact_count') || '0', 10)
}

function incrementSubmitCount() {
  sessionStorage.setItem('contact_count', String(getSubmitCount() + 1))
}

function checkSessionLimit() {
  isSessionLimitReached.value = getSubmitCount() >= 3
}

onMounted(() => {
  checkSessionLimit()
})

// --- Input validation ---

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const validationErrors = computed(() => {
  const errors: Record<string, string> = {}

  if (form.name.length > 0 && form.name.trim().length < 2) {
    errors.name = 'Name must be at least 2 characters.'
  }
  if (form.email.length > 0 && !EMAIL_RE.test(form.email)) {
    errors.email = 'Please enter a valid email address.'
  }
  if (form.subject.length > 0 && form.subject.trim().length < 3) {
    errors.subject = 'Subject must be at least 3 characters.'
  }
  if (form.message.length > 0 && form.message.trim().length < 10) {
    errors.message = 'Message must be at least 10 characters.'
  }

  return errors
})

/** Validates all fields before submit. Returns true if the form is valid. */
function validateAll(): boolean {
  // Touch every field so inline errors appear
  touched.name = true
  touched.email = true
  touched.subject = true
  touched.message = true

  // Check required + minimum length
  if (form.name.trim().length < 2) return false
  if (!EMAIL_RE.test(form.email)) return false
  if (form.subject.trim().length < 3) return false
  if (form.message.trim().length < 10) return false

  return Object.keys(validationErrors.value).length === 0
}

function touchField(field: keyof typeof touched) {
  touched[field] = true
}

// --- Rate-limit cooldown ---

function startCooldown() {
  cooldown.value = 60
  cooldownInterval = setInterval(() => {
    cooldown.value--
    if (cooldown.value <= 0 && cooldownInterval) {
      clearInterval(cooldownInterval)
      cooldownInterval = null
    }
  }, 1000)
}

onUnmounted(() => {
  if (cooldownInterval) {
    clearInterval(cooldownInterval)
    cooldownInterval = null
  }
})

// --- Submit handler ---

async function handleSubmit() {
  error.value = ''

  if (!validateAll()) {
    error.value = 'Please fix the errors above before submitting.'
    return
  }

  if (cooldown.value > 0) return
  if (getSubmitCount() >= 3) {
    checkSessionLimit()
    return
  }

  isSubmitting.value = true

  try {
    const response = await $fetch<{ success: boolean }>('https://api.web3forms.com/submit', {
      method: 'POST',
      body: {
        access_key: '0b6522a8-4ddd-4d78-b31f-f57ad037a1a8',
        from_name: 'EmoteSizer Contact',
        name: form.name.trim(),
        email: form.email.trim(),
        subject: `[EmoteSizer] ${form.subject.trim()}`,
        message: form.message.trim(),
      },
    })

    if (response.success) {
      submitted.value = true
      incrementSubmitCount()
      startCooldown()
    } else {
      error.value = 'Failed to send message. Please try again.'
    }
  } catch (e: unknown) {
    error.value = 'Failed to send message. Please try again.'
  } finally {
    isSubmitting.value = false
  }
}

function resetForm() {
  form.name = ''
  form.email = ''
  form.subject = ''
  form.message = ''
  touched.name = false
  touched.email = false
  touched.subject = false
  touched.message = false
  submitted.value = false
  error.value = ''
  checkSessionLimit()
}

useHead({
  title: 'Contact — EmoteSizer',
  meta: [
    { name: 'description', content: 'Contact EmoteSizer — use our contact form to report bugs, suggest features, or ask questions about our free emote maker.' },
    { property: 'og:title', content: 'Contact — EmoteSizer' },
    { property: 'og:description', content: 'Get in touch with the EmoteSizer team — bug reports, feature requests, and content inquiries.' },
    { property: 'og:url', content: 'https://emotesizer.com/contact' },
  ],
  link: [{ rel: 'canonical', href: 'https://emotesizer.com/contact' }],
})
</script>
