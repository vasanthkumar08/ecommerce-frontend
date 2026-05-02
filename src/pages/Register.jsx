import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { registerUser } from "../features/auth/authApi";
import { useState } from "react";
import Icon from "../components/Icon";

const inputClass = "focus-blue h-12 w-full min-w-0 rounded-xl border border-slate-200 bg-white px-4 text-base text-slate-900 shadow-sm placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 sm:text-sm";

export default function Register() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm();

  const onSubmit = async (formData) => {
    try {
      await registerUser(formData);
      toast.success("Registered successfully");
      navigate("/login");
    } catch (err) {
      toast.error(err.message || "Register failed");
    }
  };

  return (
    <div className="w-full max-w-full min-w-0 bg-slate-50 dark:bg-slate-950">
      <div className="container flex min-h-screen items-center justify-center py-6 sm:py-8">
      <div className="w-[95%] min-w-0 max-w-[520px] overflow-hidden rounded-xl border border-slate-200 bg-white p-6 shadow-[var(--shadow-card)] dark:border-slate-700 dark:bg-slate-900">
        <div className="mb-6 min-w-0 text-center">
          <Link to="/" className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-blue-600 text-xl font-bold text-white">S</Link>
          <h1 className="break-words text-2xl font-bold text-slate-950 dark:text-slate-50">Create account</h1>
          <p className="mt-2 break-words text-sm text-slate-500 dark:text-slate-300">Start shopping with a clean, secure account.</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="min-w-0 space-y-4">
          <div className="min-w-0">
            <input type="text" placeholder="Full name" {...register("name", { required: "Name is required" })} className={inputClass} />
            {errors.name && <p className="mt-1 break-words text-sm font-medium text-rose-600 dark:text-rose-300">{errors.name.message}</p>}
          </div>
          <div className="min-w-0">
            <input type="email" inputMode="email" autoComplete="email" placeholder="Email" {...register("email", { required: "Email is required" })} className={inputClass} />
            {errors.email && <p className="mt-1 break-words text-sm font-medium text-rose-600 dark:text-rose-300">{errors.email.message}</p>}
          </div>
          <div className="min-w-0">
            <div className="relative min-w-0">
              <input type={showPassword ? "text" : "password"} autoComplete="new-password" placeholder="Password" {...register("password", { required: "Password is required", minLength: { value: 6, message: "Minimum 6 characters" } })} className={`${inputClass} pr-12`} />
              <button type="button" onClick={() => setShowPassword((current) => !current)} className="absolute inset-y-1 right-1 grid w-10 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800" aria-label={showPassword ? "Hide password" : "Show password"}>
                <Icon name={showPassword ? "eyeOff" : "eye"} className="h-5 w-5" />
              </button>
            </div>
            {errors.password && <p className="mt-1 break-words text-sm font-medium text-rose-600 dark:text-rose-300">{errors.password.message}</p>}
          </div>

          <button type="submit" disabled={isSubmitting} className="flex h-12 w-full min-w-0 items-center justify-center rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm hover:-translate-y-0.5 hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60">
            {isSubmitting ? "Creating..." : "Register"}
          </button>
        </form>

        <p className="mt-5 break-words text-center text-sm text-slate-500 dark:text-slate-300">
          Already have an account?{" "}
          <button onClick={() => navigate("/login")} className="font-semibold text-blue-600 hover:text-blue-700">
            Login
          </button>
        </p>
      </div>
      </div>
    </div>
  );
}
