import React, { useState } from 'react';
import { ShopSettings } from '../types';
import { SaveIcon } from './Icons';

interface SettingsProps {
  settings: ShopSettings;
  onSave: (settings: ShopSettings) => void;
}

export default function Settings({ settings, onSave }: SettingsProps) {
  const [editedSettings, setEditedSettings] = useState<ShopSettings>(settings);
  const [feedback, setFeedback] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditedSettings(prev => ({ ...prev, [name]: value }));
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
          alert("File is too large. Please select an image under 2MB.");
          return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditedSettings(prev => ({ ...prev, logo: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLogo = () => {
    setEditedSettings(prev => ({ ...prev, logo: '' }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(editedSettings);
    setFeedback('Settings saved successfully!');
    window.scrollTo(0, 0);
    setTimeout(() => setFeedback(''), 3000);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 mb-2">Shop Settings</h1>
      <p className="text-gray-500 mb-6">Update your shop's information and logo.</p>
      
      {feedback && 
          <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-6" role="alert">
              <p>{feedback}</p>
          </div>
      }
      
      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Logo</label>
            <div className="mt-2 flex items-center gap-4">
              {editedSettings.logo ? (
                <img src={editedSettings.logo} alt="Shop Logo" className="h-20 w-20 rounded-full object-cover shadow-sm" />
              ) : (
                <span className="h-20 w-20 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 border">No Logo</span>
              )}
              <input type="file" id="logo-upload" className="hidden" onChange={handleLogoChange} accept="image/png, image/jpeg" />
              <button type="button" onClick={() => document.getElementById('logo-upload')?.click()} className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">Change</button>
              {editedSettings.logo && (
                 <button type="button" onClick={handleRemoveLogo} className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-red-600 hover:text-red-800">Remove</button>
              )}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <label htmlFor="shopName" className="block text-sm font-medium text-gray-700">Shop Name</label>
                <input type="text" name="shopName" id="shopName" value={editedSettings.shopName} onChange={handleInputChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm" />
            </div>
             <div>
                <label htmlFor="slogan" className="block text-sm font-medium text-gray-700">Slogan</label>
                <input type="text" name="slogan" id="slogan" value={editedSettings.slogan} onChange={handleInputChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm" />
            </div>
            <div>
                <label htmlFor="mobile1" className="block text-sm font-medium text-gray-700">Mobile 1</label>
                <input type="text" name="mobile1" id="mobile1" value={editedSettings.mobile1} onChange={handleInputChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm" />
            </div>
             <div>
                <label htmlFor="mobile2" className="block text-sm font-medium text-gray-700">Mobile 2 (Optional)</label>
                <input type="text" name="mobile2" id="mobile2" value={editedSettings.mobile2} onChange={handleInputChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm" />
            </div>
          </div>
           <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-700">Address</label>
              <textarea name="address" id="address" value={editedSettings.address} onChange={handleInputChange} rows={3} className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"></textarea>
           </div>
        </div>
        <div className="mt-8 flex justify-end items-center gap-4">
          <button type="submit" className="bg-blue-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-blue-700 transition shadow-md flex items-center gap-2">
            <SaveIcon className="w-5 h-5" /> Save Changes
          </button>
        </div>
      </form>
    </div>
  );
}
