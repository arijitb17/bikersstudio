// admin/modals/BatchImageUploadModal.tsx

"use client"
import React, { useState } from 'react';
import { X, Upload, Image as ImageIcon, CheckCircle, XCircle, Copy } from 'lucide-react';

interface BatchImageUploadModalProps {
  onClose: () => void;
}

interface UploadResult {
  originalName: string;
  fileName: string;
  url: string;
  size: number;
}

interface UploadResponse {
  success: boolean;
  uploaded: number;
  failed: number;
  results: UploadResult[];
  errors?: Array<{ file: string; error: string }>;
}

export const BatchImageUploadModal: React.FC<BatchImageUploadModalProps> = ({ onClose }) => {
  const [files, setFiles] = useState<File[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<UploadResponse | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    addFiles(selectedFiles);
  };

  const addFiles = (newFiles: File[]) => {
    const validFiles = newFiles.filter(file => {
      const isValidType = file.type.startsWith('image/');
      const isValidSize = file.size <= 5 * 1024 * 1024; // 5MB
      return isValidType && isValidSize;
    });

    setFiles(prev => [...prev, ...validFiles]);
    setResult(null);
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files) {
      addFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleUpload = async () => {
    if (files.length === 0) return;

    setLoading(true);
    try {
      const formData = new FormData();
      files.forEach(file => {
        formData.append('images', file);
      });

      const response = await fetch('/api/admin/batch-upload-images', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      setResult(data);
      setFiles([]); // Clear files after successful upload
   } catch (error: unknown) {
  alert('Upload failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
} finally {
      setLoading(false);
    }
  };

  const copyAllUrls = () => {
    if (!result?.results) return;
    const urls = result.results.map(r => r.url).join('\n');
    navigator.clipboard.writeText(urls);
    alert('URLs copied to clipboard!');
  };

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
  };

  const formatFileSize = (bytes: number) => {
    return (bytes / 1024).toFixed(2) + ' KB';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto">
        <div className="border-b px-6 py-4 flex items-center justify-between sticky top-0 bg-white">
          <h3 className="text-xl font-semibold text-black">
            Batch Image Upload
          </h3>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-gray-100 rounded"
            disabled={loading}
          >
            <X size={20} className="text-black" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {!result && (
            <>
              {/* Instructions */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="text-sm space-y-2">
                  <p className="font-medium text-blue-900">Upload Instructions:</p>
                  <ul className="list-disc list-inside text-blue-800 space-y-1">
                    <li>Upload multiple images at once (JPG, PNG, WebP)</li>
                    <li>Images will be automatically resized and optimized</li>
                    <li>Maximum file size: 5MB per image</li>
                    <li>Copy the generated URLs to use in your Excel file</li>
                  </ul>
                </div>
              </div>

              {/* Drop Zone */}
              <div
                className={`relative border-2 border-dashed rounded-lg p-8 transition-colors ${
                  dragActive 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  disabled={loading}
                />
                
                <div className="text-center">
                  <ImageIcon className="mx-auto mb-3 text-gray-400" size={48} />
                  <p className="text-lg font-medium text-gray-700 mb-1">
                    Drop images here or click to browse
                  </p>
                  <p className="text-sm text-gray-500">
                    JPG, PNG, WebP (Max 5MB each)
                  </p>
                </div>
              </div>

              {/* File List */}
              {files.length > 0 && (
                <div className="border rounded-lg">
                  <div className="bg-gray-50 px-4 py-3 border-b flex items-center justify-between">
                    <h5 className="font-medium text-gray-900">
                      Selected Images ({files.length})
                    </h5>
                    <button
                      onClick={() => setFiles([])}
                      className="text-sm text-red-600 hover:text-red-700"
                    >
                      Clear All
                    </button>
                  </div>
                  
                  <div className="max-h-60 overflow-auto p-4 space-y-2">
                    {files.map((file, idx) => (
                      <div key={idx} className="flex items-center gap-3 p-2 bg-gray-50 rounded">
                        <ImageIcon size={16} className="text-gray-400 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {file.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatFileSize(file.size)}
                          </p>
                        </div>
                        <button
                          onClick={() => removeFile(idx)}
                          className="p-1 hover:bg-gray-200 rounded"
                          disabled={loading}
                        >
                          <X size={16} className="text-gray-600" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleUpload}
                  disabled={files.length === 0 || loading}
                  className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      <span>Uploading...</span>
                    </>
                  ) : (
                    <>
                      <Upload size={16} />
                      <span>Upload {files.length} Image{files.length !== 1 ? 's' : ''}</span>
                    </>
                  )}
                </button>
                <button
                  onClick={onClose}
                  className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 text-black font-medium"
                  disabled={loading}
                >
                  Cancel
                </button>
              </div>
            </>
          )}

          {/* Results */}
          {result && (
            <div className="space-y-4">
              {/* Summary */}
              <div className={`p-4 rounded-lg border-2 ${
                result.failed === 0
                  ? 'bg-green-50 border-green-200'
                  : 'bg-yellow-50 border-yellow-200'
              }`}>
                <div className="flex items-start gap-3">
                  {result.failed === 0 ? (
                    <CheckCircle className="text-green-600 flex-shrink-0" size={24} />
                  ) : (
                    <XCircle className="text-yellow-600 flex-shrink-0" size={24} />
                  )}
                  
                  <div className="flex-1">
                    <h4 className="font-semibold text-lg mb-2">
                      {result.failed === 0
                        ? 'All Images Uploaded Successfully!'
                        : 'Upload Completed with Errors'
                      }
                    </h4>
                    
                    <div className="grid grid-cols-2 gap-4 mt-3">
                      <div>
                        <p className="text-xs text-gray-600">Successful</p>
                        <p className="text-xl font-bold text-green-600">
                          {result.uploaded}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Failed</p>
                        <p className="text-xl font-bold text-red-600">
                          {result.failed}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Uploaded Images */}
              {result.results.length > 0 && (
                <div className="border border-green-200 rounded-lg">
                  <div className="bg-green-50 px-4 py-3 border-b border-green-200 flex items-center justify-between">
                    <h5 className="font-medium text-green-900">
                      Uploaded Images ({result.results.length})
                    </h5>
                    <button
                      onClick={copyAllUrls}
                      className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 flex items-center gap-1"
                    >
                      <Copy size={14} />
                      Copy All URLs
                    </button>
                  </div>
                  
                  <div className="max-h-80 overflow-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="px-4 py-2 text-left text-gray-700">File Name</th>
                          <th className="px-4 py-2 text-left text-gray-700">URL</th>
                          <th className="px-4 py-2 text-left text-gray-700">Size</th>
                          <th className="px-4 py-2 text-left text-gray-700">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {result.results.map((img, idx) => (
                          <tr key={idx} className="hover:bg-gray-50">
                            <td className="px-4 py-2 text-gray-900 font-medium">
                              {img.originalName}
                            </td>
                            <td className="px-4 py-2">
                              <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                                {img.url}
                              </code>
                            </td>
                            <td className="px-4 py-2 text-gray-600">
                              {formatFileSize(img.size)}
                            </td>
                            <td className="px-4 py-2">
                              <button
                                onClick={() => copyUrl(img.url)}
                                className="p-1 hover:bg-gray-200 rounded"
                                title="Copy URL"
                              >
                                <Copy size={14} className="text-gray-600" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Errors */}
              {result.errors && result.errors.length > 0 && (
                <div className="border border-red-200 rounded-lg">
                  <div className="bg-red-50 px-4 py-3 border-b border-red-200">
                    <h5 className="font-medium text-red-900">
                      Failed Uploads ({result.errors.length})
                    </h5>
                  </div>
                  
                  <div className="max-h-40 overflow-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="px-4 py-2 text-left text-gray-700">File</th>
                          <th className="px-4 py-2 text-left text-gray-700">Error</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {result.errors.map((error, idx) => (
                          <tr key={idx} className="hover:bg-gray-50">
                            <td className="px-4 py-2 text-gray-900">{error.file}</td>
                            <td className="px-4 py-2 text-red-600">{error.error}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setResult(null);
                    setFiles([]);
                  }}
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                  Upload More Images
                </button>
                <button
                  onClick={onClose}
                  className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 text-black font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
