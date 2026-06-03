import { useState, useCallback } from 'react';
import api from '../api/axios.js';
import toast from 'react-hot-toast';

const useUrls = () => {
  const [urls, setUrls] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchUrls = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get('/urls');
      setUrls(data.urls || []);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to fetch URLs';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  const createUrl = useCallback(async (urlData) => {
    try {
      const { data } = await api.post('/urls', urlData);
      setUrls((prev) => [data.url, ...prev]);
      return { success: true, url: data.url };
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to create URL';
      return { success: false, message: msg };
    }
  }, []);

  const deleteUrl = useCallback(async (id) => {
    try {
      await api.delete(`/urls/${id}`);
      setUrls((prev) => prev.filter((u) => u._id !== id));
      toast.success('Link deleted successfully');
      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to delete URL';
      toast.error(msg);
      return { success: false, message: msg };
    }
  }, []);

  const updateUrl = useCallback(async (id, urlData) => {
    try {
      const { data } = await api.patch(`/urls/${id}`, urlData);
      setUrls((prev) => prev.map((u) => (u._id === id ? data.url : u)));
      toast.success('Link updated successfully');
      return { success: true, url: data.url };
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to update URL';
      toast.error(msg);
      return { success: false, message: msg };
    }
  }, []);

  return { urls, loading, error, fetchUrls, createUrl, deleteUrl, updateUrl };
};

export default useUrls;
