import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { authApi } from '../../api/authApi';
import { User as UserIcon, Camera, X, Check, Loader2, Mail, ShieldCheck } from 'lucide-react';

export const ProfileModal = ({ isOpen, onClose }) => {
  const { user, updateUserPic } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);

  if (!isOpen || !user) return null;

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadAvatar = async () => {
    if (!selectedFile) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', selectedFile);
      const res = await authApi.uploadAvatar(formData);
      updateUserPic(res.url);
      setPreview(null);
      setSelectedFile(null);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-sm glass-panel rounded-2xl border border-devs-border shadow-card-dark p-6 relative">
        <div className="flex items-center justify-between pb-4 border-b border-devs-border mb-6">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-devs-blue" />
            <span>Profile Settings</span>
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-devs-textMuted hover:text-white hover:bg-devs-hover"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-col items-center text-center space-y-4">
          {/* Avatar with Upload Hover */}
          <div className="relative group">
            <div className="w-28 h-28 rounded-3xl bg-devs-card border-2 border-devs-border overflow-hidden flex items-center justify-center font-bold text-3xl text-devs-blue shadow-glow-blue">
              {preview ? (
                <img src={preview} alt="New Preview" className="w-full h-full object-cover" />
              ) : user.pic ? (
                <img src={user.pic} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                user.name.charAt(0).toUpperCase()
              )}
            </div>
            <label className="absolute bottom-0 right-0 p-2.5 rounded-2xl bg-devs-blue hover:bg-devs-blueHover text-white cursor-pointer shadow-glow-blue transition-transform hover:scale-105">
              <Camera className="w-4 h-4" />
              <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
            </label>
          </div>

          <div>
            <h2 className="text-xl font-bold text-white">{user.name}</h2>
            <p className="text-xs text-devs-textMuted flex items-center justify-center gap-1.5 mt-1">
              <Mail className="w-3.5 h-3.5" /> {user.email}
            </p>
          </div>

          {selectedFile && (
            <button
              onClick={handleUploadAvatar}
              disabled={uploading}
              className="w-full py-2.5 rounded-xl devs-gradient-btn text-white text-xs font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Check className="w-4 h-4" /> Save New Avatar</>}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
