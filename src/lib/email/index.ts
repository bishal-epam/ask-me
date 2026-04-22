import { Resend } from 'resend'
import { getLogger } from '@/lib/logger'

const log = getLogger('email')
const resend = new Resend(process.env.RESEND_API_KEY!)

const FROM = `${process.env.RESEND_FROM_NAME ?? 'Ask Me'} <${process.env.RESEND_FROM_EMAIL ?? 'noreply@askme.app'}>`

interface SendEmailOptions {
  to: string | string[]
  subject: string
  html: string
  text?: string
  replyTo?: string
}

export async function sendEmail(opts: SendEmailOptions) {
  try {
    const payload = {
      from: FROM,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
      ...(opts.text !== undefined && { text: opts.text }),
      ...(opts.replyTo !== undefined && { replyTo: opts.replyTo }),
    }
    const result = await resend.emails.send(payload as Parameters<typeof resend.emails.send>[0])
    log.info({ id: result.data?.id, to: opts.to }, 'Email sent')
    return { ok: true, id: result.data?.id }
  } catch (err) {
    log.error({ err, to: opts.to }, 'Email failed')
    return { ok: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

// ─── Email templates ───────────────────────────────────────────────────

export function newChatNotification(opts: {
  ownerName: string
  visitorName: string | null
  personaTitle: string
  sessionUrl: string
}) {
  const visitor = opts.visitorName ?? 'Someone'
  return {
    subject: `${visitor} started a chat on your "${opts.personaTitle}" profile`,
    html: `
      <p>Hi ${opts.ownerName},</p>
      <p><strong>${visitor}</strong> just started a conversation on your <em>${opts.personaTitle}</em> Ask Me profile.</p>
      <p><a href="${opts.sessionUrl}" style="color:#c9a96e">View the conversation →</a></p>
      <hr/>
      <p style="color:#888;font-size:12px">Ask Me · Unsubscribe from these notifications in your settings</p>
    `,
    text: `${visitor} started a chat on your "${opts.personaTitle}" profile. View it: ${opts.sessionUrl}`,
  }
}

export function contactRequestNotification(opts: {
  ownerName: string
  requesterName: string
  requesterOrg: string | null
  subject: string
  message: string
  requestUrl: string
}) {
  const org = opts.requesterOrg ? ` from ${opts.requesterOrg}` : ''
  return {
    subject: `Contact request: ${opts.subject}`,
    html: `
      <p>Hi ${opts.ownerName},</p>
      <p><strong>${opts.requesterName}${org}</strong> has sent you a contact request.</p>
      <blockquote style="border-left:3px solid #c9a96e;padding-left:16px;color:#555">${opts.message}</blockquote>
      <p><a href="${opts.requestUrl}" style="color:#c9a96e">Review and respond →</a></p>
      <hr/>
      <p style="color:#888;font-size:12px">Ask Me · Unsubscribe from these notifications in your settings</p>
    `,
    text: `${opts.requesterName}${org} sent you a contact request: "${opts.message}". Review: ${opts.requestUrl}`,
  }
}

export function documentReadyNotification(opts: {
  ownerName: string
  documentName: string
  personaTitle: string
  dashboardUrl: string
}) {
  return {
    subject: `"${opts.documentName}" is ready on your ${opts.personaTitle} profile`,
    html: `
      <p>Hi ${opts.ownerName},</p>
      <p>Your document <strong>${opts.documentName}</strong> has been processed and is now searchable on your <em>${opts.personaTitle}</em> profile.</p>
      <p><a href="${opts.dashboardUrl}" style="color:#c9a96e">View your profile →</a></p>
    `,
    text: `"${opts.documentName}" is ready on your ${opts.personaTitle} profile. ${opts.dashboardUrl}`,
  }
}
