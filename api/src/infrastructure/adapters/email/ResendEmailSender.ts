import { Resend } from 'resend';
import { EmailSender } from '@/domain/repositories/EmailSender';
import { VerificationEmail } from '@/infrastructure/emails/VerificationEmail';
import { PasswordResetEmail } from '@/infrastructure/emails/PasswordResetEmail';
import { getFrontendBaseUrl } from '@/domain/utils/frontendUrl';
import { t } from '@/infrastructure/i18n';

/** Hosted logo URL - email clients block base64, so we use the frontend's public logo. */
function getLogoUrl(): string {
  const custom = process.env.LOGO_URL?.trim();
  if (custom) return custom;
  return `${getFrontendBaseUrl()}/app-icon.svg`;
}

export class ResendEmailSender implements EmailSender {
  private resend: Resend;
  private from: string;

  constructor(apiKey?: string, from?: string) {
    this.resend = new Resend(apiKey || process.env.RESEND_API_KEY);
    this.from = from || process.env.EMAIL_FROM || 'App Scaffold <onboarding@resend.dev>';
  }

  async sendVerificationCode(to: string, code: string, subject?: string, locale?: string | null): Promise<void> {
    const baseUrl = getFrontendBaseUrl();
    const verifyUrl = `${baseUrl}/login/email?step=verify&email=${encodeURIComponent(to)}&code=${code}`;
    const logoUrl = getLogoUrl();
    const translations = {
      tagline: t(locale, 'app.tagline'),
      verifyTitle: t(locale, 'email.verifyTitle'),
      useCode: t(locale, 'email.useCode'),
      orClick: t(locale, 'email.orClick'),
      verifyButton: t(locale, 'email.verifyButton'),
      codesExpire: t(locale, 'email.codesExpire'),
      ignoreIfNotRequested: t(locale, 'email.ignoreIfNotRequested'),
    };

    const { error } = await this.resend.emails.send({
      from: this.from,
      to: [to],
      subject: subject || t(locale, 'email.verifySubject'),
      react: VerificationEmail({ code, verifyUrl, logoUrl, translations }),
    });

    if (error) {
      throw new Error(`Failed to send verification email: ${error.message}`);
    }
  }

  async sendPasswordReset(to: string, resetUrl: string, subject?: string, locale?: string | null): Promise<void> {
    const logoUrl = getLogoUrl();
    const translations = {
      tagline: t(locale, 'app.tagline'),
      resetTitle: t(locale, 'email.resetTitle'),
      resetClick: t(locale, 'email.resetClick'),
      resetButton: t(locale, 'email.resetButton'),
      linkExpires: t(locale, 'email.linkExpires'),
      ignoreIfNotRequested: t(locale, 'email.ignoreIfNotRequested'),
    };

    const { error } = await this.resend.emails.send({
      from: this.from,
      to: [to],
      subject: subject || t(locale, 'email.resetSubject'),
      react: PasswordResetEmail({ resetUrl, logoUrl, translations }),
    });

    if (error) {
      throw new Error(`Failed to send password reset email: ${error.message}`);
    }
  }
}
