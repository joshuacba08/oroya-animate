import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';
import { supportedLanguages, type SupportedLanguage } from '../i18n';

const languageLabels: Record<SupportedLanguage, string> = {
  en: 'EN',
  es: 'ES',
  ja: 'JA',
};

const containerStyles: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  padding: '8px 12px',
  borderTop: '1px solid rgba(255,255,255,0.06)',
  flexShrink: 0,
};

const buttonStyles: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '32px',
  height: '26px',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '6px',
  background: 'transparent',
  color: 'rgba(255,255,255,0.4)',
  fontSize: '10px',
  fontWeight: 600,
  fontFamily: "'JetBrains Mono', monospace",
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  letterSpacing: '0.02em',
};

const activeButtonStyles: React.CSSProperties = {
  ...buttonStyles,
  background: 'rgba(108,138,255,0.15)',
  borderColor: 'rgba(108,138,255,0.4)',
  color: '#a0b8ff',
};

export function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const currentLang = i18n.language?.substring(0, 2) as SupportedLanguage;

  return (
    <div style={containerStyles}>
      <Globe
        size={13}
        strokeWidth={1.8}
        style={{ color: 'rgba(255,255,255,0.2)', flexShrink: 0 }}
      />
      {supportedLanguages.map((lang) => (
        <button
          key={lang}
          onClick={() => i18n.changeLanguage(lang)}
          style={currentLang === lang ? activeButtonStyles : buttonStyles}
          title={i18n.t(`common:languages.${lang}`)}
        >
          {languageLabels[lang]}
        </button>
      ))}
    </div>
  );
}
