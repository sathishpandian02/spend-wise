import React from 'react';
import {
  Utensils,
  Car,
  ShoppingBag,
  Receipt,
  Film,
  GraduationCap,
  HeartPulse,
  Plane,
  Tv,
  Home,
  CreditCard,
  MoreHorizontal,
  ArrowDownLeft,
  PiggyBank,
  Wallet,
  Tag,
  DollarSign,
  TrendingUp,
} from 'lucide-react';

const iconMap = {
  Utensils,
  Car,
  ShoppingBag,
  Receipt,
  Film,
  GraduationCap,
  HeartPulse,
  Plane,
  Tv,
  Home,
  CreditCard,
  MoreHorizontal,
  ArrowDownLeft,
  PiggyBank,
  Wallet,
  Tag,
  DollarSign,
  TrendingUp,
};

export default function CategoryIcon({ name, icon, size = 18, color = '#6366f1', className = '' }) {
  // If icon key is directly passed
  const Component = iconMap[icon] || iconMap[name] || Tag;
  return <Component size={size} color={color} className={className} />;
}
