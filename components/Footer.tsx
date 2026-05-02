import Link from 'next/link';
import { Phone, Mail, Youtube } from 'lucide-react';
import { Instagram } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-red-50 text-gray-900">
      <div className="max-w-7xl mx-auto px-6 lg:px-16 py-12">
        {/* Top Section - 3 Columns */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <div>
            <h3 className="font-bold text-lg mb-4 uppercase">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/categories/crash-guards" className="hover:text-red-600 transition-colors">Crash Guards</Link></li>
              <li><Link href="/categories/fog-lights" className="hover:text-red-600 transition-colors">Fog Lights</Link></li>
              <li><Link href="/categories/top-racks" className="hover:text-red-600 transition-colors">Top Racks</Link></li>
              <li><Link href="/categories/engine-guards" className="hover:text-red-600 transition-colors">Engine Guards</Link></li>
              <li><Link href="/categories/mirrors" className="hover:text-red-600 transition-colors">Mirrors</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-lg mb-4 uppercase">Contact</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/help" className="hover:text-red-600 transition-colors">Help & FAQ</Link></li>
              <li><Link href="/shipping" className="hover:text-red-600 transition-colors">Shipping</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-lg mb-4 uppercase">Policies</h3>
            <ul className="space-y-2 text-sm">
  <li><Link href="/privacy-policy" className="hover:text-red-600 transition-colors">Privacy Policy</Link></li>
  <li><Link href="/terms-of-service" className="hover:text-red-600 transition-colors">Terms of Service</Link></li>
  <li><Link href="/return-policy" className="hover:text-red-600 transition-colors">Return Policy</Link></li>
</ul>
          </div>
        </div>

        {/* Middle Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div>
            <h3 className="font-bold text-lg mb-3 uppercase">Customer Care</h3>
            <div className="space-y-2 text-sm">
              <p>Monday to Sunday, 10am–5pm</p>
              <p className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                <Link href="tel:919678248499" className="hover:text-red-600 transition-colors">+91 96782 48499</Link>
              </p>
              <p className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                <Link href="mailto:bikerstudio.com@gmail.com" className="hover:text-red-600 transition-colors">bikerstudio.com@gmail.com</Link>
              </p>
            </div>
          </div>

          <div>
            <h3 className="font-bold text-lg mb-3 uppercase">Brand Store Guwahati</h3>
            <div className="w-full h-48 rounded-lg overflow-hidden shadow-lg">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3580.69497064767!2d91.7325394!3d26.1740618!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x375a5948832f3d1b%3A0x9a21fe0b7a16560b!2sBikers%20studios!5e0!3m2!1sen!2sin!4v1777370414445!5m2!1sen!2sin"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen={true}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
            <p className="text-sm mt-2">Mangalam Building, Assam Trunk Rd, opp. post office, Bharalumukh, Guwahati, Assam 781009</p>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="text-center">
          <h3 className="font-bold text-lg mb-4 uppercase">Follow Us</h3>
          <div className="flex justify-center gap-4 mb-6">
            <Link
              href="https://www.instagram.com/bikers_studio_guwahati?igsh=ZGZyNzVrZ3JubG1l"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-red-500 rounded-full p-3 hover:bg-red-600 transition-all duration-200 hover:scale-110"
              aria-label="Instagram"
            >
              <Instagram className="w-5 h-5 text-white" />
            </Link>
            <Link
              href="https://youtube.com/@bikersstudioguwahati4295?si=raB1ceDts-nLqW1P"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-red-500 rounded-full p-3 hover:bg-red-600 transition-all duration-200 hover:scale-110"
              aria-label="YouTube"
            >
              <Youtube className="w-5 h-5 text-white" />
            </Link>
          </div>

          <div className="text-sm text-gray-700 pt-4 border-t border-gray-300">
            <p>© 2026 Bikers Studio. All rights reserved.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}