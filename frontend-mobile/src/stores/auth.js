import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../config/api';
import { initSocket, disconnectSocket } from '../config/socket';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      loading: false,
      socket: null,

      login: async (credentials) => {
        set({ loading: true });
        try {
          const response = await api.post('/auth/login', credentials);
          const { token, user } = response.data;

          localStorage.setItem('token', JSON.stringify(token));
          
          const socket = initSocket(user);
          
          set({
            user,
            token,
            isAuthenticated: true,
            loading: false,
            socket,
          });

          return { success: true };
        } catch (error) {
          set({ loading: false });
          return {
            success: false,
            error: error.response?.data?.error || 'Erro ao fazer login',
          };
        }
      },

      logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        disconnectSocket();
        
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          socket: null,
        });
      },

      checkAuth: async () => {
        const token = localStorage.getItem('token');
        if (!token) {
          set({ loading: false });
          return;
        }

        set({ loading: true });
        try {
          const response = await api.get('/auth/refresh-token');
          const { user } = response.data;
          
          const socket = initSocket(user);
          
          set({
            user,
            token: JSON.parse(token),
            isAuthenticated: true,
            loading: false,
            socket,
          });
        } catch (error) {
          localStorage.removeItem('token');
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            loading: false,
          });
        }
      },
    }),
    {
      name: 'auth-store',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);