
import React, { useMemo } from 'react';
import * as d3 from 'd3';
import { Store } from '../types';

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
  const width = 400;
  const height = 300;

  const projection = useMemo(() => {
    return d3.geoMercator()
      .center([-66.5, 7.5])
      .scale(1200)
      .translate([width / 2, height / 2]);
  }, [width, height]);

  const pathGenerator = useMemo(() => {
    return d3.geoPath().projection(projection);
  }, [projection]);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col items-center justify-center">
      <h3 className="text-lg font-bold text-white mb-4 self-start w-full">Mapa de Cobertura</h3>
      <div className="relative w-full h-[300px] flex items-center justify-center">
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="max-w-full h-auto">
          <g>
            {VENEZUELA_GEOJSON.features.map((feature: any, i: number) => (
              <path
                key={i}
                d={pathGenerator(feature) || ''}
                fill="#1e293b"
                stroke="#334155"
                strokeWidth="1"
              />
            ))}
          </g>
          <g>
            {stores.map((store) => {
              if (store.lat && store.lng) {
                const [x, y] = projection([store.lng, store.lat]) || [0, 0];
                const isSelected = selectedStoreIds.includes(store.id);
                return (
                  <g 
                    key={store.id} 
                    className="group cursor-pointer"
                    onClick={() => onStoreClick?.(store.id)}
                  >
                    <circle
                      cx={x}
                      cy={y}
                      r={isSelected ? "8" : "5"}
                      fill={store.status === 'En Regla' ? '#22c55e' : store.status === 'En Riesgo' ? '#eab308' : '#ef4444'}
                      stroke={isSelected ? "#fff" : "transparent"}
                      strokeWidth={isSelected ? "2" : "0"}
                      className="transition-all duration-300 group-hover:r-8"
                    />
                    <circle
                      cx={x}
                      cy={y}
                      r={isSelected ? "12" : "8"}
                      fill="transparent"
                      stroke={store.status === 'En Regla' ? '#22c55e' : store.status === 'En Riesgo' ? '#eab308' : '#ef4444'}
                      strokeWidth={isSelected ? "2" : "1"}
                      className={`${isSelected ? 'animate-pulse' : 'animate-ping'} opacity-40`}
                    />
                    <title>{store.name} - {store.location}</title>
                  </g>
                );
              }
              return null;
            })}
          </g>
        </svg>
      </div>
      <div className="flex justify-center gap-4 text-[10px] mt-4">
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-green-500"></span>
          <span className="text-slate-400">En Regla</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
          <span className="text-slate-400">En Riesgo</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-red-500"></span>
          <span className="text-slate-400">Vencido</span>
        </div>
      </div>
    </div>
  );
};

export default VenezuelaMap;
