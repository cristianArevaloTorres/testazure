import { useState, useRef, useEffect } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Send, Plus, Bot, User, Trash2 } from 'lucide-react'
import { aiService } from '@/services/aiService'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { PageLoader } from '@/components/ui/LoadingSpinner'
import type { ChatMessage } from '@/types'
import DOMPurify from 'dompurify'

export default function ChatPage() {
  const [conversationId, setConversationId] = useState<string | undefined>()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  const { data: conversations, isLoading: convLoading } = useQuery({
    queryKey: ['conversations'],
    queryFn: aiService.getConversations,
  })

  const sendMutation = useMutation({
    mutationFn: (message: string) => aiService.sendMessage({ conversationId, message }),
    onMutate: (message) => {
      const userMsg: ChatMessage = {
        id: `temp-${Date.now()}`,
        role: 'user',
        content: message,
        timestamp: new Date().toISOString(),
      }
      setMessages(prev => [...prev, userMsg])
      setInput('')
    },
    onSuccess: (data) => {
      if (!conversationId) setConversationId(data.conversationId)
      const assistantMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: data.response,
        timestamp: data.timestamp,
        tokensUsed: data.tokensUsed,
      }
      setMessages(prev => [...prev, assistantMsg])
    },
    onError: () => {
      setMessages(prev => prev.filter(m => !m.id.startsWith('temp-')))
    },
  })

  const loadConversation = async (id: string) => {
    const data = await aiService.getConversation(id)
    setConversationId(id)
    setMessages(data.messages ?? [])
  }

  const handleNewConversation = () => {
    setConversationId(undefined)
    setMessages([])
  }

  const handleSend = () => {
    if (!input.trim() || sendMutation.isPending) return
    sendMutation.mutate(input.trim())
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  return (
    <div className="h-[calc(100vh-8rem)] flex gap-4">
      {/* Conversations sidebar */}
      <div className="w-64 flex flex-col gap-3 flex-shrink-0">
        <Button
          fullWidth
          variant="secondary"
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={handleNewConversation}
        >
          Nueva Conversación
        </Button>

        <Card className="flex-1 p-3 overflow-y-auto">
          {convLoading ? <PageLoader /> : (
            <div className="space-y-1">
              {conversations?.length === 0 && (
                <p className="text-xs text-orion-text-muted text-center py-4">Sin conversaciones</p>
              )}
              {conversations?.map((c: { id: string; lastMessage?: string; updatedAt: string }) => (
                <button
                  key={c.id}
                  onClick={() => loadConversation(c.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                    conversationId === c.id
                      ? 'bg-orion-primary/10 border-l-2 border-orion-primary pl-[10px] text-orion-text-primary'
                      : 'text-orion-text-secondary hover:bg-orion-elevated hover:text-orion-text-primary'
                  }`}
                >
                  <p className="text-xs font-medium truncate">{c.lastMessage ?? 'Conversación'}</p>
                  <p className="text-xs text-orion-text-muted mt-0.5">
                    {new Date(c.updatedAt).toLocaleDateString('es-MX')}
                  </p>
                </button>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Chat main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <Card className="flex items-center justify-between p-4 mb-3 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-orion-primary to-orion-nebula flex items-center justify-center shadow-glow-blue">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-orion-text-primary">ORION AI</p>
              <p className="text-xs text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full inline-block" />
                En línea · Claude claude-3-5-sonnet
              </p>
            </div>
          </div>
          {conversationId && (
            <Button
              variant="ghost"
              size="xs"
              leftIcon={<Trash2 className="w-3.5 h-3.5" />}
              onClick={() => {
                aiService.clearConversation(conversationId)
                handleNewConversation()
              }}
            >
              Limpiar
            </Button>
          )}
        </Card>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orion-primary to-orion-nebula flex items-center justify-center shadow-glow-blue">
                <Bot className="w-8 h-8 text-white" />
              </div>
              <p className="text-sm font-semibold text-orion-text-primary">Hola, soy ORION</p>
              <p className="text-xs text-orion-text-muted text-center max-w-xs">
                Asistente de Lockton especializado en seguros. Puedo ayudarte a analizar cotizaciones, 
                comparar coberturas y responder dudas del sistema.
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                {['¿Cuál es la mejor cobertura para un auto?', '¿Cómo funciona el sistema de cotización?', '¿Qué es un deducible?'].map(s => (
                  <button
                    key={s}
                    onClick={() => { setInput(s); }}
                    className="text-xs px-3 py-1.5 rounded-full border border-orion-border bg-orion-elevated text-orion-text-secondary hover:text-orion-text-primary hover:border-orion-border-light transition-all"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div className={`w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center ${
                msg.role === 'assistant'
                  ? 'bg-gradient-to-br from-orion-primary to-orion-nebula shadow-glow-blue/30'
                  : 'bg-orion-elevated border border-orion-border'
              }`}>
                {msg.role === 'assistant'
                  ? <Bot className="w-4 h-4 text-white" />
                  : <User className="w-4 h-4 text-orion-text-secondary" />
                }
              </div>
              <div className={`max-w-[75%] ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                <div className={`rounded-xl px-4 py-3 text-sm ${
                  msg.role === 'user'
                    ? 'bg-orion-primary text-white rounded-tr-sm'
                    : 'bg-orion-elevated border border-orion-border text-orion-text-primary rounded-tl-sm'
                }`}>
                  {msg.role === 'assistant' ? (
                    <div
                      className="prose prose-sm prose-invert max-w-none"
                      dangerouslySetInnerHTML={{
                        __html: DOMPurify.sanitize(
                          msg.content.replace(/\n/g, '<br/>').replace(/`([^`]+)`/g, '<code class="bg-orion-bg px-1 py-0.5 rounded text-xs">$1</code>')
                        )
                      }}
                    />
                  ) : msg.content}
                </div>
                <p className="text-xs text-orion-text-muted px-1">
                  {new Date(msg.timestamp).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                  {msg.tokensUsed && ` · ${msg.tokensUsed} tokens`}
                </p>
              </div>
            </div>
          ))}

          {sendMutation.isPending && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orion-primary to-orion-nebula shadow-glow-blue/30 flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="bg-orion-elevated border border-orion-border rounded-xl px-4 py-3">
                <div className="flex gap-1">
                  {[0, 1, 2].map(i => (
                    <div key={i} className="w-2 h-2 bg-orion-text-muted rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                  ))}
                </div>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="mt-3 flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escribe tu pregunta... (Enter para enviar, Shift+Enter para nueva línea)"
            rows={2}
            className="flex-1 bg-orion-elevated border border-orion-border rounded-xl px-4 py-3 text-sm 
                       text-orion-text-primary placeholder-orion-text-muted resize-none
                       focus:outline-none focus:border-orion-primary focus:ring-1 focus:ring-orion-primary/30
                       transition-colors"
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim()}
            isLoading={sendMutation.isPending}
            className="self-end"
            leftIcon={<Send className="w-4 h-4" />}
          >
            Enviar
          </Button>
        </div>
      </div>
    </div>
  )
}
