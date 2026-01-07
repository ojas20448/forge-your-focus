import React, { useState } from 'react';
import { UserPlus, Users, Copy, Check, Trophy, X, ChevronLeft, Loader2, Swords } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useFriendships } from '@/hooks/useFriendships';
import { useToast } from '@/hooks/use-toast';

interface FriendsScreenProps {
  onBack: () => void;
}

export const FriendsScreen: React.FC<FriendsScreenProps> = ({ onBack }) => {
  const {
    friends,
    pendingRequests,
    sentRequests,
    friendCode,
    loading,
    mutating,
    sendFriendRequest,
    acceptFriendRequest,
    declineFriendRequest,
    removeFriend,
    createChallenge,
  } = useFriendships();

  const { toast } = useToast();
  const [addFriendCode, setAddFriendCode] = useState('');
  const [codeCopied, setCodeCopied] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showChallengeDialog, setShowChallengeDialog] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState<string | null>(null);
  const [challengeType, setChallengeType] = useState<'focus_hours' | 'tasks_completed' | 'xp_earned'>('focus_hours');
  const [challengeTarget, setChallengeTarget] = useState('10');
  const [challengeDuration, setChallengeDuration] = useState('7');

  const handleCopyCode = () => {
    if (friendCode) {
      navigator.clipboard.writeText(friendCode);
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
      toast({
        title: 'Copied!',
        description: 'Friend code copied to clipboard',
      });
    }
  };

  const handleAddFriend = async () => {
    if (!addFriendCode.trim()) return;

    const result = await sendFriendRequest(addFriendCode.toUpperCase());
    if (result.success) {
      setAddFriendCode('');
      setShowAddDialog(false);
    } else {
      toast({
        title: 'Error',
        description: result.error,
        variant: 'destructive',
      });
    }
  };

  const handleCreateChallenge = async () => {
    if (!selectedFriend) return;

    const target = parseInt(challengeTarget);
    const duration = parseInt(challengeDuration);

    if (isNaN(target) || target <= 0 || isNaN(duration) || duration <= 0) {
      toast({
        title: 'Invalid input',
        description: 'Please enter valid numbers',
        variant: 'destructive',
      });
      return;
    }

    const result = await createChallenge(selectedFriend, challengeType, target, duration);
    if (result.success) {
      setShowChallengeDialog(false);
      setSelectedFriend(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary/10 via-secondary/10 to-background p-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="mb-4"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Back
        </Button>

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">Friends</h1>
            <p className="text-muted-foreground">Connect and compete</p>
          </div>
          <Users className="w-12 h-12 text-primary" />
        </div>

        {/* Friend Code Card */}
        <div className="bg-card rounded-xl p-4 border shadow-lg">
          <p className="text-sm text-muted-foreground mb-2">Your Friend Code</p>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-primary/10 rounded-lg p-3">
              <p className="text-2xl font-mono font-bold text-primary text-center tracking-wider">
                {friendCode || '—'}
              </p>
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={handleCopyCode}
              className="h-12 w-12"
            >
              {codeCopied ? (
                <Check className="w-5 h-5 text-green-500" />
              ) : (
                <Copy className="w-5 h-5" />
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Share this code with friends to connect
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="px-4 py-4">
        <Button
          className="w-full"
          onClick={() => setShowAddDialog(true)}
        >
          <UserPlus className="w-4 h-4 mr-2" />
          Add Friend by Code
        </Button>
      </div>

      {/* Pending Requests */}
      {pendingRequests.length > 0 && (
        <div className="px-4 mb-6">
          <h2 className="text-lg font-semibold mb-3">Pending Requests</h2>
          <div className="space-y-2">
            {pendingRequests.map((request) => (
              <div
                key={request.id}
                className="flex items-center gap-3 p-3 bg-card rounded-lg border"
              >
                <Avatar className="w-10 h-10">
                  <AvatarImage src={request.friend_profile?.avatar_url || undefined} />
                  <AvatarFallback>
                    {(request.friend_profile?.display_name || 'U').charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">
                    {request.friend_profile?.display_name || 'User'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Level {request.friend_profile?.level || 1}
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => acceptFriendRequest(request.id)}
                    disabled={mutating}
                  >
                    <Check className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => declineFriendRequest(request.id)}
                    disabled={mutating}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sent Requests */}
      {sentRequests.length > 0 && (
        <div className="px-4 mb-6">
          <h2 className="text-lg font-semibold mb-3">Sent Requests</h2>
          <div className="space-y-2">
            {sentRequests.map((request) => (
              <div
                key={request.id}
                className="flex items-center gap-3 p-3 bg-card rounded-lg border opacity-60"
              >
                <Avatar className="w-10 h-10">
                  <AvatarImage src={request.friend_profile?.avatar_url || undefined} />
                  <AvatarFallback>
                    {(request.friend_profile?.display_name || 'U').charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1">
                  <p className="font-semibold">
                    {request.friend_profile?.display_name || 'User'}
                  </p>
                  <p className="text-xs text-muted-foreground">Pending...</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Friends List */}
      <div className="px-4">
        <h2 className="text-lg font-semibold mb-3">
          My Friends ({friends.length})
        </h2>

        {friends.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground">No friends yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Add friends to challenge them!
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {friends.map((friend) => (
              <div
                key={friend.id}
                className="flex items-center gap-3 p-3 bg-card rounded-lg border hover:bg-accent transition-colors"
              >
                <Avatar className="w-12 h-12">
                  <AvatarImage src={friend.friend_profile?.avatar_url || undefined} />
                  <AvatarFallback>
                    {(friend.friend_profile?.display_name || 'U').charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">
                    {friend.friend_profile?.display_name || 'User'}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>Level {friend.friend_profile?.level || 1}</span>
                    <span>•</span>
                    <span>{friend.friend_profile?.total_xp?.toLocaleString() || 0} XP</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelectedFriend(friend.friend_id);
                      setShowChallengeDialog(true);
                    }}
                  >
                    <Swords className="w-4 h-4 mr-1" />
                    Challenge
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Friend Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Friend</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Friend Code</label>
              <Input
                placeholder="Enter friend code"
                value={addFriendCode}
                onChange={(e) => setAddFriendCode(e.target.value.toUpperCase())}
                maxLength={8}
                className="text-center text-lg tracking-wider font-mono"
              />
            </div>
            <Button
              className="w-full"
              onClick={handleAddFriend}
              disabled={mutating || !addFriendCode.trim()}
            >
              {mutating ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <UserPlus className="w-4 h-4 mr-2" />
              )}
              Send Request
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Challenge Dialog */}
      <Dialog open={showChallengeDialog} onOpenChange={setShowChallengeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Challenge</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Challenge Type</label>
              <Select value={challengeType} onValueChange={(v: any) => setChallengeType(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="focus_hours">Focus Hours</SelectItem>
                  <SelectItem value="tasks_completed">Tasks Completed</SelectItem>
                  <SelectItem value="xp_earned">XP Earned</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Target Value</label>
              <Input
                type="number"
                value={challengeTarget}
                onChange={(e) => setChallengeTarget(e.target.value)}
                min="1"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Duration (days)</label>
              <Input
                type="number"
                value={challengeDuration}
                onChange={(e) => setChallengeDuration(e.target.value)}
                min="1"
                max="30"
              />
            </div>

            <Button
              className="w-full"
              onClick={handleCreateChallenge}
              disabled={mutating}
            >
              {mutating ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Trophy className="w-4 h-4 mr-2" />
              )}
              Send Challenge
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
