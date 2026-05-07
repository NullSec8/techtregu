import { Link } from 'react-router-dom';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { pageTitle } from '../siteMeta';

export function HelpPage() {
  useDocumentTitle(pageTitle('Help'));

  return (
    <article className="page-static">
      <h1>Help center</h1>
      <p className="static-lead">
        Everything you need to know about buying and selling on TechTregu. Can't find what you're looking for? <a href="mailto:support@techtregu.com">Contact us</a>.
      </p>

      <section className="static-section">
        <h2>Getting started</h2>
        <p>TechTregu is a marketplace for buying and selling tech products in Kosovo and the region. Whether you're looking for a laptop, GPU, PC parts, or accessories, you'll find it here.</p>
      </section>

      <section className="static-section">
        <h2>Buying</h2>
        <ul>
          <li><strong>Browse listings</strong> — Use the search bar and category filters on the home page to find what you need.</li>
          <li><strong>View details</strong> — Click any listing to see full specifications, condition, price in EUR, and seller information.</li>
          <li><strong>Contact sellers</strong> — Use the contact button on the listing page to reach out to sellers directly.</li>
          <li><strong>Check seller profile</strong> — Review the seller's profile, location, and listing history before purchasing.</li>
          <li><strong>Meet safely</strong> — Arrange meetups in public places. Always inspect the item before paying.</li>
        </ul>
      </section>

      <section className="static-section">
        <h2>Selling</h2>
        <ul>
          <li><Link to="/register">Create an account</Link> — Registration is free and takes just a minute.</li>
          <li><Link to="/new-listing">Create a listing</Link> — Add a clear title, honest condition description, accurate price in EUR, and real photos.</li>
          <li><strong>Be honest</strong> — Always describe the true condition of your item. Mention any defects or wear.</li>
          <li><strong>Price fairly</strong> — Check similar listings to price your item competitively.</li>
          <li><strong>Respond promptly</strong> — Answer buyer inquiries quickly to close sales faster.</li>
        </ul>
      </section>

      <section className="static-section">
        <h2>Safety tips</h2>
        <ul>
          <li>Never send money upfront before seeing the item in person.</li>
          <li>Beware of deals that seem too good to be true — they usually are.</li>
          <li>Use cash or secure payment methods when meeting in person.</li>
          <li>Meet in well-lit, public locations like coffee shops or shopping centers.</li>
          <li>Trust your instincts. If something feels off, walk away.</li>
        </ul>
      </section>

      <section className="static-section">
        <h2>Account &amp; listings</h2>
        <ul>
          <li>Manage your listings from the <Link to="/my-listings">My listings</Link> page.</li>
          <li>Save items you're interested in using the <Link to="/favorites">Favorites</Link> feature.</li>
          <li>Update your profile with your location so buyers know where you're based.</li>
          <li>Edit or delete listings anytime from your dashboard.</li>
        </ul>
      </section>

      <section className="static-section">
        <h2>Messages</h2>
        <p>When you receive messages from interested buyers, you'll see a notification in the navigation. Check your <Link to="/messages">Messages</Link> to stay connected.</p>
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
        <h2>Information We Collect</h2>
        <p>When you create an account on TechTregu, we collect:</p>
        <ul>
          <li>Your username, email address, and password</li>
          <li>Your full name and phone number (optional)</li>
          <li>Your location (city or area in Kosovo)</li>
          <li>Profile information and profile picture</li>
        </ul>
        <p>When you create listings, we collect the product details, descriptions, images, and pricing information you provide. We also log messages sent between buyers and sellers through our platform.</p>
      </section>

      <section className="static-section">
        <h2>How We Use Your Information</h2>
        <p>Your information is used to:</p>
        <ul>
          <li>Create and manage your account</li>
          <li>Display your listings to other users</li>
          <li>Facilitate communication between buyers and sellers</li>
          <li>Send you important notifications about your account and messages</li>
          <li>Improve our services and user experience</li>
        </ul>
        <p>We do not sell, rent, or share your personal information with third parties for marketing purposes.</p>
      </section>

      <section className="static-section">
        <h2>Data Security</h2>
        <p>We take security seriously. Your passwords are hashed using bcrypt and never stored in plain text. Sessions are managed through secure JWT tokens with appropriate expiration. We use HTTPS encryption for all data transmission.</p>
        <p>While we implement appropriate security measures, no method of transmission over the internet is 100% secure. We cannot guarantee absolute security, but we work hard to protect your data.</p>
      </section>

      <section className="static-section">
        <h2>Cookies</h2>
        <p>We use cookies to keep you signed in and maintain your session. These are essential cookies required for the platform to function properly. We do not use tracking cookies or advertising cookies.</p>
      </section>

      <section className="static-section">
        <h2>Your Rights</h2>
        <p>Under Kosovo data protection law and the GDPR, you have the right to:</p>
        <ul>
          <li>Access your personal data</li>
          <li>Correct inaccurate information</li>
          <li>Delete your account and personal data</li>
          <li>Export your data in a portable format</li>
          <li>Object to certain processing of your data</li>
        </ul>
        <p>To exercise any of these rights, <a href="mailto:support@techtregu.com">contact us</a> with your request.</p>
      </section>

      <section className="static-section">
        <h2>Data Retention</h2>
        <p>We retain your account information for as long as your account is active. You can delete your account at any time from your profile settings. Upon deletion, we will remove your personal information within 30 days, except where retention is required by law.</p>
      </section>

      <section className="static-section">
        <h2>Third-Party Services</h2>
        <p>We use third-party services for hosting, analytics, and email delivery. These services have their own privacy policies. We encourage you to review their policies:</p>
        <ul>
          <li>Our hosting provider handles server infrastructure</li>
          <li>Email service for account notifications</li>
        </ul>
      </section>

      <section className="static-section">
        <h2>Changes to This Policy</h2>
        <p>We may update this privacy policy from time to time. If we make significant changes, we will notify you via email or a notice on the platform. The date at the top of this page shows when it was last updated.</p>
      </section>

      <section className="static-section">
        <h2>Contact</h2>
        <p>If you have questions about this privacy policy or how we handle your data, contact us at <a href="mailto:support@techtregu.com">support@techtregu.com</a>.</p>
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
