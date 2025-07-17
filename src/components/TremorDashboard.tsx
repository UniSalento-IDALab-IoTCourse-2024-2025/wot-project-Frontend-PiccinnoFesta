import React, { useEffect, useState, useMemo, FC } from 'react';
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

const TremorDashboard: FC = () => {
  const [data, setData] = useState<DataPoint[]>([]);
  const [aggData, setAggData] = useState<{ period: string; avg: number }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [timestamp, setTimestamp] = useState<string | null>(null);
  const [rangeKey, setRangeKey] = useState<'1d' | '7d' | '1m' | '6m' | '1y' | ''>('');
  const [threshold, setThreshold] = useState<string>('');

  // Parso correttamente il timestamp per ottenere startTime numerico
  const parsedStart = useMemo<number | null>(() => {
    if (!timestamp) return null;
    const [datePart, timePart] = timestamp.split('T');
    const iso = `${datePart}T${timePart.replace(/-/g, ':')}Z`;
    const t = Date.parse(iso);
    return isNaN(t) ? null : t;
  }, [timestamp]);

  useEffect(() => {
    if (!timestamp || parsedStart === null) return;
    const load = async () => {
      setLoading(true); setError(null); setData([]);
      try {
        // 1) presign URL
        const presignUrl = `/api/inference/getPredictionZip?timestamp=${timestamp}`;
        const res1 = await fetch(presignUrl);
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
        const thr = parseFloat(threshold);
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
          const weeks = 5;
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
  }, [timestamp, parsedStart, threshold, rangeKey]);

  const handleRangeClick = (key: '1d' | '7d' | '1m' | '6m' | '1y') => {
    if (!threshold || isNaN(Number(threshold))) {
      alert('Inserisci una soglia numerica valida prima di continuare.');
      return;
    }
    setRangeKey(key);
    setTimestamp(getTimestampFromRange(key));
  };

  // UI iniziale
  if (!timestamp) {
    return (
      <div style={{ padding: '1rem' }}>
        <h2>Seleziona un intervallo di tempo</h2>
        <div style={{ marginBottom: '1rem' }}>
          <label>
            Soglia tremor_power per la media:{' '}
            <input
              type="number"
              step="any"
              value={threshold}
              onChange={e => setThreshold(e.target.value)}
              placeholder="Es: 0.0001"
              style={{ padding: '0.4rem', width: '150px', fontSize: '1rem' }}
            />
          </label>
        </div>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          {['1d', '7d', '1m', '6m', '1y'].map(k => (
            <button key={k} onClick={() => handleRangeClick(k as any)}>
              {k === '1d' && 'Ultimo giorno'}
              {k === '7d' && 'Ultima settimana'}
              {k === '1m' && 'Ultimo mese'}
              {k === '6m' && 'Ultimi 6 mesi'}
              {k === '1y' && 'Ultimo anno'}
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (error) return <p style={{ color: 'red' }}>Errore: {error}</p>;
  if (loading) return <p>Caricamento dati…</p>;

  // Soglia non valida
  if (!threshold || isNaN(Number(threshold))) {
    return (
      <div style={{ padding: '1rem' }}>
        <h3>Inserisci una soglia per la media (es: 0.0001):</h3>
        <input
          type="number"
          step="any"
          value={threshold}
          onChange={e => setThreshold(e.target.value)}
          style={{ padding: '0.5rem', fontSize: '1rem', width: '200px' }}
          placeholder="Es: 0.0001"
        />
      </div>
    );
  }

  return (
    <div className="p-4">
      <h2 className="text-lg mb-4">
        Dati da: <strong>{timestamp.replace('T', ' ').replace(/-/g, ':')}</strong>
      </h2>
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
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="time"
                  type="number"
                  domain={[parsedStart!, Date.now()]}
                  tickFormatter={timeFormatter}
                />
                <YAxis />
                <Tooltip labelFormatter={timeFormatter} />
                <Line
                  type="monotone"
                  dataKey="tremor_power"
                  dot={false}
                  strokeWidth={2}
                />
                <ReferenceLine
                  y={
                    data
                      .filter(d => (d.tremor_power ?? 0) > parseFloat(threshold))
                      .reduce((sum, d) => sum + (d.tremor_power ?? 0), 0) /
                    Math.max(
                      1,
                      data.filter(d => (d.tremor_power ?? 0) > parseFloat(threshold))
                        .length
                    )
                  }
                  stroke="red"
                  strokeDasharray="6 6"
                  label={{
                    value: `Media > ${threshold}`,
                    position: 'right',
                    fill: 'red',
                  }}
                />
              </LineChart>
            ) : (
              <BarChart data={aggData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis />
                <Tooltip formatter={(v: number) => v.toFixed(4)} />
                <Bar dataKey="avg" />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </section>
      {/* Tremor Probability */}
      <section className="h-72 mb-8">
        <h3 className="mb-2">Tremor Probability over Time</h3>
        <div style={styles.graphDiv}>
          <ResponsiveContainer>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="time"
                type="number"
                domain={["dataMin", "dataMax"]}
                tickFormatter={timeFormatter}
              />
              <YAxis
                domain={[
                  0,
                  Math.max(...data.map(d => d.pred_tremor_proba ?? 0)) * 1.2,
                ]}
              />
              <Tooltip
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
      {/* Arm at Rest */}
      <section className="h-52">
        <h3 className="mb-2">Arm at Rest Over Time</h3>
        <div style={styles.graphDiv}>
          <ResponsiveContainer>
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="time"
                type="number"
                domain={["dataMin", "dataMax"]}
                tickFormatter={timeFormatter}
              />
              <YAxis
                dataKey="pred_arm_at_rest"
                type="number"
                domain={[0, 2]}
                ticks={[0, 1, 2]}
              />
              <Tooltip
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
      </section>
    </div>
  );
};

export default TremorDashboard;

const styles = {
  graphDiv: {
    width: '100%',
    height: '18rem',
    marginTop: '0.5rem',
  },
};
