import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';
import { ArrowLeft, Send, Phone, MoreVertical, Trash2, UserX, Ban } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface Message {
  id: string;
  text: string;
  sender: 'me' | 'them';
  time: string;
}

const ChatScreen = () => {
  const { setScreen, matchedUser, setMatchedUser, removeMatch } = useAppStore();
  const { user, profileId } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [showOptions, setShowOptions] = useState(false);
  const [matchId, setMatchId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch match ID and messages
  useEffect(() => {
    const fetchMatchAndMessages = async () => {
      if (!user || !matchedUser || !profileId) {
        setLoading(false);
        return;
      }

      try {
        // Find the match between current user and matched user
        const { data: matchData } = await supabase
          .from('matches')
          .select('id')
          .or(`and(profile1_id.eq.${profileId},profile2_id.eq.${matchedUser.id}),and(profile1_id.eq.${matchedUser.id},profile2_id.eq.${profileId})`)
          .single();

        if (matchData) {
          setMatchId(matchData.id);

          // Fetch messages for this match
          const { data: messagesData } = await supabase
            .from('messages')
            .select('*')
            .eq('match_id', matchData.id)
            .order('created_at', { ascending: true });

          if (messagesData) {
            const formattedMessages: Message[] = messagesData.map((msg) => ({
              id: msg.id,
              text: msg.content,
              sender: msg.sender_id === profileId ? 'me' : 'them',
              time: new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            }));
            setMessages(formattedMessages);
          }
        }
      } catch (error) {
        console.error('Error fetching messages:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMatchAndMessages();
  }, [user, matchedUser, profileId]);

  // Subscribe to new messages
  useEffect(() => {
    if (!matchId) return;

    const channel = supabase
      .channel(`messages-${matchId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `match_id=eq.${matchId}`,
        },
        (payload) => {
          const newMsg = payload.new as any;
          const formattedMsg: Message = {
            id: newMsg.id,
            text: newMsg.content,
            sender: newMsg.sender_id === profileId ? 'me' : 'them',
            time: new Date(newMsg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          };
          setMessages((prev) => {
            // Avoid duplicates
            if (prev.some((m) => m.id === formattedMsg.id)) return prev;
            return [...prev, formattedMsg];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [matchId, profileId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleDeleteChat = () => {
    setMessages([]);
    setShowOptions(false);
  };

  const handleBlock = async () => {
    if (matchedUser && profileId) {
      try {
        await supabase.from('blocks').insert({
          blocker_id: profileId,
          blocked_id: matchedUser.id,
        });
        removeMatch(matchedUser.id);
        setMatchedUser(null);
        setScreen('matches');
      } catch (error) {
        console.error('Error blocking user:', error);
      }
    }
    setShowOptions(false);
  };

  const handleUnmatch = () => {
    if (matchedUser) {
      removeMatch(matchedUser.id);
    }
    setMatchedUser(null);
    setScreen('matches');
  };

  const handleSend = async () => {
    if (!newMessage.trim()) return;

    if (matchId && profileId) {
      // Send to database
      const { error } = await supabase.from('messages').insert({
        match_id: matchId,
        sender_id: profileId,
        content: newMessage.trim(),
      });

      if (error) {
        console.error('Error sending message:', error);
        return;
      }
    } else {
      // Demo mode - just add locally
      const message: Message = {
        id: Date.now().toString(),
        text: newMessage,
        sender: 'me',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, message]);
    }

    setNewMessage('');
  };

  const chatUser = matchedUser || {
    name: 'Emma',
    photos: ['https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop'],
  };

  return (
    <div className="h-full flex flex-col relative overflow-hidden">
      {/* Full-screen background like Apple homescreen */}
      <div 
        className="fixed inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&auto=format&fit=crop)` }}
      />
      <div className="fixed inset-0 bg-gradient-to-b from-accent/30 via-background/70 to-background/80 backdrop-blur-[2px]" />

      {/* Header */}
      <div className="relative z-10 px-4 pt-12 pb-3 flex items-center gap-3 border-b border-border/50">
        <button 
          onClick={() => setScreen('matches')}
          className="w-10 h-10 flex items-center justify-center rounded-xl bg-secondary transition-all duration-300 hover:bg-secondary/70"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        
        <div className="flex items-center gap-3 flex-1">
          <div className="relative">
            <img
              src={chatUser.photos[0]}
              alt={chatUser.name}
              className="w-10 h-10 rounded-full object-cover"
            />
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
          </div>
          <div>
            <h2 className="font-display text-foreground text-lg">{chatUser.name}</h2>
            <p className="text-xs text-green-500">Online</p>
          </div>
        </div>

        <div className="flex gap-2">
          <button className="w-10 h-10 flex items-center justify-center rounded-xl bg-secondary transition-smooth hover:bg-secondary/70">
            <Phone className="w-5 h-5 text-foreground" />
          </button>
          <div className="relative">
            <button 
              onClick={() => setShowOptions(!showOptions)}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-secondary transition-smooth hover:bg-secondary/70"
            >
              <MoreVertical className="w-5 h-5 text-foreground" />
            </button>
            {showOptions && (
              <div className="absolute right-0 top-12 w-48 bg-card rounded-xl shadow-elegant border border-border overflow-hidden z-50">
                <button
                  onClick={handleDeleteChat}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-foreground hover:bg-secondary transition-smooth"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Chat
                </button>
                <button
                  onClick={handleBlock}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-destructive hover:bg-destructive/10 transition-smooth"
                >
                  <Ban className="w-4 h-4" />
                  Block User
                </button>
                <button
                  onClick={handleUnmatch}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-destructive hover:bg-destructive/10 transition-smooth"
                >
                  <UserX className="w-4 h-4" />
                  Unmatch
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Messages - add bottom padding for input */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 relative z-10 pb-24">
        {/* Match notice */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-4"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-accent/10 rounded-full">
            <span className="text-xs text-accent font-medium">
              ✨ You matched on Dec 20
            </span>
          </div>
        </motion.div>

        {/* Messages */}
        {messages.map((message, index) => (
          <motion.div
            key={message.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`flex ${message.sender === 'me' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[75%] px-4 py-3 rounded-2xl ${
                message.sender === 'me'
                  ? 'gradient-accent text-accent-foreground rounded-br-md'
                  : 'bg-secondary text-foreground rounded-bl-md'
              }`}
            >
              <p className="text-sm">{message.text}</p>
              <p className={`text-[10px] mt-1 ${
                message.sender === 'me' ? 'text-accent-foreground/70' : 'text-muted-foreground'
              }`}>
                {message.time}
              </p>
            </div>
          </motion.div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input - Fixed at absolute bottom */}
      <div className="absolute bottom-0 left-0 right-0 z-10 p-4 pb-6 border-t border-border/50 bg-background/95 backdrop-blur-sm">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="h-12 pr-12 rounded-2xl bg-secondary border-0 shadow-soft"
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            />
            <button
              onClick={handleSend}
              disabled={!newMessage.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full gradient-accent flex items-center justify-center disabled:opacity-50 transition-smooth"
            >
              <Send className="w-4 h-4 text-accent-foreground" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatScreen;
