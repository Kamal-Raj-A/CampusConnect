import { useState } from 'react';
import { Navigation, X } from 'lucide-react';
import { CAMPUS_PLACES } from '../data/campusPlaces';

interface Props {
  onNavigate: (start: [number, number], end: [number, number]) => void;
  onClear: () => void;
}

export default function CampusNavigationPanel({ onNavigate, onClear }: Props) {
  const [fromId, setFromId] = useState('');
  const [toId, setToId] = useState('');

  const handleNavigate = () => {
    const from = CAMPUS_PLACES.find(p => p.id === fromId);
    const to = CAMPUS_PLACES.find(p => p.id === toId);

    if (!from || !to) {
      alert('Please select both From and To locations');
      return;
    }

    onNavigate([from.lat, from.lng], [to.lat, to.lng]);
  };

  return (
    <div className="absolute top-4 left-4 z-[1000] bg-white rounded-xl shadow-xl p-4 w-72 space-y-3">
      <h3 className="font-bold text-gray-800 flex items-center gap-2">
        <Navigation size={18} className="text-blue-600" />
        Campus Navigation
      </h3>

      <select
        value={fromId}
        onChange={e => setFromId(e.target.value)}
        className="w-full px-3 py-2 border rounded-lg"
      >
        <option value="">From location</option>
        {CAMPUS_PLACES.map(p => (
          <option key={p.id} value={p.id}>{p.name}</option>
        ))}
      </select>

      <select
        value={toId}
        onChange={e => setToId(e.target.value)}
        className="w-full px-3 py-2 border rounded-lg"
      >
        <option value="">To location</option>
        {CAMPUS_PLACES.map(p => (
          <option key={p.id} value={p.id}>{p.name}</option>
        ))}
      </select>

      <div className="flex gap-2">
        <button
          onClick={handleNavigate}
          className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700"
        >
          Show Route
        </button>

        <button
          onClick={onClear}
          className="bg-gray-200 text-gray-700 px-3 rounded-lg hover:bg-gray-300"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
}
