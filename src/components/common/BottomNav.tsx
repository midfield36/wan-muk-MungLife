import React from 'react';
import {
  Home,
  MapPin,
  AlertTriangle,
  Heart,
  Footprints,
  MessageSquare,
} from 'lucide-react';

interface BottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, setActiveTab }) => {
  const navItems = [
    { id: 'home', label: '홈', icon: Home },
    { id: 'places', label: '주변찾기', icon: MapPin },
    { id: 'emergency', label: '긴급도움', icon: AlertTriangle, isEmergency: true },
    { id: 'dog', label: '우리강아지', icon: Heart },
    { id: 'walk', label: '산책·여행', icon: Footprints },
    { id: 'community', label: '이야기나눔', icon: MessageSquare },
  ];

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-stone-200 lg:hidden shadow-lg safe-area-pb">
      <div className="grid grid-cols-6 max-w-md mx-auto h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center gap-1 transition-all active:scale-95 ${
                item.isEmergency
                  ? isActive
                    ? 'text-rose-600'
                    : 'text-rose-500'
                  : isActive
                  ? 'text-teal-700'
                  : 'text-stone-400 hover:text-stone-600'
              }`}
            >
              <div
                className={`p-1 rounded-xl transition-all ${
                  item.isEmergency && isActive
                    ? 'bg-rose-50'
                    : isActive
                    ? 'bg-teal-50'
                    : ''
                }`}
              >
                <Icon
                  className={`w-5 h-5 ${
                    item.isEmergency && !isActive ? 'animate-pulse' : ''
                  }`}
                  strokeWidth={isActive ? 2.5 : 2}
                />
              </div>
              <span
                className={`text-[10px] font-medium leading-none tracking-tight ${
                  isActive ? 'font-bold' : ''
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
