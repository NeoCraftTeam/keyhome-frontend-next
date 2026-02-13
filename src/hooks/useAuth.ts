import axios from '@/lib/axios'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import useSWR from 'swr'

export const useAuth = ({ middleware, redirectIfAuthenticated }: { middleware?: string, redirectIfAuthenticated?: string } = {}) => {
    const router = useRouter()

    const { data: user, error, mutate } = useSWR('/auth/me', () =>
        axios.get('/auth/me')
            .then(res => res.data)
            .catch(error => {
                if (error.response.status !== 409) throw error
                router.push('/verify-email')
            })
    )

    const csrf = () => axios.get(`${process.env.NEXT_PUBLIC_API_URL}/sanctum/csrf-cookie`)

    const register = async ({ setErrors, ...props }: any) => {
        await csrf()

        setErrors([])

        axios
            .post('/auth/registerCustomer', props)
            .then(() => mutate())
            .catch(error => {
                if (error.response.status !== 422) throw error

                setErrors(error.response.data.errors)
            })
    }

    const login = async ({ setErrors, setStatus, ...props }: any) => {
        await csrf()

        setErrors([])
        setStatus(null)

        axios
            .post('/auth/login', props)
            .then(() => mutate())
            .catch(error => {
                if (error.response.status !== 422) throw error

                setErrors(error.response.data.errors)
            })
    }

    const logout = async () => {
        if (!error) {
            await axios.post('/auth/logout').then(() => mutate())
        }

        window.location.pathname = '/login'
    }

    useEffect(() => {
        if (middleware === 'guest' && redirectIfAuthenticated && user) router.push(redirectIfAuthenticated)
        if (window.location.pathname === '/verify-email' && user?.email_verified_at) router.push(redirectIfAuthenticated || '/')
        if (middleware === 'auth' && error) logout()
    }, [user, error])

    return {
        user,
        register,
        login,
        logout,
    }
}
