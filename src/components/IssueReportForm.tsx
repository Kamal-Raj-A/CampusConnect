import { useState, useEffect } from 'react';
import { MapPin, Upload, Send, X, Check, Building, UserCheck, LogIn } from 'lucide-react';
import type { IssueCategory } from '../lib/database.types';
import { fetchAllCategories, createNewIssue } from '../lib/issuesService';
import { CAMPUS_PLACES } from '../data/campusPlaces';
import type { AuthUser } from '../lib/authService';

interface IssueReportFormProps {
  onSuccess: () => void;
  preselectedLocation?: { lat: number; lng: number; name: string };
  onLocationSelect?: (lat: number, lng: number, name: string) => void;
  currentUser?: AuthUser | null;
  onOpenAuth?: () => void;
}

export default function IssueReportForm({
  onSuccess,
  preselectedLocation,
  onLocationSelect,
  currentUser,
  onOpenAuth,
}: IssueReportFormProps) {
  const [categories, setCategories] = useState<IssueCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category_id: '',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'critical',
    location_lat: preselectedLocation?.lat || null,
    location_lng: preselectedLocation?.lng || null,
    location_name: preselectedLocation?.name || '',
    reporter_name: currentUser?.name || '',
    reporter_contact: currentUser?.email || '',
  });

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    const cats = await fetchAllCategories();
    setCategories(cats);
    if (cats.length > 0) {
      setFormData((prev) => ({
        ...prev,
        category_id: prev.category_id || cats[0].id,
      }));
    }
  };

  // Sync user info into form
  useEffect(() => {
    if (currentUser) {
      setFormData((prev) => ({
        ...prev,
        reporter_name: prev.reporter_name || currentUser.name,
        reporter_contact: prev.reporter_contact || currentUser.email,
      }));
    }
  }, [currentUser]);

  useEffect(() => {
    if (preselectedLocation) {
      setFormData((prev) => ({
        ...prev,
        location_lat: preselectedLocation.lat,
        location_lng: preselectedLocation.lng,
        location_name: preselectedLocation.name,
      }));
    }
  }, [preselectedLocation]);

  const handlePlaceDropdownChange = (placeId: string) => {
    const place = CAMPUS_PLACES.find((p) => p.id === placeId);
    if (place) {
      setFormData((prev) => ({
        ...prev,
        location_lat: place.lat,
        location_lng: place.lng,
        location_name: place.name,
      }));
      onLocationSelect?.(place.lat, place.lng, place.name);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.category_id && categories.length > 0) {
      formData.category_id = categories[0].id;
    }

    setLoading(true);

    try {
      const res = await createNewIssue({
        title: formData.title,
        description: formData.description,
        category_id: formData.category_id,
        priority: formData.priority,
        location_lat: formData.location_lat,
        location_lng: formData.location_lng,
        location_name: formData.location_name || 'Campus Grounds',
        reporter_name: formData.reporter_name || currentUser?.name || 'Anonymous',
        reporter_contact: formData.reporter_contact || currentUser?.email || '',
        imageFile: imageFile,
      });

      if (res.success) {
        setFormData({
          title: '',
          description: '',
          category_id: categories[0]?.id || '',
          priority: 'medium',
          location_lat: null,
          location_lng: null,
          location_name: '',
          reporter_name: currentUser?.name || '',
          reporter_contact: currentUser?.email || '',
        });
        setImageFile(null);
        setImagePreview(null);

        alert('Issue reported successfully! Your report is now tracked on the map and dashboard.');
        onSuccess();
      } else {
        alert('Failed to report issue. Please try again.');
      }
    } catch (error) {
      console.error('Error reporting issue:', error);
      alert('Failed to report issue. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 border border-gray-100">
      <div className="flex items-center justify-between pb-6 border-b border-gray-100 mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md">
            <MapPin size={24} />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
              Submit Issue Details
            </h2>
            <p className="text-sm text-gray-500">
              Fill in the information below to register your campus issue
            </p>
          </div>
        </div>

        {/* LOGGED IN / GUEST STATUS */}
        {currentUser ? (
          <div className="inline-flex items-center gap-1.5 text-xs bg-blue-50 text-blue-800 border border-blue-200 px-3 py-1.5 rounded-xl font-medium">
            <UserCheck size={14} className="text-blue-600" />
            <span>Reporting as <strong>{currentUser.name}</strong></span>
          </div>
        ) : (
          <button
            type="button"
            onClick={onOpenAuth}
            className="inline-flex items-center gap-1.5 text-xs bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 px-3 py-1.5 rounded-xl font-semibold transition cursor-pointer"
          >
            <LogIn size={13} />
            <span>Sign In to Track My Issues</span>
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* LOCATION SELECTOR & STATUS */}
        <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-4 sm:p-5">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-bold text-blue-900 flex items-center gap-1.5">
              <Building size={16} className="text-blue-600" />
              Issue Location
            </label>
            {formData.location_lat && formData.location_lng && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                <Check size={12} /> Map Coordinates Captured
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                Choose Campus Facility / Building
              </label>
              <select
                onChange={(e) => handlePlaceDropdownChange(e.target.value)}
                value={
                  CAMPUS_PLACES.find((p) => p.name === formData.location_name)?.id || ''
                }
                className="w-full px-3 py-2 bg-white border border-blue-200 rounded-lg text-sm text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none cursor-pointer"
              >
                <option value="">-- Select from Known Campus Places --</option>
                {CAMPUS_PLACES.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                Location Name / Floor / Specific Spot
              </label>
              <input
                type="text"
                value={formData.location_name}
                onChange={(e) => setFormData({ ...formData, location_name: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-blue-200 rounded-lg text-sm text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="e.g., Library 2nd Floor, Near Main Gate"
              />
            </div>
          </div>

          {formData.location_lat && formData.location_lng ? (
            <div className="mt-2 text-xs text-blue-700 font-mono">
              Latitude: {formData.location_lat.toFixed(6)} | Longitude: {formData.location_lng.toFixed(6)}
            </div>
          ) : (
            <p className="mt-2 text-xs text-amber-800 bg-amber-50 p-2 rounded-lg border border-amber-200">
              💡 Tip: Click directly on the map above or pick a building from the dropdown to set coordinates.
            </p>
          )}
        </div>

        {/* ISSUE TITLE */}
        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-1.5">
            Issue Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            placeholder="e.g., Water leakage in 2nd floor restroom"
          />
        </div>

        {/* CATEGORY AND PRIORITY */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-1.5">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={formData.category_id}
              onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white cursor-pointer font-medium text-gray-800"
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-1.5">
              Priority <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={formData.priority}
              onChange={(e) =>
                setFormData({ ...formData, priority: e.target.value as any })
              }
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white cursor-pointer"
            >
              <option value="low">🟢 Low (Routine maintenance)</option>
              <option value="medium">🟡 Medium (Needs attention)</option>
              <option value="high">🟠 High (Impacting daily activities)</option>
              <option value="critical">🔴 Critical (Immediate safety hazard)</option>
            </select>
          </div>
        </div>

        {/* DESCRIPTION */}
        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-1.5">
            Detailed Description <span className="text-red-500">*</span>
          </label>
          <textarea
            required
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            placeholder="Please provide specifics: room number, exact problem, any hazard..."
          />
        </div>

        {/* REPORTER DETAILS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-1.5">
              Reporter Name
            </label>
            <input
              type="text"
              value={formData.reporter_name}
              onChange={(e) => setFormData({ ...formData, reporter_name: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              placeholder="Your name or Student ID"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-1.5">
              Contact Info (Email)
            </label>
            <input
              type="text"
              value={formData.reporter_contact}
              onChange={(e) =>
                setFormData({ ...formData, reporter_contact: e.target.value })
              }
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              placeholder="Email address"
            />
          </div>
        </div>

        {/* PHOTO UPLOAD */}
        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-1.5">
            Attach Photo (Optional)
          </label>
          {!imagePreview ? (
            <label className="flex flex-col items-center justify-center w-full px-4 py-6 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-blue-500 hover:bg-blue-50/30 transition-all">
              <Upload className="text-gray-400 mb-1" size={28} />
              <span className="text-sm font-medium text-gray-700">Click to upload photo of the issue</span>
              <span className="text-xs text-gray-400 mt-0.5">PNG, JPG, JPEG up to 10MB</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
            </label>
          ) : (
            <div className="relative inline-block w-full max-w-xs">
              <img
                src={imagePreview}
                alt="Preview"
                className="w-full h-40 object-cover rounded-xl border border-gray-200 shadow-sm"
              />
              <button
                type="button"
                onClick={removeImage}
                className="absolute top-2 right-2 bg-red-600 text-white p-1.5 rounded-full hover:bg-red-700 shadow-md transition cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>
          )}
        </div>

        {/* SUBMIT BUTTON */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3.5 rounded-xl font-bold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-blue-500/25 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-base cursor-pointer"
        >
          <Send size={18} />
          {loading ? 'Registering Issue...' : 'Submit Issue Report'}
        </button>
      </form>
    </div>
  );
}
