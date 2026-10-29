
import { useState } from 'react';
import './AIAssistantScreen.css';

export default function AIAssistantScreen({ onBack }) {
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  const sendQuestion = async (event) => {
    event.preventDefault();

    const text = question.trim();
    if (!text || loading) return;

    setMessages((prev) => [
      ...prev,
      { role: 'user', text },
    ]);
    setQuestion('');
    setLoading(true);

    try {
      const response = await fetch(
        'http://127.0.0.1:8000/ai-assistant',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ question: text }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || 'Unable to get an answer.'
        );
      }

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: data.answer,
        },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: `Sorry, something went wrong: ${error.message}. Please check that the backend is running.`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ai-screen">
      <header className="ai-header">
        <button onClick={onBack} className="ai-back">
          ← Back
        </button>
        <div>
          <h2>HarvestRoute AI</h2>
          <p>Your farming assistant</p>
        </div>
      </header>

      <div className="ai-messages">
        {messages.length === 0 && (
          <div className="ai-welcome">
            <h3>Namaste, Farmer! 🌱</h3>
            <p>
              Ask me about mandis, crop prices,
              market recommendations, or net returns.
            </p>
          </div>
        )}

        {messages.map((message, index) => (
          <div
            key={index}
            className={`ai-message ${message.role}`}
          >
            {message.text}
          </div>
        ))}

        {loading && (
          <div className="ai-message assistant">
            Thinking...
          </div>
        )}
      </div>

      <form className="ai-input-form" onSubmit={sendQuestion}>
        <input
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder="Ask in Hindi or English..."
          aria-label="Ask HarvestRoute AI"
          disabled={loading}
        />
        <button type="submit" disabled={loading || !question.trim()}>
          Send
        </button>
      </form>
    </div>
  );
}
