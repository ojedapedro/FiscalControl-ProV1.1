
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Store } from '../types';
import { Maximize2, RefreshCw, AlertTriangle, MapPin } from 'lucide-react';
import { APIProvider, Map, AdvancedMarker, Pin, useApiLoadingStatus, APILoadingStatus } from '@vis.gl/react-google-maps';

interface VenezuelaMapProps {
  stores: Store[];
  selectedStoreIds?: string[];
  onStoreClick?: (id: string) => void;
}

const MapContent: React.FC<VenezuelaMapProps & { setActiveStore: (store: Store | null) => void }> = ({ stores, selectedStoreIds = [], onStoreClick, setActiveStore }) => {
  const status = useApiLoadingStatus();

  if (status === APILoadingStatus.FAILED) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-slate-800/50 text-slate-400 p-8 text-center">
        <AlertTriangle size={48} className="text-amber-500 mb-4" />
        <h4 className="text-lg font-bold text-white mb-2">Error al cargar el mapa</h4>
        <p className="text-sm max-w-xs">
          Hubo un problema con la API de Google Maps. Por favor, verifique que la API esté habilitada en su consola de Google Cloud.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-4">
          {stores.map(store => (
            <button
              key={store.id}
              onClick={() => setActiveStore(store)}
              className="px-3 py-1.5 bg-slate-700/50 hover:bg-slate-700 rounded-lg text-[10px] font-bold text-slate-300 transition-colors flex items-center gap-2"
            >
              <MapPin size={10} /> {store.name}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <Map
      defaultCenter={{ lat: 7.5, lng: -66.5 }}
      defaultZoom={5}
      mapId="venezuela-map"
      disableDefaultUI={true}
      zoomControl={true}
      gestureHandling={'greedy'}
      className="w-full h-full"
    >
      {stores.map((store) => {
        if (store.lat && store.lng) {
          const isSelected = selectedStoreIds.includes(store.id);
          const color = store.status === 'En Regla' ? '#22c55e' : store.status === 'En Riesgo' ? '#eab308' : '#ef4444';
          
          return (
            <AdvancedMarker
              key={store.id}
              position={{ lat: store.lat, lng: store.lng }}
              onClick={() => {
                if (onStoreClick) onStoreClick(store.id);
                setActiveStore(store);
              }}
            >
              <div className="relative flex items-center justify-center">
                {isSelected && (
                  <div className="absolute w-10 h-10 rounded-full border-2 border-white border-dashed animate-[spin_4s_linear_infinite]" />
                )}
                <div className={`absolute w-8 h-8 rounded-full opacity-30 ${isSelected ? 'animate-pulse' : 'animate-ping'}`} style={{ backgroundColor: color }} />
                <Pin background={color} borderColor={isSelected ? '#fff' : color} glyphColor="#fff" />
              </div>
            </AdvancedMarker>
          );
        }
        return null;
      })}
    </Map>
  );
};

export const VenezuelaMap: React.FC<VenezuelaMapProps> = ({ stores, selectedStoreIds = [], onStoreClick }) => {
  const [activeStore, setActiveStore] = React.useState<Store | null>(null);

  // Use a placeholder key if not provided in env
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

  if (!apiKey) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card p-8 flex flex-col items-center justify-center relative group min-h-[500px]"
      >
        <div className="flex items-center gap-3 mb-6">
            <div className="w-1.5 h-6 bg-blue-500 rounded-full"></div>
            <h3 className="text-xl font-bold text-white tracking-tight">Cobertura Nacional</h3>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-slate-800/30 rounded-2xl border border-slate-700/50 w-full">
          <MapPin size={48} className="text-slate-600 mb-4" />
          <h4 className="text-lg font-bold text-white mb-2">Mapa no configurado</h4>
          <p className="text-sm text-slate-400 max-w-xs mb-6">
            Configure su API Key de Google Maps en el archivo .env para visualizar la cobertura nacional.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 w-full">
            {stores.map(store => (
              <button
                key={store.id}
                onClick={() => setActiveStore(store)}
                className="p-3 bg-slate-800/50 hover:bg-slate-700/50 rounded-xl border border-slate-700/50 text-left transition-all group/btn"
              >
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 group-hover/btn:text-blue-400">{store.location}</p>
                <p className="text-xs font-bold text-white truncate">{store.name}</p>
              </button>
            ))}
          </div>
        </div>
        
        {/* Overlay for selected store when map is missing */}
        <AnimatePresence>
            {activeStore && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="absolute inset-x-8 bottom-8 z-50 glass-card p-6"
              >
                <div className="flex items-center justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-4 h-4 rounded-full ${
                      activeStore.status === 'En Regla' ? 'bg-green-500' : 
                      activeStore.status === 'En Riesgo' ? 'bg-yellow-500' : 'bg-red-500'
                    }`}></div>
                    <p className="font-bold text-white text-lg tracking-tight">{activeStore.name}</p>
                  </div>
                  <button onClick={() => setActiveStore(null)} className="text-slate-400 hover:text-white transition-colors p-2">&times;</button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1">Ubicación</p>
                      <p className="text-sm text-slate-300">{activeStore.location}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1">Estado Fiscal</p>
                      <p className={`text-sm font-bold ${
                        activeStore.status === 'En Regla' ? 'text-green-400' : 
                        activeStore.status === 'En Riesgo' ? 'text-yellow-400' : 'text-red-400'
                      }`}>{activeStore.status}</p>
                    </div>
                </div>
              </motion.div>
            )}
        </AnimatePresence>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass-card p-8 flex flex-col items-center justify-center relative group"
    >
      <div className="flex justify-between items-center w-full mb-6 z-10">
        <div className="flex items-center gap-3">
            <div className="w-1.5 h-6 bg-blue-500 rounded-full"></div>
            <h3 className="text-xl font-bold text-white tracking-tight">Cobertura Nacional</h3>
        </div>
      </div>

      <div className="relative w-full h-[450px] rounded-2xl overflow-hidden border border-slate-700/50">
        <APIProvider apiKey={apiKey}>
          <MapContent 
            stores={stores} 
            selectedStoreIds={selectedStoreIds} 
            onStoreClick={onStoreClick} 
            setActiveStore={setActiveStore}
          />
        </APIProvider>

        {/* Custom Tooltip Overlay */}
        <AnimatePresence>
            {activeStore && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 10 }}
                className="absolute bottom-6 left-6 z-50 glass-card p-5 min-w-[240px]"
              >
                <div className="flex items-center justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full shadow-[0_0_10px_rgba(0,0,0,0.5)] ${
                      activeStore.status === 'En Regla' ? 'bg-green-500' : 
                      activeStore.status === 'En Riesgo' ? 'bg-yellow-500' : 'bg-red-500'
                    }`}></div>
                    <p className="font-bold text-white text-sm tracking-tight">{activeStore.name}</p>
                  </div>
                  <button onClick={() => setActiveStore(null)} className="text-slate-400 hover:text-white transition-colors">&times;</button>
                </div>
                <div className="space-y-1.5">
                    <p className="text-[11px] text-slate-400 flex items-center gap-2">
                      <Maximize2 size={12} className="text-slate-500" /> {activeStore.location}
                    </p>
                    <p className="text-[10px] text-slate-500">{activeStore.address}</p>
                    <div className="mt-3 pt-3 border-t border-slate-800 flex justify-between items-center">
                      <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Estado Fiscal</span>
                      <span className={`text-[11px] font-black uppercase tracking-wider ${
                        activeStore.status === 'En Regla' ? 'text-green-400' : 
                        activeStore.status === 'En Riesgo' ? 'text-yellow-400' : 'text-red-400'
                      }`}>
                        {activeStore.status}
                      </span>
                    </div>
                </div>
              </motion.div>
            )}
        </AnimatePresence>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-6 text-[11px] mt-6 bg-slate-800/30 backdrop-blur-md px-6 py-3 rounded-2xl border border-slate-700/30">
        <div className="flex items-center gap-3">
          <span className="w-3 h-3 rounded-full bg-green-500 shadow-[0_0_12px_rgba(34,197,94,0.6)]"></span>
          <span className="text-slate-200 font-bold tracking-wide">Cumplimiento Total</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="w-3 h-3 rounded-full bg-yellow-500 shadow-[0_0_12px_rgba(234,179,8,0.6)]"></span>
          <span className="text-slate-200 font-bold tracking-wide">Alerta de Plazo</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.6)]"></span>
          <span className="text-slate-200 font-bold tracking-wide">Vencimiento Crítico</span>
        </div>
      </div>

      {/* Interaction Hint */}
      <div className="absolute bottom-6 right-8 text-[10px] text-slate-500 font-medium tracking-wide opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
        <RefreshCw size={12} className="animate-spin-slow" />
        Navegación Interactiva Habilitada
      </div>
    </motion.div>
  );
};

export default VenezuelaMap;
