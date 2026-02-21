
import React, { useMemo, useRef, useEffect, useState } from 'react';
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
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col items-center justify-center relative overflow-hidden group">
      <div className="flex justify-between items-center w-full mb-4 z-10">
        <h3 className="text-lg font-bold text-white">Mapa de Cobertura</h3>
        <div className="flex gap-2">
          <button onClick={handleZoomIn} className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors" title="Acercar">
            <ZoomIn size={16} />
          </button>
          <button onClick={handleZoomOut} className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors" title="Alejar">
            <ZoomOut size={16} />
          </button>
          <button onClick={handleReset} className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors" title="Restablecer">
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      <div className="relative w-full h-[350px] flex items-center justify-center cursor-move">
        <svg 
          ref={svgRef}
          width="100%" 
          height="100%" 
          viewBox={`0 0 ${width} ${height}`} 
          className="max-w-full h-auto touch-none"
        >
          <defs>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <linearGradient id="mapGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1e293b" />
              <stop offset="100%" stopColor="#0f172a" />
            </linearGradient>
          </defs>
          <g ref={gRef}>
            <g>
              {VENEZUELA_GEOJSON.features.map((feature: any, i: number) => (
                <path
                  key={i}
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
                        r={isSelected ? "14" : "10"}
                        fill="transparent"
                        stroke={color}
                        strokeWidth="2"
                        className={`${isSelected ? 'animate-pulse' : 'animate-ping'} opacity-20`}
                      />
                      
                      {/* Selection ring */}
                      {isSelected && (
                        <circle
                          cx={x}
                          cy={y}
                          r="10"
                          fill="none"
                          stroke="#fff"
                          strokeWidth="2"
                          className="animate-in zoom-in duration-300"
                        />
                      )}

                      {/* Main point */}
                      <circle
                        cx={x}
                        cy={y}
                        r={isSelected ? "7" : "5"}
                        fill={color}
                        stroke={isSelected ? "#fff" : "rgba(0,0,0,0.3)"}
                        strokeWidth={isSelected ? "2" : "1"}
                        filter={isSelected ? "url(#glow)" : ""}
                        className="transition-all duration-300 group-hover:r-8"
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
        {tooltip && (
          <div 
            className="absolute z-50 pointer-events-none bg-slate-800 border border-slate-700 p-3 rounded-xl shadow-2xl animate-in zoom-in-95 duration-200 min-w-[150px]"
            style={{ 
              left: tooltip.x, 
              top: tooltip.y - 10,
              transform: 'translate(-50%, -100%)'
            }}
          >
            <div className="flex items-center gap-2 mb-1">
              <div className={`w-2 h-2 rounded-full ${
                tooltip.store.status === 'En Regla' ? 'bg-green-500' : 
                tooltip.store.status === 'En Riesgo' ? 'bg-yellow-500' : 'bg-red-500'
              }`}></div>
              <p className="font-bold text-white text-xs">{tooltip.store.name}</p>
            </div>
            <p className="text-[10px] text-slate-400 flex items-center gap-1">
              <Maximize2 size={10} /> {tooltip.store.location}
            </p>
            <div className="mt-2 pt-2 border-t border-slate-700 flex justify-between items-center">
              <span className="text-[9px] text-slate-500 uppercase font-bold">Estado</span>
              <span className={`text-[10px] font-bold ${
                tooltip.store.status === 'En Regla' ? 'text-green-400' : 
                tooltip.store.status === 'En Riesgo' ? 'text-yellow-400' : 'text-red-400'
              }`}>
                {tooltip.store.status}
              </span>
            </div>
            {/* Arrow */}
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-800"></div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex justify-center gap-6 text-[10px] mt-4 bg-slate-800/50 px-4 py-2 rounded-full border border-slate-700/50">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]"></span>
          <span className="text-slate-300 font-medium">En Regla</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.4)]"></span>
          <span className="text-slate-300 font-medium">En Riesgo</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]"></span>
          <span className="text-slate-300 font-medium">Vencido</span>
        </div>
      </div>

      {/* Interaction Hint */}
      <div className="absolute bottom-4 right-6 text-[9px] text-slate-500 italic opacity-0 group-hover:opacity-100 transition-opacity">
        Usa el scroll para zoom • Arrastra para mover
      </div>
    </div>
  );
};

export default VenezuelaMap;
