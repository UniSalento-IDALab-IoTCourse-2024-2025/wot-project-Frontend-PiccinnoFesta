import React, { useEffect, useState, useMemo, FC, useRef } from 'react';
import JSZip from 'jszip';
import {
  LineChart,
  ReferenceLine,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  BarChart,
  Bar,
} from 'recharts';

// Tipi per i dati
interface DataPoint {
  time: number;
  tremor_power?: number;
  pred_tremor_proba?: number;
  pred_arm_at_rest?: number;
  [key: string]: number | undefined;
}
interface TremorProps {
  patientId: string;
}

interface SensorMeta {
  file_name: string;
  channels: string[];
  scale_factors?: number[];
}

interface IMUMeta {
  start_iso8601: string;
  rows: number;
  sensors: SensorMeta[];
}

// Formatter per timestamp
const timeFormatter = (ts: number): string =>
  new Intl.DateTimeFormat('it-IT', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZone: 'Europe/Rome',
  }).format(new Date(ts));

 const formatAdjustedTimestamp = (ts: string): string => {
  const [date, time] = ts.split('T'); 
  const [hh, mm, ss] = time.split('-').map(Number);
  const dateObj = new Date(`${date}T${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}Z`);

  // 🔥 Rimuovi lo shift manuale
  const shifted = dateObj; // NO offset

  const yyyy = shifted.getUTCFullYear();
  const MM = String(shifted.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(shifted.getUTCDate()).padStart(2, '0');
  const HH = String(shifted.getUTCHours()).padStart(2, '0');
  const min = String(shifted.getUTCMinutes()).padStart(2, '0');


  

  return `${yyyy}:${MM}:${dd} ${HH}:${min}`;
};




const formatItalianDate = (isoTimestamp: string): string => {
  const [date, time] = isoTimestamp.split(' ');
  const [yyyy, MM, dd] = date.split(':');
  return `${dd}/${MM}/${yyyy}`;
};
// Genera timestamp ISO compatibile con il server (colons->hyphens)
const getTimestampFromRange = (range: string): string => {
  const now = new Date();
  const past = new Date();
  switch (range) {
    case '1d': past.setDate(now.getDate() - 1); break;
    case '7d': past.setDate(now.getDate() - 7); break;
    case '1m': past.setMonth(now.getMonth() - 1); break;
    case '6m': past.setMonth(now.getMonth() - 6); break;
    case '1y': past.setFullYear(now.getFullYear() - 1); break;
    default: return '';
  }
  return past.toISOString().replace(/:/g, '-').split('.')[0];
};




const TremorDashboard: FC<TremorProps> = ({ patientId }) => {
  const [data, setData] = useState<DataPoint[]>([]);
  const [aggData, setAggData] = useState<{ period: string; avg: number }[]>([]);
  const [aggProba, setAggProba] = useState<{ period: string; avg: number }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [timestamp, setTimestamp] = useState<string | null>(null);
  const [rangeKey, setRangeKey] = useState<'1d' | '7d' | '1m' | '6m' | '1y' | ''>('1d');
  const thresholdInputRef = useRef<HTMLInputElement>(null);
  const [currentThreshold, setCurrentThreshold] = useState<string>('0.0005'); // Soglia attualmente applicata

  // Parso correttamente il timestamp per ottenere startTime numerico
  const parsedStart = useMemo<number | null>(() => {
    if (!timestamp) return null;
    const [datePart, timePart] = timestamp.split('T');
    const iso = `${datePart}T${timePart.replace(/-/g, ':')}Z`;
    const t = Date.parse(iso);
    return isNaN(t) ? null : t;
  }, [timestamp]);

    const maxTimestamp = data.length ? Math.max(...data.map(d => d.time)) : parsedStart!;

  // Initial data load on component mount
  useEffect(() => {
    setTimestamp(getTimestampFromRange('1d'));
  }, []);

  useEffect(() => {
    if (!timestamp || parsedStart === null) return;
    const load = async () => {
      setLoading(true); setError(null); setData([]);
      try {
        // 1) presign URL
        const presignUrl = `/api/inference/getPredictionZip?timestamp=${timestamp}`;
        const res1 = await fetch(presignUrl,{
          headers: {
          "patientid": patientId
          }
        });
        if (!res1.ok) {
          const errText = await res1.text();
          throw new Error(`Errore presign (${res1.status}): ${errText}`);
        }
        const { url: zipUrl } = await res1.json();
        if (!zipUrl) throw new Error('Risposta invalida: manca il campo "url"');

        // 2) download ZIP
        const res2 = await fetch(zipUrl, { mode: 'cors', redirect: 'follow' });
        if (!res2.ok) throw new Error(`Errore download zip (${res2.status})`);
        const buffer = await res2.arrayBuffer();

        // 3) parsing ZIP
        const mainZip = await JSZip.loadAsync(buffer);
        const nestedNames = Object.keys(mainZip.files).filter(f => f.endsWith('.zip'));
        const points: DataPoint[] = [];

        for (const name of nestedNames) {
          try {
            const nestedBuf = await mainZip.file(name)!.async('arraybuffer');
            const nz = await JSZip.loadAsync(nestedBuf);
            const meta = JSON.parse(
              await nz.file('IMU_pred_meta.json')!.async('string')
            ) as IMUMeta;
            const start = new Date(meta.start_iso8601).getTime();
            const timeSensor = meta.sensors.find(s => s.channels.includes('time'))!;
            const valSensor = meta.sensors.find(s => s.channels.length > 1)!;

            const tv = new DataView(
              await nz.file(timeSensor.file_name)!.async('arraybuffer')
            );
            const vv = new DataView(
              await nz.file(valSensor.file_name)!.async('arraybuffer')
            );
            const n = meta.rows, m = valSensor.channels.length;
            for (let i = 0; i < n; i++) {
              const rel = tv.getFloat64(i * 8, true);
              if (i >= n - 10) {
                console.log(`rel[${i}] = ${rel.toFixed(3)}s`);
              }
              const t = start + rel * 1000;
              const pt: DataPoint = { time: t };
              valSensor.channels.forEach((ch, j) => {
                const raw = vv.getFloat64((i * m + j) * 8, true);
                pt[ch] = raw * (valSensor.scale_factors?.[j] ?? 1);
              });
            

              points.push(pt);


              
            }
          } catch (e) {
            console.warn(`Errore parsing ${name}:`, e);
          }
        }
        points.sort((a, b) => a.time - b.time);
        const times = points.map(p => p.time);
console.log("Max time:", new Date(Math.max(...times)).toLocaleTimeString());
console.log("Now:", new Date().toLocaleTimeString());
    
        // 4) padding iniziale/finale
        const endTime = Date.now();
        const zeroFields = { tremor_power: 0, pred_tremor_proba: 0, pred_arm_at_rest: 0 };
        const allPoints = [
          { time: parsedStart, ...zeroFields },
          ...points,
          { time: endTime, ...zeroFields },
        ].sort((a, b) => a.time - b.time);
        setData(allPoints);

        // 5) aggregazione per periodi
        const thr = parseFloat(currentThreshold); // Usa currentThreshold
        const filt = allPoints.filter(p => (p.tremor_power ?? 0) > thr);
        const buckets: Record<string, number[]> = {};
        const fmtDay = (d: Date) =>
          String(d.getDate()).padStart(2, '0') + '/' + String(d.getMonth() + 1).padStart(2, '0');

        if (rangeKey === '7d') {
          for (let i = 0; i < 7; i++) {
            const d = new Date(parsedStart + i * 86400_000);
            buckets[fmtDay(d)] = [];
          }
          filt.forEach(p => {
            const d = new Date(p.time);
            const key = fmtDay(new Date(d.getFullYear(), d.getMonth(), d.getDate()));
            if (buckets[key]) buckets[key].push(p.tremor_power!);
          });
        } else if (rangeKey === '1m') {
          const weeks =4;
          for (let w = 1; w <= weeks; w++) buckets[`W${w}`] = [];
          filt.forEach(p => {
            const idx = Math.min(
              weeks,
              Math.floor((p.time - parsedStart) / (7 * 86400_000)) + 1
            );
            buckets[`W${idx}`].push(p.tremor_power!);
          });
        } else if (rangeKey === '6m' || rangeKey === '1y') {
          const months = Math.ceil((endTime - parsedStart) / (30 * 86400_000));
          for (let m = 0; m <= months; m++) {
            const d = new Date(parsedStart);
            d.setMonth(d.getMonth() + m);
            buckets[d.toLocaleString('it-IT', { month: 'short' })] = [];
          }
          filt.forEach(p => {
            const d = new Date(p.time);
            const key = d.toLocaleString('it-IT', { month: 'short' });
            if (buckets[key]) buckets[key].push(p.tremor_power!);
          });
        }
        setAggData(
          Object.keys(buckets).map(period => ({
            period,
            avg:
              buckets[period].length > 0
                ? buckets[period].reduce((a, b) => a + b, 0) / buckets[period].length
                : 0,
          }))
        );
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [timestamp, parsedStart, currentThreshold, rangeKey]); // Dipendenza da currentThreshold

  const applyThresholdAndSetRange = (key: '1d' | '7d' | '1m' | '6m' | '1y') => {
    const inputValue = thresholdInputRef.current?.value;
    if (!inputValue || isNaN(Number(inputValue))) {
      alert('Inserisci una soglia numerica valida.');
      return;
    }
    setCurrentThreshold(inputValue); // Applica il valore dal ref
    setRangeKey(key);
    setTimestamp(getTimestampFromRange(key));
  };

  const handleApplyThresholdClick = () => {
    const inputValue = thresholdInputRef.current?.value;
    if (!inputValue || isNaN(Number(inputValue))) {
      alert('Inserisci una soglia numerica valida prima di applicare.');
      return;
    }
    setCurrentThreshold(inputValue); // Questo triggera il `useEffect` per ricaricare i dati
    // Opzionale: pulire il campo input dopo l'applicazione
    if (thresholdInputRef.current) {
        thresholdInputRef.current.value = '';
    }
  };


  const BarLoader: React.FC = () => (
      <div style={styles.barLoaderContainer}>
        <div style={styles.barLoader}></div>
      </div>
    );


  if (error) return (
  <div style={styles.errorContainer}>
    Impossibile recuperare i dati
  </div>
  );  if (loading) return (
  <div style={styles.loadingWrapper}>
    <div style={styles.loadingContent}>
      <p style={styles.loadingText}>Caricamento in corso...</p>
      <BarLoader />
    </div>
  </div>
);

  return (
  <div className="p-4">
<h2 className="text-lg mb-4" style={styles.timestampWrapper}>
  Dati a partire dal:{' '}
  {timestamp && (() => {
  const [datePart, timePart] = timestamp.split('T');
  const [hh, mm, ss] = timePart.split('-').map(Number);
  const baseDate = new Date(`${datePart}T${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}Z`);

  // ➕ Aggiungi 2 ore manualmente
  const shifted = new Date(baseDate.getTime() + 2 * 60 * 60 * 1000);

  const yyyy = shifted.getUTCFullYear();
  const MM = String(shifted.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(shifted.getUTCDate()).padStart(2, '0');
  const HH = String(shifted.getUTCHours()).padStart(2, '0');
  const min = String(shifted.getUTCMinutes()).padStart(2, '0');

  return (
    <span>
      <span style={styles.datePart}>
        {`${dd}/${MM}/${yyyy}`}
      </span>
      , dalle ore:{' '}
      <span style={styles.timePart}>
        {`${HH}:${min}`}
      </span>
    </span>
  );
})()}
</h2>

    <div style={{ marginBottom: '1rem' }}>
          <label>
            Soglia di intensità del tremore significativa:{' '}
            <input
              type="number"
              step="any"
              defaultValue={'0'} // Imposta il valore iniziale, ma non lo controlla
              ref={thresholdInputRef} // Collega il ref all'input
              placeholder="Es: 0.0001"
              style={{ padding: '0.4rem', width: '150px', fontSize: '1rem' }}
            />
          </label>
          <button 
            onClick={handleApplyThresholdClick}
            style={{ ...styles.buttonBase,...styles.secondaryButton ,marginLeft: '0.5rem', padding: '0.4rem 0.8rem', fontSize: '1rem' }}
          >
            Applica Soglia
          </button>
          {/* Nuova label per la soglia attuale */}
         <p style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: '#555' }}>
            Soglia attualmente impostata:{' '}
            <strong>
              {
                Math.abs(Number(currentThreshold)) < 1e-4
                  ? Number(currentThreshold).toExponential(2) 
                  : Number(currentThreshold).toFixed(4)       
              }
            </strong>
          </p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
          {['1d', '7d', '1m', '6m', '1y'].map(k => (
            <button
              key={k}
              onClick={() => applyThresholdAndSetRange(k as any)}
              style={{
                ...styles.buttonBase,
                ...(rangeKey === k ? styles.primaryButton : styles.secondaryButton),
              }}
            >
              {k === '1d' && 'Ultimo giorno'}
              {k === '7d' && 'Ultima settimana'}
              {k === '1m' && 'Ultimo mese'}
              {k === '6m' && 'Ultimi 6 mesi'}
              {k === '1y' && 'Ultimo anno'}
            </button>
          ))}
        </div>

    {/* Tremor Power */}
    <section className="h-72 mb-8">
      <h3 className="mb-2">
        Tremor Power{' '}
        {rangeKey === '1d'
          ? 'over Time'
          : rangeKey === '7d'
          ? 'media giornaliera'
          : rangeKey === '1m'
          ? 'media settimanale'
          : 'media mensile'}
      </h3>
      <div style={styles.graphDiv}>
        <ResponsiveContainer>
          {rangeKey === '1d' ? (
            <LineChart data={data}>
              <CartesianGrid {...styles.grid} />
              <XAxis
                dataKey="time"
                type="number"
                domain={['dataMin','dataMax']}
                tickFormatter={timeFormatter}
                {...styles.axis}
              />
              <YAxis {...styles.axis} />
              <Tooltip {...styles.tooltip} labelFormatter={timeFormatter} />
              <Line
                type="monotone"
                dataKey="tremor_power"
                dot={false}
                strokeWidth={2}
              />
              <ReferenceLine
                y={
                  data
                    .filter(d => (d.tremor_power ?? 0) > parseFloat(currentThreshold))
                    .reduce((s, d) => s + (d.tremor_power ?? 0), 0) /
                  Math.max(
                    1,
                    data.filter(d => (d.tremor_power ?? 0) > parseFloat(currentThreshold))
                      .length
                  )
                }
                stroke="red"
                strokeDasharray="6 6"
                label={{
                  value: `Media > ${currentThreshold}`,
                  position: 'right',
                  fill: 'red',
                }}
              />
            </LineChart>
          ) : (
            <BarChart data={aggData} barGap={styles.barChartContainer.barGap}>
              <defs>
                <linearGradient
                  id={styles.barDefGradient.id}
                  x1={styles.barDefGradient.x1}
                  y1={styles.barDefGradient.y1}
                  x2={styles.barDefGradient.x2}
                  y2={styles.barDefGradient.y2}
                >
                  {styles.barDefGradient.stops.map((stop, i) => (
                    <stop
                      key={i}
                      offset={stop.offset}
                      stopColor={stop.stopColor}
                      stopOpacity={stop.stopOpacity}
                    />
                  ))}
                </linearGradient>
              </defs>
              <CartesianGrid {...styles.grid} />
              <XAxis dataKey="period" {...styles.axis} />
              <YAxis {...styles.axis} />
              <Tooltip
                {...styles.tooltip}
                formatter={(value: number, name: string, props: any) => {
                  const formatted =
                    value === 0
                      ? '0'
                      : Math.abs(value) < 1e-4 || Math.abs(value) >= 1e4
                      ? value.toExponential(2)
                      : value.toFixed(4);
                  return [formatted, 'Media'];
                }}
                labelFormatter={(label: string) =>
                  label.startsWith('W') ? `Settimana ${label.replace('W', '')}` : label
                }
              />        
                <Bar dataKey="avg" {...styles.bar} />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </section>

    {/* Tremor Probability */}
    {rangeKey === '1d' && (
  <section className="h-72 mb-8">
    <h3 className="mb-2">Tremor Probability over Time</h3>
    <div style={styles.graphDiv}>
      <ResponsiveContainer>
        <LineChart data={data}>
          <CartesianGrid {...styles.grid} />
          <XAxis
            dataKey="time"
            type="number"
            domain={['dataMin', 'dataMax']}
            tickFormatter={timeFormatter}
            {...styles.axis}
          />
          <YAxis
            domain={[0, Math.max(...data.map(d => d.pred_tremor_proba ?? 0)) * 1.2]}
            {...styles.axis}
          />
          <Tooltip
            {...styles.tooltip}
            labelFormatter={timeFormatter}
            formatter={(v: number) => v.toFixed(3)}
          />
          <Line
            type="monotone"
            dataKey="pred_tremor_proba"
            dot={false}
            strokeWidth={2}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  </section>
    )}

    {/* Arm at Rest */}
     {rangeKey === '1d' && (
    <section className="h-52 mb-8">
      <h3 className="mb-2">
        Arm at Rest{' '}
        {rangeKey === '1d'
          ? 'over Time'
          : rangeKey === '7d'
          ? 'media giornaliera'
          : rangeKey === '1m'
          ? 'media settimanale'
          : 'media mensile'}
      </h3>
      <div style={styles.graphDiv}>
        <ResponsiveContainer>
            <ScatterChart>
              <CartesianGrid {...styles.grid} />
              <XAxis
                dataKey="time"
                type="number"
                domain={['dataMin', 'dataMax']}
                tickFormatter={timeFormatter}
                {...styles.axis}
              />
              <YAxis
                dataKey="pred_arm_at_rest"
                type="number"
                domain={[0, 2]}
                ticks={[0, 1, 2]}
                {...styles.axis}
              />
              <Tooltip
                {...styles.tooltip}
                labelFormatter={timeFormatter}
                formatter={(v: number) => v}
              />
              <Scatter
                name="Arm at Rest"
                data={data}
                shape={(props: any) => {
                  const { cx, cy, payload } = props as {
                    cx: number;
                    cy: number;
                    payload: DataPoint;
                  };
                  return payload.pred_arm_at_rest === 1 ? (
                    <circle cx={cx} cy={cy} r={4} fill="#8884d8" />
                  ) : (
                    <g />
                  );
                }}
              />
            </ScatterChart>
          
        </ResponsiveContainer>
      </div>
    </section>)}
  </div>
);
};

export default TremorDashboard;


const radiusTuple: [number, number, number, number] = [8, 8, 0, 0];

const styles = {
  graphDiv: {
    width: '100%',
    height: '18rem',
    marginTop: '0.5rem',
  },
  barChartContainer: {
    barGap: '10%',
  },
  barDefGradient: {
    id: 'grad',
    x1: '0',
    y1: '0',
    x2: '0',
    y2: '1',
    stops: [
      { offset: '0%', stopColor: '#68afeaff', stopOpacity: 0.8 },
      { offset: '100%', stopColor: '#1f6095ff', stopOpacity: 0.2 },
    ],
  },
  axis: {
    tick: { fill: '#555', fontSize: 12 },
    axisLine: { stroke: '#8884d8' },
    tickLine: false,
  },
  grid: {
    stroke: '#ccc',
    strokeDasharray: '3 3',
  },
  tooltip: {
    contentStyle: { backgroundColor: '#222', borderRadius: 4, padding: '8px' },
    labelStyle: { color: '#fff', fontSize: 12 },
    itemStyle: { color: '#fff' },
  },
  bar: {
    barSize: 30,
    radius: radiusTuple,
    fill: 'url(#grad)',
  },
  // Stile base per i bottoni
  buttonBase: {
    padding: '0.5rem 1rem',
    border: 'none',
    borderRadius: '0.375rem',
    cursor: 'pointer',
    fontSize: '0.9rem',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    transition: 'transform 0.1s ease, box-shadow 0.1s ease',
  },
  // Bottoni primari (azioni principali)
  primaryButton: {
    backgroundColor: '#4f46e5', // indigo-600
    color: '#fff',
  },
  // Bottoni secondari (annulla, alternative)
  secondaryButton: {
    backgroundColor: '#cddbf7ff', // gray-200
    color: '#374151',
  },
  errorContainer: {
  background: 'rgba(255, 255, 255, 0.6)',      // come body
  border: '1px solid #dbeafe',                 // stesso bordo del container
  borderRadius: '1.5rem',                      // stesso radius
  padding: '1.5rem',
  margin: '1rem auto',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)', 
  backdropFilter: 'blur(6px)',            
  color: '#1f2937',                           
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  height: '200px',
  fontSize: '1rem',
  fontWeight: 500,
  textAlign: 'center' as const,
  maxWidth: '950px',
  width: '100%',
},
timestampWrapper: {
  fontSize: '1.125rem',
  fontWeight: 500,
  color: '#1f2937',
},

datePart: {
  color: '#374151', // grigio scuro
  fontWeight: 500,
},

timePart: {
  color: '#4b5563', // grigio medio
  fontWeight: 500,
},
barLoaderContainer: {
    width: '200px',
    height: '6px',
    backgroundColor: '#e0e0e0',
    borderRadius: '3px',
    overflow: 'hidden',
  },
  barLoader: {
    width: '100%',
    height: '100%',
    backgroundColor: '#4f46e5',
    animation: 'bar-loading 1s linear infinite',
    transform: 'translateX(-100%)',
  },
  loadingWrapper: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '200px', // o 100vh se vuoi tutto lo schermo
    width: '100%',
  },
  loadingContent: {
    textAlign: 'center' as const,
  },
  loadingText: {
    fontSize: '18px',
    marginBottom: '1.5rem',
    color: '#374151',
  },
  

};