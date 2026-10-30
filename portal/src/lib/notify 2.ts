/** Best-effort email via Formspree. Failures are swallowed by callers. */

export async function sendPortalEmail(payload: {
  subject: string;
  toEmail?: string;
  fields: Record<string, string | number | boolean | undefined | null>;
}) {
  const endpoint = process.env.FORMSPREE_ENDPOINT || "https://formspree.io/f/xnjenyao";
  const body: Record<string, unknown> = {
    ...payload.fields,
    _subject: payload.subject,
    form_type: String(payload.fields.form_type || "Portal notification"),
  };
  if (payload.toEmail) {
    body.email = payload.toEmail;
    body._replyto = payload.toEmail;
    body.recipient_hint = payload.toEmail;
  }

  await fetch(endpoint, {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}
