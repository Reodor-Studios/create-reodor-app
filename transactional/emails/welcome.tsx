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

interface WelcomeEmailProps {
  logoUrl?: string;
  userName?: string;
  userId?: string;
}

export const WelcomeEmail = ({
  logoUrl = `${baseUrl}/logo-email.png`,
  userName = "User",
  userId = "123",
}: WelcomeEmailProps) => {
  const previewText = `Velkommen til ${companyConfig.name}! ${companyConfig.shortDescription}`;
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

          {/* Welcome Header */}
          <Heading style={heading}>Velkommen til {companyConfig.name}!</Heading>

          <Text style={welcomeText}>
            Hei {userName}! Vi er så glade for å ha deg med oss på reisen. Du
            har nå tilgang til {companyConfig.shortDescription}.
          </Text>

          {/* Getting Started Section */}
          <Section style={gettingStartedSection}>
            <Text style={sectionHeader}>Kom i gang på 3 enkle steg:</Text>

            <div style={stepContainer}>
              <div style={stepNumber}>1</div>
              <div style={stepContent}>
                <Text style={stepTitle}>WELCOME_STEP_1_TITLE</Text>
                <Text style={stepDescription}>WELCOME_STEP_1_DESCRIPTION</Text>
              </div>
            </div>

            <div style={stepContainer}>
              <div style={stepNumber}>2</div>
              <div style={stepContent}>
                <Text style={stepTitle}>WELCOME_STEP_2_TITLE</Text>
                <Text style={stepDescription}>WELCOME_STEP_2_DESCRIPTION</Text>
              </div>
            </div>

            <div style={stepContainer}>
              <div style={stepNumber}>3</div>
              <div style={stepContent}>
                <Text style={stepTitle}>WELCOME_STEP_3_TITLE</Text>
                <Text style={stepDescription}>WELCOME_STEP_3_DESCRIPTION</Text>
              </div>
            </div>
          </Section>

          {/* CTA Button */}
          <Section style={ctaSection}>
            <Text style={ctaText}>WELCOME_CTA_TEXT</Text>
            <Button style={button} href={`${baseUrl}/`}>
              WELCOME_CTA_BUTTON
            </Button>
          </Section>

          <Hr style={hr} />

          {/* Tips Section */}
          <Section style={tipsSection}>
            <Text style={tipsHeader}>
              Tips for å få mest ut av {companyConfig.name}:
            </Text>
            <Text style={tipsText}>WELCOME_TIPS_TEXT</Text>
          </Section>

          {/* Support Section */}
          <Section style={supportSection}>
            <Text style={supportHeader}>Trenger du hjelp?</Text>
            <Text style={supportText}>
              Vårt kundeserviceteam er her for å hjelpe deg.
            </Text>
            <Text style={supportContact}>
              {" "}
              <Link
                href={`mailto:${companyConfig.supportEmail}`}
                style={supportLink}
              >
                {companyConfig.supportEmail}
              </Link>
            </Text>
          </Section>

          <Hr style={hr} />

          <Text style={footer}>
            <Link href={baseUrl} target="_blank" style={footerLink}>
              {companyConfig.domain}
            </Link>
            <br />
            <span style={footerTagline}>{companyConfig.tagline}</span>
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

WelcomeEmail.PreviewProps = {
  logoUrl: "https://example.com/logo-email.png",
  userName: "John Doe",
  userId: "123",
} as WelcomeEmailProps;

export default WelcomeEmail;

// Base styles
const main = baseStyles.main;
const container = baseStyles.container;
const logoContainer = baseStyles.logoContainer;
const logo = baseStyles.logo;
const heading = baseStyles.heading;
const hr = baseStyles.hr;
const footer = baseStyles.footer;

const welcomeText = {
  ...baseStyles.paragraph,
  fontSize: "18px",
  textAlign: "center" as const,
  color: colors.foreground,
  marginBottom: "32px",
};

// Getting Started Section
const gettingStartedSection = {
  ...sectionStyles.infoSection,
  padding: "32px 24px",
};

const sectionHeader = {
  ...textStyles.sectionHeader,
  textAlign: "center" as const,
  marginBottom: "24px",
};

const stepContainer = {
  display: "flex",
  alignItems: "flex-start",
  gap: "16px",
  marginBottom: "24px",
};

const stepNumber = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: "40px",
  height: "40px",
  backgroundColor: colors.primary,
  color: colors.white,
  borderRadius: "50%",
  fontSize: "18px",
  fontWeight: "bold",
  flexShrink: 0,
};

const stepContent = {
  flex: 1,
};

const stepTitle = {
  fontSize: "16px",
  fontWeight: "600",
  color: colors.foreground,
  margin: "0 0 4px 0",
};

const stepDescription = {
  fontSize: "14px",
  color: colors.mutedForeground,
  margin: "0",
  lineHeight: "1.5",
};

// CTA Section
const ctaSection = sectionStyles.actionSection;

const ctaText = {
  fontSize: "18px",
  color: colors.foreground,
  margin: "0 0 16px 0",
  fontWeight: "500",
};

const button = buttonStyles.primary;

// Stylist Section
const stylistSection = {
  ...sectionStyles.detailsSection,
  textAlign: "center" as const,
  margin: "32px 0",
};

const stylistHeader = {
  fontSize: "20px",
  fontWeight: "600",
  color: colors.secondaryForeground,
  margin: "0 0 12px 0",
};

const stylistText = {
  fontSize: "15px",
  color: colors.secondaryForeground,
  margin: "0 0 16px 0",
  lineHeight: "1.6",
};

const stylistBenefits = {
  margin: "20px 0",
};

const benefitItem = {
  fontSize: "14px",
  color: colors.secondaryForeground,
  margin: "4px 0",
  display: "block",
};

const stylistButton = {
  ...buttonStyles.primary,
  backgroundColor: colors.secondaryForeground,
  fontSize: "14px",
  padding: "12px 24px",
};

// Tips Section
const tipsSection = sectionStyles.tipsSection;
const tipsHeader = textStyles.tipsHeader;
const tipsText = textStyles.tipsText;

// Support Section
const supportSection = {
  margin: "32px 0",
  padding: "20px",
  backgroundColor: colors.accent,
  borderRadius: "10px",
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

// Settings Section
const settingsSection = sectionStyles.settingsSection;
const settingsText = textStyles.settingsText;
const settingsLink = textStyles.settingsLink;

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
