import { useState, useEffect } from 'react';
import { Camera } from '@capacitor/camera';

interface CameraPermissionState {
  granted: boolean;
  loading: boolean;
  error: string | null;
}

export const useCameraPermission = () => {
  const [permissionState, setPermissionState] = useState<CameraPermissionState>({
    granted: false,
    loading: true,
    error: null,
  });

  const checkPermission = async () => {
    try {
      const result = await Camera.checkPermissions();
      setPermissionState({
        granted: result.camera === 'granted',
        loading: false,
        error: null,
      });
      return result.camera === 'granted';
    } catch (error) {
      console.error('Error checking camera permission:', error);
      setPermissionState({
        granted: false,
        loading: false,
        error: 'Failed to check camera permission',
      });
      return false;
    }
  };

  const requestPermission = async () => {
    try {
      setPermissionState(prev => ({ ...prev, loading: true }));
      const result = await Camera.requestPermissions({ permissions: ['camera'] });
      const granted = result.camera === 'granted';
      
      setPermissionState({
        granted,
        loading: false,
        error: granted ? null : 'Camera permission denied',
      });
      
      return granted;
    } catch (error) {
      console.error('Error requesting camera permission:', error);
      setPermissionState({
        granted: false,
        loading: false,
        error: 'Failed to request camera permission',
      });
      return false;
    }
  };

  useEffect(() => {
    checkPermission();
  }, []);

  return {
    ...permissionState,
    checkPermission,
    requestPermission,
  };
};
