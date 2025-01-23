import {create} from 'zustand';
import { axiosInstace } from '../lib/axios';
import toast from 'react-hot-toast';
import { io } from 'socket.io-client'

const BASE_URL = import.meta.env.MODE === "development" ? "http://localhost:4000" : "/api";

export const useAuthStore = create((set,get) => ({
    authUser:null,
    isSigningUp:false,
    isLoggingIn:false,
    isUpdatingProfile:false,
    isCheckingAuth:true,
    onlineUsers: [],
    socket: null,


    checkAuth: async () => {
        try {
            const res = await axiosInstace.get("/auth/check");
            set({ authUser:res.data });
            get().connectSocket();
        } catch (error) {
            console.log("Error in checkAuth store", error)
            set({ authUser:null });
        } finally {
            set({ isCheckingAuth: false })
        }
    },

    signup: async (data) => {
        set({ isSigningUp: true });
        try {
           const res = await axiosInstace.post("/auth/signup", data);
           set({authUser: res.data});
           toast.success("Acount created succesfully");

           get().connectSocket();
        } catch (error) {
            toast.error(error.response.data.message);
        } finally {
            set({ isSigningUp: false});
        }
    },

    login: async (data) => {
        set({ isLoggingIn: true });
        try {
            const res = await axiosInstace.post("/auth/login", data);
            set({authUser: res.data});
            toast.success("Logged in succesfully");

            get().connectSocket();
        } catch (error) {
            toast.error(error.response.data.message);
        } finally {
            set({ isLoggingIn: false });
        }
    },

    updateProfile: async (data) => {
        set({ isUpdatingProfile: true});
        try {
            const res = await axiosInstace.put("/auth/update-profile", data);
            set({ authUser: res.data });
            toast.success("Profile Updated succesfully");
        } catch (error) {
            toast.error(error.response.data.message);
        } finally {
            set({ isUpdatingProfile: false });
        }
    },

    logout: async () => {
        try {
            await axiosInstace.post("/auth/logout");
            set({authUser: null});
            toast.success("Logged out succesfully");
            get().disconnectSocket();
        } catch (error) {
            toast.error(error.response.data.message);
        }
    },

    connectSocket: async () => {
        const { authUser } = get();
        if(!authUser || get().socket?.connected) return;

        const socket = io(BASE_URL, {
            query:{
                userId: authUser._id
            }
        });
        socket.connect();

        set({ socket: socket });

        socket.on("getOnlineUsers", (userIds) => {
            set({ onlineUsers: userIds });
        });
    },

    disconnectSocket: async () => {
        if(get().socket?.connected) get().socket.disconnect();
    }
}))