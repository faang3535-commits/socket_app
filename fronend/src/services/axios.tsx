import axios from "axios";

const apiClient = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:3000",
    headers: {
        "Content-Type": "application/json",
    },
});

apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("token");
        if (token) {
            config.headers["Authorization"] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);  
    }
);

apiClient.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export const apiService = {
    get: async (url: string) => {
        const response = await apiClient.get(url);
        return response.data;
    },
    post: async (url: string, data: any) => {
        const response = await apiClient.post(url, data);
        return response.data;
    },
    put: async (url: string, data: any) => {
        const response = await apiClient.put(url, data);
        return response.data;
    },
    delete: async (url: string) => {
        const response = await apiClient.delete(url);
        return response.data;
    },
}

export default apiClient;