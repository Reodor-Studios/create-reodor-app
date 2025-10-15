import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import {
  baseStyles,
  sectionStyles,
  textStyles,
  layoutStyles,
} from "./utils/styles";
import { baseUrl, getLogoDimensions } from "./utils";
import { companyConfig } from "../../lib/brand";

interface ContactFormEmailProps {
  name: string;
  email: string;
  subject: string;
  message: string;
  adminName: string;
  logoUrl?: string;
}

export const ContactFormEmail = ({
  name,
  email,
  subject,
  message,
  adminName,
  logoUrl = `${baseUrl}/logo-email.png`,
}: ContactFormEmailProps) => {
  const { width, height } = getLogoDimensions();

  return (
    <Html>
      <Head />
      <Preview>Ny henvendelse fra {name} - {subject}</Preview>
      <Body style={baseStyles.main}>
        <Container style={baseStyles.container}>
          {/* Header */}
          <Section style={baseStyles.logoContainer}>
            <Img
              src={logoUrl}
              width={width}
              height={height}
              alt={companyConfig.name}
              style={baseStyles.logo}
            />
          </Section>

          <Heading style={baseStyles.heading}>
            Ny henvendelse mottatt
          </Heading>

          <Text style={baseStyles.paragraph}>
            Hei {adminName},
          </Text>

          <Text style={baseStyles.paragraph}>
            Du har mottatt en ny henvendelse gjennom kontaktskjemaet på {companyConfig.name}.
          </Text>

          {/* Contact Details */}
          <Section style={sectionStyles.infoSection}>
            <Text style={textStyles.sectionHeader}>Kontaktinformasjon:</Text>

            <div style={layoutStyles.detailRow}>
              <Text style={textStyles.detailLabel}>Navn:</Text>
              <Text style={textStyles.detailValue}>{name}</Text>
            </div>

            <div style={layoutStyles.detailRow}>
              <Text style={textStyles.detailLabel}>E-post:</Text>
              <Text style={textStyles.detailValue}>{email}</Text>
            </div>

            <div style={layoutStyles.detailRow}>
              <Text style={textStyles.detailLabel}>Emne:</Text>
              <Text style={textStyles.detailValue}>{subject}</Text>
            </div>
          </Section>

          {/* Message Content */}
          <Section style={sectionStyles.messageSection}>
            <Text style={textStyles.messageHeader}>
              Melding:
            </Text>
            <Text style={textStyles.messageContent}>
              "{message}"
            </Text>
          </Section>

          <Text style={baseStyles.paragraph}>
            Vennligst svar på denne henvendelsen så snart som mulig.
          </Text>

          <Hr style={baseStyles.hr} />

          {/* Footer */}
          <Section>
            <Text style={baseStyles.footer}>
              Dette er en automatisk melding fra {companyConfig.name}
              <br />
              {companyConfig.address.company} • {companyConfig.supportEmail}
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default ContactFormEmail;