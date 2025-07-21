
import React, { useState } from 'react';
import LoadingSpinner from '../common/LoadingSpinner';
import { supabase } from '../../services/supabase';
import { useData } from '../../hooks/useDataContext';
import { User } from '../../types';

const LoginScreen: React.FC = () => {
    const { addUserToDb } = useData();
    const [uiLoading, setUiLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [view, setView] = useState<'login' | 'signup' | 'reset'>('login');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setMessage('');
        setUiLoading(true);
        try {
            const { error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) throw error;
            // onAuthStateChanged in DataProvider will handle the rest
        } catch (err: any) {
            setError(err.message || 'Credenciais inválidas. Por favor, tente novamente.');
        } finally {
            setUiLoading(false);
        }
    };

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setMessage('');
        if (password.length < 6) {
            setError('A senha deve ter pelo menos 6 caracteres.');
            return;
        }
        setUiLoading(true);
        try {
            const { data, error } = await supabase.auth.signUp({ 
                email, 
                password,
            });
            if (error) throw error;
            if (!data.user) throw new Error("Cadastro falhou, nenhum usuário retornado.");

            const newUser: User = {
                id: data.user.id,
                name,
                email,
                phone,
                role: 'client'
            };
            await addUserToDb(newUser);

            setMessage('Cadastro realizado! Um link de confirmação foi enviado para o seu e-mail. Por favor, verifique sua caixa de entrada e spam antes de fazer o login.');
            setView('login');
        } catch (err: any) {
             setError(err.message || 'Ocorreu um erro durante o cadastro.');
        } finally {
            setUiLoading(false);
        }
    };

    const handlePasswordReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setMessage('');
        setUiLoading(true);
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/`,
            });
            if (error) throw error;
            setMessage('Se uma conta existir para este e-mail, um link para redefinir a senha foi enviado.');
            setView('login');
        } catch (err: any) {
            setError(err.message || 'Ocorreu um erro. Por favor, tente novamente.');
        } finally {
            setUiLoading(false);
        }
    }
    
    const resetFormState = () => {
        setEmail('');
        setPassword('');
        setName('');
        setPhone('');
        setError('');
        setMessage('');
    }

    const switchView = (newView: 'login' | 'signup' | 'reset') => {
        resetFormState();
        setView(newView);
    }

    const renderForm = () => {
        if (view === 'signup') {
            return (
                <form onSubmit={handleSignUp} className="space-y-4">
                    <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">Criar Conta de Cliente</h2>
                    <input type="text" value={name} onChange={e => setName(e.target.value)} required placeholder="Nome Completo" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" />
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="E-mail" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" />
                    <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} required placeholder="Telefone" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" />
                    <input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="Senha (mín. 6 caracteres)" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" />
                    <button type="submit" disabled={uiLoading} className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 disabled:bg-teal-400">
                        {uiLoading ? <LoadingSpinner size="sm" /> : 'Cadastrar'}
                    </button>
                    <p className="text-sm text-center">
                        Já tem uma conta? <button type="button" onClick={() => switchView('login')} className="font-medium text-teal-600 hover:text-teal-500">Faça o login</button>
                    </p>
                </form>
            );
        }
        if (view === 'reset') {
             return (
                <form onSubmit={handlePasswordReset} className="space-y-6">
                    <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">Recuperar Senha</h2>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="Seu e-mail de cadastro" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" />
                    <button type="submit" disabled={uiLoading} className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 disabled:bg-teal-400">
                        {uiLoading ? <LoadingSpinner size="sm" /> : 'Enviar Link'}
                    </button>
                     <p className="text-sm text-center">
                        Lembrou a senha? <button type="button" onClick={() => switchView('login')} className="font-medium text-teal-600 hover:text-teal-500">Voltar ao Login</button>
                    </p>
                </form>
            );
        }
        return (
            <form onSubmit={handleLogin} className="space-y-6">
                <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">Login</h2>
                <input autoComplete="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="E-mail" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" />
                <input autoComplete="current-password" type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="Senha" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" />
                <div className="flex items-center justify-end text-sm">
                    <button type="button" onClick={() => switchView('reset')} className="font-medium text-teal-600 hover:text-teal-500">Esqueceu a senha?</button>
                </div>
                <button type="submit" disabled={uiLoading} className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 disabled:bg-teal-400">
                    {uiLoading ? <LoadingSpinner size="sm" /> : 'Entrar'}
                </button>
                 <p className="text-sm text-center">
                    Não tem uma conta? <button type="button" onClick={() => switchView('signup')} className="font-medium text-teal-600 hover:text-teal-500">Cadastre-se</button>
                </p>
            </form>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col justify-center items-center p-4">
             <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-gray-900">
                        Project<span className="text-teal-600">Flow</span>
                    </h1>
                    <p className="text-gray-600 mt-2">Seu portal de acompanhamento de projetos.</p>
                </div>
                <div className="bg-white p-8 rounded-lg shadow-lg w-full">
                    {error && <p className="mb-4 text-center text-sm text-red-600 bg-red-100 p-3 rounded-md">{error}</p>}
                    {message && <p className="mb-4 text-center text-sm text-green-600 bg-green-100 p-3 rounded-md">{message}</p>}
                    {renderForm()}
                </div>
            </div>
        </div>
    );
};

export default LoginScreen;