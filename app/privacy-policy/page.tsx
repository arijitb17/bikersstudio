export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-neutral-50 pt-40 pb-20">
      <div className="max-w-4xl mx-auto px-6 lg:px-16 py-12">
        <div className="bg-white rounded-lg shadow-md p-8 lg:p-12 border border-neutral-200">
          <h1 className="text-4xl font-black uppercase tracking-tight text-black mb-2">Privacy Policy</h1>
          <div className="w-16 h-1 bg-yellow-400 mb-8" />
          <div className="prose max-w-none text-neutral-700 space-y-6">
            <p className="text-lg">
              At BikerStudio, we are committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard your personal information.
            </p>

            <div>
              <h2 className="text-xl font-black uppercase tracking-tight text-black mt-8 mb-3 pb-2 border-b border-neutral-200">Information We Collect</h2>
              <p>
                We collect information that you provide directly to us, including your name, email address, phone number, shipping address, and payment information when you make a purchase or create an account.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-black uppercase tracking-tight text-black mt-8 mb-3 pb-2 border-b border-neutral-200">How We Use Your Information</h2>
              <p>We use the information we collect to process your orders, communicate with you about your purchases, improve our services, and send you promotional materials if you&apos;ve opted in to receive them.</p>
            </div>

            <div>
              <h2 className="text-xl font-black uppercase tracking-tight text-black mt-8 mb-3 pb-2 border-b border-neutral-200">Data Security</h2>
              <p>
                We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-black uppercase tracking-tight text-black mt-8 mb-3 pb-2 border-b border-neutral-200">Cookies</h2>
              <p>
                We use cookies and similar tracking technologies to enhance your browsing experience, analyze site traffic, and understand where our visitors are coming from.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-black uppercase tracking-tight text-black mt-8 mb-3 pb-2 border-b border-neutral-200">Third-Party Sharing</h2>
              <p>
                We do not sell your personal information to third parties. We may share your information with service providers who assist us in operating our website and conducting our business.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-black uppercase tracking-tight text-black mt-8 mb-3 pb-2 border-b border-neutral-200">Your Rights</h2>
              <p>
                You have the right to access, correct, or delete your personal information. You may also opt out of receiving marketing communications at any time.
              </p>
            </div>

            <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-5">
              <h2 className="text-xl font-black uppercase tracking-tight text-black mb-3">Contact Us</h2>
              <p className="mb-0">
                If you have any questions about this Privacy Policy, please contact us at{' '}
                <a href="mailto:bikerstudio.com@gmail.com" className="text-black font-medium hover:text-yellow-600 underline decoration-yellow-400 underline-offset-4">
                  bikerstudio.com@gmail.com
                </a>{' '}
                or call{' '}
                <a href="tel:919678248499" className="text-black font-medium hover:text-yellow-600 underline decoration-yellow-400 underline-offset-4">
                  +91 96782 48499
                </a>.
              </p>
            </div>

            <p className="text-sm text-neutral-500 mt-8 font-mono">
              Last Updated: April 2026
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}