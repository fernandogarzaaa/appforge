import React from 'react';
import { useTenantBranding } from './useTenantBranding';

/**
 * Tenant Isolation Component
 * Visualize data isolation and tenant switching
 */
export const TenantIsolation = () => {
  const { branding, updateBranding, uploadLogo, setCustomDomain, resetBranding } = useTenantBranding();

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      uploadLogo(file);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Tenant Branding</h1>

      {/* Branding Settings */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4">Customize Your Brand</h2>
        
        <div className="space-y-4">
          {/* Logo Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Logo</label>
            {branding.logo && (
              <img src={branding.logo} alt="Logo" className="h-20 mb-2 object-contain" />
            )}
            <input
              type="file"
              accept="image/*"
              onChange={handleLogoUpload}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>

          {/* Company Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Company Name</label>
            <input
              type="text"
              value={branding.companyName}
              onChange={(e) => updateBranding({ companyName: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg"
              placeholder="Your Company Name"
            />
          </div>

          {/* Primary Color */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Primary Color</label>
            <div className="flex gap-2">
              <input
                type="color"
                value={branding.primaryColor}
                onChange={(e) => updateBranding({ primaryColor: e.target.value })}
                className="h-10 w-20 border rounded"
              />
              <input
                type="text"
                value={branding.primaryColor}
                onChange={(e) => updateBranding({ primaryColor: e.target.value })}
                className="flex-1 px-4 py-2 border rounded-lg"
              />
            </div>
          </div>

          {/* Secondary Color */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Secondary Color</label>
            <div className="flex gap-2">
              <input
                type="color"
                value={branding.secondaryColor}
                onChange={(e) => updateBranding({ secondaryColor: e.target.value })}
                className="h-10 w-20 border rounded"
              />
              <input
                type="text"
                value={branding.secondaryColor}
                onChange={(e) => updateBranding({ secondaryColor: e.target.value })}
                className="flex-1 px-4 py-2 border rounded-lg"
              />
            </div>
          </div>

          {/* Custom Domain */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Custom Domain</label>
            <input
              type="text"
              value={branding.customDomain || ''}
              onChange={(e) => setCustomDomain(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg"
              placeholder="app.yourdomain.com"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => updateBranding(branding)}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Save Changes
            </button>
            <button
              onClick={resetBranding}
              className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
            >
              Reset to Default
            </button>
          </div>
        </div>
      </div>

      {/* Preview */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4">Preview</h2>
        <div className="border rounded-lg p-6" style={{
          borderColor: branding.primaryColor,
          backgroundColor: branding.primaryColor + '10',
        }}>
          {branding.logo && <img src={branding.logo} alt="Logo" className="h-12 mb-4" />}
          <h3 className="text-2xl font-bold" style={{ color: branding.primaryColor }}>
            {branding.companyName || 'Your Company Name'}
          </h3>
          <p className="mt-2 text-gray-600">
            This is how your branded interface will look to users.
          </p>
          <button
            className="mt-4 px-4 py-2 rounded-lg text-white"
            style={{ backgroundColor: branding.primaryColor }}
          >
            Primary Button
          </button>
          <button
            className="mt-4 ml-2 px-4 py-2 rounded-lg text-white"
            style={{ backgroundColor: branding.secondaryColor }}
          >
            Secondary Button
          </button>
        </div>
      </div>
    </div>
  );
};
