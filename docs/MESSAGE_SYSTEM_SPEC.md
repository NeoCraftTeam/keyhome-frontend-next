# Message System — Technical Specification

**Project:** KeyHome Frontend (`keyhome-frontend-next`)  
**Stack:** Next.js 16 · React 19 · TypeScript · MUI v7 · Axios · TanStack Query v5  
**Status:** Design-ready — pending implementation

---

## 1. Purpose

The current error-handling layer (`lib/error-messages.ts`) extracts a single string from a response. It cannot model multiple concurrent messages, message severity, or per-field validation errors. This specification defines a **unified, type-safe message system** that maps every backend response message to the correct UI modality without code duplication across services and components.

---

## 2. Backend Message Contract

Every API response body **may** contain a top-level `messages` array alongside its normal payload. The backend **must not** be changed — the frontend must handle both shapes gracefully.

```typescript
// Shape produced by the Laravel backend
interface BackendResponse<T = unknown> {
  data?:     T;
  message?:  string;           // single-message shorthand (legacy)
  messages?: BackendMessage[]; // structured multi-message (new contract)
  errors?:   Record<string, string[]>; // Laravel 422 validation map
}

interface BackendMessage {
  type: MessageType;   // required
  code?: string;       // optional machine-readable identifier, e.g. "EMAIL_NOT_VERIFIED"
  text:  string;       // human-readable, already localised by backend (French)
}

enum MessageType {
  SUCCESS    = 'SUCCESS',
  INFO       = 'INFO',
  WARNING    = 'WARNING',
  VALIDATION = 'VALIDATION',
  ERROR      = 'ERROR',
}
```

> The `message` shorthand (single string) is normalised into a `BackendMessage` by the parsing layer. It is never surfaced raw to components.

---

## 3. Internal Message Model

After parsing, every message is stamped with runtime metadata and lives in the message store.

```typescript
interface AppMessage {
  id:        string;       // crypto.randomUUID() — stable key for React lists
  type:      MessageType;
  text:      string;
  code?:     string;
  field?:    string;       // set for VALIDATION messages mapped to a form field
  createdAt: number;       // Date.now() — used for auto-dismiss scheduling
  dismissed: boolean;      // soft-deleted before removal from state
}
```

---

## 4. Parsing Layer

### 4.1 `parseMessages(response, httpStatus)`

A pure function that converts any raw backend response into `AppMessage[]`. It is called by the Axios response interceptor and by TanStack Query's `onError` / `onSuccess` handlers — never inside components.

```
Input  → BackendResponse (any shape) + HTTP status code
Output → AppMessage[]
```

**Normalisation rules (in priority order):**

| Condition | Action |
|---|---|
| `response.messages` array is present | Map each object directly using `BackendMessage` schema |
| `response.errors` map is present (HTTP 422) | Create one `VALIDATION` message per field, setting `field` to the key name |
| `response.message` string is present | Create one `AppMessage`; infer `type` from HTTP status (see §4.2) |
| HTTP 401 | One `ERROR` message, code `UNAUTHENTICATED` |
| HTTP 403 | One `ERROR` message, code `FORBIDDEN` |
| HTTP 404 | One `INFO` message, code `NOT_FOUND` |
| HTTP 429 | One `WARNING` message, code `RATE_LIMITED`; include `retry_after` in text if present |
| HTTP 5xx | One `ERROR` message, code `SERVER_ERROR`; generic text, never expose raw trace |
| Network error / timeout | One `ERROR` message, code `NETWORK_ERROR` |
| Unparseable JSON | One `ERROR` message, code `MALFORMED_RESPONSE` |

### 4.2 HTTP Status → Default MessageType mapping

```typescript
function statusToType(status: number): MessageType {
  if (status >= 200 && status < 300) return MessageType.SUCCESS;
  if (status === 422)                return MessageType.VALIDATION;
  if (status === 429)                return MessageType.WARNING;
  if (status >= 400 && status < 500) return MessageType.ERROR;
  if (status >= 500)                 return MessageType.ERROR;
  return MessageType.INFO;
}
```

### 4.3 Axios interceptors integration

Attach in `lib/api.ts` to ensure all messages are extracted before any service or query handler sees the error:

```typescript
// lib/api.ts  — response interceptor (replace current pass-through)
api.interceptors.response.use(
  (response) => {
    const messages = parseMessages(response.data, response.status);
    if (messages.length) {
      // post to global store — services still receive the full response
      messageStore.add(messages);
    }
    return response;
  },
  (error: AxiosError<BackendResponse>) => {
    const status  = error.response?.status ?? 0;
    const data    = error.response?.data;
    const messages = parseMessages(data ?? {}, status, /*isNetworkError=*/ !error.response);
    messageStore.add(messages);
    return Promise.reject(error);
  }
);
```

> Services (`auth.service.ts`, `ads.service.ts`, …) keep their current signatures. They no longer call `getSafeErrorMessage` — messages are surfaced by the global system.

---

## 5. Message Store

Framework-native state, not a third-party library. The store is a React Context backed by `useReducer`, accessible via `useMessages()`.

### 5.1 Store shape

```typescript
interface MessageStore {
  messages: AppMessage[];
}

type MessageAction =
  | { type: 'ADD';     payload: AppMessage[] }
  | { type: 'DISMISS'; id: string }
  | { type: 'CLEAR';   filter?: MessageType }
  | { type: 'CLEAR_FIELD'; field: string };
```

### 5.2 Provider

```
src/providers/MessageProvider.tsx
```

Wrap the root layout (add to `src/app/layout.tsx` inside the existing `<Providers>`):

```tsx
<QueryProvider>
  <AuthProvider>
    <MessageProvider>   {/* ← add here */}
      {children}
      <MessageRenderer /> {/* global toast + modal outlets */}
    </MessageProvider>
  </AuthProvider>
</QueryProvider>
```

### 5.3 `useMessages()` hook API

```typescript
interface UseMessages {
  // All active (non-dismissed) messages
  messages:    AppMessage[];
  // Subset helpers
  toasts:      AppMessage[];   // SUCCESS + INFO
  alerts:      AppMessage[];   // WARNING + VALIDATION
  errors:      AppMessage[];   // ERROR
  // For form integration — messages scoped to a field name
  fieldMessages: (field: string) => AppMessage[];
  // Actions
  dismiss:     (id: string)         => void;
  clearField:  (field: string)      => void;
  clearAll:    ()                   => void;
  // Manual injection (for optimistic UI, offline scenarios)
  add:         (m: Omit<AppMessage, 'id' | 'createdAt' | 'dismissed'>[]) => void;
}
```

---

## 6. UI Modalities

### 6.1 Transient Notifications (Toast) — `SUCCESS` · `INFO`

**Component:** `src/components/messages/ToastStack.tsx`

**Behaviour:**
- Rendered in a fixed portal at `bottom-right` (desktop) and `bottom-center` (mobile, `sm` breakpoint).
- Maximum **5** toasts visible simultaneously. If the 6th arrives, the oldest is dismissed immediately.
- Auto-dismiss after **5 000 ms** (configurable per-message via an optional `ttl` field).
- The auto-dismiss timer is **paused** while the user hovers over the toast.
- Stacked with a `8px` gap; new messages enter from bottom with a slide-up + fade-in animation (150 ms, `cubic-bezier(0.4, 0, 0.2, 1)`).
- Dismissal triggers slide-down + fade-out (100 ms), then removes from DOM after animation.
- Each toast shows: colour-coded left border (green for SUCCESS, blue for INFO), icon (MUI `CheckCircleOutline` / `InfoOutline`), text, and a close `IconButton`.

**MUI mapping:** Build on `MUI Snackbar + Alert` with `anchorOrigin` controlled by the store, **not** per-call.

**ARIA:**
```html
<div role="status" aria-live="polite" aria-atomic="false">
  <!-- toast items injected here -->
</div>
```

### 6.2 Persistent Inline Alerts — `WARNING` · `VALIDATION`

**Component:** `src/components/messages/InlineAlerts.tsx`

**Behaviour:**
- Placed **above the form or section** they relate to, not in a global overlay.
- Consumed directly in page/component via `const { alerts, fieldMessages } = useMessages()`.
- For `VALIDATION` messages with a `field` set, the alert is placed adjacent to the relevant `react-hook-form` field using the `useFormMessageSync` hook (§7.2).
- For `VALIDATION` messages without a `field`, shown at the top of the form as a summary list.
- `WARNING` messages remain visible until the user dismisses them or navigates away.
- `VALIDATION` messages are cleared automatically when the corresponding field is re-submitted successfully (`clearField(name)` on `onSuccess`).

**MUI mapping:** `MUI Alert severity="warning"` / `severity="error"` with `variant="outlined"`, show/hide controlled by the store.

**ARIA:**
```html
<div role="alert" aria-live="assertive" aria-atomic="true">
  <!-- persists until dismissed -->
</div>
```

### 6.3 Modal Dialogs — `ERROR`

**Component:** `src/components/messages/ErrorModal.tsx`

**Behaviour:**
- Rendered in a portal (`document.body`). Blocks all pointer and keyboard interaction with the page behind it (`aria-modal="true"`, `inert` attribute on `#root`).
- If multiple `ERROR` messages arrive simultaneously, they are shown as a list inside a single modal (not multiple modals stacked).
- `code` field is shown in a collapsed `<details>` for technical support reference — hidden from normal users unless `process.env.NEXT_PUBLIC_DEBUG === 'true'`.
- Only one action: **"Fermer"** button — calls `dismiss(id)` for all displayed errors.
- For `NETWORK_ERROR` and `SERVER_ERROR` codes, append a retry button that re-triggers the last failed request via a stored callback (optional, see §8.3).

**MUI mapping:** `MUI Dialog` with `open` controlled by `errors.length > 0`.

**ARIA:**
```html
<dialog role="alertdialog" aria-modal="true" aria-labelledby="err-title" aria-describedby="err-body">
  <h2 id="err-title">Une erreur est survenue</h2>
  <div id="err-body">...</div>
</dialog>
```

---

## 7. Form Integration

### 7.1 `useFormMessageSync` hook

Bridges the message store with `react-hook-form`. Call once per form:

```typescript
function useFormMessageSync<T extends FieldValues>(
  form: UseFormReturn<T>
): void
```

- On every re-render, reads `fieldMessages(name)` for each registered field.
- Calls `form.setError(name, { type: 'server', message: text })` for any unacknowledged `VALIDATION` message.
- On `form.formState.isSubmitSuccessful`, calls `clearField(name)` for all mapped fields.

### 7.2 Zod + react-hook-form client-side validation

Client-side Zod errors are **not** routed through the message store — they stay in `form.formState.errors` and are rendered by the form component's own `<FormHelperText>` as today. The message store only handles **server-returned** `VALIDATION` messages.

---

## 8. TanStack Query Integration

### 8.1 Global `QueryClient` defaults

Update `src/providers/QueryProvider.tsx`:

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    mutations: {
      onError: () => {
        // Messages already extracted by Axios interceptor.
        // No extra handling needed here unless you want mutation-local overrides.
      },
    },
    queries: {
      retry: (failureCount, error) => {
        const status = (error as AxiosError)?.response?.status;
        // Do not retry on 4xx client errors
        if (status && status >= 400 && status < 500) return false;
        return failureCount < 2;
      },
    },
  },
});
```

### 8.2 Per-mutation `onSuccess` clearing

In service hooks that deal with form submission, clear field messages on success:

```typescript
const { clearAll } = useMessages();

useMutation({
  mutationFn: authService.login,
  onSuccess: () => {
    clearAll();
    router.push('/dashboard');
  },
});
```

### 8.3 Optional retry callback for `ERROR` modals

If a retry button is required for network/server errors, store the last failed mutation callback in the message (as an optional `retryFn`) set by the mutation's `onError`:

```typescript
onError: (error, variables, context) => {
  messageStore.patchLastError({ retryFn: () => mutate(variables) });
}
```

---

## 9. Message Accumulation & Ordering

When multiple messages arrive in a single response:

1. Parse all into `AppMessage[]` in the order received.
2. `ERROR` messages are displayed **before** `WARNING`, `VALIDATION`, then `INFO`/`SUCCESS`.
3. Within the same type, order is preserved (FIFO).
4. Duplicate detection: if a message with the same `code` already exists in the store (non-dismissed), the new one is **skipped** — prevents duplicate toasts on retry.

```typescript
// reducer ADD action deduplication
const isDuplicate = (existing: AppMessage[], incoming: AppMessage) =>
  incoming.code != null &&
  existing.some(m => !m.dismissed && m.code === incoming.code);
```

---

## 10. Special Pages

### 10.1 404 Page (`app/not-found.tsx`)

Renders entirely statically. Does **not** use `useMessages` — the 404 condition is a Next.js routing concern, not a backend message. The `NOT_FOUND` code generated by the interceptor (§4.1) is only relevant if a background API call 404s while on a page, not when the page itself doesn't exist.

### 10.2 Maintenance Page

A static page served from `app/maintenance/page.tsx` with no API calls. If the API returns HTTP 503, the interceptor emits an `ERROR` with `code: SERVICE_UNAVAILABLE`. Components may check for this code to redirect to `/maintenance` in a global effect:

```typescript
// In MessageProvider
useEffect(() => {
  if (errors.some(e => e.code === 'SERVICE_UNAVAILABLE')) {
    router.push('/maintenance');
  }
}, [errors]);
```

---

## 11. Accessibility Summary

| Modality | ARIA role | `aria-live` | Notes |
|---|---|---|---|
| Toast (SUCCESS/INFO) | `status` | `polite` | `aria-atomic="false"` — new items announced individually |
| Inline Alert (WARNING/VALIDATION) | `alert` | `assertive` | Announced immediately on injection |
| Error Modal (ERROR) | `alertdialog` | `assertive` | Focus trapped inside modal, `inert` applied to page |
| Dismiss buttons | `button` | — | `aria-label="Fermer la notification"` |

- All message text values originate from the backend and are already in French.
- Colour is never the **sole** means of conveying message type — icons and text labels are always present alongside colour.
- Toast dismissal is reachable by keyboard (`Tab` + `Enter` / `Space`).

---

## 12. File Structure

```
src/
├── lib/
│   ├── api.ts                    ← extend interceptors (§4.3)
│   ├── message-parser.ts         ← parseMessages() pure function (§4.1)
│   └── error-messages.ts         ← deprecated — keep for now, wrap with parseMessages
├── types/
│   └── index.ts                  ← add BackendMessage, AppMessage, MessageType (§2, §3)
├── providers/
│   └── MessageProvider.tsx       ← store + reducer + context (§5)
├── hooks/
│   ├── useMessages.ts            ← public hook (§5.3)
│   └── useFormMessageSync.ts     ← form bridge (§7.1)
└── components/
    └── messages/
        ├── ToastStack.tsx         ← SUCCESS + INFO (§6.1)
        ├── InlineAlerts.tsx       ← WARNING + VALIDATION (§6.2)
        ├── ErrorModal.tsx         ← ERROR (§6.3)
        └── MessageRenderer.tsx    ← composes ToastStack + ErrorModal for global outlet
```

---

## 13. Migration from `getSafeErrorMessage`

`getSafeErrorMessage` remains functional during the transition. Refactor call sites progressively:

1. **Phase 1** — Add `MessageProvider` + interceptor. All messages flow into the store silently (no new UI yet). Existing `getSafeErrorMessage` calls still handle the component-level display.
2. **Phase 2** — Ship `ToastStack` + `ErrorModal`. Remove `getSafeErrorMessage` from service hooks (`useMutation.onError`). Toast and modal now cover those cases.
3. **Phase 3** — Ship `InlineAlerts` + `useFormMessageSync`. Replace all manual `setError` calls in form `onError` handlers. Remove remaining `getSafeErrorMessage` imports.
4. **Phase 4 (cleanup)** — Delete `getSafeErrorMessage`. The function in `lib/error-messages.ts` is no longer needed.

---

## 14. Open Questions

| # | Question | Default assumption |
|---|---|---|
| 1 | Should SUCCESS toasts fire for every mutation, or only those that explicitly opt in? | Opt-in: services mark responses with `type: SUCCESS` explicitly |
| 2 | Should VALIDATION errors clear on `onChange` or only on next submit? | On next submit (less distracting) |
| 3 | Max toast display duration acceptable to product? | 5 000 ms; increase to 8 000 ms for multi-line messages |
| 4 | Is a `retryFn` in error modals desired for all errors or only network errors? | Network errors only (`NETWORK_ERROR`, `SERVER_ERROR` codes) |
