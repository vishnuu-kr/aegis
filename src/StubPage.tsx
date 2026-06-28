import type { StubSlug } from './routes'
import { STUB_ROUTES } from './routes'

type CopyBlock = {
  heading: string
  paragraphs: string[]
}

const COPY: Record<StubSlug, CopyBlock> = {
  'case-studies': {
    heading: 'Case Studies',
    paragraphs: [
      'Customer case studies are being prepared for public release.',
      'If you operate an autonomous-agent deployment and would like to be featured, email hello@agenttag.ai with a short description of your agent fleet and the control you would expect.',
    ],
  },
  blog: {
    heading: 'Blog & Insights',
    paragraphs: [
      'Field notes on cryptographic mandates, MCP policy surfaces, and real-world governance of autonomous AI agents.',
      'New writing appears here when published — never before. Subscribe at the footer for launch announcements.',
    ],
  },
  research: {
    heading: 'Research',
    paragraphs: [
      'Notes, drafts, and references on the Aegis Control Plane primitives: Ed25519 DIDs, hash-chained audit ledgers, mandate signing, and step-up human-in-the-loop controls.',
      'Working papers and threat models are released as we ship each primitive.',
    ],
  },
  terms: {
    heading: 'Terms of Service',
    paragraphs: [
      'These Terms of Service govern your use of the AgentTag.ai product and the agenttag.ai website operated by AgentTag.ai ("we", "us").',
      'By accessing or using the Service you agree to be bound by these Terms. The Service is currently offered as a free public beta; beta participants receive the same protections as paid customers with respect to data handling and availability.',
      'You may not use the Service to violate any applicable law or regulation, to issue unauthorized instructions to autonomous agents, or to circumvent the policy engine.',
      'For the complete agreement, contact us at hello@agenttag.ai or send postal correspondence to the address listed at the bottom of this page.',
    ],
  },
  privacy: {
    heading: 'Privacy Policy',
    paragraphs: [
      'We collect the minimum information needed to operate the Service: an email address when you sign in or subscribe, and operational telemetry required to deliver, secure, and improve the product.',
      'We do not sell personal data. We do not share agent-derived content with third parties except at your explicit direction through the audit-ledger export.',
      'Cryptographic identifiers (DIDs, passport material) are stored in encrypted form and never transmitted to advertising networks.',
      'For the full privacy notice, including data-subject rights and contact procedures, email privacy@agenttag.ai.',
    ],
  },
  'data-tos': {
    heading: 'Data Platform Terms of Service',
    paragraphs: [
      'These Data Platform Terms apply to your use of AgentTag data-processing services such as the audit-ledger export, mandate synchronisation, and historical analytics.',
      'You retain ownership of agent-derived content. We process content only to provide the Service you request and only for the duration required to deliver that Service.',
      'We will never train third-party models on your content and will disclose any sub-processor changes at least 30 days in advance.',
      'For the complete Data Platform Terms, including security and confidentiality commitments, email dpa@agenttag.ai.',
    ],
  },
}

export default function StubPage({ slug }: { slug: StubSlug }) {
  const block = COPY[slug]
  return (
    <main
      id="main"
      style={{
        maxWidth: 760,
        margin: '0 auto',
        padding: '160px 32px 96px',
        color: 'var(--ink)',
        fontFamily: 'inherit',
      }}
    >
      <a
        href={slug === (STUB_ROUTES as readonly string[])[0] ? '/' : `/#${slug}`}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          fontSize: 13,
          color: 'var(--muted)',
          textDecoration: 'none',
          marginBottom: 24,
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6"></polyline>
        </svg>
        Back home
      </a>

      <h1
        style={{
          fontSize: 48,
          lineHeight: 1.05,
          letterSpacing: '-0.02em',
          margin: '0 0 24px',
          fontFamily: "'Bricolage Grotesque', sans-serif",
          fontWeight: 700,
        }}
      >
        {block.heading}
      </h1>

      {block.paragraphs.map((p, i) => (
        <p
          key={i}
          style={{
            fontSize: 17,
            lineHeight: 1.65,
            color: 'var(--muted)',
            margin: '0 0 18px',
          }}
        >
          {p}
        </p>
      ))}

      <div
        style={{
          marginTop: 56,
          paddingTop: 24,
          borderTop: '1px solid var(--line)',
          fontSize: 13,
          color: 'var(--faint)',
        }}
      >
        AgentTag.ai · Free public beta · <a href="/#contact" style={{ color: 'inherit' }}>Contact</a>
      </div>
    </main>
  )
}
