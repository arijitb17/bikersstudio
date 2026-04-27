// app/admin/views/ImagesView.tsx
import { useState, useEffect } from 'react';
import { Image as ImageIcon, Download, Trash2, Copy, Check, X } from 'lucide-react';
import Image from 'next/image';
interface ImageFile {
  name: string;
  path: string;
  size: number;
  createdAt: string;
}

interface ImagesViewProps {
  refreshTrigger: number;
}

export function ImagesView({ refreshTrigger }: ImagesViewProps) {
  const [images, setImages] = useState<ImageFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<ImageFile | null>(null);
  const [copiedPath, setCopiedPath] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadImages();
  }, [refreshTrigger]);

  const loadImages = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/images');
      const data = await response.json();
      console.log('Loaded images:', data.images);
      setImages(data.images || []);
    } catch (err) {
      console.error('Failed to load images:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyPath = (path: string) => {
    navigator.clipboard.writeText(path);
    setCopiedPath(path);
    setTimeout(() => setCopiedPath(null), 2000);
  };

  const handleDelete = async (imageName: string) => {
    if (!confirm(`Delete ${imageName}? This cannot be undone.`)) return;

    try {
      await fetch(`/api/admin/images/${imageName}`, { method: 'DELETE' });
      loadImages();
    } catch {
      alert('Failed to delete image');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const filteredImages = images.filter(img =>
    img.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <ImageIcon className="text-blue-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Images</p>
              <p className="text-2xl font-bold text-gray-900">{images.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 rounded-lg">
              <Download className="text-green-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Size</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatFileSize(images.reduce((sum, img) => sum + img.size, 0))}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-100 rounded-lg">
              <ImageIcon className="text-purple-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Storage Path</p>
              <p className="text-sm font-mono text-gray-900">/uploads/images</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6 ">
        <input
          type="text"
          placeholder="Search images..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-2 border  rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-600 text-gray-600"
        />
      </div>

      {/* Images Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {filteredImages.length === 0 ? (
          <div className="col-span-full text-center py-12 bg-white rounded-lg">
            <ImageIcon className="mx-auto text-gray-400 mb-3" size={48} />
            <p className="text-gray-500">No images found</p>
          </div>
        ) : (
          filteredImages.map(image => (
            <div
              key={image.name}
              className="bg-white rounded-lg border overflow-hidden hover:shadow-lg transition-shadow group"
            >
              {/* ↓ parent must be relative + sized for fill to work */}
              <div
                className="relative aspect-square bg-gray-100 cursor-pointer overflow-hidden"
                onClick={() => setSelectedImage(image)}
              >
                <Image
                  src={image.path}
                  alt={image.name}
                  fill
                  sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 16vw"
                  className="object-contain opacity-0 transition-opacity duration-300"
                  loading="lazy"
                  onLoad={(e) => {
                    e.currentTarget.classList.remove('opacity-0');
                    e.currentTarget.classList.add('opacity-100');
                  }}
                  onError={(e) => {
                    const target = e.currentTarget as HTMLImageElement;
                    target.style.display = 'none';
                    const parent = target.parentElement;
                    if (parent && !parent.querySelector('.error-placeholder')) {
                      const errorDiv = document.createElement('div');
                      errorDiv.className = 'error-placeholder absolute inset-0 flex flex-col items-center justify-center bg-gray-200';
                      errorDiv.innerHTML = `
                        <svg class="mb-2 text-gray-400" width="48" height="48" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                        </svg>
                        <p class="text-xs text-gray-500 text-center px-2">${image.name}</p>
                      `;
                      parent.appendChild(errorDiv);
                    }
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center z-10">
                  <div className="text-white text-center">
                    <ImageIcon className="mx-auto mb-1" size={32} />
                    <p className="text-xs px-2 truncate max-w-full">{image.name}</p>
                  </div>
                </div>
              </div>
              <div className="p-3">
                <p className="text-xs text-gray-900 font-mono truncate" title={image.name}>
                  {image.name}
                </p>
                <p className="text-xs text-gray-500 mt-1">{formatFileSize(image.size)}</p>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopyPath(image.path);
                    }}
                    className="flex-1 px-2 py-1 bg-blue-100 text-blue-600 rounded text-xs hover:bg-blue-200 flex items-center justify-center gap-1"
                    title="Copy path"
                  >
                    {copiedPath === image.path ? <Check size={12} /> : <Copy size={12} />}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(image.name);
                    }}
                    className="px-2 py-1 bg-red-100 text-red-600 rounded text-xs hover:bg-red-200"
                    title="Delete"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Image Preview Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div
            className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center z-10">
              <div>
                <h3 className="font-semibold text-gray-900">{selectedImage.name}</h3>
                <p className="text-sm text-gray-600">{formatFileSize(selectedImage.size)}</p>
              </div>
              <button
                onClick={() => setSelectedImage(null)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-4">
              {/* ↓ preview modal: fixed size container with fill */}
              <div className="relative w-full min-h-[400px] bg-gray-100 rounded overflow-hidden">
                <Image
                  src={selectedImage.path}
                  alt={selectedImage.name}
                  fill
                  sizes="(max-width: 896px) 100vw, 896px"
                  className="object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    const parent = e.currentTarget.parentElement;
                    if (parent) {
                      parent.innerHTML = '<div class="flex items-center justify-center h-full p-8 text-center"><div><p class="text-gray-500">Failed to load image</p><p class="text-sm text-gray-400 mt-2">Path: ' + selectedImage.path + '</p></div></div>';
                    }
                  }}
                />
              </div>
              <div className="mt-4 p-3 bg-gray-50 rounded">
                <p className="text-sm text-gray-600 mb-2">Image Path:</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-sm bg-white px-3 py-2 rounded border font-mono break-all">
                    {selectedImage.path}
                  </code>
                  <button
                    onClick={() => handleCopyPath(selectedImage.path)}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2 whitespace-nowrap"
                  >
                    {copiedPath === selectedImage.path ? (
                      <>
                        <Check size={16} />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy size={16} />
                        Copy
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}