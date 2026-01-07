import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface VisionBoardItem {
  id: string;
  vision_board_id: string;
  image_url: string;
  caption: string | null;
  position_x: number;
  position_y: number;
  width: number;
  height: number;
}

export interface VisionBoard {
  id: string;
  title: string;
  description: string | null;
  is_default: boolean;
  items?: VisionBoardItem[];
}

export function useVisionBoard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [board, setBoard] = useState<VisionBoard | null>(null);
  const [items, setItems] = useState<VisionBoardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const fetchVisionBoard = useCallback(async () => {
    if (!user) {
      setBoard(null);
      setItems([]);
      setLoading(false);
      return;
    }

    try {
      // Get or create default vision board
      let { data: boards, error } = await supabase
        .from('vision_boards')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_default', true)
        .limit(1);

      if (error) throw error;

      let currentBoard = boards?.[0];

      // Create default board if doesn't exist
      if (!currentBoard) {
        const { data: newBoard, error: createError } = await supabase
          .from('vision_boards')
          .insert({
            user_id: user.id,
            title: 'My Vision Board',
            is_default: true,
          })
          .select()
          .single();

        if (createError) throw createError;
        currentBoard = newBoard;
      }

      setBoard(currentBoard);

      // Fetch items for this board
      const { data: boardItems, error: itemsError } = await supabase
        .from('vision_board_items')
        .select('*')
        .eq('vision_board_id', currentBoard.id)
        .order('created_at', { ascending: true });

      if (itemsError) throw itemsError;
      setItems(boardItems || []);
    } catch (error) {
      console.error('Error fetching vision board:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchVisionBoard();
  }, [fetchVisionBoard]);

  const uploadImage = async (file: File, caption?: string): Promise<VisionBoardItem | null> => {
    if (!user || !board) {
      toast({
        title: 'Error',
        description: 'You must be logged in to upload images',
        variant: 'destructive',
      });
      return null;
    }

    // Validate file
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid file',
        description: 'Please select an image file',
        variant: 'destructive',
      });
      return null;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Please select an image under 5MB',
        variant: 'destructive',
      });
      return null;
    }

    setUploading(true);

    try {
      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('vision-boards')
        .upload(fileName, file, {
          cacheControl: '3600',
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('vision-boards')
        .getPublicUrl(fileName);

      // Create item in database
      const { data: newItem, error: insertError } = await supabase
        .from('vision_board_items')
        .insert({
          user_id: user.id,
          vision_board_id: board.id,
          image_url: urlData.publicUrl,
          caption: caption || null,
          position_x: 0,
          position_y: 0,
          width: 200,
          height: 200,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      setItems(prev => [...prev, newItem]);
      toast({
        title: 'Image added',
        description: 'Your vision board has been updated!',
      });

      return newItem;
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: 'Upload failed',
        description: 'Failed to upload image. Please try again.',
        variant: 'destructive',
      });
      return null;
    } finally {
      setUploading(false);
    }
  };

  const removeImage = async (itemId: string) => {
    if (!user) return false;

    try {
      const item = items.find(i => i.id === itemId);
      if (!item) return false;

      // Delete from database
      const { error } = await supabase
        .from('vision_board_items')
        .delete()
        .eq('id', itemId)
        .eq('user_id', user.id);

      if (error) throw error;

      // Try to delete from storage (extract path from URL)
      try {
        const url = new URL(item.image_url);
        const pathParts = url.pathname.split('/');
        const storagePath = pathParts.slice(-2).join('/'); // user_id/filename
        await supabase.storage.from('vision-boards').remove([storagePath]);
      } catch (e) {
        // Ignore storage deletion errors
      }

      setItems(prev => prev.filter(i => i.id !== itemId));
      toast({
        title: 'Image removed',
        description: 'Image has been removed from your vision board.',
      });

      return true;
    } catch (error) {
      console.error('Error removing image:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove image',
        variant: 'destructive',
      });
      return false;
    }
  };

  const updateCaption = async (itemId: string, caption: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('vision_board_items')
        .update({ caption })
        .eq('id', itemId)
        .eq('user_id', user.id);

      if (error) throw error;

      setItems(prev => prev.map(i => i.id === itemId ? { ...i, caption } : i));
      return true;
    } catch (error) {
      console.error('Error updating caption:', error);
      return false;
    }
  };

  return {
    board,
    items,
    loading,
    uploading,
    uploadImage,
    removeImage,
    updateCaption,
    refetch: fetchVisionBoard,
  };
}
