import { Link } from 'react-router-dom';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { pageTitle } from '../siteMeta';
import { useI18n } from '../context/I18nProvider';

function BackLink() {
  const { t } = useI18n();
  return (
    <p className="static-footer-note">
      <Link to="/">&larr; {t('backToListings')}</Link>
    </p>
  );
}

export function HelpPage() {
  const { t } = useI18n();
  useDocumentTitle(pageTitle(t('helpCenter')));

  return (
    <article className="page-static">
      <h1>{t('helpCenter')}</h1>
      <p className="static-lead">
        {t('helpLead')} <a href="mailto:support@techtregu.com">{t('contactUs')}</a>.
      </p>

      <section className="static-section">
        <h2>{t('gettingStarted')}</h2>
        <p>{t('gettingStartedDesc')}</p>
      </section>

      <section className="static-section">
        <h2>{t('buying')}</h2>
        <ul>
          <li>{t('buying1')}</li>
          <li>{t('buying2')}</li>
          <li>{t('buying3')}</li>
          <li>{t('buying4')}</li>
          <li>{t('buying5')}</li>
        </ul>
      </section>

      <section className="static-section">
        <h2>{t('selling')}</h2>
        <ul>
          <li><Link to="/register">{t('selling1Create')}</Link> {t('selling1Text')}</li>
          <li><Link to="/new-listing">{t('selling2Create')}</Link> {t('selling2Text')}</li>
          <li>{t('selling3')}</li>
          <li>{t('selling4')}</li>
          <li>{t('selling5')}</li>
        </ul>
      </section>

      <section className="static-section">
        <h2>{t('safetyTips')}</h2>
        <ul>
          <li>{t('safety1')}</li>
          <li>{t('safety2')}</li>
          <li>{t('safety3')}</li>
          <li>{t('safety4')}</li>
          <li>{t('safety5')}</li>
        </ul>
      </section>

      <section className="static-section">
        <h2>{t('accountListings')}</h2>
        <ul>
          <li>{t('account1a')} <Link to="/my-listings">{t('myListings')}</Link> {t('account1b')}</li>
          <li>{t('account2a')} <Link to="/favorites">{t('favorites')}</Link> {t('account2b')}</li>
          <li>{t('account3')}</li>
          <li>{t('account4')}</li>
        </ul>
      </section>

      <section className="static-section">
        <h2>{t('messages')}</h2>
        <p>{t('messagesDesc1')} <Link to="/messages">{t('messages')}</Link> {t('messagesDesc2')}</p>
      </section>

      <BackLink />
    </article>
  );
}

export function PrivacyPage() {
  const { t } = useI18n();
  useDocumentTitle(pageTitle(t('privacyTitle')));

  return (
    <article className="page-static">
      <h1>{t('privacyTitle')}</h1>
      <p className="static-meta">{t('lastUpdated')}</p>

      <section className="static-section">
        <h2>{t('infoCollectHeading')}</h2>
        <p>{t('infoCollectIntro')}</p>
        <ul>
          <li>{t('infoCollect1')}</li>
          <li>{t('infoCollect2')}</li>
          <li>{t('infoCollect3')}</li>
          <li>{t('infoCollect4')}</li>
        </ul>
        <p>{t('infoCollectDesc')}</p>
      </section>

      <section className="static-section">
        <h2>{t('infoUseHeading')}</h2>
        <p>{t('infoUseIntro')}</p>
        <ul>
          <li>{t('infoUse1')}</li>
          <li>{t('infoUse2')}</li>
          <li>{t('infoUse3')}</li>
          <li>{t('infoUse4')}</li>
          <li>{t('infoUse5')}</li>
        </ul>
        <p>{t('infoUseFooter')}</p>
      </section>

      <section className="static-section">
        <h2>{t('dataSecurityHeading')}</h2>
        <p>{t('dataSecurity1')}</p>
        <p>{t('dataSecurity2')}</p>
      </section>

      <section className="static-section">
        <h2>{t('cookiesHeading')}</h2>
        <p>{t('cookiesDesc')}</p>
      </section>

      <section className="static-section">
        <h2>{t('rightsHeading')}</h2>
        <p>{t('rightsIntro')}</p>
        <ul>
          <li>{t('rights1')}</li>
          <li>{t('rights2')}</li>
          <li>{t('rights3')}</li>
          <li>{t('rights4')}</li>
          <li>{t('rights5')}</li>
        </ul>
        <p>{t('rightsFooter')}</p>
      </section>

      <section className="static-section">
        <h2>{t('retentionHeading')}</h2>
        <p>{t('retentionDesc')}</p>
      </section>

      <section className="static-section">
        <h2>{t('thirdPartyHeading')}</h2>
        <p>{t('thirdPartyIntro')}</p>
        <ul>
          <li>{t('thirdParty1')}</li>
          <li>{t('thirdParty2')}</li>
        </ul>
      </section>

      <section className="static-section">
        <h2>{t('changesHeading')}</h2>
        <p>{t('changesDesc')}</p>
      </section>

      <section className="static-section">
        <h2>{t('contactHeading')}</h2>
        <p>{t('contactPrivacyDesc')}</p>
      </section>

      <BackLink />
    </article>
  );
}

export function ContactPage() {
  const { t } = useI18n();
  useDocumentTitle(pageTitle(t('contactTitle')));

  return (
    <article className="page-static">
      <h1>{t('contactTitle')}</h1>
      <p className="static-meta">{t('contactLead')}</p>

      <section className="static-section">
        <h2>{t('contactEmailLabel')}</h2>
        <p>
          {t('contactEmailDesc')} <strong>support@techtregu.com</strong>
        </p>
      </section>

      <section className="static-section">
        <h2>{t('contactSupportLabel')}</h2>
        <p>{t('contactSupportDesc')}</p>
      </section>

      <section className="static-section">
        <h2>{t('contactPartnersLabel')}</h2>
        <p>
          {t('contactPartnersDesc')} <strong>partners@techtregu.com</strong>
        </p>
      </section>

      <section className="static-section">
        <h2>{t('contactLocationLabel')}</h2>
        <p>{t('contactLocationDesc')}</p>
      </section>

      <section className="static-section">
        <h2>{t('contactResponseLabel')}</h2>
        <p>{t('contactResponseDesc')}</p>
      </section>

      <BackLink />
    </article>
  );
}

export function TermsPage() {
  const { t } = useI18n();
  useDocumentTitle(pageTitle(t('termsTitle')));

  return (
    <article className="page-static">
      <h1>{t('termsTitle')}</h1>
      <p className="static-meta">{t('lastUpdated')}</p>

      <section className="static-section">
        <h2>{t('termsAcceptHeading')}</h2>
        <p>{t('termsAcceptDesc')}</p>
      </section>

      <section className="static-section">
        <h2>{t('termsAccountsHeading')}</h2>
        <p>{t('termsAccountsDesc')}</p>
      </section>

      <section className="static-section">
        <h2>{t('termsListingHeading')}</h2>
        <p>{t('termsListingDesc')}</p>
        <p>{t('termsProhibited')}</p>
        <ul>
          <li>{t('termsProhibited1')}</li>
          <li>{t('termsProhibited2')}</li>
          <li>{t('termsProhibited3')}</li>
          <li>{t('termsProhibited4')}</li>
        </ul>
      </section>

      <section className="static-section">
        <h2>{t('termsTransactionHeading')}</h2>
        <p>{t('termsTransactionDesc')}</p>
      </section>

      <section className="static-section">
        <h2>{t('termsConductHeading')}</h2>
        <p>{t('termsConductIntro')}</p>
        <ul>
          <li>{t('termsConduct1')}</li>
          <li>{t('termsConduct2')}</li>
          <li>{t('termsConduct3')}</li>
          <li>{t('termsConduct4')}</li>
        </ul>
      </section>

      <section className="static-section">
        <h2>{t('termsDisclaimerHeading')}</h2>
        <p>{t('termsDisclaimerDesc')}</p>
      </section>

      <section className="static-section">
        <h2>{t('contactHeading')}</h2>
        <p>{t('termsContactDesc')}</p>
      </section>

      <BackLink />
    </article>
  );
}
