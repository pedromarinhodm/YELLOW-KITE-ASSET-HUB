import { 
  Laptop, 
  Monitor, 
  Keyboard, 
  Mouse, 
  Headphones, 
  Video,
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
  other: Package,
};

export function CategoryIcon({ category, className = 'w-5 h-5' }: CategoryIconProps) {
  const Icon = iconMap[category] || Package;
  return <Icon className={className} />;
}
