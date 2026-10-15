const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const loginUser = async (email, password)=>{
    const response = await fetch(`${API_URL}/auth/login`,{
        method: 'POST',
        headers:{
            'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({email, password}),
    });

    const data = await response.json();

    if (!response.ok){
        throw new Error(data.message || 'Error al iniciar sesión')
    }
    return data;
};

export const registerUser = async (name, email, password)=>{
    const response = await fetch(`${API_URL}/auth/register`,{
        method: 'POST',
        headers:{
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({name, email, password}),
    });

    const data = await response.json();

    if (!response.ok){
        throw new Error(data.message || 'Error al registrarse!');
    }
    return data
}