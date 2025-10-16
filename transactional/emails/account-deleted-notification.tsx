import {
  Body,
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
import { baseStyles, sectionStyles, textStyles, colors } from "./utils/styles";
import { baseUrl, getLogoDimensions } from "./utils";
import { companyConfig } from "../../lib/brand";

interface AccountDeletedNotificationEmailProps {
  logoUrl?: string;
  userName?: string;
  userEmail?: string;
}

export const AccountDeletedNotificationEmail = ({
  logoUrl = `${baseUrl}/logo-email.png`,
  userName = "Ola Nordmann",
  userEmail = "ola@example.com",
}: AccountDeletedNotificationEmailProps) => {
  const previewText = `Din ${companyConfig.name}-konto er nå permanent slettet`;
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

          {/* Confirmation Header */}
          <Section style={confirmationSection}>
            <Heading style={heading}>Konto slettet</Heading>
          </Section>

          <Text style={confirmationText}>
            Hei, {userName}! Din {companyConfig.name}-konto ({userEmail}) er nå
            permanent slettet som forespurt.
          </Text>

          {/* What was deleted Section */}
          <Section style={deletedItemsSection}>
            <Text style={sectionHeader}>
              Følgende data er permanent fjernet:
            </Text>

            <div style={deletedItem}>
              <div style={checkBullet}>✓</div>
              <Text style={deletedText}>
                Din personlige profil og kontoinformasjon
              </Text>
            </div>

            <div style={deletedItem}>
              <div style={checkBullet}>✓</div>
              <Text style={deletedText}>Alle bestillinger og historikk</Text>
            </div>

            <div style={deletedItem}>
              <div style={checkBullet}>✓</div>
              <Text style={deletedText}>Meldinger og samtaler</Text>
            </div>

            <div style={deletedItem}>
              <div style={checkBullet}>✓</div>
              <Text style={deletedText}>Anmeldelser og vurderinger</Text>
            </div>

            <div style={deletedItem}>
              <div style={checkBullet}>✓</div>
              <Text style={deletedText}>
                Lagrede betalingsmetoder og adresser
              </Text>
            </div>
          </Section>

          {/* Thank you section */}
          <Section style={thankYouSection}>
            <Text style={thankYouHeader}>Takk for tiden med oss</Text>
            <Text style={thankYouText}>
              Vi setter pris på at du valgte {companyConfig.name}. Vi håper
              opplevelsen din var positiv, selv om du har besluttet å forlate
              oss nå.
            </Text>
            <Text style={thankYouText}>
              Hvis du noen gang bestemmer deg for å komme tilbake, er du alltid
              velkommen til å opprette en ny konto. Vi vil være her for å hjelpe
              deg.
            </Text>
          </Section>

          <Hr style={hr} />

          {/* Future section */}
          <Section style={futureSection}>
            <Text style={futureHeader}>Vil du komme tilbake?</Text>
            <Text style={futureText}>
              Du kan når som helst opprette en ny konto på {companyConfig.domain}.
              Merk at du må starte fra bunnen av siden all tidligere data er
              slettet.
            </Text>
            <Text style={futureText}>
              Vi vil fortsatt være klare til å hjelpe deg.
            </Text>
          </Section>

          {/* Data retention note */}
          <Section style={dataSection}>
            <Text style={dataHeader}>Personvern og datasikkerhet</Text>
            <Text style={dataText}>
              I henhold til GDPR er all personlig informasjon knyttet til din
              konto permanent slettet fra våre systemer. Noen anonyme data kan
              fortsatt eksistere for statistiske formål, men disse kan ikke
              knyttes til deg personlig.
            </Text>
            <Text style={dataText}>
              Hvis du har spørsmål om datasletting eller personvern, kan du
              kontakte oss på {companyConfig.supportEmail}.
            </Text>
          </Section>

          <Hr style={hr} />

          {/* Final support section */}
          <Section style={supportSection}>
            <Text style={supportHeader}>Har du spørsmål?</Text>
            <Text style={supportText}>
              Selv om kontoen din er slettet, kan du fortsatt kontakte oss hvis
              du har spørsmål om sletteprosessen eller trenger hjelp.
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

          {/* Farewell footer */}
          <Text style={footer}>
            <Link href={baseUrl} target="_blank" style={footerLink}>
              {companyConfig.domain}
            </Link>
            <br />
            <span style={footerTagline}>
              Ha det bra, og takk for alt! Vi savner deg allerede.
            </span>
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

AccountDeletedNotificationEmail.PreviewProps = {
  logoUrl: "https://example.com/logo-email.png",
  userName: "Ola Nordmann",
  userEmail: "ola@example.com",
} as AccountDeletedNotificationEmailProps;

export default AccountDeletedNotificationEmail;

// Base styles
const main = baseStyles.main;
const container = baseStyles.container;
const logoContainer = baseStyles.logoContainer;
const logo = baseStyles.logo;
const heading = {
  ...baseStyles.heading,
  color: colors.foreground,
  marginTop: "0",
};
const hr = baseStyles.hr;
const footer = baseStyles.footer;

// Confirmation section
const confirmationSection = {
  textAlign: "center" as const,
  margin: "24px 0",
};

const checkmarkIcon = {
  fontSize: "48px",
  color: colors.primary,
  marginBottom: "16px",
};

const confirmationText = {
  ...baseStyles.paragraph,
  fontSize: "16px",
  textAlign: "center" as const,
  color: colors.foreground,
  marginBottom: "32px",
  lineHeight: "1.6",
};

// Deleted items section
const deletedItemsSection = {
  ...sectionStyles.infoSection,
  padding: "24px",
  margin: "24px 0",
  backgroundColor: colors.accent,
  borderRadius: "8px",
};

const sectionHeader = {
  ...textStyles.sectionHeader,
  color: colors.accentForeground,
  marginBottom: "16px",
  fontSize: "16px",
  fontWeight: "600",
};

const deletedItem = {
  display: "flex",
  alignItems: "flex-start",
  gap: "8px",
  marginBottom: "8px",
};

const checkBullet = {
  color: colors.primary,
  fontWeight: "bold",
  fontSize: "16px",
  lineHeight: "1.5",
  flexShrink: 0,
};

const deletedText = {
  fontSize: "14px",
  color: colors.accentForeground,
  margin: "0",
  lineHeight: "1.5",
};

// Thank you section
const thankYouSection = {
  ...sectionStyles.detailsSection,
  textAlign: "center" as const,
  margin: "32px 0",
  padding: "24px",
  backgroundColor: colors.secondary,
  borderRadius: "8px",
};

const thankYouHeader = {
  fontSize: "20px",
  fontWeight: "600",
  color: colors.secondaryForeground,
  margin: "0 0 16px 0",
};

const thankYouText = {
  fontSize: "15px",
  color: colors.secondaryForeground,
  margin: "0 0 16px 0",
  lineHeight: "1.6",
};

// Future section
const futureSection = {
  margin: "32px 0",
  textAlign: "center" as const,
};

const futureHeader = {
  fontSize: "18px",
  fontWeight: "600",
  color: colors.foreground,
  margin: "0 0 12px 0",
};

const futureText = {
  fontSize: "14px",
  color: colors.mutedForeground,
  margin: "0 0 16px 0",
  lineHeight: "1.6",
};

// Data section
const dataSection = {
  margin: "24px 0",
  padding: "16px",
  backgroundColor: colors.muted,
  borderRadius: "6px",
};

const dataHeader = {
  fontSize: "14px",
  fontWeight: "600",
  color: colors.mutedForeground,
  margin: "0 0 12px 0",
};

const dataText = {
  fontSize: "12px",
  color: colors.mutedForeground,
  margin: "0 0 12px 0",
  lineHeight: "1.5",
};

// Support Section
const supportSection = {
  margin: "24px 0",
  padding: "20px",
  backgroundColor: colors.accent,
  borderRadius: "8px",
  textAlign: "center" as const,
};

const supportHeader = {
  fontSize: "16px",
  fontWeight: "600",
  color: colors.accentForeground,
  margin: "0 0 12px 0",
};

const supportText = {
  fontSize: "14px",
  color: colors.accentForeground,
  margin: "0 0 12px 0",
  lineHeight: "1.5",
};

const supportContact = {
  fontSize: "14px",
  color: colors.accentForeground,
  margin: "0",
};

const supportLink = {
  color: colors.accentForeground,
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
