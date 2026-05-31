'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useStudy } from '@/context/StudyContext';
import ResearchPageLayout from '@/components/ResearchPageLayout';
import StepIndicator from '@/components/StepIndicator';
import Toast from '@/components/Toast';

import { supabase } from '@/lib/supabaseClient';

/** Daftar Program Studi yang tersedia */
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

/**
 * Hitung BMI dan kategorinya.
 * @param {number} weight - Berat badan (kg)
 * @param {number} height - Tinggi badan (cm)
 * @returns {{ bmi: number, category: string, color: string } | null}
 */
function calculateBMI(weight, height) {
  const w = parseFloat(weight);
  const h = parseFloat(height);
  if (!w || !h || w <= 0 || h <= 0) return null;

  const heightM = h / 100;
  const bmi = w / (heightM * heightM);
  const bmiRounded = parseFloat(bmi.toFixed(1));

  let category, color;
  if (bmiRounded < 18.5) {
    category = 'Underweight';
    color = 'text-blue-600';
  } else if (bmiRounded < 25) {
    category = 'Normal';
    color = 'text-slate-800 font-semibold';
  } else if (bmiRounded < 30) {
    category = 'Overweight';
    color = 'text-amber-600';
  } else {
    category = 'Obesitas';
    color = 'text-red-600';
  }

  return { bmi: bmiRounded, category, color };
}

export default function RegistrasiPage() {
  const router = useRouter();
  const { researcher, isHydrated, logout } = useAuth();
  const { setAthleteProfile } = useStudy();

  const [form, setForm] = useState({
    name: '',
    age: '',
    prodi: '',
    weight: '',
    height: '',
  });
  const [errors, setErrors] = useState({});
  const [bmiResult, setBmiResult] = useState(null);
  const [toast, setToast] = useState(null);

  // Hitung BMI real-time setiap kali berat/tinggi berubah
  useEffect(() => {
    const result = calculateBMI(form.weight, form.height);
    setBmiResult(result);
  }, [form.weight, form.height]);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  }, []);

  const validate = () => {
    const errs = {};
    if (!form.name.trim() || form.name.trim().length < 3)
      errs.name = 'Nama minimal 3 karakter';
    const age = parseInt(form.age, 10);
    if (!form.age || isNaN(age) || age < 10 || age > 60)
      errs.age = 'Umur harus antara 10–60 tahun';
    if (!form.prodi) errs.prodi = 'Pilih Program Studi';
    const weight = parseFloat(form.weight);
    if (!form.weight || isNaN(weight) || weight < 20 || weight > 300)
      errs.weight = 'Berat badan harus antara 20–300 kg';
    const height = parseFloat(form.height);
    if (!form.height || isNaN(height) || height < 100 || height > 250)
      errs.height = 'Tinggi badan harus antara 100–250 cm';
    return errs;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      setToast({ message: 'Periksa kembali isian form.', type: 'warning', key: Date.now() });
      return;
    }

    if (!bmiResult) {
      setToast({ message: 'Pastikan berat dan tinggi badan terisi dengan benar.', type: 'warning', key: Date.now() });
      return;
    }

    // Peneliti di-set secara default ke pemeriksa aktif atau default id
    const defaultResearcherId = researcher?.id || 'd3b07384-d113-49cd-a5d6-89d023b12345';

    setAthleteProfile({
      name: form.name.trim(),
      age: parseInt(form.age, 10),
      prodi: form.prodi,
      weight: parseFloat(form.weight),
      height: parseFloat(form.height),
      bmi: bmiResult.bmi,
      bmiCategory: bmiResult.category,
      researcher_id: defaultResearcherId,
    });

    router.push('/pre-test');
  };

  const inputClass = (field) => `
    w-full px-0 py-2.5 bg-transparent border-b text-slate-800 text-sm placeholder-slate-300
    outline-none rounded-none transition-colors duration-200
    ${errors[field]
      ? 'border-red-400 focus:border-red-500'
      : 'border-slate-200 focus:border-slate-800'
    }
    disabled:opacity-50
  `;

  if (!isHydrated) return null;

  return (
    <ResearchPageLayout
      researcher={researcher}
      onLogout={() => { logout(); router.replace('/login'); }}
      title="Registrasi Naracoba"
      lightTheme={true}
    >
      {toast && (
        <Toast key={toast.key} message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}

      {/* Progress step bar (Light theme friendly override) */}
      <div className="mb-10">
        <StepIndicator currentStep={2} />
      </div>

      <div className="max-w-xl mx-auto">
        {/* Header */}
        <div className="mb-10 text-center sm:text-left">
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Registrasi Profil Atlet</h1>
          <p className="text-slate-400 text-xs mt-1 font-medium">
            Lengkapi data profil Anda untuk memulai pengujian.
          </p>
        </div>

        {/* Clean Light Card (1px border, no heavy shadow) */}
        <form onSubmit={handleSubmit} noValidate className="bg-white border border-[#e2e8f0] rounded-lg p-8 md:p-10 shadow-none">
          <div className="space-y-8">
            
            {/* Nama Lengkap */}
            <div className="space-y-1">
              <label htmlFor="reg-name" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Nama Lengkap Atlet <span className="text-red-400">*</span>
              </label>
              <input
                id="reg-name"
                name="name"
                type="text"
                autoComplete="name"
                maxLength={100}
                value={form.name}
                onChange={handleChange}
                placeholder="Masukkan nama lengkap atlet"
                className={inputClass('name')}
              />
              {errors.name && <p className="text-xs text-red-400">{errors.name}</p>}
            </div>

            {/* Umur */}
            <div className="space-y-1">
              <label htmlFor="reg-age" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Umur (tahun) <span className="text-red-400">*</span>
              </label>
              <input
                id="reg-age"
                name="age"
                type="number"
                min="10"
                max="60"
                value={form.age}
                onChange={handleChange}
                placeholder="Contoh: 20"
                className={inputClass('age')}
              />
              {errors.age && <p className="text-xs text-red-400">{errors.age}</p>}
            </div>

            {/* Program Studi */}
            <div className="space-y-1">
              <label htmlFor="reg-prodi" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Program Studi <span className="text-red-400">*</span>
              </label>
              <select
                id="reg-prodi"
                name="prodi"
                value={form.prodi}
                onChange={handleChange}
                className={`${inputClass('prodi')} cursor-pointer`}
              >
                <option value="">-- Pilih Prodi --</option>
                {PRODI_OPTIONS.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
              {errors.prodi && <p className="text-xs text-red-400">{errors.prodi}</p>}
            </div>

            {/* Berat Badan */}
            <div className="space-y-1">
              <label htmlFor="reg-weight" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Berat Badan (kg) <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <input
                  id="reg-weight"
                  name="weight"
                  type="number"
                  min="20"
                  max="300"
                  step="0.1"
                  value={form.weight}
                  onChange={handleChange}
                  placeholder="Contoh: 65.5"
                  className={inputClass('weight')}
                />
                <span className="absolute right-0 bottom-2.5 text-slate-300 text-xs font-semibold">kg</span>
              </div>
              {errors.weight && <p className="text-xs text-red-400">{errors.weight}</p>}
            </div>

            {/* Tinggi Badan */}
            <div className="space-y-1">
              <label htmlFor="reg-height" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Tinggi Badan (cm) <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <input
                  id="reg-height"
                  name="height"
                  type="number"
                  min="100"
                  max="250"
                  step="0.1"
                  value={form.height}
                  onChange={handleChange}
                  placeholder="Contoh: 170"
                  className={inputClass('height')}
                />
                <span className="absolute right-0 bottom-2.5 text-slate-300 text-xs font-semibold">cm</span>
              </div>
              {errors.height && <p className="text-xs text-red-400">{errors.height}</p>}

              {/* Real-time Inline BMI Calculator */}
              {bmiResult && (
                <p className="mt-2 text-xs text-slate-500 tracking-wide">
                  Indeks Massa Tubuh (BMI): <span className="text-slate-800 font-bold">{bmiResult.bmi}</span> · Kategori: <span className={`${bmiResult.color} font-bold`}>{bmiResult.category}</span>
                </p>
              )}
            </div>

            {/* Form Actions */}
            <div className="pt-4 flex items-center justify-between">
              <button
                type="button"
                onClick={() => router.push('/informed-consent')}
                className="flex items-center gap-1.5 text-slate-400 hover:text-slate-600 text-xs font-bold tracking-wider uppercase transition-colors duration-200 cursor-pointer"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                </svg>
                Kembali
              </button>

              <button
                id="registrasi-submit-btn"
                type="submit"
                className="
                  px-6 py-3 bg-slate-900 text-white rounded-md
                  font-medium text-xs tracking-wider uppercase
                  hover:bg-slate-800 active:bg-slate-950
                  transition-all duration-150 cursor-pointer
                  flex items-center justify-center gap-2
                "
              >
                Lanjut ke ABQ
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </button>
            </div>
          </div>
        </form>
      </div>
    </ResearchPageLayout>
  );
}
