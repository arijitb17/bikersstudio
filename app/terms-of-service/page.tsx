export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-neutral-50 pt-40 pb-20">
      <div className="max-w-4xl mx-auto px-6 lg:px-16 py-12">
        <div className="bg-white rounded-lg shadow-md p-8 lg:p-12 border border-neutral-200">
          <h1 className="text-4xl font-black uppercase tracking-tight text-black mb-2">Terms of Service</h1>
          <div className="w-16 h-1 bg-yellow-400 mb-8" />
          <div className="prose max-w-none text-neutral-700 space-y-6">
            <p className="text-lg">
              Welcome to BikerStudio. By accessing or using our website and services, you agree to be bound by these Terms of Service. Please read them carefully before making a purchase.
            </p>

            <div>
              <h2 className="text-xl font-black uppercase tracking-tight text-black mt-8 mb-3 pb-2 border-b border-neutral-200">Acceptance of Terms</h2>
              <p>
                By using our website, you confirm that you are at least 18 years of age, have read and understood these terms, and agree to be legally bound by them. If you do not agree, please discontinue use of our site immediately.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-black uppercase tracking-tight text-black mt-8 mb-3 pb-2 border-b border-neutral-200">Orders &amp; Payments</h2>
              <p>
                All orders placed through BikerStudio are subject to product availability and acceptance. We reserve the right to refuse or cancel any order at our discretion. Prices are listed in the applicable currency and are subject to change without notice. Full payment is required before an order is processed and shipped.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-black uppercase tracking-tight text-black mt-8 mb-3 pb-2 border-b border-neutral-200">Shipping &amp; Delivery</h2>
              <p>
                We aim to dispatch orders within the stated processing time. Delivery timelines are estimates and may vary due to factors outside our control. BikerStudio is not liable for delays caused by courier services, customs, or unforeseen circumstances.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-black uppercase tracking-tight text-black mt-8 mb-3 pb-2 border-b border-neutral-200">Returns &amp; Refunds</h2>
              <p>
                Items may be returned within 30 days of delivery, provided they are unused, in original packaging, and accompanied by proof of purchase. Refunds will be processed within 5–7 business days after we receive and inspect the returned item. We do not accept returns on items that have been installed or used.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-black uppercase tracking-tight text-black mt-8 mb-3 pb-2 border-b border-neutral-200">Product Information</h2>
              <p>
                We make every effort to display product descriptions, images, and specifications as accurately as possible. However, we do not warrant that product descriptions or other content on our site are completely accurate, current, or error-free. It is your responsibility to verify compatibility with your vehicle before purchasing.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-black uppercase tracking-tight text-black mt-8 mb-3 pb-2 border-b border-neutral-200">Intellectual Property</h2>
              <p>
                All content on this website, including images, text, logos, and graphics, is the property of BikerStudio and is protected by applicable copyright and trademark laws. You may not reproduce, distribute, or use any content without our prior written consent.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-black uppercase tracking-tight text-black mt-8 mb-3 pb-2 border-b border-neutral-200">Limitation of Liability</h2>
              <p>
                BikerStudio shall not be liable for any indirect, incidental, or consequential damages arising from the use of our products or services. Our total liability to you for any claim shall not exceed the amount paid for the product in question.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-black uppercase tracking-tight text-black mt-8 mb-3 pb-2 border-b border-neutral-200">Changes to Terms</h2>
              <p>
                We reserve the right to update or modify these Terms of Service at any time without prior notice. Continued use of our website following any changes constitutes your acceptance of the revised terms.
              </p>
            </div>

            <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-5">
              <h2 className="text-xl font-black uppercase tracking-tight text-black mb-3">Contact Us</h2>
              <p className="mb-0">
                If you have any questions about these Terms of Service, please contact us at{' '}
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