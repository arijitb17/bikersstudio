import Link from 'next/link';

export default function HelpFAQPage() {
  const faqs = [
    {
      category: "Orders & Shipping",
      questions: [
        {
          q: "How long does delivery take?",
          a: "We typically deliver within 5–7 business days across India. Remote areas may take up to 10 business days. You'll receive a tracking link once your order is dispatched.",
        },
        {
          q: "How can I track my order?",
          a: "Once your order is shipped, you'll receive an SMS and email with a tracking number. You can also track your order from the 'My Orders' section in your profile.",
        },
        {
          q: "Do you offer free shipping?",
          a: "Yes, we offer free shipping on orders above ₹999. Orders below this amount have a flat shipping fee of ₹99.",
        },
        {
          q: "Can I change or cancel my order after placing it?",
          a: "Orders can be modified or cancelled within 24 hours of placement. Please contact us immediately at bikerstudio.com@gmail.com or call +91 96782 48499.",
        },
      ],
    },
    {
      category: "Products & Compatibility",
      questions: [
        {
          q: "How do I know if an accessory fits my bike?",
          a: "Each product listing includes a compatibility section listing supported bike models. If you're unsure, feel free to contact us with your bike's make, model, and year and we'll confirm fitment.",
        },
        {
          q: "Are your products OEM or aftermarket?",
          a: "We stock a mix of OEM-quality and premium aftermarket accessories. Product descriptions clearly mention the brand and type so you know exactly what you're getting.",
        },
        {
          q: "Do you provide installation support?",
          a: "Most accessories come with installation instructions. You can also visit our Brand Store in Guwahati for in-person fitment assistance.",
        },
      ],
    },
    {
      category: "Returns & Refunds",
      questions: [
        {
          q: "What is your return window?",
          a: "You have 30 days from the date of delivery to initiate a return. Items must be unused and in original packaging. See our full Return Policy for details.",
        },
        {
          q: "How long does a refund take?",
          a: "Refunds are processed within 5–7 business days after we receive and inspect the returned item. The amount is credited to your original payment method.",
        },
        {
          q: "What if I received a damaged or wrong product?",
          a: "We're sorry about that! Please contact us within 48 hours of delivery with photos of the issue at bikerstudio.com@gmail.com. We'll arrange a replacement or full refund at no extra cost.",
        },
      ],
    },
    {
      category: "Payments",
      questions: [
        {
          q: "What payment methods do you accept?",
          a: "We accept UPI, credit/debit cards, net banking, and major wallets. All transactions are secured with SSL encryption.",
        },
        {
          q: "Is it safe to save my card details?",
          a: "Yes. We use industry-standard encryption and do not store raw card data on our servers. Payments are processed through PCI-DSS compliant gateways.",
        },
        {
          q: "Do you offer Cash on Delivery?",
          a: "COD is available on select products and pin codes. You'll see the COD option at checkout if it's available for your location.",
        },
      ],
    },
    {
      category: "Account & Profile",
      questions: [
        {
          q: "How do I create an account?",
          a: "Click 'Sign In' at the top right and choose 'Create Account'. You can sign up with your email or continue with Google.",
        },
        {
          q: "I forgot my password. What do I do?",
          a: "On the sign-in page, click 'Forgot Password' and enter your registered email. You'll receive a reset link within a few minutes.",
        },
        {
          q: "Can I place an order without an account?",
          a: "Currently, an account is required to place orders so we can keep you updated on your delivery status and make returns easier.",
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pt-40 pb-20">
      <div className="max-w-4xl mx-auto px-6 lg:px-16 py-12">

        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-8 lg:p-12 mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Help & FAQ</h1>
          <p className="text-lg text-gray-700">
            Find answers to the most common questions below. Can&apos;t find what you&apos;re looking for? Reach out to us directly.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 mt-6">
            <Link
              href="tel:919678248499"
              className="flex items-center gap-2 px-4 py-2 bg-red-400 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
            >
              📞 +91 96782 48499
            </Link>
            <Link
              href="mailto:bikerstudio.com@gmail.com"
              className="flex items-center gap-2 px-4 py-2 border border-red-600 text-red-600 rounded-lg hover:bg-red-50 transition-colors text-sm font-medium"
            >
              ✉️ bikerstudio.com@gmail.com
            </Link>
          </div>
        </div>

        {/* FAQ Sections */}
        <div className="space-y-6">
          {faqs.map((section) => (
            <div key={section.category} className="bg-white rounded-lg shadow-md p-8 lg:p-10">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-3 border-b border-gray-200">
                {section.category}
              </h2>
              <div className="space-y-6">
                {section.questions.map((item) => (
                  <div key={item.q}>
                    <h3 className="text-base font-semibold text-gray-900 mb-2">{item.q}</h3>
                    <p className="text-gray-600 text-sm leading-relaxed">{item.a}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Still need help */}
        <div className="bg-red-600 rounded-lg shadow-md p-8 mt-8 text-center text-white">
          <h2 className="text-2xl font-bold mb-2">Still need help?</h2>
          <p className="text-red-100 mb-6">
            Our team is available Monday to Sunday, 10am – 5pm.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              href="tel:919678248499"
              className="px-6 py-2 bg-white text-red-600 font-semibold rounded-lg hover:bg-red-50 transition-colors"
            >
              Call Us
            </Link>
            <Link
              href="mailto:bikerstudio.com@gmail.com"
              className="px-6 py-2 border-2 border-white text-white font-semibold rounded-lg hover:bg-red-700 transition-colors"
            >
              Email Us
            </Link>
          </div>
        </div>

        <p className="text-sm text-gray-500 mt-8 text-center">Last Updated: April 2026</p>
      </div>
    </div>
  );
}