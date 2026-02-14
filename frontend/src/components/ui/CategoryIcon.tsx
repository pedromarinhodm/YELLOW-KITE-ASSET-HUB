import { 
  Laptop, 
  Monitor, 
  Keyboard, 
  Mouse, 
  Headphones, 
  Video,
  Smartphone,
  Camera,
  Mic,
  Lightbulb,
  Package
} from 'lucide-react';
import { EquipmentCategory } from '@/types';

interface CategoryIconProps {
  category: EquipmentCategory;
  className?: string;
}

const iconMap: Record<EquipmentCategory, React.ComponentType<{ className?: string }>> = {
  notebook: Laptop,
  monitor: Monitor,
  keyboard: Keyboard,
  mouse: Mouse,
  headset: Headphones,
  webcam: Video,
  accessories_station: Package,
  other_station: Package,
  smartphone: Smartphone,
  tripod: Video,
  ringlight: Lightbulb,
  camera: Camera,
  microphone: Mic,
  accessories_field: Package,
  other_field: Package,
  other: Package,
};

export function CategoryIcon({ category, className = 'w-5 h-5' }: CategoryIconProps) {
  const Icon = iconMap[category] || Package;
  return <Icon className={className} />;
}
