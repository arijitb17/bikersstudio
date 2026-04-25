'use client';

import { useState } from 'react';
import { Share2, Check, Facebook, Twitter, Link as LinkIcon, MessageCircle } from 'lucide-react';

interface ShareButtonProps {
  productName: string;
  productUrl: string;
}

export default function ShareButton({ productName, productUrl }: ShareButtonProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [copied, setCopied] = useState(false);

  const fullUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}${productUrl}`
    : productUrl;

  const shareText = `Check out ${productName}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
        setShowMenu(false);
      }, 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleShare = async (platform: string) => {
    const encodedUrl = encodeURIComponent(fullUrl);
    const encodedText = encodeURIComponent(shareText);

    let shareUrl = '';

    switch (platform) {
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`;
        break;
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=${encodedText}%20${encodedUrl}`;
        break;
    }

    if (shareUrl) {
      window.open(shareUrl, '_blank', 'width=600,height=400');
      setShowMenu(false);
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: productName,
          text: shareText,
          url: fullUrl,
        });
        setShowMenu(false);
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      setShowMenu(!showMenu);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={handleNativeShare}
        className="p-4 border-2 border-gray-300 rounded-xl hover:border-red-600 hover:bg-red-50 transition-all group"
      >
        <Share2 className="w-6 h-6 text-gray-600 group-hover:text-red-600 transition-all" />
      </button>

      {/* Share Menu (fallback for desktop) */}
      {showMenu && !navigator.share && (
        <div className="absolute right-0 top-full mt-2 bg-white rounded-xl shadow-lg border-2 border-gray-200 p-3 z-50 min-w-[200px]">
          <p className="text-xs font-bold text-gray-900 mb-2 px-2">Share via:</p>
          
          <button
            onClick={() => handleShare('whatsapp')}
            className="w-full flex items-center gap-3 px-3 py-2 hover:bg-green-50 rounded-lg transition-colors text-left"
          >
            <MessageCircle className="w-5 h-5 text-green-600" />
            <span className="text-sm font-semibold text-gray-900">WhatsApp</span>
          </button>

          <button
            onClick={() => handleShare('facebook')}
            className="w-full flex items-center gap-3 px-3 py-2 hover:bg-blue-50 rounded-lg transition-colors text-left"
          >
            <Facebook className="w-5 h-5 text-blue-600" />
            <span className="text-sm font-semibold text-gray-900">Facebook</span>
          </button>

          <button
            onClick={() => handleShare('twitter')}
            className="w-full flex items-center gap-3 px-3 py-2 hover:bg-sky-50 rounded-lg transition-colors text-left"
          >
            <Twitter className="w-5 h-5 text-sky-600" />
            <span className="text-sm font-semibold text-gray-900">Twitter</span>
          </button>

          <div className="border-t border-gray-200 my-2"></div>

          <button
            onClick={handleCopyLink}
            className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-50 rounded-lg transition-colors text-left"
          >
            {copied ? (
              <>
                <Check className="w-5 h-5 text-green-600" />
                <span className="text-sm font-semibold text-green-600">Copied!</span>
              </>
            ) : (
              <>
                <LinkIcon className="w-5 h-5 text-gray-600" />
                <span className="text-sm font-semibold text-gray-900">Copy Link</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Click outside to close */}
      {showMenu && !navigator.share && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowMenu(false)}
        />
      )}
    </div>
  );
}
