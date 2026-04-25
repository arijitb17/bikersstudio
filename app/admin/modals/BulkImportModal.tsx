// admin/modals/BulkImportModal.tsx

"use client"
import React, { useState } from 'react';
import { X, Upload, FileSpreadsheet, AlertCircle, CheckCircle, XCircle, Download, Image as ImageIcon, Copy } from 'lucide-react';

interface BulkImportModalProps {
  type: string;
  onClose: () => void;
  onImport: (type: string, file: File) => Promise<ImportResult>; 
  loading: boolean;
}

// BulkImportModal.tsx
export interface ImportResult {  // add 'export'
  success: boolean;
  totalRows: number;
  successRows: number;
  failedRows: number;
  errors?: Array<{ row: number; name: string; error: string }>;
}
interface UploadResult {
  originalName: string;
  fileName: string;
  url: string;
  size: number;
}

interface ImageUploadResponse {
  success: boolean;
  uploaded: number;
  failed: number;
  results: UploadResult[];
  errors?: Array<{ file: string; error: string }>;
}

export const BulkImportModal: React.FC<BulkImportModalProps> = ({ 
  type, 
  onClose, 
  onImport, 
  loading 
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  
  // Image upload states
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imageDragActive, setImageDragActive] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [imageUploadResult, setImageUploadResult] = useState<ImageUploadResponse | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      validateAndSetFile(selectedFile);
    }
  };

  const validateAndSetFile = (selectedFile: File) => {
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv'
    ];
    
    if (!validTypes.includes(selectedFile.type) && 
        !selectedFile.name.match(/\.(xlsx|xls|csv)$/i)) {
      alert('Please select a valid Excel file (.xlsx, .xls, or .csv)');
      return;
    }

    if (selectedFile.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    setFile(selectedFile);
    setResult(null);
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
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async () => {
    if (!file) {
      alert('Please select a file');
      return;
    }

    try {
      const importResult = await onImport(type, file);
      setResult(importResult);
    } catch (error) {
      alert('Import failed: ' + (error as Error).message);
    }
  };

  const downloadTemplate = () => {
    window.open(`/api/admin/templates/${type}`, '_blank');
  };

  const formatTypeName = (type: string) => {
    return type.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const downloadErrorReport = () => {
    if (!result || !result.errors) return;

    const errorCSV = [
      ['Row Number', 'Product Name', 'Error'],
      ...result.errors.map(e => [e.row, e.name, e.error])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([errorCSV], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${type}_import_errors.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Image upload handlers
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    addImageFiles(selectedFiles);
  };

  const addImageFiles = (newFiles: File[]) => {
    const validFiles = newFiles.filter(file => {
      const isValidType = file.type.startsWith('image/');
      const isValidSize = file.size <= 5 * 1024 * 1024;
      return isValidType && isValidSize;
    });

    setImageFiles(prev => [...prev, ...validFiles]);
    setImageUploadResult(null);
  };

  const removeImageFile = (index: number) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleImageDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setImageDragActive(true);
    } else if (e.type === "dragleave") {
      setImageDragActive(false);
    }
  };

  const handleImageDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setImageDragActive(false);
    
    if (e.dataTransfer.files) {
      addImageFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleImageUpload = async () => {
    if (imageFiles.length === 0) return;

    setImageUploading(true);
    try {
      const formData = new FormData();
      imageFiles.forEach(file => {
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

      setImageUploadResult(data);
      setImageFiles([]);
    } catch (error: unknown) {
  alert('Upload failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
} finally {
      setImageUploading(false);
    }
  };

  const copyAllUrls = () => {
    if (!imageUploadResult?.results) return;
    const urls = imageUploadResult.results.map(r => r.url).join(',');
    navigator.clipboard.writeText(urls);
    alert('URLs copied to clipboard! (comma-separated for Excel)');
  };

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    alert('URL copied to clipboard!');
  };

  const formatFileSize = (bytes: number) => {
    return (bytes / 1024).toFixed(2) + ' KB';
  };

  // Check if current type needs images
  const needsImages = ['products', 'brands', 'bikes'].includes(type);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto">
        <div className="border-b px-6 py-4 flex items-center justify-between sticky top-0 bg-white z-10">
          <h3 className="text-xl font-semibold text-black">
            Bulk Import {formatTypeName(type)}
          </h3>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-gray-100 rounded"
            disabled={loading || imageUploading}
          >
            <X size={20} className="text-black" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Tab Navigation (only show for types that need images) */}
          {needsImages && !result && (
            <div className="flex gap-2 border-b">
              <button
                onClick={() => setShowImageUpload(false)}
                className={`px-4 py-2 font-medium transition-colors ${
                  !showImageUpload
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <FileSpreadsheet className="inline mr-2" size={16} />
                Excel Import
              </button>
              <button
                onClick={() => setShowImageUpload(true)}
                className={`px-4 py-2 font-medium transition-colors ${
                  showImageUpload
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <ImageIcon className="inline mr-2" size={16} />
                Upload Images First
              </button>
            </div>
          )}

          {/* Image Upload Section */}
          {showImageUpload && !imageUploadResult && (
            <>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="text-sm space-y-2">
                  <p className="font-medium text-blue-900">📸 Step 1: Upload Images</p>
                  <ul className="list-disc list-inside text-blue-800 space-y-1">
                    <li>Upload all your product/brand/bike images here first</li>
                    <li>Images will be optimized and stored automatically</li>
                    <li>Copy the generated URLs to use in your Excel file</li>
                    <li>Maximum file size: 5MB per image</li>
                  </ul>
                </div>
              </div>

              <div
                className={`relative border-2 border-dashed rounded-lg p-8 transition-colors ${
                  imageDragActive 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                onDragEnter={handleImageDrag}
                onDragLeave={handleImageDrag}
                onDragOver={handleImageDrag}
                onDrop={handleImageDrop}
              >
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  disabled={imageUploading}
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

              {imageFiles.length > 0 && (
                <div className="border rounded-lg">
                  <div className="bg-gray-50 px-4 py-3 border-b flex items-center justify-between">
                    <h5 className="font-medium text-gray-900">
                      Selected Images ({imageFiles.length})
                    </h5>
                    <button
                      onClick={() => setImageFiles([])}
                      className="text-sm text-red-600 hover:text-red-700"
                    >
                      Clear All
                    </button>
                  </div>
                  
                  <div className="max-h-60 overflow-auto p-4 space-y-2">
                    {imageFiles.map((file, idx) => (
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
                          onClick={() => removeImageFile(idx)}
                          className="p-1 hover:bg-gray-200 rounded"
                          disabled={imageUploading}
                        >
                          <X size={16} className="text-gray-600" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleImageUpload}
                  disabled={imageFiles.length === 0 || imageUploading}
                  className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium"
                >
                  {imageUploading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      <span>Uploading...</span>
                    </>
                  ) : (
                    <>
                      <Upload size={16} />
                      <span>Upload {imageFiles.length} Image{imageFiles.length !== 1 ? 's' : ''}</span>
                    </>
                  )}
                </button>
                <button
                  onClick={() => setShowImageUpload(false)}
                  className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 text-black font-medium"
                  disabled={imageUploading}
                >
                  Back to Import
                </button>
              </div>
            </>
          )}

          {/* Image Upload Results */}
          {imageUploadResult && (
            <div className="space-y-4">
              <div className={`p-4 rounded-lg border-2 ${
                imageUploadResult.failed === 0
                  ? 'bg-green-50 border-green-200'
                  : 'bg-yellow-50 border-yellow-200'
              }`}>
                <div className="flex items-start gap-3">
                  {imageUploadResult.failed === 0 ? (
                    <CheckCircle className="text-green-600 flex-shrink-0" size={24} />
                  ) : (
                    <AlertCircle className="text-yellow-600 flex-shrink-0" size={24} />
                  )}
                  
                  <div className="flex-1">
                    <h4 className="font-semibold text-lg mb-2">
                      {imageUploadResult.failed === 0
                        ? '✅ All Images Uploaded Successfully!'
                        : '⚠️ Upload Completed with Errors'
                      }
                    </h4>
                    
                    <div className="grid grid-cols-2 gap-4 mt-3">
                      <div>
                        <p className="text-xs text-gray-600">Successful</p>
                        <p className="text-xl font-bold text-green-600">
                          {imageUploadResult.uploaded}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Failed</p>
                        <p className="text-xl font-bold text-red-600">
                          {imageUploadResult.failed}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {imageUploadResult.results.length > 0 && (
                <div className="border border-green-200 rounded-lg">
                  <div className="bg-green-50 px-4 py-3 border-b border-green-200 flex items-center justify-between">
                    <h5 className="font-medium text-green-900">
                      📋 Uploaded Images - Copy URLs for Excel
                    </h5>
                    <button
                      onClick={copyAllUrls}
                      className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 flex items-center gap-1"
                    >
                      <Copy size={14} />
                      Copy All (Comma-separated)
                    </button>
                  </div>
                  
                  <div className="max-h-80 overflow-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="px-4 py-2 text-left text-gray-700">File Name</th>
                          <th className="px-4 py-2 text-left text-gray-700">URL</th>
                          <th className="px-4 py-2 text-center text-gray-700">Copy</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {imageUploadResult.results.map((img, idx) => (
                          <tr key={idx} className="hover:bg-gray-50">
                            <td className="px-4 py-2 text-gray-900 font-medium">
                              {img.originalName}
                            </td>
                            <td className="px-4 py-2">
                              <code className="text-xs bg-gray-100 px-2 py-1 rounded block truncate">
                                {img.url}
                              </code>
                            </td>
                            <td className="px-4 py-2 text-center">
                              <button
                                onClick={() => copyUrl(img.url)}
                                className="p-2 hover:bg-gray-200 rounded inline-flex items-center gap-1 text-blue-600"
                                title="Copy URL"
                              >
                                <Copy size={14} />
                                Copy
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-900">
                  <strong>✅ Next Step:</strong> Now download the Excel template, paste these URLs in the images column, and import your data!
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setImageUploadResult(null);
                    setImageFiles([]);
                  }}
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                  Upload More Images
                </button>
                <button
                  onClick={() => setShowImageUpload(false)}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                >
                  Continue to Excel Import →
                </button>
              </div>
            </div>
          )}

          {/* Excel Import Section */}
          {!showImageUpload && !result && (
            <>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="text-blue-600 mt-0.5 flex-shrink-0" size={20} />
                  <div className="text-sm">
                    <p className="font-medium text-blue-900 mb-2">Import Instructions</p>
                    <ul className="list-decimal list-inside text-blue-800 space-y-1">
                      {needsImages && (
                        <li><strong>Upload images first using the &quot;Upload Images First&quot; tab</strong></li>
                      )}
                      <li>Download the template file below</li>
                      <li>Fill in your data following the template format</li>
                      <li><strong>Required fields cannot be empty</strong></li>
                      {needsImages && (
                        <li>Paste image URLs (from image upload) into the template</li>
                      )}
                      <li>Upload the completed Excel file</li>
                      <li>Review results and fix any errors if needed</li>
                    </ul>
                  </div>
                </div>
              </div>

              <button
                onClick={downloadTemplate}
                className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors"
              >
                <FileSpreadsheet className="mx-auto mb-2 text-blue-600" size={32} />
                <p className="text-sm font-medium text-black">Download Excel Template</p>
                <p className="text-xs text-gray-500 mt-1">
                  Template includes instructions and sample data
                </p>
              </button>

              <div>
                <label className="block text-sm font-medium mb-2 text-black">
                  Upload Excel File
                </label>
                
                <div
                  className={`relative border-2 border-dashed rounded-lg p-6 transition-colors ${
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
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    disabled={loading}
                  />
                  
                  <div className="text-center">
                    <Upload className="mx-auto mb-2 text-gray-400" size={32} />
                    <p className="text-sm text-gray-600">
                      Drag and drop your file here, or click to browse
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Supports: .xlsx, .xls, .csv (Max 5MB)
                    </p>
                  </div>
                </div>

                {file && (
                  <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
                    <CheckCircle size={16} className="text-green-600 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-green-900 truncate">
                        {file.name}
                      </p>
                      <p className="text-xs text-green-700">
                        {(file.size / 1024).toFixed(2)} KB
                      </p>
                    </div>
                    <button
                      onClick={() => setFile(null)}
                      className="p-1 hover:bg-green-100 rounded"
                      disabled={loading}
                    >
                      <X size={16} className="text-green-600" />
                    </button>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleSubmit}
                  disabled={!file || loading}
                  className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <Upload size={16} />
                      <span>Import Data</span>
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

          {/* Results Display */}
          {result && (
            <div className="space-y-4">
              <div className={`p-4 rounded-lg border-2 ${
                result.success && result.failedRows === 0
                  ? 'bg-green-50 border-green-200'
                  : result.failedRows > 0
                  ? 'bg-yellow-50 border-yellow-200'
                  : 'bg-red-50 border-red-200'
              }`}>
                <div className="flex items-start gap-3">
                  {result.success && result.failedRows === 0 ? (
                    <CheckCircle className="text-green-600 flex-shrink-0" size={24} />
                  ) : result.failedRows > 0 ? (
                    <AlertCircle className="text-yellow-600 flex-shrink-0" size={24} />
                  ) : (
                    <XCircle className="text-red-600 flex-shrink-0" size={24} />
                  )}
                  
                  <div className="flex-1">
                    <h4 className="font-semibold text-lg mb-2">
                      {result.success && result.failedRows === 0
                        ? 'Import Completed Successfully!'
                        : result.failedRows > 0
                        ? 'Import Completed with Errors'
                        : 'Import Failed'
                      }
                    </h4>
                    
                    <div className="grid grid-cols-3 gap-4 mt-3">
                      <div>
                        <p className="text-xs text-gray-600">Total Rows</p>
                        <p className="text-xl font-bold text-gray-900">
                          {result.totalRows}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Successful</p>
                        <p className="text-xl font-bold text-green-600">
                          {result.successRows}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Failed</p>
                        <p className="text-xl font-bold text-red-600">
                          {result.failedRows}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {result.errors && result.errors.length > 0 && (
                <div className="border border-red-200 rounded-lg">
                  <div className="bg-red-50 px-4 py-3 border-b border-red-200 flex items-center justify-between">
                    <h5 className="font-medium text-red-900">
                      Error Details ({result.errors.length} rows)
                    </h5>
                    <button
                      onClick={downloadErrorReport}
                      className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 flex items-center gap-1"
                    >
                      <Download size={14} />
                      Download Report
                    </button>
                  </div>
                  
                  <div className="max-h-60 overflow-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="px-4 py-2 text-left text-gray-700">Row</th>
                          <th className="px-4 py-2 text-left text-gray-700">Name</th>
                          <th className="px-4 py-2 text-left text-gray-700">Error</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {result.errors.map((error, idx) => (
                          <tr key={idx} className="hover:bg-gray-50">
                            <td className="px-4 py-2 text-gray-900">{error.row}</td>
                            <td className="px-4 py-2 text-gray-900 font-medium">
                              {error.name}
                            </td>
                            <td className="px-4 py-2 text-red-600">{error.error}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setFile(null);
                    setResult(null);
                  }}
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                  Import Another File
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
