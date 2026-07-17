import { useAuthStore } from "../../stores/authStore";
import { INDUSTRIES } from "@visitflow/shared/industries";

interface IndustryFieldsProps {
  form: any;
  setForm: (f: any) => void;
}

// Static Tailwind ring color map (dynamic classes don't work with JIT)
const focusRing: Record<string, string> = {
  violet: "focus:ring-violet-500",
  emerald: "focus:ring-emerald-500",
  rose: "focus:ring-rose-500",
  amber: "focus:ring-amber-500",
  blue: "focus:ring-blue-500",
  slate: "focus:ring-slate-500",
  pink: "focus:ring-pink-500",
  cyan: "focus:ring-cyan-500",
  orange: "focus:ring-orange-500",
};

export function IndustryFields({ form, setForm }: IndustryFieldsProps) {
  const industryId = useAuthStore((s) => s.user?.industry);
  const spec = industryId ? INDUSTRIES[industryId] : null;
  const ringColor = spec ? (focusRing[spec.color] || "focus:ring-brand-500") : "focus:ring-brand-500";

  if (!spec) return null;

  const update = (key: string, value: string) => setForm({ ...form, [key]: value });

  return (
    <div className={`space-y-3 border-t ${spec.border} pt-3 mt-2`}>
      <div className="flex items-center gap-2 mb-1">
        <span className={`w-1.5 h-1.5 rounded-full ${spec.dotColor}`} />
        <p className={`text-[11px] font-bold ${spec.text} uppercase tracking-wider`}>Form {spec.label}</p>
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        {spec.leadFields.map((f) => (
          <div key={f.key} className={f.col === "full" ? "col-span-2" : ""}>
            <label className={`block text-[10px] font-semibold ${spec.text} mb-1`}>
              {f.label}{f.required ? " *" : ""}
            </label>
            {f.type === "select" ? (
              <select
                value={form[f.key] || ""}
                onChange={(e) => update(f.key, e.target.value)}
                required={f.required}
                className={`w-full px-3 py-2 rounded-xl bg-surface-50 dark:bg-surface-900 ring-1 ring-surface-200 dark:ring-surface-700 text-xs focus:ring-2 ${ringColor} focus:outline-none`}
              >
                <option value="">{f.placeholder}</option>
                {f.options?.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            ) : (
              <input
                type={f.type}
                value={form[f.key] || ""}
                onChange={(e) => update(f.key, e.target.value)}
                placeholder={f.placeholder}
                required={f.required}
                className={`w-full px-3 py-2 rounded-xl bg-surface-50 dark:bg-surface-900 ring-1 ring-surface-200 dark:ring-surface-700 text-xs focus:ring-2 ${ringColor} focus:outline-none`}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
