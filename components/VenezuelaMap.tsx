
import React, { useMemo, useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import * as d3 from 'd3';
import { Store } from '../types';
import { Maximize2, ZoomIn, ZoomOut, RefreshCw } from 'lucide-react';

interface VenezuelaMapProps {
  stores: Store[];
  selectedStoreIds?: string[];
  onStoreClick?: (id: string) => void;
}

const VENEZUELA_GEOJSON: any = {
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": { "name": "Venezuela" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [-71.3, 11.8], [-71.4, 10.9], [-71.9, 10.5], [-72.4, 10.3], [-72.8, 9.2], [-73.3, 9.1], [-72.5, 8.3], [-72.4, 7.5], [-71.9, 7.1], [-71.4, 7.2], [-70.8, 7.0], [-69.8, 7.2], [-68.9, 7.4], [-67.8, 6.2], [-67.5, 5.1], [-67.8, 4.1], [-67.5, 3.1], [-67.1, 2.1], [-67.5, 1.1], [-66.9, 1.0], [-66.1, 1.2], [-65.1, 1.5], [-64.1, 2.1], [-63.1, 3.1], [-62.1, 4.1], [-61.1, 5.1], [-60.1, 6.1], [-59.8, 7.1], [-59.9, 8.1], [-60.5, 8.5], [-61.5, 8.3], [-62.5, 9.1], [-63.5, 10.1], [-64.5, 10.5], [-65.5, 10.1], [-66.5, 10.5], [-67.5, 10.5], [-68.5, 10.9], [-69.5, 11.5], [-70.5, 12.1], [-71.3, 11.8]
          ]
        ]
      }
    }
  ]
};

export const VenezuelaMap: React.FC<VenezuelaMapProps> = ({ stores, selectedStoreIds = [], onStoreClick }) => {
  const width = 500;
  const height = 400;
  const svgRef = useRef<SVGSVGElement>(null);
  const gRef = useRef<SVGGElement>(null);
  const [tooltip, setTooltip] = useState<{ x: number, y: number, store: Store } | null>(null);

  const projection = useMemo(() => {
    return d3.geoMercator()
      .center([-66.5, 7.5])
      .scale(1800)
      .translate([width / 2, height / 2]);
  }, [width, height]);

  const pathGenerator = useMemo(() => {
    return d3.geoPath().projection(projection);
  }, [projection]);

  useEffect(() => {
    if (!svgRef.current || !gRef.current) return;

    const svg = d3.select(svgRef.current);
    const g = d3.select(gRef.current);

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([1, 8])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom);
  }, []);

  const handleZoomIn = () => {
    if (!svgRef.current) return;
    d3.select(svgRef.current).transition().call(d3.zoom<SVGSVGElement, unknown>().scaleBy as any, 1.5);
  };

  const handleZoomOut = () => {
    if (!svgRef.current) return;
    d3.select(svgRef.current).transition().call(d3.zoom<SVGSVGElement, unknown>().scaleBy as any, 0.7);
  };

  const handleReset = () => {
    if (!svgRef.current) return;
    d3.select(svgRef.current).transition().call(d3.zoom<SVGSVGElement, unknown>().transform as any, d3.zoomIdentity);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 flex flex-col items-center justify-center relative overflow-hidden group shadow-2xl"
    >
      <div className="flex justify-between items-center w-full mb-6 z-10">
        <div className="flex items-center gap-3">
            <div className="w-1.5 h-6 bg-blue-500 rounded-full"></div>
            <h3 className="text-xl font-bold text-white tracking-tight">Cobertura Nacional</h3>
        </div>
        <div className="flex gap-2 bg-slate-800/50 p-1 rounded-xl border border-slate-700/50 backdrop-blur-md">
          <button onClick={handleZoomIn} className="p-2 hover:bg-slate-700 text-slate-300 rounded-lg transition-all active:scale-90" title="Acercar">
            <ZoomIn size={18} />
          </button>
          <button onClick={handleZoomOut} className="p-2 hover:bg-slate-700 text-slate-300 rounded-lg transition-all active:scale-90" title="Alejar">
            <ZoomOut size={18} />
          </button>
          <button onClick={handleReset} className="p-2 hover:bg-slate-700 text-slate-300 rounded-lg transition-all active:scale-90" title="Restablecer">
            <RefreshCw size={18} />
          </button>
        </div>
      </div>

      <div className="relative w-full h-[450px] flex items-center justify-center cursor-move">
        <svg 
          ref={svgRef}
          width="100%" 
          height="100%" 
          viewBox={`0 0 ${width} ${height}`} 
          className="max-w-full h-auto touch-none"
        >
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1"/>
            </pattern>
            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <linearGradient id="mapGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1e293b" />
              <stop offset="100%" stopColor="#0f172a" />
            </linearGradient>
          </defs>
          
          {/* Background Grid */}
          <rect width="100%" height="100%" fill="url(#grid)" />

          <g ref={gRef}>
            <g>
              {VENEZUELA_GEOJSON.features.map((feature: any, i: number) => (
                <motion.path
                  key={i}
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ duration: 2, ease: "easeInOut" }}
                  d={pathGenerator(feature) || ''}
                  fill="url(#mapGradient)"
                  stroke="#334155"
                  strokeWidth="1.5"
                  className="transition-colors duration-500"
                />
              ))}
            </g>
            <g>
              {stores.map((store) => {
                if (store.lat && store.lng) {
                  const [x, y] = projection([store.lng, store.lat]) || [0, 0];
                  const isSelected = selectedStoreIds.includes(store.id);
                  const color = store.status === 'En Regla' ? '#22c55e' : store.status === 'En Riesgo' ? '#eab308' : '#ef4444';
                  
                  return (
                    <g 
                      key={store.id} 
                      className="group cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        onStoreClick?.(store.id);
                      }}
                      onMouseEnter={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const parentRect = e.currentTarget.closest('div')?.getBoundingClientRect();
                        if (parentRect) {
                          setTooltip({
                            x: rect.left - parentRect.left + rect.width / 2,
                            y: rect.top - parentRect.top,
                            store
                          });
                        }
                      }}
                      onMouseLeave={() => setTooltip(null)}
                    >
                      {/* Outer pulse */}
                      <circle
                        cx={x}
                        cy={y}
                        r={isSelected ? "18" : "12"}
                        fill="transparent"
                        stroke={color}
                        strokeWidth="2"
                        className={`${isSelected ? 'animate-pulse' : 'animate-ping'} opacity-20`}
                      />
                      
                      {/* Selection ring */}
                      {isSelected && (
                        <motion.circle
                          initial={{ r: 0 }}
                          animate={{ r: 14 }}
                          cx={x}
                          cy={y}
                          fill="none"
                          stroke="#fff"
                          strokeWidth="2"
                          strokeDasharray="4 2"
                          className="animate-[spin_4s_linear_infinite]"
                        />
                      )}

                      {/* Main point */}
                      <motion.circle
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 260, damping: 20, delay: 1 }}
                        cx={x}
                        cy={y}
                        r={isSelected ? "8" : "6"}
                        fill={color}
                        stroke={isSelected ? "#fff" : "rgba(0,0,0,0.3)"}
                        strokeWidth={isSelected ? "2.5" : "1.5"}
                        filter={isSelected ? "url(#glow)" : ""}
                        className="transition-all duration-300 shadow-2xl"
                      />
                    </g>
                  );
                }
                return null;
              })}
            </g>
          </g>
        </svg>

        {/* Custom Tooltip */}
        <AnimatePresence>
            {tooltip && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 10 }}
                className="absolute z-50 pointer-events-none bg-slate-900/90 backdrop-blur-xl border border-slate-700/50 p-4 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] min-w-[180px]"
                style={{ 
                  left: tooltip.x, 
                  top: tooltip.y - 15,
                  transform: 'translate(-50%, -100%)'
                }}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className={`w-3 h-3 rounded-full shadow-[0_0_10px_rgba(0,0,0,0.5)] ${
                    tooltip.store.status === 'En Regla' ? 'bg-green-500' : 
                    tooltip.store.status === 'En Riesgo' ? 'bg-yellow-500' : 'bg-red-500'
                  }`}></div>
                  <p className="font-bold text-white text-sm tracking-tight">{tooltip.store.name}</p>
                </div>
                <div className="space-y-1.5">
                    <p className="text-[11px] text-slate-400 flex items-center gap-2">
                      <Maximize2 size={12} className="text-slate-500" /> {tooltip.store.location}
                    </p>
                    <div className="mt-3 pt-3 border-t border-slate-800 flex justify-between items-center">
                      <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Estado Fiscal</span>
                      <span className={`text-[11px] font-black uppercase tracking-wider ${
                        tooltip.store.status === 'En Regla' ? 'text-green-400' : 
                        tooltip.store.status === 'En Riesgo' ? 'text-yellow-400' : 'text-red-400'
                      }`}>
                        {tooltip.store.status}
                      </span>
                    </div>
                </div>
                {/* Arrow */}
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-[10px] border-transparent border-t-slate-900/90"></div>
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
