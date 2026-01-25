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
    <div className="fixed inset-0 flex flex-col">
      {/* Full-screen background - matching theme */}
      <div 
        className="fixed inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1920&q=80)` }}
      />
      <div className="fixed inset-0 bg-gradient-to-br from-sky-400/40 via-indigo-400/30 to-violet-500/40" />
      <div className="fixed inset-0 backdrop-blur-sm" />

      {/* Header - glassmorphism style */}
      <div className="relative z-10 px-4 pt-12 pb-3 flex items-center gap-3 shrink-0">
        <button 
          onClick={() => setScreen('matches')}
          className="w-11 h-11 flex items-center justify-center rounded-full bg-white/40 backdrop-blur-md border border-white/30 shadow-lg transition-all hover:bg-white/50 active:scale-95"
        >
          <ArrowLeft className="w-5 h-5 text-gray-800" />
        </button>
        
        <div className="flex items-center gap-3 flex-1">
          <div className="relative">
            <img
              src={chatUser.photos[0]}
              alt={chatUser.name}
              className="w-11 h-11 rounded-full object-cover border-2 border-white/40 shadow-lg"
            />
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-white" />
          </div>
          <div>
            <h2 className="font-display text-white text-lg drop-shadow-md">{chatUser.name}</h2>
            <p className="text-xs text-green-300 drop-shadow">Online</p>
          </div>
        </div>

        <div className="flex gap-2">
          <button className="w-11 h-11 flex items-center justify-center rounded-full bg-white/40 backdrop-blur-md border border-white/30 shadow-lg transition-all hover:bg-white/50 active:scale-95">
            <Phone className="w-5 h-5 text-gray-800" />
          </button>
          <div className="relative">
            <button 
              onClick={() => setShowOptions(!showOptions)}
              className="w-11 h-11 flex items-center justify-center rounded-full bg-white/40 backdrop-blur-md border border-white/30 shadow-lg transition-all hover:bg-white/50 active:scale-95"
            >
              <MoreVertical className="w-5 h-5 text-gray-800" />
            </button>
            {showOptions && (
              <div className="absolute right-0 top-14 w-48 bg-white/90 backdrop-blur-xl rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.25)] border border-white/50 overflow-hidden z-50">
                <button
                  onClick={handleDeleteChat}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-800 hover:bg-white/50 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Chat
                </button>
                <button
                  onClick={handleBlock}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-500 hover:bg-red-50/50 transition-all"
                >
                  <Ban className="w-4 h-4" />
                  Block User
                </button>
                <button
                  onClick={handleUnmatch}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-500 hover:bg-red-50/50 transition-all"
                >
                  <UserX className="w-4 h-4" />
                  Unmatch
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Messages area - glass container */}
      <div className="relative z-10 flex-1 overflow-hidden px-4 py-4" style={{ marginBottom: '90px' }}>
        <div className="h-full overflow-y-auto space-y-4 pr-2">
          {/* Match notice */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-4"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/30 backdrop-blur-md rounded-full border border-white/30">
              <span className="text-xs text-white font-medium drop-shadow">
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
              transition={{ delay: index * 0.05 }}
              className={`flex ${message.sender === 'me' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[75%] px-4 py-3 rounded-2xl shadow-lg ${
                  message.sender === 'me'
                    ? 'bg-gradient-to-r from-indigo-400 via-blue-400 to-violet-400 text-white rounded-br-md'
                    : 'bg-white/80 backdrop-blur-md text-gray-800 rounded-bl-md border border-white/50'
                }`}
              >
                <p className="text-sm">{message.text}</p>
                <p className={`text-[10px] mt-1 ${
                  message.sender === 'me' ? 'text-white/70' : 'text-gray-500'
                }`}>
                  {message.time}
                </p>
              </div>
            </motion.div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input - Fixed at bottom with glass styling */}
      <div className="fixed bottom-0 left-0 right-0 z-20 p-4 pb-6">
        <div className="bg-white/30 backdrop-blur-xl rounded-2xl border border-white/40 shadow-lg p-2">
          <div className="flex gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 h-12 rounded-xl bg-white/50 border-white/30 text-gray-900 placeholder:text-gray-500"
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            />
            <button
              onClick={handleSend}
              disabled={!newMessage.trim()}
              className="w-12 h-12 rounded-xl bg-gradient-to-r from-indigo-400 via-blue-400 to-violet-400 flex items-center justify-center disabled:opacity-50 transition-all shadow-lg hover:shadow-xl active:scale-95"
            >
              <Send className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatScreen;
