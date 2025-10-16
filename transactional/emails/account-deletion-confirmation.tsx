import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import {
  baseStyles,
  sectionStyles,
  textStyles,
  buttonStyles,
  colors,
} from "./utils/styles";
import { baseUrl, getLogoDimensions } from "./utils";
import { companyConfig } from "../../lib/brand";

interface AccountDeletionConfirmationEmailProps {
  logoUrl?: string;
  userName?: string;
  userId?: string;
  confirmationToken?: string;
}

export const AccountDeletionConfirmationEmail = ({
  logoUrl = `${baseUrl}/logo-email.png`,
  userName = "Ola Nordmann",
  userId = "123",
  confirmationToken = "abc123",
}: AccountDeletionConfirmationEmailProps) => {
  const previewText = `Bekreft sletting av din ${companyConfig.name}-konto`;
  const confirmationUrl = `${baseUrl}/auth/delete-account/confirm?token=${confirmationToken}&userId=${userId}`;

  const { width, height } = getLogoDimensions();

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Logo Section */}
          <Section style={logoContainer}>
            <Img
              src={logoUrl}
              width={width}
              height={height}
              alt={companyConfig.name}
              style={logo}
            />
          </Section>

          {/* Warning Header */}
          <Section style={warningSection}>
            <Heading style={heading}>Bekreft sletting av konto</Heading>
          </Section>

          <Text style={introText}>
            Hei, {userName}! Vi har mottatt en forespørsel om å slette din
            {companyConfig.name}-konto. Dette er en permanent handling som ikke kan
            angres.
          </Text>

          {/* What will be deleted Section */}
          <Section style={deletionDetailsSection}>
            <Text style={sectionHeader}>Hva som vil bli slettet:</Text>

            <div style={deletionItem}>
              <div style={bulletPoint}>•</div>
              <Text style={deletionText}>
                Din personlige profil og kontoinformasjon
              </Text>
            </div>

            <div style={deletionItem}>
              <div style={bulletPoint}>•</div>
              <Text style={deletionText}>
                Alle dine bestillinger og historikk
              </Text>
            </div>

            <div style={deletionItem}>
              <div style={bulletPoint}>•</div>
              <Text style={deletionText}>Meldinger og samtaler</Text>
            </div>

            <div style={deletionItem}>
              <div style={bulletPoint}>•</div>
              <Text style={deletionText}>
                Anmeldelser og vurderinger du har gitt
              </Text>
            </div>

            <div style={deletionItem}>
              <div style={bulletPoint}>•</div>
              <Text style={deletionText}>
                Lagrede betalingsmetoder og adresser
              </Text>
            </div>
          </Section>

          {/* Confirmation CTA */}
          <Section style={ctaSection}>
            <Text style={ctaText}>
              Hvis du er sikker på at du vil slette kontoen din, klikk på
              knappen under:
            </Text>
            <Button style={dangerButton} href={confirmationUrl}>
              Ja, slett min konto permanent
            </Button>
          </Section>

          {/* Alternative Section */}
          <Section style={alternativeSection}>
            <Text style={alternativeHeader}>Ikke sikker?</Text>
            <Text style={alternativeText}>
              Hvis du bare trenger en pause eller har problemer med kontoen din,
              kan du kontakte oss i stedet. Vi kan hjelpe deg med å:
            </Text>
            <Text style={alternativeOptions}>
              • Deaktivere varslinger midlertidig
              <br />
              • Løse tekniske problemer
              <br />
              • Justere personverninnstillinger
              <br />• Endre kontoinformasjon
            </Text>
            <Button
              style={supportButton}
              href={`mailto:${companyConfig.supportEmail}`}
            >
              Kontakt kundeservice
            </Button>
          </Section>

          <Hr style={hr} />

          {/* Security Note */}
          <Section style={securitySection}>
            <Text style={securityHeader}>Sikkerhet</Text>
            <Text style={securityText}>
              Denne lenken er gyldig i 24 timer og kan kun brukes én gang. Hvis
              du ikke ba om å slette kontoen din, kan du ignorere denne
              e-posten.
            </Text>
            <Text style={securityText}>
              Hvis du tror noen andre har tilgang til kontoen din,{" "}
              <Link
                href={`mailto:${companyConfig.supportEmail}`}
                style={securityLink}
              >
                kontakt oss umiddelbart
              </Link>
              .
            </Text>
          </Section>

          {/* Support Section */}
          <Section style={supportSection}>
            <Text style={supportHeader}>Trenger du hjelp?</Text>
            <Text style={supportText}>
              Vårt kundeserviceteam er her for å hjelpe deg.
            </Text>
            <Text style={supportContact}>
              <Link
                href={`mailto:${companyConfig.supportEmail}`}
                style={supportLink}
              >
                {companyConfig.supportEmail}
              </Link>
            </Text>
          </Section>

          <Text style={footer}>
            <Link href={baseUrl} target="_blank" style={footerLink}>
              {companyConfig.domain}
            </Link>
            <br />
            <span style={footerTagline}>Vi savner deg allerede</span>
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

AccountDeletionConfirmationEmail.PreviewProps = {
  logoUrl: "https://example.com/logo-email.png",
  userName: "Ola Nordmann",
  userId: "123",
  confirmationToken: "abc123",
} as AccountDeletionConfirmationEmailProps;

export default AccountDeletionConfirmationEmail;

// Base styles
const main = baseStyles.main;
const container = baseStyles.container;
const logoContainer = baseStyles.logoContainer;
const logo = baseStyles.logo;
const heading = {
  ...baseStyles.heading,
  color: colors.destructive,
  marginTop: "0",
};
const hr = baseStyles.hr;
const footer = baseStyles.footer;

// Warning section
const warningSection = {
  textAlign: "center" as const,
  margin: "24px 0",
};

const warningIcon = {
  fontSize: "48px",
  marginBottom: "16px",
};

const introText = {
  ...baseStyles.paragraph,
  fontSize: "16px",
  textAlign: "center" as const,
  color: colors.foreground,
  marginBottom: "32px",
  lineHeight: "1.6",
};

// Deletion details section
const deletionDetailsSection = {
  ...sectionStyles.infoSection,
  padding: "24px",
  margin: "24px 0",
  backgroundColor: colors.muted,
  border: `1px solid ${colors.mutedForeground}30`,
  borderRadius: "8px",
};

const sectionHeader = {
  ...textStyles.sectionHeader,
  color: colors.foreground,
  marginBottom: "16px",
  fontSize: "16px",
  fontWeight: "600",
};

const deletionItem = {
  display: "flex",
  alignItems: "flex-start",
  gap: "8px",
  marginBottom: "8px",
};

const bulletPoint = {
  color: colors.mutedForeground,
  fontWeight: "bold",
  fontSize: "16px",
  lineHeight: "1.5",
  flexShrink: 0,
};

const deletionText = {
  fontSize: "14px",
  color: colors.foreground,
  margin: "0",
  lineHeight: "1.5",
};

// Active bookings warning
const activeBookingsWarning = {
  marginTop: "16px",
  padding: "12px",
  backgroundColor: colors.muted,
  borderRadius: "6px",
  border: `1px solid ${colors.mutedForeground}30`,
};

const warningText = {
  fontSize: "14px",
  color: colors.destructive,
  margin: "0",
  fontWeight: "500",
  lineHeight: "1.5",
};

// CTA Section
const ctaSection = {
  ...sectionStyles.actionSection,
  textAlign: "center" as const,
  margin: "32px 0",
};

const ctaText = {
  fontSize: "16px",
  color: colors.foreground,
  margin: "0 0 20px 0",
  fontWeight: "500",
};

const dangerButton = {
  backgroundColor: colors.destructive,
  borderRadius: "6px",
  color: colors.white,
  fontSize: "16px",
  fontWeight: "600",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "16px 32px",
  margin: "0 auto",
  border: "none",
};

// Alternative section
const alternativeSection = {
  ...sectionStyles.detailsSection,
  textAlign: "center" as const,
  margin: "32px 0",
  padding: "24px",
  backgroundColor: colors.accent,
  borderRadius: "8px",
};

const alternativeHeader = {
  fontSize: "18px",
  fontWeight: "600",
  color: colors.accentForeground,
  margin: "0 0 12px 0",
};

const alternativeText = {
  fontSize: "14px",
  color: colors.accentForeground,
  margin: "0 0 16px 0",
  lineHeight: "1.6",
};

const alternativeOptions = {
  fontSize: "14px",
  color: colors.accentForeground,
  margin: "0 0 20px 0",
  lineHeight: "1.8",
  textAlign: "left" as const,
};

const supportButton = {
  ...buttonStyles.primary,
  backgroundColor: colors.accentForeground,
  color: colors.accent,
  fontSize: "14px",
  padding: "12px 24px",
};

// Security Section
const securitySection = {
  margin: "24px 0",
  padding: "16px",
  backgroundColor: colors.muted,
  borderRadius: "6px",
};

const securityHeader = {
  fontSize: "14px",
  fontWeight: "600",
  color: colors.mutedForeground,
  margin: "0 0 8px 0",
};

const securityText = {
  fontSize: "12px",
  color: colors.mutedForeground,
  margin: "0 0 8px 0",
  lineHeight: "1.5",
};

const securityLink = {
  color: colors.primary,
  textDecoration: "none",
  fontWeight: "500",
};

// Support Section
const supportSection = {
  margin: "24px 0",
  padding: "20px",
  backgroundColor: colors.secondary,
  borderRadius: "8px",
  textAlign: "center" as const,
};

const supportHeader = {
  fontSize: "16px",
  fontWeight: "600",
  color: colors.secondaryForeground,
  margin: "0 0 12px 0",
};

const supportText = {
  fontSize: "14px",
  color: colors.secondaryForeground,
  margin: "0 0 12px 0",
  lineHeight: "1.5",
};

const supportContact = {
  fontSize: "14px",
  color: colors.secondaryForeground,
  margin: "0",
};

const supportLink = {
  color: colors.secondaryForeground,
  textDecoration: "none",
  fontWeight: "500",
};

const footerLink = {
  ...baseStyles.link,
  fontSize: "16px",
  fontWeight: "600",
};

const footerTagline = {
  color: colors.mutedForeground,
  fontSize: "12px",
  fontStyle: "italic",
};
