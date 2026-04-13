import { create } from 'zustand';

const useAuthStore = create((set) => ({
  user: JSON.parse(localStorage.getItem('user')) || null,
  accessToken: localStorage.getItem('accessToken') || null,
  refreshToken: localStorage.getItem('refreshToken') || null,
  setCredentials: (user, accessToken, refreshToken) => {
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    set({ user, accessToken, refreshToken });
  },
  logout: () => {
    localStorage.removeItem('user');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    set({ user: null, accessToken: null, refreshToken: null });
  },
  updateBalance: (balance) => set((state) => {
    if (!state.user) return state;
    const updatedUser = { ...state.user, virtualBalance: balance };
    localStorage.setItem('user', JSON.stringify(updatedUser));
    return { user: updatedUser };
  })
}));

export default useAuthStore;
