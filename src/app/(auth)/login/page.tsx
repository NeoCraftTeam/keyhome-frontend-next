'use client'

import { useAuth } from '@/hooks/useAuth'
import Link from 'next/link'
import { FormEvent, useState } from 'react'

export default function Login() {
    const { login } = useAuth({
        middleware: 'guest',
        redirectIfAuthenticated: '/dashboard',
    })

    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [errors, setErrors] = useState<any>({})
    const [status, setStatus] = useState<string | null>(null)

    const submitForm = async (event: FormEvent) => {
        event.preventDefault()
        login({ email, password, setErrors, setStatus })
    }

    return (
        <div className="min-h-screen flex flex-col sm:justify-center items-center pt-6 sm:pt-0 bg-gray-100">
            <div className="w-full sm:max-w-md mt-6 px-6 py-4 bg-white shadow-md overflow-hidden sm:rounded-lg">
                <div className="mb-4 text-center">
                    <h2 className="text-2xl font-bold">KeyHome Login</h2>
                </div>

                {status && <div className="mb-4 font-medium text-sm text-green-600">{status}</div>}

                <form onSubmit={submitForm}>
                    {/* Email Address */}
                    <div>
                        <label htmlFor="email" className="block font-medium text-sm text-gray-700">Email</label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            className="block mt-1 w-full rounded-md shadow-sm border-gray-300 focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                            onChange={event => setEmail(event.target.value)}
                            required
                            autoFocus
                        />
                        {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email[0]}</p>}
                    </div>

                    {/* Password */}
                    <div className="mt-4">
                        <label htmlFor="password" className="block font-medium text-sm text-gray-700">Password</label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            className="block mt-1 w-full rounded-md shadow-sm border-gray-300 focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                            onChange={event => setPassword(event.target.value)}
                            required
                            autoComplete="current-password"
                        />
                        {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password[0]}</p>}
                    </div>

                    {/* Submit Button */}
                    <div className="flex items-center justify-end mt-4">
                        <Link href="/forgot-password" className="underline text-sm text-gray-600 hover:text-gray-900">
                            Forgot your password?
                        </Link>

                        <button className="ml-3 inline-flex items-center px-4 py-2 bg-gray-800 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-gray-700 active:bg-gray-900 focus:outline-none focus:border-gray-900 focus:ring ring-gray-300 disabled:opacity-25 transition ease-in-out duration-150">
                            Login
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
