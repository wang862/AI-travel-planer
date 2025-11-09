import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useSpeechRecognition } from '../hooks/SpeechRecognitionHook'

function SpeechTestPage() {
  const { 
    transcript, 
    isListening, 
    startListening, 
    stopListening 
  } = useSpeechRecognition()
  
  const [recognitionHistory, setRecognitionHistory] = useState([])
  const [error, setError] = useState('')

  const handleStartListening = () => {
    setError('')
    startListening()
  }

  const handleStopListening = () => {
    stopListening()
    // 将最新的识别结果添加到历史记录中
    if (transcript) {
      setRecognitionHistory(prev => [transcript, ...prev])
    }
  }

  const clearHistory = () => {
    setRecognitionHistory([])
  }

  return (
    <div className="container">
      <h1>语音识别测试</h1>
      <div className="speech-test-container">
        <div className="instructions">
          <h2>使用说明</h2>
          <p>1. 点击"开始录音"按钮</p>
          <p>2. 对着麦克风说话（尝试说中文旅行相关内容）</p>
          <p>3. 点击"停止录音"按钮</p>
          <p>4. 查看语音识别结果</p>
          
          <p className="example-text">
            示例："我想去北京旅行，预算5000元，计划玩5天"
          </p>
        </div>

        <div className="controls">
          <button
            onClick={isListening ? handleStopListening : handleStartListening}
            className={`record-button ${isListening ? 'recording' : ''}`}
          >
            {isListening ? (
              <>
                <span className="recording-icon">🔴</span>
                <span>停止录音</span>
              </>
            ) : (
              <>
                <span className="mic-icon">🎤</span>
                <span>开始录音</span>
              </>
            )}
          </button>
          
          {error && (
            <div className="error-message">
              <p>{error}</p>
            </div>
          )}
        </div>

        {transcript && (
          <div className="current-result">
            <h2>当前识别结果</h2>
            <p className="transcript-text">{transcript}</p>
          </div>
        )}

        {recognitionHistory.length > 0 && (
          <div className="history">
            <div className="history-header">
              <h2>历史记录</h2>
              <button onClick={clearHistory} className="clear-button">
                清空历史
              </button>
            </div>
            <ul className="history-list">
              {recognitionHistory.map((item, index) => (
                <li key={index} className="history-item">
                  <p>{item}</p>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="back-link">
          <Link to="/">返回首页</Link>
        </div>
      </div>

      <style>{`
        .speech-test-container {
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f9f9f9;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .instructions {
          margin-bottom: 30px;
          padding: 15px;
          background-color: #e8f5e9;
          border-radius: 6px;
        }
        
        .example-text {
          font-style: italic;
          color: #4a4a4a;
          background-color: #fff;
          padding: 10px;
          border-left: 3px solid #4CAF50;
        }
        
        .controls {
          text-align: center;
          margin-bottom: 30px;
        }
        
        .record-button {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 15px 30px;
          font-size: 18px;
          font-weight: bold;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        
        .record-button:not(.recording) {
          background-color: #4CAF50;
          color: white;
        }
        
        .record-button:not(.recording):hover {
          background-color: #45a049;
        }
        
        .record-button.recording {
          background-color: #f44336;
          color: white;
          animation: pulse 1s infinite;
        }
        
        @keyframes pulse {
          0% {
            opacity: 1;
          }
          50% {
            opacity: 0.8;
          }
          100% {
            opacity: 1;
          }
        }
        
        .mic-icon,
        .recording-icon {
          font-size: 20px;
        }
        
        .error-message {
          margin-top: 15px;
          padding: 10px;
          background-color: #ffebee;
          color: #c62828;
          border-radius: 4px;
        }
        
        .current-result {
          margin-bottom: 30px;
          padding: 20px;
          background-color: white;
          border-radius: 6px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        
        .transcript-text {
          font-size: 18px;
          line-height: 1.6;
          color: #333;
          background-color: #f5f5f5;
          padding: 15px;
          border-radius: 4px;
          min-height: 60px;
        }
        
        .history {
          margin-top: 30px;
        }
        
        .history-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 15px;
        }
        
        .clear-button {
          padding: 6px 12px;
          background-color: #2196F3;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }
        
        .history-list {
          list-style: none;
          padding: 0;
        }
        
        .history-item {
          margin-bottom: 10px;
          padding: 10px;
          background-color: white;
          border-radius: 4px;
          border-left: 3px solid #2196F3;
        }
        
        .back-link {
          margin-top: 30px;
          text-align: center;
        }
        
        .back-link a {
          color: #2196F3;
          text-decoration: none;
          font-weight: bold;
        }
        
        .back-link a:hover {
          text-decoration: underline;
        }
      `}</style>
    </div>
  )
}

export default SpeechTestPage