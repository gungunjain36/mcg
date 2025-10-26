import { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bot, Send, TrendingUp } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const AsiChatWidget = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hi! I'm your AI Market Analyst. I can help you understand market trends, analyze trading patterns, and provide insights on NFT floor prices. What would you like to know?",
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);
  
  const handleSend = async () => {
    if (!input.trim()) return;
    
    const userMessage: Message = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);
    
    // Simulate AI response
    setTimeout(() => {
      const responses = [
        "Based on the latest analysis, buying 'Yes' appears to have a higher probability of success at the current price.",
        "'Yes' seems to show stronger momentum right now, so I would recommend considering a purchase of 'Yes' shares.",
        "Recent market data suggests that 'Yes' is favored by most traders at this moment.",
        "Given the current trends, 'Yes' is statistically more likely to yield a positive outcome.",
      ];
      
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      
      setMessages((prev) => [...prev, { role: 'assistant', content: randomResponse }]);
      setIsTyping(false);
    }, 1500);
  };
  
  return (
    <Card className="border-border flex flex-col h-[500px]">
      <div className="border-b border-border p-4">
        <h3 className="font-semibold text-sm">AI Analyst</h3>
        <p className="text-xs text-muted-foreground">Powered by ASI Alliance</p>
      </div>
      
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex gap-2 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`rounded px-3 py-2 max-w-[85%] ${
                  message.role === 'user'
                    ? 'bg-foreground text-background'
                    : 'bg-muted'
                }`}
              >
                <p className="text-sm">{message.content}</p>
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex gap-2">
              <div className="bg-muted rounded px-3 py-2">
                <div className="flex gap-1">
                  <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
      
      <div className="border-t border-border p-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex gap-2"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about market trends..."
            className="flex-1"
          />
          <Button type="submit" size="icon" disabled={!input.trim() || isTyping}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </Card>
  );
};

export default AsiChatWidget;
