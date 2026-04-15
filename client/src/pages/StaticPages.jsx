import { Link } from 'react-router-dom';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { pageTitle } from '../siteMeta';

export function HelpPage() {
  useDocumentTitle(pageTitle('Help'));

  return (
    <article className="page-static">
      <h1>Help center</h1>
      <p className="static-lead">
        Quick answers for buyers and sellers on TechTregu. This is starter content you can replace with real
        policies and FAQs.
      </p>
      <section className="static-section">
        <h2>Buying</h2>
        <ul>
          <li>Use search and categories on the home page to narrow listings.</li>
          <li>Open a listing for full specs, price in EUR, and seller details.</li>
          <li>Contact sellers via email from the listing page (in-app messaging can be wired to /api/messages).</li>
        </ul>
      </section>
      <section className="static-section">
        <h2>Selling</h2>
        <ul>
          <li>
            <Link to="/register">Create an account</Link>, then use <Link to="/new-listing">New listing</Link> to
            publish items.
          </li>
          <li>Add a clear title, honest condition, and an image URL so buyers trust the listing.</li>
          <li>Update your <Link to="/login">profile</Link> so buyers can see your location and verification status.</li>
        </ul>
      </section>
      <p className="static-footer-note">
        <Link to="/">← Back to listings</Link>
      </p>
    </article>
  );
}

export function PrivacyPage() {
  useDocumentTitle(pageTitle('Privacy'));

  return (
    <article className="page-static">
      <h1>Privacy policy</h1>
      <p className="static-meta">Last updated: April 2026 · Placeholder for your legal review.</p>
      <section className="static-section">
        <h2>What we collect</h2>
        <p>
          Accounts may store email, name, username, optional phone, location, and listings you create. JWT tokens
          keep you signed in in this demo app; configure production cookies and HTTPS appropriately.
        </p>
      </section>
      <section className="static-section">
        <h2>How we use data</h2>
        <p>
          Data is used to run the marketplace: show listings, attribute them to sellers, and authenticate requests.
          Replace this section with your jurisdiction-specific text (GDPR, etc.) before launch.
        </p>
      </section>
      <p className="static-footer-note">
        <Link to="/">← Back to listings</Link>
      </p>
    </article>
  );
}

export function TermsPage() {
  useDocumentTitle(pageTitle('Terms'));

  return (
    <article className="page-static">
      <h1>Terms of use</h1>
      <p className="static-meta">Last updated: April 2026 · Placeholder for your legal review.</p>
      <section className="static-section">
        <h2>Marketplace rules</h2>
        <p>
          Listings must describe real items accurately. Prohibited goods, scams, and harassment are not allowed.
          TechTregu is provided as-is in this starter project; production terms should be drafted with counsel.
        </p>
      </section>
      <section className="static-section">
        <h2>Liability</h2>
        <p>
          Transactions are between buyers and sellers. This demo does not process payments. Add dispute and
          limitation clauses suitable for your business.
        </p>
      </section>
      <p className="static-footer-note">
        <Link to="/">← Back to listings</Link>
      </p>
    </article>
  );
}
