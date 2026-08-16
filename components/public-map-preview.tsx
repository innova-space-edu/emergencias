'use client';
import dynamic from 'next/dynamic';
const EmergencyMap = dynamic(() => import('@/components/emergency-map'), { ssr: false });
export default function PublicMapPreview(){return <EmergencyMap mode="preview" />;}
