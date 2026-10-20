import { useDialog } from '../../hooks/useDialog';
import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { authApi } from '../../api/authApi';
import { User as UserIcon, Camera, X, Check, Loader2, Mail, ShieldCheck } from 'lucide-react';

export const ProfileModal = ({ isOpen, onClose }) => {
  const { user, updateUserPic } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const dialogRef = useDialog(isOpen, onClose);

  if (!isOpen || !user) return null;

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setError(null);
    setSuccess(false);

    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Image file size must be less than 5MB');
        return;
      }
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCancelPreview = () => {
    setSelectedFile(null);
    setPreview(null);
    setError(null);
    setSuccess(false);
  };

  const handleUploadAvatar = async () => {
    if (!selectedFile || !preview) return;
    setUploading(true);
    setError(null);
    setSuccess(false);
    try {
      // Send the base64 data URL directly as JSON — the backend
      // controller accepts req.body.image as a data URL string and
      // uploads it to Cloudinary. This avoids multer/FormData issues.
      const res = await authApi.uploadAvatar({ image: preview });
      if (res && res.url) {
        updateUserPic(res.url);
        setSuccess(true);
        setTimeout(() => {
          setPreview(null);
          setSelectedFile(null);
          setSuccess(false);
          onClose();
        }, 1000);
      } else {
        throw new Error('Failed to obtain uploaded image URL');
      }
    } catch (err) {
      console.error('Avatar upload error:', err);
      setError(err.message || 'Failed to upload image. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75  flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-label="Your profile" tabIndex={-1} className="max-h-[90dvh] overflow-y-auto w-full max-w-sm sm:max-w-xs bg-devs-surface border-t sm:border border-devs-border/80 rounded-t-3xl sm:rounded-3xl shadow-card-dark p-6 relative animate-in fade-in slide-in-from-bottom-5 sm:zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-3.5 border-b border-devs-border/80 mb-5">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <UserIcon className="w-4 h-4 text-devs-indigo" />
            <span>Profile Settings</span>
          </h3>
          <button
            onClick={() => {
              handleCancelPreview();
              onClose();
            }}
            className="p-1 rounded-lg text-devs-textMuted hover:text-white hover:bg-devs-hover transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400 text-center font-medium">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 font-semibold text-center flex items-center justify-center gap-1.5">
            <Check className="w-4 h-4" /> Avatar updated!
          </div>
        )}

        <div className="flex flex-col items-center text-center space-y-4">
          {/* Avatar with Upload Hover */}
          <div className="relative group">
            <div className="w-24 h-24 rounded-2xl bg-devs-card border border-devs-border overflow-hidden flex items-center justify-center font-bold text-2xl text-devs-indigo shadow-subtle">
              {preview ? (
                <img src={preview} alt="New Preview" className="w-full h-full object-cover" />
              ) : user?.pic ? (
                <img src={user.pic} alt={user.name || 'User'} className="w-full h-full object-cover" />
              ) : (
                (user?.name || user?.email || 'U').charAt(0).toUpperCase()
              )}
            </div>
            <label className="absolute -bottom-1 -right-1 p-2 rounded-xl bg-devs-blue hover:bg-devs-blueHover text-white cursor-pointer shadow-subtle transition-transform active:scale-95">
              <Camera className="w-3.5 h-3.5" />
              <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
            </label>
          </div>

          <div>
            <h2 className="text-base font-bold text-white">{user.name}</h2>
            <p className="text-xs text-devs-textMuted flex items-center justify-center gap-1.5 mt-0.5">
              <Mail className="w-3.5 h-3.5 text-devs-textMuted/70" /> {user.email}
            </p>
          </div>

          {selectedFile && (
            <div className="w-full flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleCancelPreview}
                disabled={uploading}
                className="flex-1 py-2 rounded-xl border border-devs-border text-devs-textSecondary hover:text-white text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUploadAvatar}
                disabled={uploading || success}
                className="flex-1 py-2 rounded-xl bg-devs-blue hover:bg-devs-blueHover text-white text-xs font-semibold flex items-center justify-center gap-1.5 disabled:opacity-50 shadow-subtle"
              >
                {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><Check className="w-3.5 h-3.5" /> Save</>}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
