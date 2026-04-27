import { Facebook, Instagram, Twitter, Phone, Mail } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-red-50 text-gray-900">
      <div className="max-w-7xl mx-auto px-6 lg:px-16 py-12">
        {/* Top Section - 3 Columns */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {/* Quick Links Column */}
          <div>
            <h3 className="font-bold text-lg mb-4 uppercase">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-red-600 transition-colors">Bikes</a></li>
              <li><a href="#" className="hover:text-red-600 transition-colors">Accessories</a></li>
              <li><a href="#" className="hover:text-red-600 transition-colors">About Us</a></li>
            </ul>
          </div>

          {/* Contact Column */}
          <div>
            <h3 className="font-bold text-lg mb-4 uppercase">Contact</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-red-600 transition-colors">Help & FAQ</a></li>
              <li><a href="#" className="hover:text-red-600 transition-colors">Shipping</a></li>
            </ul>
          </div>

          {/* Policies Column */}
          <div>
            <h3 className="font-bold text-lg mb-4 uppercase">Policies</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="/privacy-policy" className="hover:text-red-600 transition-colors">Privacy Policy</a></li>
              <li><a href="/return-policy" className="hover:text-red-600 transition-colors">Return Policy</a></li>
            </ul>
          </div>
        </div>

        {/* Middle Section - Customer Care & Map */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Customer Care */}
          <div>
            <h3 className="font-bold text-lg mb-3 uppercase">Customer Care</h3>
            <div className="space-y-2 text-sm">
              <p>Monday to Sunday, 10am-5pm</p>
              <p className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                <a href="tel:910000000000" className="hover:text-red-600 transition-colors">+91 00000 00000</a>
              </p>
              <p className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                <a href="mailto:abc@gmail.com" className="hover:text-red-600 transition-colors">abc@gmail.com</a>
              </p>
            </div>
          </div>

          {/* Map */}
          <div>
            <h3 className="font-bold text-lg mb-3 uppercase">Brand Store Guwahati</h3>
            <div className="w-full h-48 rounded-lg overflow-hidden shadow-lg">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3581.0377537686554!2d91.7893!3d26.1433!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x375a5f3b3b3b3b3b%3A0x3b3b3b3b3b3b3b3b!2sBarahapara%2C%20Guwahati%2C%20Assam!5e0!3m2!1sen!2sin!4v1234567890"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen={true}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              ></iframe>
            </div>
            <p className="text-sm mt-2">Barsapara Near Stadium, Guwahati, Assam</p>
          </div>
        </div>

        {/* Bottom Section - Social Media */}
        <div className="text-center">
          <h3 className="font-bold text-lg mb-4 uppercase">Follow Us</h3>
          <div className="flex justify-center gap-4 mb-6">
            <a 
              href="#" 
              className="bg-red-500 rounded-full p-3 hover:bg-red-600 transition-all duration-200 hover:scale-110"
              aria-label="Facebook"
            >
              <Facebook className="w-5 h-5 text-white" />
            </a>
            <a 
              href="#" 
              className="bg-red-500 rounded-full p-3 hover:bg-red-600 transition-all duration-200 hover:scale-110"
              aria-label="Instagram"
            >
              <Instagram className="w-5 h-5 text-white" />
            </a>
            <a 
              href="#" 
              className="bg-red-500 rounded-full p-3 hover:bg-red-600 transition-all duration-200 hover:scale-110"
              aria-label="Twitter"
            >
              <Twitter className="w-5 h-5 text-white" />
            </a>
          </div>

          {/* Copyright */}
          <div className="text-sm text-gray-700 pt-4 border-t border-gray-300">
            <p>© 2026 Bikers Studio. All rights reserved.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
