import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Img,
  Heading,
  Text,
  Link,
} from '@react-email/components';

export interface VerificationEmailTranslations {
  tagline: string;
  verifyTitle: string;
  useCode: string;
  orClick: string;
  verifyButton: string;
  codesExpire: string;
  ignoreIfNotRequested: string;
}

const DEFAULT_VERIFY: VerificationEmailTranslations = {
  tagline: 'A reusable application scaffold',
  verifyTitle: 'Verify your email',
  useCode: 'Use this code to verify your account:',
  orClick: 'Or click the button below:',
  verifyButton: 'Verify my email',
  codesExpire: 'Codes expire in 15 minutes.',
  ignoreIfNotRequested: "If you didn't request this, you can ignore this email.",
};

export interface VerificationEmailProps {
  code: string;
  verifyUrl: string;
  logoUrl: string;
  translations?: Partial<VerificationEmailTranslations>;
}

export function VerificationEmail({ code, verifyUrl, logoUrl, translations }: VerificationEmailProps) {
  const t = { ...DEFAULT_VERIFY, ...translations };
  return (
    <Html lang="en">
      <Head>
        <style>{`
          @keyframes shakeThenPause {
            0%, 100% { transform: translateX(0) rotate(0deg); }
            5%, 15%, 25% { transform: translateX(-2px) rotate(-3deg); }
            10%, 20%, 30% { transform: translateX(2px) rotate(3deg); }
            35%, 100% { transform: translateX(0) rotate(0deg); }
          }
          .logo-shake {
            animation: shakeThenPause 4s ease-in-out infinite;
            display: inline-block;
          }
          @media (prefers-reduced-motion: reduce) {
            .logo-shake { animation: none; }
          }
        `}</style>
      </Head>
      <Body
        style={{
          margin: 0,
          padding: 0,
          fontFamily: "'Nunito', 'Poppins', 'Helvetica', 'Arial', sans-serif",
          backgroundColor: '#F0F2FF',
          minHeight: '100vh',
        }}
      >
        <Container
          style={{
            width: '100%',
            backgroundColor: '#F0F2FF',
            padding: '40px 20px',
          }}
        >
          <Section
            style={{
              maxWidth: 440,
              width: '100%',
              margin: '0 auto',
              backgroundColor: '#FFFFFF',
              borderRadius: 24,
              border: '1px solid rgba(26,26,46,0.08)',
              boxShadow: '0 2px 16px rgba(26,26,46,0.1)',
              overflow: 'hidden',
            }}
          >
            <Section style={{ padding: '40px 32px', textAlign: 'center' as const }}>
              <div className="logo-shake" style={{ marginBottom: 24 }}>
                <Img
                  src={logoUrl || ''}
                  alt="App Scaffold"
                  width={80}
                  height={80}
                  style={{
                    display: 'block',
                    margin: '0 auto',
                    width: 80,
                    height: 'auto',
                  }}
                />
              </div>
              <Heading
                style={{
                  margin: '0 0 8px',
                  fontSize: 28,
                  fontWeight: 800,
                  color: '#1A1A2E',
                  letterSpacing: '-0.02em',
                }}
              >
                App Scaffold
              </Heading>
              <Text
                style={{
                  margin: '0 0 32px',
                  fontSize: 15,
                  color: '#5C5F8A',
                  lineHeight: 1.5,
                }}
              >
                {t.tagline}
              </Text>

              <Heading
                as="h2"
                style={{
                  margin: '0 0 16px',
                  fontSize: 20,
                  fontWeight: 700,
                  color: '#1A1A2E',
                }}
              >
                {t.verifyTitle}
              </Heading>
              <Text
                style={{
                  margin: '0 0 24px',
                  fontSize: 16,
                  color: '#5C5F8A',
                  lineHeight: 1.6,
                }}
              >
                {t.useCode}
              </Text>
              <Text
                style={{
                  margin: '0 0 24px',
                  fontSize: 28,
                  fontWeight: 700,
                  letterSpacing: 6,
                  color: '#1A1A2E',
                }}
              >
                {code}
              </Text>
              <Text
                style={{
                  margin: '0 0 24px',
                  fontSize: 15,
                  color: '#5C5F8A',
                }}
              >
                {t.orClick}
              </Text>
              <Link
                href={verifyUrl}
                style={{
                  display: 'inline-block',
                  marginTop: 8,
                  padding: '14px 32px',
                  backgroundColor: '#FF3D5A',
                  color: '#FFFFFF',
                  textDecoration: 'none',
                  borderRadius: 50,
                  fontWeight: 700,
                  fontSize: 16,
                  boxShadow: '0 4px 20px rgba(255,61,90,0.4)',
                }}
              >
                {t.verifyButton}
              </Link>

              <Text
                style={{
                  margin: '32px 0 0',
                  fontSize: 13,
                  color: '#5C5F8A',
                }}
              >
                {t.codesExpire}
              </Text>
              <Text
                style={{
                  margin: '8px 0 0',
                  fontSize: 13,
                  color: '#5C5F8A',
                }}
              >
                {t.ignoreIfNotRequested}
              </Text>
            </Section>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export default VerificationEmail;
