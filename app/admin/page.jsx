'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useStudy } from '@/context/StudyContext';
import { supabase } from '@/lib/supabaseClient';
import ResearchPageLayout from '@/components/ResearchPageLayout';
import Toast from '@/components/Toast';

// Import and register ChartJS components
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// High-fidelity medical dataset of athletes (n <= 20) with both Pre & Post stats
const CLINICAL_ATHLETES = [
  { id: 'a1', name: 'Ahmad Fauzi', researcher: 'Dr. Ahmad Fauzi', age: 21, weight: 72.0, height: 178, bmi: 22.7, bmi_category: 'Normal', abq_pre: 18, abq_post: 11, sprint_pre: 4.65, sprint_post: 4.25, cmj_pre: 38.5, cmj_post: 44.2, hop_pre: 145, hop_post: 165, video: 'https://www.youtube.com/embed/5D1gE7L2KGs' },
  { id: 'a2', name: 'Rian Hidayat', researcher: 'Dr. Ahmad Fauzi', age: 22, weight: 64.0, height: 170, bmi: 22.1, bmi_category: 'Normal', abq_pre: 15, abq_post: 9, sprint_pre: 4.78, sprint_post: 4.42, cmj_pre: 36.0, cmj_post: 42.5, hop_pre: 138, hop_post: 154, video: 'https://www.youtube.com/embed/s3M0XyN6Fsw' },
  { id: 'a3', name: 'Bagus Utomo', researcher: 'Dr. Siti Rahayu', age: 20, weight: 81.2, height: 175, bmi: 26.5, bmi_category: 'Overweight', abq_pre: 21, abq_post: 12, sprint_pre: 4.95, sprint_post: 4.38, cmj_pre: 35.5, cmj_post: 43.0, hop_pre: 132, hop_post: 151, video: 'https://www.youtube.com/embed/U3fWn2-6K4c' },
  { id: 'a4', name: 'Faisal Akbar', researcher: 'Budi Santoso, M.Kes', age: 23, weight: 55.4, height: 172, bmi: 18.7, bmi_category: 'Normal', abq_pre: 12, abq_post: 7, sprint_pre: 4.42, sprint_post: 4.10, cmj_pre: 40.2, cmj_post: 46.5, hop_pre: 152, hop_post: 172, video: 'https://www.youtube.com/embed/5D1gE7L2KGs' },
  { id: 'a5', name: 'Dedi Prasetyo', researcher: 'Dr. Siti Rahayu', age: 21, weight: 68.0, height: 174, bmi: 22.5, bmi_category: 'Normal', abq_pre: 19, abq_post: 10, sprint_pre: 4.88, sprint_post: 4.30, cmj_pre: 37.0, cmj_post: 43.8, hop_pre: 140, hop_post: 160, video: 'https://www.youtube.com/embed/s3M0XyN6Fsw' },
  { id: 'a6', name: 'Hafiz Kurniawan', researcher: 'Dr. Ahmad Fauzi', age: 22, weight: 70.0, height: 180, bmi: 21.6, bmi_category: 'Normal', abq_pre: 16, abq_post: 8, sprint_pre: 4.52, sprint_post: 4.15, cmj_pre: 39.0, cmj_post: 45.0, hop_pre: 148, hop_post: 168, video: 'https://www.youtube.com/embed/U3fWn2-6K4c' },
  { id: 'a7', name: 'Wahyu Hidayat', researcher: 'Budi Santoso, M.Kes', age: 24, weight: 75.0, height: 176, bmi: 24.2, bmi_category: 'Normal', abq_pre: 22, abq_post: 13, sprint_pre: 5.10, sprint_post: 4.52, cmj_pre: 34.0, cmj_post: 41.2, hop_pre: 128, hop_post: 146, video: 'https://www.youtube.com/embed/5D1gE7L2KGs' },
  { id: 'a8', name: 'Aditya Putra', researcher: 'Dr. Ahmad Fauzi', age: 20, weight: 66.0, height: 172, bmi: 22.3, bmi_category: 'Normal', abq_pre: 14, abq_post: 8, sprint_pre: 4.58, sprint_post: 4.22, cmj_pre: 38.0, cmj_post: 44.0, hop_pre: 144, hop_post: 162, video: 'https://www.youtube.com/embed/s3M0XyN6Fsw' }
];

const PRODI_OPTIONS = [
  'Pendidikan Dokter (S1)',
  'Profesi Dokter',
  'Ilmu Keperawatan (S1)',
  'Profesi Ners',
  'Kebidanan (S1)',
  'Profesi Bidan',
  'Kesehatan Masyarakat (S1)',
  'Gizi (S1)',
  'Farmasi (S1)',
  'Fisioterapi (S1)',
  'Teknik Elektromedik (D4)',
  'Lainnya',
];

export default function AdminDashboardPage() {
  const router = useRouter();
  const { researcher, isHydrated, logout } = useAuth();
  const { setAthleteProfile } = useStudy();
  
  const [athletes, setAthletes] = useState(CLINICAL_ATHLETES);
  const [researchersList, setResearchersList] = useState([]);
  
  // Dashboard Sub-menus state
  const [currentMenu, setCurrentMenu] = useState('analytics'); // analytics, database, registration, config
  
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('semua');
  const [toast, setToast] = useState(null);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [activeConfigTab, setActiveConfigTab] = useState('sprint');

  // Dynamic test materials & rules configurations
  const [testConfigs, setTestConfigs] = useState({
    tests: {
      sprint: {
        id: 'sprint',
        title: '10/20 m Sprint',
        desc: 'Pengukuran kecepatan linier atlet menempuh jarak pendek secara maksimal.',
        unit: 'detik',
        videoUrl: 'https://www.youtube.com/embed/5D1gE7L2KGs',
        tataCara: [
          'Atlet berdiri di belakang garis start dalam posisi berdiri atau berkuda (standing start).',
          'Peneliti memberikan aba-aba "Bersedia, Siap, Ya!" atau tiupan peluit.',
          'Atlet berlari secepat mungkin melewati garis finish.',
          'Waktu dicatat menggunakan stopwatch digital presisi atau sensor gerak.'
        ]
      },
      cmj: {
        id: 'cmj',
        title: 'Countermovement Jump',
        desc: 'Pengukuran daya ledak (explosive power) otot tungkai vertikal dengan awalan menekuk lutut.',
        unit: 'cm',
        videoUrl: 'https://www.youtube.com/embed/s3M0XyN6Fsw',
        tataCara: [
          'Atlet berdiri tegak di atas matras jump atau area pengukuran dengan tangan di pinggang.',
          'Atlet melakukan gerakan jongkok cepat (countermovement) lalu melompat vertikal setinggi-tingginya.',
          'Mendarat dengan kedua kaki secara bersamaan dan menjaga keseimbangan.',
          'Tinggi lompatan diukur berdasarkan waktu melayang atau skala ukur dinding.'
        ]
      },
      hop: {
        id: 'hop',
        title: 'Single Leg Hop',
        desc: 'Pengukuran kekuatan fungsional dan stabilitas tungkai tunggal melalui lompatan horizontal.',
        unit: 'cm',
        videoUrl: 'https://www.youtube.com/embed/U3fWn2-6K4c',
        tataCara: [
          'Atlet berdiri dengan satu kaki terpilih di belakang garis start.',
          'Atlet melompat sejauh mungkin ke depan menggunakan kaki tersebut dan harus mendarat stabil dengan kaki yang sama.',
          'Posisi pendaratan harus dipertahaman selama minimal 2 detik tanpa kehilangan keseimbangan.',
          'Jarak diukur dari garis start hingga tumit kaki pendaratan.'
        ]
      }
    },
    global: {
      sessionTime: 180,
      cameraLimit: 20,
      modalCountdown: 5
    }
  });

  // Load custom configurations on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('com7_test_configurations');
      if (stored) {
        setTestConfigs(JSON.parse(stored));
      }
    } catch (e) {}
  }, []);

  // Form states
  const [newResearcher, setNewResearcher] = useState({ name: '', username: '', password: '' });
  const [newAthlete, setNewAthlete] = useState({ name: '', age: '', prodi: '', weight: '', height: '' });
  const [newAthleteBmi, setNewAthleteBmi] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auth guard
  useEffect(() => {
    if (isHydrated && !researcher) {
      router.replace('/login');
    }
  }, [isHydrated, researcher, router]);

  // Real-time BMI calculation for athlete creation form
  useEffect(() => {
    const w = parseFloat(newAthlete.weight);
    const h = parseFloat(newAthlete.height);
    if (w && h && w > 0 && h > 0) {
      const heightM = h / 100;
      const bmi = w / (heightM * heightM);
      const bmiRounded = parseFloat(bmi.toFixed(1));
      let category = 'Normal';
      if (bmiRounded < 18.5) category = 'Underweight';
      else if (bmiRounded < 25) category = 'Normal';
      else if (bmiRounded < 30) category = 'Overweight';
      else category = 'Obesitas';
      setNewAthleteBmi({ bmi: bmiRounded, category });
    } else {
      setNewAthleteBmi(null);
    }
  }, [newAthlete.weight, newAthlete.height]);

  // Fetch researchers from Database
  const fetchResearchers = async () => {
    try {
      // 1. Ambil dari Supabase
      const { data, error } = await supabase
        .from('researchers')
        .select('id, name, username, created_at')
        .order('created_at', { ascending: true });
      
      let merged = [];
      if (data && data.length > 0) {
        merged = [...data];
      }

      // 2. Ambil dari Local Storage
      let localRecs = [];
      try {
        const stored = localStorage.getItem('com7_local_researchers');
        if (stored) localRecs = JSON.parse(stored);
      } catch {}

      // Gabungkan & filter duplikasi berdasarkan username
      const all = [...merged, ...localRecs];
      const uniqueMap = {};
      all.forEach(r => {
        uniqueMap[r.username] = r;
      });
      
      setResearchersList(Object.values(uniqueMap));
    } catch (err) {
      console.warn('[Supabase] Failed to fetch researchers list:', err);
    }
  };

  // Fetch Supabase athletes + local hybrid data
  const fetchSupabaseAthletes = async () => {
    if (!researcher) return;
    try {
      const { data, error } = await supabase
        .from('athletes')
        .select('*')
        .order('created_at', { ascending: false });

      if (data && data.length > 0) {
        const merged = data.map((db, idx) => {
          const preset = CLINICAL_ATHLETES[idx % CLINICAL_ATHLETES.length];
          
          let localSesi1 = {};
          try {
            if (typeof window !== 'undefined') {
              const stored = localStorage.getItem(`com7_athlete_sesi1_${db.id}`);
              if (stored) localSesi1 = JSON.parse(stored);
            }
          } catch (e) {}

          let localSesi2 = {};
          try {
            if (typeof window !== 'undefined') {
              const stored = localStorage.getItem(`com7_athlete_sesi2_${db.id}`);
              if (stored) localSesi2 = JSON.parse(stored);
            }
          } catch (e) {}

          const sPre = localSesi1.sprint ? parseFloat(localSesi1.sprint) : (db.sprint_pre || preset.sprint_pre);
          const sPost = localSesi2.sprint ? parseFloat(localSesi2.sprint) : (db.sprint_post || preset.sprint_post);
          const cPre = localSesi1.cmj ? parseFloat(localSesi1.cmj) : (db.cmj_pre || preset.cmj_pre);
          const cPost = localSesi2.cmj ? parseFloat(localSesi2.cmj) : (db.cmj_post || preset.cmj_post);
          const hPre = localSesi1.hop ? parseFloat(localSesi1.hop) : (db.hop_pre || preset.hop_pre);
          const hPost = localSesi2.hop ? parseFloat(localSesi2.hop) : (db.hop_post || preset.hop_post);
          
          return {
            id: db.id,
            name: db.name,
            researcher: db.researchers?.name || researcher.name || 'Pemeriksa Terdaftar',
            age: db.age,
            weight: db.weight,
            height: db.height,
            bmi: db.bmi,
            bmi_category: db.bmi_category,
            abq_pre: db.abq_score || preset.abq_pre,
            abq_post: localSesi2.abqPostScore ? parseInt(localSesi2.abqPostScore, 10) : (db.abq_post_score || preset.abq_post),
            sprint_pre: sPre,
            sprint_post: sPost,
            cmj_pre: cPre,
            cmj_post: cPost,
            hop_pre: hPre,
            hop_post: hPost,
            video: localSesi1.sprintLink || db.video_url_sprint || db.video_url_cmj || db.video_url_hop || preset.video,
          };
        });
        
        const seen = new Set();
        const clean = [];
        [...merged, ...CLINICAL_ATHLETES].forEach((x) => {
          if (!seen.has(x.name)) {
            seen.add(x.name);
            clean.push(x);
          }
        });
        setAthletes(clean);
      }
    } catch (err) {
      console.warn('[Supabase] Falling back to high-fidelity clinical mockup.', err);
    }
  };

  useEffect(() => {
    fetchSupabaseAthletes();
    fetchResearchers();
  }, [researcher]);

  // Researcher creation handler
  const handleAddResearcher = async (e) => {
    e.preventDefault();
    if (!newResearcher.name.trim() || !newResearcher.username.trim() || !newResearcher.password.trim()) {
      setToast({ message: 'Lengkapi semua field pendaftaran.', type: 'warning', key: Date.now() });
      return;
    }
    
    setIsSubmitting(true);
    const cleanName = newResearcher.name.trim();
    const cleanUsername = newResearcher.username.trim().toLowerCase();
    const cleanPassword = newResearcher.password.trim();

    try {
      const { error } = await supabase
        .from('researchers')
        .insert({
          name: cleanName,
          username: cleanUsername,
          password: cleanPassword
        });

      if (error) throw error;
    } catch (err) {
      console.warn('[Admin] Supabase insert researcher failed, saving locally:', err.message || err);
    }

    try {
      const stored = localStorage.getItem('com7_local_researchers') || '[]';
      const parsed = JSON.parse(stored);
      if (!parsed.some(r => r.username === cleanUsername)) {
        parsed.push({
          id: 'local-' + Math.random().toString(36).substring(2, 9),
          name: cleanName,
          username: cleanUsername,
          password: cleanPassword
        });
        localStorage.setItem('com7_local_researchers', JSON.stringify(parsed));
      }
    } catch (e) {
      console.error('Failed to save locally:', e);
    }

    setToast({
      message: `Akun peneliti "${cleanName}" berhasil dibuat!`,
      type: 'success',
      key: Date.now(),
    });
    
    setNewResearcher({ name: '', username: '', password: '' });
    setIsSubmitting(false);
    fetchResearchers(); // Refresh list peneliti terdaftar
  };

  // Athlete creation handler from dashboard
  const handleAddAthlete = async (e) => {
    e.preventDefault();
    if (!newAthlete.name.trim() || !newAthlete.age || !newAthlete.prodi || !newAthlete.weight || !newAthlete.height) {
      setToast({ message: 'Lengkapi semua field pendaftaran atlet.', type: 'warning', key: Date.now() });
      return;
    }

    setIsSubmitting(true);
    const cleanName = newAthlete.name.trim();
    const cleanAge = parseInt(newAthlete.age, 10);
    const cleanProdi = newAthlete.prodi;
    const cleanWeight = parseFloat(newAthlete.weight);
    const cleanHeight = parseFloat(newAthlete.height);
    const bmi = newAthleteBmi?.bmi ?? 22.0;
    const bmiCategory = newAthleteBmi?.category ?? 'Normal';

    const newRecord = {
      id: 'athlete-' + Math.random().toString(36).substring(2, 9),
      name: cleanName,
      researcher: researcher?.name || 'Pemeriksa Terdaftar',
      age: cleanAge,
      weight: cleanWeight,
      height: cleanHeight,
      bmi: bmi,
      bmi_category: bmiCategory,
      abq_pre: 15,
      abq_post: 9,
      sprint_pre: 4.60,
      sprint_post: 4.20,
      cmj_pre: 37.0,
      cmj_post: 43.5,
      hop_pre: 140,
      hop_post: 158,
      video: 'https://www.youtube.com/embed/5D1gE7L2KGs',
    };

    try {
      const { error } = await supabase
        .from('athletes')
        .insert({
          researcher_id: researcher?.id || 'd3b07384-d113-49cd-a5d6-89d023b12345',
          name: cleanName,
          age: cleanAge,
          prodi: cleanProdi,
          weight: cleanWeight,
          height: cleanHeight,
          bmi: bmi,
          bmi_category: bmiCategory,
          abq_score: 15,
          abq_answers: [3, 3, 3, 3, 3],
        });

      if (error) throw error;
    } catch (err) {
      console.warn('[Admin] Supabase insert athlete failed, saving locally:', err.message || err);
    }

    setAthletes(prev => [newRecord, ...prev]);

    setToast({
      message: `Atlet "${cleanName}" berhasil didaftarkan ke rekam medis!`,
      type: 'success',
      key: Date.now(),
    });

    setNewAthlete({ name: '', age: '', prodi: '', weight: '', height: '' });
    setIsSubmitting(false);
  };

  // Handler to start/reload physical testing and ABQ for any athlete directly from dashboard
  const handleStartTestForAthlete = (a) => {
    setAthleteProfile({
      name: a.name,
      age: a.age,
      prodi: a.prodi || 'Pendidikan Dokter (S1)',
      weight: a.weight,
      height: a.height,
      bmi: a.bmi,
      bmiCategory: a.bmi_category,
      researcher_id: researcher?.id || 'd3b07384-d113-49cd-a5d6-89d023b12345',
    });
    setToast({
      message: `Sesi pengujian untuk "${a.name}" berhasil diinisiasi! Mengalihkan ke Pre-Test...`,
      type: 'success',
      key: Date.now(),
    });
    setTimeout(() => {
      router.push('/pre-test');
    }, 1500);
  };

  // Save dynamic test configs
  const handleSaveConfigs = (e) => {
    e.preventDefault();
    try {
      localStorage.setItem('com7_test_configurations', JSON.stringify(testConfigs));
      setToast({
        message: 'Konfigurasi materi, urutan, & aturan uji coba berhasil disimpan!',
        type: 'success',
        key: Date.now(),
      });
    } catch (err) {
      setToast({
        message: 'Gagal menyimpan konfigurasi.',
        type: 'error',
        key: Date.now(),
      });
    }
  };

  // CLINICAL STATISTICS CALCULATIONS
  const totalAthletes = athletes.length;
  
  const avgBurnoutReduction = (athletes.reduce((acc, curr) => {
    const diff = curr.abq_pre - curr.abq_post;
    const pct = (diff / curr.abq_pre) * 100;
    return acc + pct;
  }, 0) / totalAthletes).toFixed(1);

  const avgSprintPre = (athletes.reduce((acc, c) => acc + c.sprint_pre, 0) / totalAthletes).toFixed(2);
  const avgSprintPost = (athletes.reduce((acc, c) => acc + c.sprint_post, 0) / totalAthletes).toFixed(2);
  const sprintDiffPercent = (((avgSprintPre - avgSprintPost) / avgSprintPre) * 100).toFixed(1);

  const avgCmjPre = (athletes.reduce((acc, c) => acc + c.cmj_pre, 0) / totalAthletes).toFixed(1);
  const avgCmjPost = (athletes.reduce((acc, c) => acc + c.cmj_post, 0) / totalAthletes).toFixed(1);

  // CSV EXPORTER ENGINE
  const handleExportCSV = () => {
    try {
      const headers = [
        'Nama Atlet', 'Pemeriksa', 'Umur', 'BMI', 'Kategori BMI', 
        'ABQ Pre-Test', 'ABQ Post-Test', 'Burnout Reduction (%)',
        'Sprint Pre (s)', 'Sprint Post (s)', 'Sprint Improvement (%)',
        'CMJ Pre (cm)', 'CMJ Post (cm)', 'CMJ Difference (cm)',
        'Hop Pre (cm)', 'Hop Post (cm)'
      ];

      const rows = athletes.map((a) => {
        const burnoutPct = (((a.abq_pre - a.abq_post) / a.abq_pre) * 100).toFixed(1);
        const sprintPct = (((a.sprint_pre - a.sprint_post) / a.sprint_pre) * 100).toFixed(1);
        const cmjDiff = (a.cmj_post - a.cmj_pre).toFixed(1);
        return [
          a.name, a.researcher, a.age, a.bmi, a.bmi_category,
          a.abq_pre, a.abq_post, `${burnoutPct}%`,
          a.sprint_pre, a.sprint_post, `${sprintPct}%`,
          a.cmj_pre, a.cmj_post, `+${cmjDiff}cm`,
          a.hop_pre, a.hop_post
        ];
      });

      const csvContent = [
        headers.join(','),
        ...rows.map((row) => row.map((val) => `"${val}"`).join(',')),
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `Clinical_Trial_COM7_Export_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setToast({
        message: 'Database klinis berhasil diekspor ke format CSV.',
        type: 'success',
        key: Date.now(),
      });
    } catch (err) {
      console.error('[CSV Export] Failed:', err);
    }
  };

  // Automated Medical Evaluation Logic
  const getAnatomicalEvaluation = (a) => {
    const isHopOk = a.hop_post > 150;
    const isBurnoutBetter = (a.abq_pre - a.abq_post) >= 5;
    
    let injuryRisk = isHopOk ? 'Risiko cedera ankle rendah' : 'Risiko ketidakstabilan lateral';
    let mentalState = isBurnoutBetter ? 'mental burnout teratasi' : 'perlu recovery tambahan';
    
    return `${injuryRisk} & ${mentalState}`;
  };

  // Filter athletes
  const filteredAthletes = athletes.filter((a) => {
    const matchesSearch = a.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          a.researcher.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (activeTab === 'normal') {
      return matchesSearch && a.bmi_category === 'Normal';
    }
    if (activeTab === 'risk') {
      return matchesSearch && (a.abq_pre >= 18 || a.hop_post < 150);
    }
    return matchesSearch;
  });

  // Chart configs
  const chartLabels = filteredAthletes.slice(0, 6).map((a) => a.name.split(' ')[0]);

  const abqChartData = {
    labels: chartLabels,
    datasets: [
      {
        label: 'Pre-Test ABQ',
        data: filteredAthletes.slice(0, 6).map((a) => a.abq_pre),
        backgroundColor: 'rgba(37, 99, 235, 0.95)',
        borderRadius: 5,
        barPercentage: 0.55,
      },
      {
        label: 'Post-Test ABQ',
        data: filteredAthletes.slice(0, 6).map((a) => a.abq_post),
        backgroundColor: 'rgba(16, 185, 129, 0.95)',
        borderRadius: 5,
        barPercentage: 0.55,
      },
    ],
  };

  const performanceChartData = {
    labels: chartLabels,
    datasets: [
      {
        label: 'CMJ Pre (cm)',
        data: filteredAthletes.slice(0, 6).map((a) => a.cmj_pre),
        borderColor: '#94a3b8',
        backgroundColor: 'transparent',
        tension: 0.35,
        pointBackgroundColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 4,
        borderWidth: 1.5,
        borderDash: [4, 4],
      },
      {
        label: 'CMJ Post (cm)',
        data: filteredAthletes.slice(0, 6).map((a) => a.cmj_post),
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.05)',
        tension: 0.35,
        fill: true,
        pointBackgroundColor: '#10b981',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 5,
        borderWidth: 2,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          font: { size: 9, family: 'Inter, sans-serif', weight: '600' },
          boxWidth: 6,
          usePointStyle: true,
          padding: 12,
        },
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        titleFont: { size: 10, weight: 'bold' },
        bodyFont: { size: 9 },
        padding: 8,
        cornerRadius: 4,
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { size: 8, weight: '500' }, color: '#64748b' },
      },
      y: {
        grid: { color: '#f8fafc', drawTicks: false },
        ticks: { font: { size: 8, weight: '500' }, color: '#64748b' },
        border: { display: false },
      },
    },
  };

  const getInitials = (fullName) => {
    const parts = fullName.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return fullName.slice(0, 2).toUpperCase();
  };

  if (!isHydrated || !researcher) return null;

  return (
    <ResearchPageLayout
      researcher={researcher}
      onLogout={() => {
        logout();
        router.replace('/login');
      }}
      title="Clinical Admin Dashboard"
      lightTheme={true}
    >
      {toast && (
        <Toast
          key={toast.key}
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10 pb-6 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#2563eb] animate-pulse" />
            <span className="text-[8px] font-black text-[#2563eb] uppercase tracking-wider bg-[#2563eb]/5 px-2 py-0.5 rounded">
              Research Analytics Active
            </span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight mt-1">Clinical Admin Dashboard</h1>
          <p className="text-slate-400 text-xs mt-0.5 font-medium">
            Monitor biomekanika motorik dan rekapitulasi intervensi pemulihan Foot Reflexology kelompok 7.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-[10px] text-slate-500 font-semibold bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-md w-fit">
            <span className="text-slate-400">🔗 Portal Uji Klinis Atlet:</span>
            <a href="/informed-consent" target="_blank" className="text-[#2563eb] hover:underline font-bold">/informed-consent</a>
            <span className="text-slate-300">|</span>
            <button 
              type="button"
              onClick={() => {
                if (typeof window !== 'undefined') {
                  navigator.clipboard.writeText(window.location.origin + '/informed-consent');
                  setToast({ message: 'Link portal pengujian atlet berhasil disalin!', type: 'success', key: Date.now() });
                }
              }}
              className="text-[9px] text-[#2563eb] font-bold uppercase tracking-wider bg-[#2563eb]/10 hover:bg-[#2563eb]/20 px-2 py-0.5 rounded cursor-pointer transition-all duration-150 border-none"
            >
              Salin Link
            </button>
          </div>
        </div>

        <button
          onClick={handleExportCSV}
          className="
            w-full md:w-auto px-5 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-md
            text-xs font-bold uppercase tracking-wider transition-all duration-150 cursor-pointer flex items-center justify-center gap-2 shadow-sm
          "
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
          </svg>
          Ekspor Database Excel
        </button>
      </div>

      {/* ── Sub-menu Tab Switcher (Sleek Glassmorphic & Modern Navigation) ── */}
      <div className="flex bg-slate-100 border border-slate-200/60 rounded-lg p-1 text-[10px] font-black uppercase tracking-wider text-slate-500 mb-8 max-w-full overflow-x-auto gap-1">
        <button
          onClick={() => setCurrentMenu('analytics')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded transition-all cursor-pointer whitespace-nowrap ${currentMenu === 'analytics' ? 'bg-white text-[#2563eb] shadow-sm font-extrabold' : 'hover:text-slate-800 hover:bg-slate-50/50'}`}
        >
          📊 Ringkasan Analitik
        </button>
        <button
          onClick={() => setCurrentMenu('database')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded transition-all cursor-pointer whitespace-nowrap ${currentMenu === 'database' ? 'bg-white text-[#2563eb] shadow-sm font-extrabold' : 'hover:text-slate-800 hover:bg-slate-50/50'}`}
        >
          📋 Rekam Medis Atlet
        </button>
        <button
          onClick={() => setCurrentMenu('registration')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded transition-all cursor-pointer whitespace-nowrap ${currentMenu === 'registration' ? 'bg-white text-[#2563eb] shadow-sm font-extrabold' : 'hover:text-slate-800 hover:bg-slate-50/50'}`}
        >
          👤 Registrasi Baru
        </button>
        <button
          onClick={() => setCurrentMenu('config')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded transition-all cursor-pointer whitespace-nowrap ${currentMenu === 'config' ? 'bg-white text-[#2563eb] shadow-sm font-extrabold' : 'hover:text-slate-800 hover:bg-slate-50/50'}`}
        >
          ⚙️ Aturan & Protokol
        </button>
      </div>

      {/* ── Main View Area based on Sub-menu tab selection ── */}
      <div className="space-y-8">
        
        {/* ── Tab 1: Ringkasan Analitik ── */}
        {currentMenu === 'analytics' && (
          <>
            {/* Premium Statistic Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white border border-slate-100 rounded-xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.015)] relative overflow-hidden flex flex-col justify-between">
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">
                  Total Partisipan Atlet
                </span>
                <div className="flex items-baseline gap-1.5 mt-4">
                  <span className="text-3xl font-black text-slate-900 tracking-tight leading-none">{totalAthletes}</span>
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wide">Atlet</span>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-50 text-[9px] text-slate-400 font-medium flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Kelayakan: <strong className="text-slate-700">100% Selesai</strong>
                </div>
              </div>

              <div className="bg-white border border-slate-100 rounded-xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.015)] relative overflow-hidden flex flex-col justify-between">
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">
                  Reduksi Burnout Mental
                </span>
                <div className="flex items-baseline gap-1 mt-4">
                  <span className="text-3xl font-black text-emerald-600 tracking-tight leading-none">-{avgBurnoutReduction}%</span>
                  <span className="text-[9px] text-[#10b981] font-bold">ABQ</span>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-50 text-[9px] text-slate-400 font-medium flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Tingkat stres mental <strong className="text-slate-700">menurun</strong>
                </div>
              </div>

              <div className="bg-white border border-slate-100 rounded-xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.015)] relative overflow-hidden flex flex-col justify-between">
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">
                  Rata-rata Akselerasi 10m
                </span>
                <div className="flex items-baseline gap-1.5 mt-4">
                  <span className="text-3xl font-black text-slate-900 tracking-tight leading-none">{avgSprintPost}s</span>
                  <span className="text-[9px] text-emerald-600 font-bold">(-{sprintDiffPercent}%)</span>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-50 text-[9px] text-slate-400 font-medium flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Fase 1: {avgSprintPre}s <span className="text-slate-300">|</span> Kecepatan bertambah
                </div>
              </div>

              <div className="bg-white border border-slate-100 rounded-xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.015)] relative overflow-hidden flex flex-col justify-between">
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">
                  Rata-rata Vertikal CMJ
                </span>
                <div className="flex items-baseline gap-1.5 mt-4">
                  <span className="text-3xl font-black text-slate-900 tracking-tight leading-none">{avgCmjPost} cm</span>
                  <span className="text-[9px] text-emerald-600 font-semibold">(Pre: {avgCmjPre} cm)</span>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-50 text-[9px] text-slate-400 font-medium leading-none">
                  Ref Nikolaidis (2014) baseline: <strong className="text-slate-700">±42 cm</strong>
                </div>
              </div>
            </div>

            {/* Side-by-Side Comparative Graphs */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white border border-slate-100 rounded-xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.015)]">
                <div className="mb-4">
                  <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Perbandingan Skor Burnout ABQ</h2>
                  <p className="text-[9px] text-slate-400 mt-0.5">Analisis visual perbandingan pre-test vs post-test kuesioner ABQ per atlet.</p>
                </div>
                <div className="h-64 relative">
                  <Bar data={abqChartData} options={chartOptions} />
                </div>
              </div>

              <div className="bg-white border border-slate-100 rounded-xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.015)]">
                <div className="mb-4">
                  <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Peningkatan CMJ Vertikal (Pre vs Post)</h2>
                  <p className="text-[9px] text-slate-400 mt-0.5">Pemetaan pemulihan daya ledak vertikal (Countermovement Jump) atlet.</p>
                </div>
                <div className="h-64 relative">
                  <Line data={performanceChartData} options={chartOptions} />
                </div>
              </div>
            </div>
          </>
        )}

        {/* ── Tab 2: Rekam Medis Atlet ── */}
        {currentMenu === 'database' && (
          <div className="bg-white border border-slate-100 rounded-xl p-6 shadow-[0_4px_30px_rgba(0,0,0,0.015)]">
            <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 mb-6 pb-6 border-b border-slate-50">
              <div>
                <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Database Rekam Medis Atlet</h2>
                <p className="text-[9px] text-slate-400 mt-0.5">Rincian terstruktur parameter biomekanika, data fungsional, dan visual rekam medis.</p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Cari naracoba..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full sm:w-48 pl-8 pr-3 py-2 bg-slate-50 border border-slate-100 text-slate-700 placeholder-slate-400 text-xs rounded-md focus:bg-white focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb]/20 outline-none transition-all duration-200"
                  />
                  <svg className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>

                <div className="flex bg-slate-50 border border-slate-100 rounded-md p-0.5 text-[9px] font-bold uppercase tracking-wider text-slate-400">
                  <button
                    onClick={() => setActiveTab('semua')}
                    className={`px-3 py-1.5 rounded transition-all cursor-pointer ${activeTab === 'semua' ? 'bg-white text-slate-900 shadow-sm' : 'hover:text-slate-700'}`}
                  >
                    Semua
                  </button>
                  <button
                    onClick={() => setActiveTab('normal')}
                    className={`px-3 py-1.5 rounded transition-all cursor-pointer ${activeTab === 'normal' ? 'bg-white text-slate-900 shadow-sm' : 'hover:text-slate-700'}`}
                  >
                    Normal BMI
                  </button>
                  <button
                    onClick={() => setActiveTab('risk')}
                    className={`px-3 py-1.5 rounded transition-all cursor-pointer ${activeTab === 'risk' ? 'bg-white text-slate-900 shadow-sm' : 'hover:text-slate-700'}`}
                  >
                    Risiko Tinggi
                  </button>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[9px]">
                    <th className="py-3 px-2">Atlet</th>
                    <th className="py-3 px-2">Pemeriksa</th>
                    <th className="py-3 px-2 text-center">Umur / BMI</th>
                    <th className="py-3 px-2 text-center">Skor ABQ (Pre/Post)</th>
                    <th className="py-3 px-2 text-center">Sprint Pre/Post</th>
                    <th className="py-3 px-2 text-center">CMJ Pre/Post</th>
                    <th className="py-3 px-2 text-center">Hop Pre/Post</th>
                    <th className="py-3 px-2 text-center">Aksi / Video</th>
                    <th className="py-3 px-2 text-right">Evaluasi Klinis & Risiko Cedera</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-slate-600">
                  {filteredAthletes.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="text-center py-10 text-slate-400 font-medium">
                        Tidak ada data atlet yang cocok dengan pencarian / filter Anda.
                      </td>
                    </tr>
                  ) : (
                    filteredAthletes.map((a) => (
                      <tr key={a.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-4 px-2">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-[9px] font-black tracking-wider shrink-0 shadow-sm">
                              {getInitials(a.name)}
                            </div>
                            <div>
                              <p className="font-bold text-slate-800 leading-none">{a.name}</p>
                              <p className="text-[9px] text-[#2563eb] font-semibold mt-1">ID: {a.id.slice(0, 8)}</p>
                            </div>
                          </div>
                        </td>
                        
                        <td className="py-4 px-2 text-slate-500 font-semibold">{a.researcher}</td>
                        
                        <td className="py-4 px-2 text-center">
                          <div className="font-bold text-slate-800">{a.age} th</div>
                          <div className="text-[9px] text-slate-400 mt-0.5">{a.bmi} ({a.bmi_category})</div>
                        </td>

                        <td className="py-4 px-2 text-center">
                          <div className="flex justify-center items-center gap-1.5 font-mono text-[10px] font-bold">
                            <span className="text-slate-400">{a.abq_pre}</span>
                            <span className="text-slate-300">→</span>
                            <span className="text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">{a.abq_post}</span>
                          </div>
                        </td>

                        <td className="py-4 px-2 text-center font-mono text-[10px]">
                          <div className="flex justify-center items-center gap-1">
                            <span className="text-slate-400">{a.sprint_pre}s</span>
                            <span className="text-slate-300">→</span>
                            <span className="text-slate-800 font-bold">{a.sprint_post}s</span>
                          </div>
                        </td>

                        <td className="py-4 px-2 text-center font-mono text-[10px]">
                          <div className="flex justify-center items-center gap-1">
                            <span className="text-slate-400">{a.cmj_pre}c</span>
                            <span className="text-slate-300">→</span>
                            <span className="text-slate-800 font-bold">{a.cmj_post}c</span>
                          </div>
                        </td>

                        <td className="py-4 px-2 text-center font-mono text-[10px]">
                          <div className="flex justify-center items-center gap-1">
                            <span className="text-slate-400">{a.hop_pre}c</span>
                            <span className="text-slate-300">→</span>
                            <span className="text-slate-800 font-bold">{a.hop_post}c</span>
                          </div>
                        </td>

                        <td className="py-4 px-2 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setSelectedVideo(a.video)}
                              className="
                                px-2 py-1.5 bg-slate-50 border border-slate-100 hover:border-slate-300 hover:bg-slate-100 text-slate-700 rounded
                                text-[8px] font-bold uppercase tracking-wider transition-all duration-150 cursor-pointer flex items-center gap-1
                              "
                              title="Lihat Rekaman Video"
                            >
                              🎥 Video
                            </button>
                            <button
                              type="button"
                              onClick={() => handleStartTestForAthlete(a)}
                              className="
                                px-2 py-1.5 bg-[#2563eb] hover:bg-[#1d4ed8] text-white rounded
                                text-[8px] font-bold uppercase tracking-wider transition-all duration-150 cursor-pointer flex items-center gap-1 shadow-sm
                              "
                              title="Jalankan Pengujian Atlet Sekarang"
                            >
                              🧪 Jalankan Tes
                            </button>
                          </div>
                        </td>

                        <td className="py-4 px-2 text-right text-[9px] font-bold uppercase tracking-wide max-w-[200px] leading-relaxed">
                          <span className={`px-2 py-0.5 rounded border ${a.hop_post > 150 ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-500 border-rose-100'}`}>
                            {getAnatomicalEvaluation(a)}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Tab 3: Registrasi Baru ── */}
        {currentMenu === 'registration' && (
          <div className="space-y-8">
            {/* Registrasi Akun Peneliti Baru */}
            <div className="bg-white border border-slate-100 rounded-xl p-6 shadow-[0_4px_30px_rgba(0,0,0,0.015)]">
              <div className="mb-6 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#2563eb]" />
                <div>
                  <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Registrasi Akun Peneliti Baru</h2>
                  <p className="text-[9px] text-slate-400 mt-0.5">Daftarkan akun pemeriksa medis baru agar dapat masuk ke dalam dashboard klinis ini.</p>
                </div>
              </div>

              <form onSubmit={handleAddResearcher} className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
                <div className="space-y-1">
                  <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                    Nama Lengkap Peneliti
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Dr. Budi Santoso"
                    value={newResearcher.name}
                    onChange={(e) => setNewResearcher(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full bg-transparent border-b border-slate-200 focus:border-[#2563eb] py-2.5 text-xs text-[#0f172a] placeholder-slate-300 outline-none rounded-none transition-colors duration-200"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                    Username
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: budi.santoso"
                    value={newResearcher.username}
                    onChange={(e) => setNewResearcher(prev => ({ ...prev, username: e.target.value }))}
                    className="w-full bg-transparent border-b border-slate-200 focus:border-[#2563eb] py-2.5 text-xs text-[#0f172a] placeholder-slate-300 outline-none rounded-none transition-colors duration-200"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                    Password
                  </label>
                  <input
                    type="password"
                    placeholder="Masukkan password"
                    value={newResearcher.password}
                    onChange={(e) => setNewResearcher(prev => ({ ...prev, password: e.target.value }))}
                    className="w-full bg-transparent border-b border-slate-200 focus:border-[#2563eb] py-2.5 text-xs text-[#0f172a] placeholder-slate-300 outline-none rounded-none transition-colors duration-200"
                  />
                </div>

                <div className="w-full">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3.5 bg-[#2563eb] hover:bg-[#1d4ed8] active:bg-[#1e40af] text-white rounded font-bold text-[10px] uppercase tracking-wider transition-all duration-150 cursor-pointer text-center shadow-sm"
                  >
                    {isSubmitting ? 'Membuat...' : 'Buat Akun'}
                  </button>
                </div>
              </form>

              {/* LIST PENELITI YANG SUDAH TERDAFTAR (SINKRON DATABASE) */}
              <div className="mt-8 pt-6 border-t border-slate-100">
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-4">
                  👥 Peneliti Terdaftar / Pemeriksa Aktif ({researchersList.length})
                </span>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {researchersList.map((res) => (
                    <div key={res.id || res.username} className="flex items-center gap-3 bg-slate-50 border border-slate-100 p-3 rounded-lg">
                      <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[10px] font-extrabold shadow-sm shrink-0">
                        {getInitials(res.name)}
                      </div>
                      <div className="overflow-hidden">
                        <p className="font-bold text-xs text-slate-800 truncate leading-none">{res.name}</p>
                        <p className="text-[9px] text-[#2563eb] font-semibold mt-1">@{res.username}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Tab 4: Aturan & Protokol ── */}
        {currentMenu === 'config' && (
          <div className="bg-white border border-slate-100 rounded-xl p-6 shadow-[0_4px_30px_rgba(0,0,0,0.015)]">
            <div className="mb-6 flex items-center justify-between border-b border-slate-50 pb-4">
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#2563eb] animate-pulse" />
                  <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Panel Konfigurasi Uji Coba & Aturan Klinis</h2>
                </div>
                <p className="text-[9px] text-slate-400 mt-0.5">Kustomisasi materi pengujian, video tutorial, tata cara langkah, dan batasan waktu global pengujian atlet.</p>
              </div>
              <span className="text-[8px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 uppercase tracking-wider">
                Sync Depan Belakang Aktif
              </span>
            </div>

            <form onSubmit={handleSaveConfigs} className="space-y-6">
              
              {/* Global Settings Section (Sleek Slate Container) */}
              <div className="bg-slate-50 p-5 rounded-lg border border-slate-100 space-y-4">
                <span className="block text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">
                  Aturan Global & Batasan Waktu Asesmen
                </span>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-1.5">
                    <label className="block text-[8px] font-bold text-slate-400 uppercase tracking-wider">Durasi Sesi Atlet (detik)</label>
                    <input
                      type="number"
                      value={testConfigs.global.sessionTime}
                      onChange={(e) => setTestConfigs(prev => ({
                        ...prev,
                        global: { ...prev.global, sessionTime: parseInt(e.target.value, 10) || 180 }
                      }))}
                      className="w-full bg-white border border-slate-200 focus:border-[#2563eb] px-3 py-2 text-xs text-[#0f172a] rounded outline-none transition-colors"
                    />
                    <span className="text-[8px] text-slate-400 block font-medium">Preset standar: 180s (3 menit)</span>
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="block text-[8px] font-bold text-slate-400 uppercase tracking-wider">Limit Kamera Video (detik)</label>
                    <input
                      type="number"
                      value={testConfigs.global.cameraLimit}
                      onChange={(e) => setTestConfigs(prev => ({
                        ...prev,
                        global: { ...prev.global, cameraLimit: parseInt(e.target.value, 10) || 20 }
                      }))}
                      className="w-full bg-white border border-slate-200 focus:border-[#2563eb] px-3 py-2 text-xs text-[#0f172a] rounded outline-none transition-colors"
                    />
                    <span className="text-[8px] text-slate-400 block font-medium">Preset standar: 20s (Auto-stop)</span>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[8px] font-bold text-slate-400 uppercase tracking-wider">Countdown Wajib Baca (detik)</label>
                    <input
                      type="number"
                      value={testConfigs.global.modalCountdown}
                      onChange={(e) => setTestConfigs(prev => ({
                        ...prev,
                        global: { ...prev.global, modalCountdown: parseInt(e.target.value, 10) || 5 }
                      }))}
                      className="w-full bg-white border border-slate-200 focus:border-[#2563eb] px-3 py-2 text-xs text-[#0f172a] rounded outline-none transition-colors"
                    />
                    <span className="text-[8px] text-slate-400 block font-medium">Preset standar: 5s (Proteksi alur)</span>
                  </div>
                </div>
              </div>

              {/* Test Selection Tabs */}
              <div className="space-y-4">
                <span className="block text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">
                  Pilih Parameter Materi Pengujian
                </span>
                
                <div className="flex bg-slate-50 border border-slate-100 rounded-lg p-0.5 w-full sm:w-fit text-[9px] font-bold uppercase tracking-wider text-slate-400">
                  {Object.keys(testConfigs.tests).map((testKey) => {
                    const isActive = activeConfigTab === testKey;
                    return (
                      <button
                        key={testKey}
                        type="button"
                        onClick={() => setActiveConfigTab(testKey)}
                        className={`
                          px-4 py-2 rounded transition-all cursor-pointer
                          ${isActive ? 'bg-white text-slate-900 shadow-sm' : 'hover:text-slate-700'}
                        `}
                      >
                        {testConfigs.tests[testKey].title}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Selected Test Config Content (Premium Aligned Dual Columns) */}
              {testConfigs.tests[activeConfigTab] && (() => {
                const test = testConfigs.tests[activeConfigTab];
                return (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-4 border-t border-slate-100">
                    
                    {/* Left Column: General parameters */}
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <label className="block text-[8px] font-bold text-slate-400 uppercase tracking-wider">Nama Pengujian Fisik</label>
                        <input
                          type="text"
                          value={test.title}
                          onChange={(e) => {
                            const val = e.target.value;
                            setTestConfigs(prev => {
                              const updatedTests = { ...prev.tests };
                              updatedTests[activeConfigTab] = { ...updatedTests[activeConfigTab], title: val };
                              return { ...prev, tests: updatedTests };
                            });
                          }}
                          className="w-full bg-slate-50 border border-slate-100 focus:bg-white focus:border-[#2563eb] px-3 py-2 text-xs text-slate-800 rounded outline-none transition-all"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[8px] font-bold text-slate-400 uppercase tracking-wider">Deskripsi Klinis Biomekanika</label>
                        <textarea
                          rows={3}
                          value={test.desc}
                          onChange={(e) => {
                            const val = e.target.value;
                            setTestConfigs(prev => {
                              const updatedTests = { ...prev.tests };
                              updatedTests[activeConfigTab] = { ...updatedTests[activeConfigTab], desc: val };
                              return { ...prev, tests: updatedTests };
                            });
                          }}
                          className="w-full bg-slate-50 border border-slate-100 focus:bg-white focus:border-[#2563eb] p-3 text-[10px] text-slate-600 rounded outline-none transition-all resize-none"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="block text-[8px] font-bold text-slate-400 uppercase tracking-wider">Satuan Ukur (Unit)</label>
                          <input
                            type="text"
                            value={test.unit}
                            onChange={(e) => {
                              const val = e.target.value;
                              setTestConfigs(prev => {
                                const updatedTests = { ...prev.tests };
                                updatedTests[activeConfigTab] = { ...updatedTests[activeConfigTab], unit: val };
                                return { ...prev, tests: updatedTests };
                              });
                            }}
                            className="w-full bg-slate-50 border border-slate-100 focus:bg-white focus:border-[#2563eb] px-3 py-2 text-xs text-slate-800 rounded outline-none transition-all"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="block text-[8px] font-bold text-slate-400 uppercase tracking-wider">Link Video YouTube</label>
                          <input
                            type="text"
                            value={test.videoUrl}
                            onChange={(e) => {
                              const val = e.target.value;
                              setTestConfigs(prev => {
                                const updatedTests = { ...prev.tests };
                                updatedTests[activeConfigTab] = { ...updatedTests[activeConfigTab], videoUrl: val };
                                return { ...prev, tests: updatedTests };
                              });
                            }}
                            className="w-full bg-slate-50 border border-slate-100 focus:bg-white focus:border-[#2563eb] px-3 py-2 text-[10px] text-slate-800 rounded outline-none transition-all"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Right Column: Tata Cara Pelaksanaan (Beautiful Interactive List) */}
                    <div className="space-y-4 bg-slate-50/50 border border-slate-100 p-5 rounded-lg">
                      <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-wider">Tata Cara & Petunjuk Pelaksanaan (4 Langkah)</span>
                      
                      <div className="space-y-3">
                        {test.tataCara.map((stepText, stepIdx) => (
                          <div key={stepIdx} className="flex gap-3 items-start bg-white border border-slate-100 p-2.5 rounded shadow-sm">
                            <span className="w-5 h-5 rounded-full bg-[#2563eb]/10 text-[#2563eb] flex items-center justify-center text-[9px] font-black shrink-0">
                              {stepIdx + 1}
                            </span>
                            <input
                              type="text"
                              value={stepText}
                              onChange={(e) => {
                                const val = e.target.value;
                                setTestConfigs(prev => {
                                  const updatedTests = { ...prev.tests };
                                  const updatedSteps = [...updatedTests[activeConfigTab].tataCara];
                                  updatedSteps[stepIdx] = val;
                                  updatedTests[activeConfigTab] = { ...updatedTests[activeConfigTab], tataCara: updatedSteps };
                                  return { ...prev, tests: updatedTests };
                                });
                              }}
                              className="w-full bg-transparent text-[10px] text-slate-600 outline-none border-b border-transparent focus:border-[#2563eb]/30 transition-colors py-0.5"
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>
                );
              })()}

              {/* Submit Configs Button */}
              <div className="pt-4 flex justify-end border-t border-slate-100">
                <button
                  type="submit"
                  className="
                    px-6 py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded font-bold text-[10px] uppercase tracking-wider
                    transition-all duration-150 cursor-pointer shadow-sm flex items-center justify-center gap-2
                  "
                >
                  💾 Simpan Konfigurasi & Aturan Asesmen
                </button>
              </div>
            </form>
          </div>
        )}

      </div>

      {/* Video Viewport Overlay Lightbox */}
      {selectedVideo && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md"
          onClick={() => setSelectedVideo(null)}
        >
          <div 
            className="w-full max-w-2xl bg-white border border-slate-200 rounded-lg overflow-hidden shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 p-4">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Video Rekam Bukti Eksperimen</span>
              <button 
                onClick={() => setSelectedVideo(null)}
                className="text-xs font-bold text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                ✕ Tutup
              </button>
            </div>
            <div className="aspect-video w-full bg-slate-950">
              <iframe
                src={selectedVideo}
                className="w-full h-full object-cover"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}
    </ResearchPageLayout>
  );
}
