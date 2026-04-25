"use client";

import { useActionState } from "react";
import { loginAdmin } from "@/actions/authActions";
import { Lock, Mail } from "lucide-react";

const initialState = {
  error: "",
};

export default function AdminLogin() {
  const [state, formAction, isPending] = useActionState(
    loginAdmin,
    initialState,
  );

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-3xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-linear-to-r from-red-500 to-pink-500 bg-clip-text text-transparent">
            Admin Portal
          </h1>
          <p className="text-gray-400 mt-2">Sign in to manage Vibe Drama</p>
        </div>

        <form action={formAction} className="space-y-6">
          {state?.error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-sm text-center">
              {state.error}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-500" />
              </div>
              <input
                type="email"
                name="email"
                required
                className="w-full bg-gray-950 border border-gray-800 focus:border-red-500 focus:ring-1 focus:ring-red-500 rounded-xl pl-12 pr-4 py-3 text-white transition-colors outline-none"
                placeholder="admin@vibe.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-500" />
              </div>
              <input
                type="password"
                name="password"
                required
                className="w-full bg-gray-950 border border-gray-800 focus:border-red-500 focus:ring-1 focus:ring-red-500 rounded-xl pl-12 pr-4 py-3 text-white transition-colors outline-none"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full bg-linear-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white font-semibold py-3 rounded-xl transition-all shadow-lg hover:shadow-red-500/25 disabled:opacity-50"
          >
            {isPending ? "Authenticating..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
