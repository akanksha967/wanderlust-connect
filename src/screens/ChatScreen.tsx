import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';
import { ArrowLeft, Send, Phone, Video, MoreHorizontal } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface Message {
  id: string;
  text: string;
  sender: 'me' | 'them';
  time: string;
}

const initialMessages: Message[] = [
  {
    id: '1',
    text: 'Hey! I saw we matched. So excited to find someone heading to Bali too! 🌴',
    sender: 'them',
    time: '2:30 PM',
  },
  {
    id: '2',
    text: 'Hi! Yes! I can\'t wait. Are you planning on doing any diving there?',
    sender: 'me',
    time: '2:32 PM',
  },
  {
    id: '3',
    text: 'Absolutely! The coral reefs are on my bucket list. Would you be interested in going together?',
    sender: 'them',
    time: '2:33 PM',
  },
];

const ChatScreen = () => {
  const { setScreen, matchedUser } = useAppStore();
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [newMessage, setNewMessage] = useState('');

  const handleSend = () => {
    if (!newMessage.trim()) return;

    const message: Message = {
      id: Date.now().toString(),
      text: newMessage,
      sender: 'me',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages([...messages, message]);
    setNewMessage('');
  };

  const user = matchedUser || {
    name: 'Emma',
    photos: ['https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop'],
  };

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="px-4 pt-12 pb-3 flex items-center gap-3 border-b border-border">
        <button 
          onClick={() => setScreen('swipe')}
          className="w-10 h-10 flex items-center justify-center rounded-xl bg-secondary transition-all duration-300 hover:bg-secondary/70"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        
        <div className="flex items-center gap-3 flex-1">
          <div className="relative">
            <img
              src={user.photos[0]}
              alt={user.name}
              className="w-10 h-10 rounded-full object-cover"
            />
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
          </div>
          <div>
            <h2 className="font-display text-foreground text-lg">{user.name}</h2>
            <p className="text-xs text-green-500">Online</p>
          </div>
        </div>

        <div className="flex gap-2">
          <button className="w-10 h-10 flex items-center justify-center rounded-xl bg-secondary transition-smooth hover:bg-secondary/70">
            <Phone className="w-5 h-5 text-foreground" />
          </button>
          <button className="w-10 h-10 flex items-center justify-center rounded-xl bg-secondary transition-smooth hover:bg-secondary/70">
            <Video className="w-5 h-5 text-foreground" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
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
      </div>

      {/* Input */}
      <div className="p-4 pb-8 border-t border-border">
        <div className="flex gap-3">
          <button className="w-12 h-12 flex items-center justify-center rounded-xl bg-secondary transition-smooth hover:bg-secondary/70">
            <MoreHorizontal className="w-5 h-5 text-muted-foreground" />
          </button>
          
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
