export default function ReturnPolicyPage() {
  return (
    <div className="min-h-screen bg-neutral-50 pt-40 pb-20">
      <div className="max-w-4xl mx-auto px-6 lg:px-16 py-12">
        <div className="bg-white rounded-lg shadow-md p-8 lg:p-12 border border-neutral-200">
          <h1 className="text-4xl font-black uppercase tracking-tight text-black mb-2">Return Policy</h1>
          <div className="w-16 h-1 bg-yellow-400 mb-8" />
          <div className="prose max-w-none text-neutral-700 space-y-6">
            <p className="text-lg">
              We want you to be completely satisfied with your purchase. If you&apos;re not happy with your bike or accessories, we&apos;re here to help.
            </p>

            <div>
              <h2 className="text-xl font-black uppercase tracking-tight text-black mt-8 mb-3 pb-2 border-b border-neutral-200">Return Window</h2>
              <p>
                You have 30 days from the date of delivery to return your purchase for a full refund or exchange. The product must be in its original condition with all original packaging and accessories.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-black uppercase tracking-tight text-black mt-8 mb-3 pb-2 border-b border-neutral-200">How to Return</h2>
              <p>
                To initiate a return, please contact our customer service team at bikerstudio.com@gmail.com or call +91 96782 48499. We will provide you with a return authorization number and shipping instructions.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-black uppercase tracking-tight text-black mt-8 mb-3 pb-2 border-b border-neutral-200">Condition Requirements</h2>
              <p>
                Items must be unused, in the same condition that you received them, and in the original packaging. Bikes should not have been assembled or ridden. Any signs of wear or damage may affect your eligibility for a return.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-black uppercase tracking-tight text-black mt-8 mb-3 pb-2 border-b border-neutral-200">Refund Process</h2>
              <p>
                Once we receive and inspect your return, we will process your refund within 5–7 business days. The refund will be credited to your original payment method.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-black uppercase tracking-tight text-black mt-8 mb-3 pb-2 border-b border-neutral-200">Exchanges</h2>
              <p>
                If you&apos;d like to exchange your item for a different size or model, please contact us. We&apos;ll help arrange the exchange and cover any price differences.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-black uppercase tracking-tight text-black mt-8 mb-3 pb-2 border-b border-neutral-200">Shipping Costs</h2>
              <p>
                Return shipping costs are the responsibility of the customer unless the return is due to our error or a defective product. We recommend using a trackable shipping service.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-black uppercase tracking-tight text-black mt-8 mb-3 pb-2 border-b border-neutral-200">Non-Returnable Items</h2>
              <p>
                Custom-made bikes, clearance items, and gift cards are not eligible for return. Please check product descriptions carefully before purchasing.
              </p>
            </div>

            <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-5">
              <h2 className="text-xl font-black uppercase tracking-tight text-black mb-3">Questions?</h2>
              <p className="mb-0">
                If you have any questions about our return policy, please don&apos;t hesitate to contact us at{' '}
                <a href="mailto:bikerstudio.com@gmail.com" className="text-black font-medium hover:text-yellow-600 underline decoration-yellow-400 underline-offset-4">
                  bikerstudio.com@gmail.com
                </a>{' '}
                or{' '}
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