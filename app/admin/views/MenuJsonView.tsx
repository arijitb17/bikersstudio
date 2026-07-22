'use client';

import { useState, useEffect } from 'react';
import { Save, Upload, Download, RefreshCw, Copy, Check } from 'lucide-react';

// Fully dynamic — no hardcoded section names
type MenuStructure = Record<string, Record<string, { name: string; slug: string }[]>>;

export function MenuJsonView() {
  const [menuData, setMenuData] = useState<MenuStructure | null>(null);
  const [jsonText, setJsonText] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => { loadMenuData(); }, []);

  const loadMenuData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/menu-structure');
      const data = await response.json();
      if (response.ok) {
        setMenuData(data.menuStructure);
        setJsonText(JSON.stringify(data.menuStructure, null, 2));
        setError('');
      } else {
        setError('Failed to load menu structure');
      }
    } catch (err) {
      setError('Error loading menu structure');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const parsedData = JSON.parse(jsonText);
      setSaving(true);
      const response = await fetch('/api/admin/menu-structure', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ menuStructure: parsedData }),
      });
      if (response.ok) {
        setMenuData(parsedData);
        alert('Menu structure saved successfully!');
        setError('');
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to save menu structure');
      }
    } catch (err) {
      if (err instanceof SyntaxError) {
        setError('Invalid JSON format. Please check your syntax.');
      } else {
        setError('Error saving menu structure');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([jsonText], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `menu-structure-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        setJsonText(JSON.stringify(JSON.parse(content), null, 2));
        setError('');
      } catch {
        setError('Invalid JSON file');
      }
    };
    reader.readAsText(file);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatJson = () => {
    try {
      setJsonText(JSON.stringify(JSON.parse(jsonText), null, 2));
      setError('');
    } catch {
      setError('Invalid JSON format');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
          <p className="text-gray-600">Loading menu structure...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Menu Structure Editor</h2>
        <p className="text-gray-600 text-sm">
          Edit the navigation menu structure in JSON format. Add, remove, or rename any section — 
          the navbar will update automatically. No code changes needed.
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex flex-wrap gap-3">
          <button onClick={handleSave} disabled={saving || !!error} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors">
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
          <button onClick={formatJson} className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
            <RefreshCw className="w-4 h-4" />Format JSON
          </button>
          <button onClick={handleCopy} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied!' : 'Copy JSON'}
          </button>
          <button onClick={handleDownload} className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors">
            <Download className="w-4 h-4" />Download JSON
          </button>
          <label className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors cursor-pointer">
            <Upload className="w-4 h-4" />Upload JSON
            <input type="file" accept=".json" onChange={handleUpload} className="hidden" />
          </label>
          <button onClick={loadMenuData} className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors">
            <RefreshCw className="w-4 h-4" />Reload
          </button>
        </div>
        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Menu Structure JSON</label>
        <p className="text-xs text-gray-500 mb-4">
          Each top-level key = one navbar dropdown. Add any key and it appears automatically.
          Empty sections are hidden from the navbar.
        </p>
        <textarea
          value={jsonText}
          onChange={(e) => setJsonText(e.target.value)}
          className="text-black w-full h-[600px] p-4 font-mono text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          spellCheck={false}
          placeholder="Enter menu structure JSON..."
        />
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-600 font-mono">
            Lines: {jsonText.split('\n').length} | Characters: {jsonText.length}
          </p>
        </div>
      </div>

      {/* Dynamic preview — works with any sections */}
      {menuData && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Structure Preview</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(menuData).map(([section, categories]) => {
              const catCount = Object.keys(categories).length;
              const itemCount = Object.values(categories).reduce((sum, items) => sum + items.length, 0);
              return (
                <div key={section} className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-2 capitalize">
                    {section.replace(/([A-Z])/g, ' $1').trim()}
                  </h4>
                  <div className="text-sm text-gray-600">
                    <p>{catCount} categories</p>
                    <p>{itemCount} items</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">How it works</h3>
        <div className="space-y-2 text-sm text-blue-800">
          <p>Add any top-level key — it automatically becomes a navbar dropdown with that name.</p>
          <p>The navbar label uses the key name (camelCase converted to words), or you can add custom labels in <code>SECTION_LABELS</code> in Navbar.tsx.</p>
          <p>Empty sections <code>{'{}'}</code> are automatically hidden from the navbar.</p>
          <pre className="bg-blue-100 p-3 rounded mt-2 overflow-x-auto text-xs">{`{
  "motorcycleAccessories": {
    "Protection & Safety": [
      { "name": "Crash Guards", "slug": "crash-guards" }
    ]
  },
  "universalAccessories": {
    "Universal": [
      { "name": "Accessories", "slug": "accessories" }
    ]
  }
}`}</pre>
        </div>
      </div>
    </div>
  );
}