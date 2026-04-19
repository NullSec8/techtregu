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
      <h1>Privacy Policy</h1>
      <p className="static-meta">Last updated: April 2026</p>
      <section className="static-section">
        <h2>What We Collect</h2>
        <p>
          We collect information you provide when creating an account: username, email, name, 
          phone number (optional), and location. We also collect data from listings you create 
          including product details, images, and pricing.
        </p>
      </section>
      <section className="static-section">
        <h2>How We Use Your Data</h2>
        <p>
          Your data is used to: authenticate your account, display your listings to other users, 
          enable communication between buyers and sellers, and improve our services. 
          We do not sell your personal information to third parties.
        </p>
      </section>
      <section className="static-section">
        <h2>Data Security</h2>
        <p>
          We use industry-standard security measures to protect your data. Passwords are encrypted 
          using bcrypt. Sessions are managed through secure JWT tokens.
        </p>
      </section>
      <section className="static-section">
        <h2>Your Rights</h2>
        <p>
          Under Kosovo data protection law and GDPR, you have the right to access, correct, or delete 
          your personal data. Contact us to exercise these rights.
        </p>
      </section>
      <section className="static-section">
        <h2>Cookies</h2>
        <p>
          We use cookies to keep you signed in. By using TechTregu, you agree to our use of 
          cookies for authentication purposes.
        </p>
      </section>
      <p className="static-footer-note">
        <Link to="/">← Back to listings</Link>
      </p>
    </article>
  );
}

export function ContactPage() {
  useDocumentTitle(pageTitle('Contact'));

  return (
    <article className="page-static">
      <h1>Contact Us</h1>
      <p className="static-meta">We'd love to hear from you</p>
      <section className="static-section">
        <h2>Email</h2>
        <p>
          For general inquiries: <strong>support@techtregu.com</strong>
        </p>
      </section>
      <section className="static-section">
        <h2>Support</h2>
        <p>
          For help with your account or listings, email us at <strong>support@techtregu.com</strong> 
          and include your username.
        </p>
      </section>
      <section className="static-section">
        <h2>Partnerships</h2>
        <p>
          For business partnerships or bulk sellers, contact: <strong>partners@techtregu.com</strong>
        </p>
      </section>
      <section className="static-section">
        <h2>Location</h2>
        <p>
          TechTregu is based in <strong>Prishtina, Kosovo</strong>. All item pickups 
          are arranged directly between buyers and sellers.
        </p>
      </section>
      <section className="static-section">
        <h2>Response Time</h2>
        <p>
          We typically respond within 24-48 hours on business days.
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
      <h1>Terms of Service</h1>
      <p className="static-meta">Last updated: April 2026</p>
      <section className="static-section">
        <h2>Acceptance of Terms</h2>
        <p>
          By using TechTregu, you agree to be bound by these terms. If you do not agree to these terms, 
          please do not use our platform.
        </p>
      </section>
      <section className="static-section">
        <h2>User Accounts</h2>
        <p>
          You must provide accurate information when creating an account. You are responsible for maintaining 
          the security of your account and password. You must be at least 16 years old to use TechTregu.
        </p>
      </section>
      <section className="static-section">
        <h2>Listing Rules</h2>
        <p>
          All listings must: accurately describe the item being sold, include clear photos, 
          state the actual condition (new, used, refurbished), and show the real price in EUR.
        </p>
        <p>Prohibited listings include:</p>
        <ul>
          <li>Stolen or illegal goods</li>
          <li>Counterfeit or pirated items</li>
          <li>Items that violate Kosovo or international law</li>
          <li>Services而非物理商品</li>
        </ul>
      </section>
      <section className="static-section">
        <h2>Transactions</h2>
        <p>
          TechTregu is a platform connecting buyers and sellers. We do not process payments 
          or handle shipping. All transactions are between the buyer and seller directly.
        </p>
      </section>
      <section className="static-section">
        <h2>Prohibited Conduct</h2>
        <p>You agree not to:</p>
        <ul>
          <li>Post false or misleading listings</li>
          <li>Harass or scam other users</li>
          <li>Attempt to bypass our safety features</li>
          <li>Use the platform for illegal purposes</li>
        </ul>
      </section>
      <section className="static-section">
        <h2>Disclaimer</h2>
        <p>
          TechTregu is provided "as is" without any warranties. We do not guarantee the quality, 
          safety, or legality of items listed by users.
        </p>
      </section>
      <section className="static-section">
        <h2>Contact</h2>
        <p>
          For terms-related questions, contact us at: support@techtregu.com
        </p>
      </section>
      <p className="static-footer-note">
        <Link to="/">← Back to listings</Link>
      </p>
    </article>
  );
}
