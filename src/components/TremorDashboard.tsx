import React, { useEffect, useState, FC } from 'react';
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

const timeFormatter = (ts:number) :string =>
  new Intl.DateTimeFormat('it-IT', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZone: 'Europe/Rome',
  }).format(new Date(ts));

const getTimestampFromRange = (range:string):string => {
  const now = new Date();
  let past = new Date();

  switch (range) {
    case '1d':
      past.setDate(now.getDate() - 1);
      break;
    case '7d':
      past.setDate(now.getDate() - 7);
      break;
    case '1m':
      past.setMonth(now.getMonth() - 1);
      break;
    case '6m':
      past.setMonth(now.getMonth() - 6);
      break;
    case '1y':
      past.setFullYear(now.getFullYear() - 1);
      break;
    default:
      return '';
  }

  return past.toISOString().replace(/:/g, '-').split('.')[0]; // formato compatibile con il tuo API
};

const TremorDashboard: FC = () => {
  const [data, setData] = useState<DataPoint[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [timestamp, setTimestamp] = useState<string | null>(null);
  const [threshold, setThreshold] = useState<string>('');

  useEffect(() => {
    if (!timestamp) return;
    const load = async () => {
      console.log('🔄 Starting data load');
      setLoading(true);
      setError(null);
      setData([]);
      try {
        // 1) Chiedi presigned URL
        const presignUrl = `/api/inference/getPredictionZip?timestamp=${timestamp}`;
        console.log('⏰ Timestamp inviato al server:', timestamp);
        const res1 = await fetch(presignUrl);
      
        console.log('📡 presignUrl:', presignUrl, '→', window.location.origin + presignUrl);
        if (!res1.ok) {
          const errText = await res1.text();
          throw new Error(`Errore presign (${res1.status}): ${errText}`);
        }

        const json = await res1.json();
        const zipUrl = json.url;
        if (!zipUrl) {
          throw new Error('Risposta invalida: manca il campo "url"');
        }

       console.log('➡️ Downloading ZIP from:', zipUrl);
        const res2 = await fetch(zipUrl, {
        mode: 'cors',
        redirect: 'follow',
        });
        console.log('⬅️ ZIP fetch status:', res2.status, res2.statusText);
        if (!res2.ok) {
        const errText = await res2.text();
        console.error('❌ ZIP error body:', errText);
        throw new Error(`Errore download zip (${res2.status})`);
        }

        const buffer = await res2.arrayBuffer();
        console.log('📦 ZIP downloaded, byteLength =', buffer.byteLength);
        console.log('🔍 Parsing ZIP file...');
        const mainZip = await JSZip.loadAsync(buffer);
        console.log('📂 ZIP file parsed, files:', Object.keys(mainZip.files));
        const innerNames = Object.keys(mainZip.files).filter((f) => f.endsWith('.zip'));

        const points: DataPoint[] = [];
        for (const name of innerNames) {
          try {
            console.log(`▶️ Apro il nested ZIP “${name}”`);
            const nestedBuf = await mainZip.file(name)!.async('arraybuffer');
            console.log(`  📥 nestedBuf byteLength: ${nestedBuf.byteLength}`);

            const nestedZip = await JSZip.loadAsync(nestedBuf);
            const nestedFiles = Object.keys(nestedZip.files);
            console.log(`  ✅ Nested ZIP caricato, file:`, nestedFiles);
            const metaText = await nestedZip.file('IMU_pred_meta.json')!.async('string');
            console.log(`  📄 Meta JSON caricato, lunghezza: ${metaText.length}`);
            const meta = JSON.parse(metaText) as IMUMeta;
            const start = new Date(meta.start_iso8601).getTime();
            const timeSensor = meta.sensors.find((s) => s.channels.includes('time'))!;
            const valSensor = meta.sensors.find((s) => s.channels.length > 1)!;

            const tv = new DataView(await nestedZip.file(timeSensor.file_name)!.async('arraybuffer'));
            const vv = new DataView(await nestedZip.file(valSensor.file_name)!.async('arraybuffer'));
            const n = meta.rows;
            const m = valSensor.channels.length;

            for (let i = 0; i < n; i++) {
              const relSec = tv.getFloat64(i * 8, true);
              const t = start + relSec * 1000;
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
        setData(points);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [timestamp]);

  const handleRangeClick = (rangeKey:string) => {
    const ts = getTimestampFromRange(rangeKey);
    setTimestamp(ts);
  };


  

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
            onChange={(e) => setThreshold(e.target.value)}
            placeholder="Es: 0.0001"
            style={{ padding: '0.4rem', width: '150px', fontSize: '1rem' }}
          />
        </label>
      </div>

      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        {['1d', '7d', '1m', '6m', '1y'].map((rangeKey:string) => (
          <button
            key={rangeKey}
            onClick={() => {
              if (!threshold || isNaN(Number(threshold))) {
                alert('Inserisci una soglia numerica valida prima di continuare.');
                return;
              }
              setTimestamp(getTimestampFromRange(rangeKey));
            }}
          >
            {rangeKey === '1d' && 'Ultimo giorno'}
            {rangeKey === '7d' && 'Ultima settimana'}
            {rangeKey === '1m' && 'Ultimo mese'}
            {rangeKey === '6m' && 'Ultimi 6 mesi'}
            {rangeKey === '1y' && 'Ultimo anno'}
          </button>
        ))}
      </div>
    </div>
  );
}

  if (error) return <p style={{ color: 'red' }}>Errore: {error}</p>;
  if (loading || !data.length) return <p>Caricamento dati…</p>;

    if (!threshold || isNaN(Number(threshold))) {
      return (
        <div style={{ padding: '1rem' }}>
          <h3>Inserisci una soglia per il calcolo della media (es: 0.0001):</h3>
          <input
            type="number"
            step="any"
            value={threshold}
            onChange={(e) => setThreshold(e.target.value)}
            style={{ padding: '0.5rem', fontSize: '1rem', width: '200px' }}
            placeholder="Es: 0.0001"
          />
        </div>
      );
    }
    const filteredValues: number[] = data
    .map((d) => d.tremor_power ?? 0)
    .filter((val) => val > parseFloat(threshold));
    const meanTremorPower = filteredValues.length > 0
    ? filteredValues.reduce((a, b) => a + b, 0) / filteredValues.length
    : 0;
  return (
    <div className="p-4">
      <h2 className="text-lg mb-4">
        Dati caricati da: {timestamp.replace('T', ' ').replace(/-/g, ':')}
      </h2>

      {/* Tremor Power */}
      <section className="h-72 mb-8">
        <h3 className="mb-2">Tremor Power over Time</h3>
         <div
            style={styles.graphDiv}
        >
        <ResponsiveContainer>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" type="number" domain={["dataMin", "dataMax"]} tickFormatter={timeFormatter} />
            <YAxis />
            <Tooltip labelFormatter={timeFormatter} />
            <Line type="monotone" dataKey="tremor_power" dot={false} strokeWidth={2} />
            <ReferenceLine
              y={meanTremorPower}
              stroke="red"
              strokeDasharray="6 6"
              label={{ value: `Media > ${threshold}`, position: 'right', fill: 'red' }}
            />
          </LineChart>
        </ResponsiveContainer>
        </div>
      </section>

      {/* Tremor Probability */}
      <section className="h-72 mb-8">
        <h3 className="mb-2">Tremor Probability over Time</h3>
        <div
          style={styles.graphDiv}>
        <ResponsiveContainer>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" type="number" domain={["dataMin", "dataMax"]} tickFormatter={timeFormatter} />
            <YAxis domain={[0, Math.max(...data.map((d) => d.pred_tremor_proba ?? 0)) * 1.2]} />
            <Tooltip labelFormatter={timeFormatter} formatter={(v: number) => v.toFixed(3)} />
            <Line type="monotone" dataKey="pred_tremor_proba" dot={false} strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
        </div>
      </section>

      {/* Arm at Rest */}
      <section className="h-52">
        <h3 className="mb-2">Arm at Rest Over Time</h3>
         <div
          style={styles.graphDiv}>
        <ResponsiveContainer>
          <ScatterChart>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" type="number" domain={["dataMin", "dataMax"]} tickFormatter={timeFormatter} />
            <YAxis dataKey="pred_arm_at_rest" type="number" domain={[0, 2]} ticks={[0, 1, 2]} />
            <Tooltip labelFormatter={timeFormatter} formatter={(v: number) => v} />
           <Scatter
            name="Arm at Rest"
            data={data}
            shape={(props: any) => {
                // diciamo che props ha { cx, cy, payload }
                const { cx, cy, payload } = props as {
                cx: number;
                cy: number;
                payload: DataPoint;
                };
                // restituisco sempre un elemento valido (null → <g />)
                return payload.pred_arm_at_rest === 1
                ? <circle cx={cx} cy={cy} r={4} fill="#8884d8" />
                : <g />;
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

const styles={
    graphDiv: {
     
        width: '100%',
        height: '18rem',      // fisso 18rem = circa h-72
        marginTop: '0.5rem',
    
    },
}
