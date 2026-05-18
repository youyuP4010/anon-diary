interface LegalModalProps {
  type: 'terms' | 'privacy';
  onClose: () => void;
}

const TERMS = `Anon Diary Terms of Service
Effective Date: May 18, 2026

1. Acceptance of Terms
By accessing or using Anon Diary ("Service"), you agree to be bound by these Terms of Service. If you do not agree, please do not use the Service.

2. Description of Service
Anon Diary is a public anonymous diary platform where users can write and share diary entries with the global community.

3. User Accounts
- You may sign in using your Google account via OAuth.
- Upon registration, a random username is automatically assigned. You may change it in Settings.
- You are responsible for maintaining the security of your account.

4. User Content
- All diary entries are publicly visible.
- You retain ownership of the content you post.
- By posting, you grant Anon Diary a non-exclusive, royalty-free license to display your content within the Service.
- You must not post content that is unlawful, harmful, threatening, abusive, harassing, defamatory, or otherwise objectionable.

5. Prohibited Conduct
You agree not to:
- Post content that violates any applicable law or regulation
- Post sexually explicit, violent, or hateful content
- Harass, intimidate, or harm other users
- Attempt to disrupt or interfere with the Service

6. Content Moderation
- Content reported 5 or more times will be automatically hidden pending review.
- We reserve the right to remove content that violates these Terms at our discretion.

7. Disclaimer of Warranties
The Service is provided "as is" without warranties of any kind. We do not guarantee uninterrupted or error-free operation.

8. Limitation of Liability
To the fullest extent permitted by law, Anon Diary shall not be liable for any indirect, incidental, or consequential damages arising from your use of the Service.

9. Changes to Terms
We may update these Terms at any time. Continued use of the Service after changes constitutes acceptance of the new Terms.

10. Contact
For questions about these Terms, contact us at: demisoda4010@gmail.com`;

const PRIVACY = `Anon Diary Privacy Policy
Effective Date: May 18, 2026

1. Information We Collect
When you sign in with Google, we collect:
- Your email address
- Your Google account unique ID

2. How We Use Your Information
- To identify you and provide the Service
- To auto-generate your username
- To respond to your inquiries

3. Data Retention
Your personal data is deleted immediately upon account deletion. We do not retain personal data beyond the period necessary to provide the Service.

4. Sharing of Information
We do not sell or share your personal information with third parties, except:
- When required by law
- With service providers who help us operate the Service (see below)

5. Third-Party Service Providers
- Supabase Inc. — Authentication and data storage
- Google LLC — OAuth login authentication

6. Your Rights (GDPR & CCPA)
Depending on your location, you may have the right to:
- Access the personal data we hold about you
- Request deletion of your personal data
- Object to or restrict processing of your data
- Data portability

To exercise these rights, contact us at: demisoda4010@gmail.com
We will respond within 30 days.

7. Cookies and Local Storage
We use browser local storage solely to maintain your login session. We do not use tracking cookies or advertising cookies.

8. Children's Privacy
This Service is not directed to children under the age of 13. We do not knowingly collect personal information from children.

9. Changes to This Policy
We may update this Privacy Policy at any time. We will notify users of significant changes by posting a notice within the Service.

10. Contact
For privacy-related inquiries:
demisoda4010@gmail.com`;

const TITLE: Record<LegalModalProps['type'], string> = {
  terms: 'Terms of Service',
  privacy: 'Privacy Policy',
};

const CONTENT: Record<LegalModalProps['type'], string> = {
  terms: TERMS,
  privacy: PRIVACY,
};

export default function LegalModal({ type, onClose }: LegalModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.55)' }}
      onClick={onClose}
      data-testid={`legal-modal-${type}`}
    >
      <div
        className="w-full max-w-lg bg-white rounded-t-3xl shadow-2xl flex flex-col"
        style={{ maxHeight: '85vh' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-border flex-shrink-0">
          <h3 className="font-bold text-foreground text-base">{TITLE[type]}</h3>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground text-xl leading-none"
            data-testid="button-close-legal"
          >
            ✕
          </button>
        </div>
        <div className="overflow-y-auto px-6 py-5 flex-1">
          <pre className="text-xs text-foreground/80 leading-relaxed whitespace-pre-wrap font-sans">
            {CONTENT[type]}
          </pre>
        </div>
      </div>
    </div>
  );
}
