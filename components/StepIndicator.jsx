'use client';

/**
 * StepIndicator — Progress bar visual untuk alur pendaftaran naracoba.
 *
 * Steps:
 *   1. Informed Consent
 *   2. Registrasi Profil
 *   3. Pre-Test ABQ
 *   4. Sesi 1: Tes Fisik
 *
 * Props:
 *   - currentStep : 1 | 2 | 3 | 4
 *   - isLightTheme : boolean
 */

const STEPS = [
  { id: 1, label: 'Informed Consent', shortLabel: 'Consent' },
  { id: 2, label: 'Registrasi Profil', shortLabel: 'Profil' },
  { id: 3, label: 'Pre-Test ABQ', shortLabel: 'ABQ' },
  { id: 4, label: 'Sesi 1: Tes Fisik', shortLabel: 'Sesi 1' },
];

export default function StepIndicator({ currentStep, isLightTheme = true }) {
  return (
    <div className="w-full max-w-2xl mx-auto mb-10 px-4">
      <div className="flex items-center justify-between">
        {STEPS.map((step, idx) => {
          const isCompleted = currentStep > step.id;
          const isActive = currentStep === step.id;
          const isUpcoming = currentStep < step.id;

          // Color tokens depending on light/dark mode
          const activeCircleBorder = isLightTheme ? 'border-[#2563eb]' : 'border-lime-400';
          const activeCircleText = isLightTheme ? 'text-[#2563eb]' : 'text-lime-400';
          const activeCircleGlow = isLightTheme 
            ? 'shadow-[0_0_15px_rgba(37,99,235,0.2)] bg-[#2563eb]/5' 
            : 'shadow-[0_0_12px_rgba(163,230,53,0.4)] bg-lime-450/5';
          
          const completedGradient = isLightTheme
            ? { background: 'linear-gradient(135deg, #2563eb, #1d4ed8)' }
            : { background: 'linear-gradient(135deg, #a3e635, #84cc16)' };
          
          const connectorGradient = isLightTheme
            ? 'linear-gradient(90deg, #2563eb, #1d4ed8)'
            : 'linear-gradient(90deg, #a3e635, #84cc16)';

          const circleBorderClass = isCompleted
            ? (isLightTheme ? 'border-[#2563eb] text-white' : 'border-lime-400 text-slate-900')
            : isActive
            ? `${activeCircleBorder} ${activeCircleText} ${activeCircleGlow}`
            : (isLightTheme ? 'border-slate-200 text-slate-300' : 'border-slate-700 text-slate-600');

          const labelColorClass = isActive
            ? (isLightTheme ? 'text-[#2563eb] font-bold' : 'text-lime-400 font-bold')
            : isCompleted
            ? (isLightTheme ? 'text-slate-500 font-medium' : 'text-lime-600 font-medium')
            : 'text-slate-400';

          return (
            <div key={step.id} className="flex items-center flex-1">
              {/* Step circle */}
              <div className="flex flex-col items-center shrink-0">
                <div
                  className={`
                    w-10 h-10 rounded-full flex items-center justify-center
                    text-xs font-black border-2 transition-all duration-300
                    ${circleBorderClass}
                  `}
                  style={isCompleted ? completedGradient : {}}
                >
                  {isCompleted ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  ) : (
                    step.id
                  )}
                </div>
                {/* Label */}
                <span
                  className={`
                    mt-2 text-[9px] uppercase tracking-wider text-center leading-tight hidden sm:block
                    ${labelColorClass}
                  `}
                  style={{ maxWidth: '80px' }}
                >
                  {step.label}
                </span>
                <span
                  className={`
                    mt-2 text-[9px] uppercase tracking-wider text-center leading-tight sm:hidden
                    ${labelColorClass}
                  `}
                >
                  {step.shortLabel}
                </span>
              </div>

              {/* Connector line */}
              {idx < STEPS.length - 1 && (
                <div className="flex-1 mx-2 sm:mx-4 h-0.5 mb-5 relative">
                  <div className={`absolute inset-0 ${isLightTheme ? 'bg-slate-100' : 'bg-slate-700'} rounded`} />
                  <div
                    className="absolute inset-0 rounded transition-all duration-500"
                    style={{
                      background: connectorGradient,
                      transform: `scaleX(${isCompleted ? 1 : 0})`,
                      transformOrigin: 'left',
                    }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
