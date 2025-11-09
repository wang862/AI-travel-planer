import { useState, useCallback } from 'react'
import axios from 'axios'

export const useSpeechRecognition = () => {
  const [transcript, setTranscript] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [mediaRecorder, setMediaRecorder] = useState(null)

  const startListening = useCallback(() => {
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(stream => {
        const recorder = new MediaRecorder(stream)
        const audioChunks = []

        recorder.ondataavailable = event => {
          audioChunks.push(event.data)
        }

        recorder.onstop = async () => {
          const audioBlob = new Blob(audioChunks, { type: 'audio/wav' })
          try {
            // 将音频发送到后端进行语音识别
            const formData = new FormData()
            formData.append('audio', audioBlob)
            
            const response = await axios.post('/api/speech-to-text', formData, {
              headers: {
                'Content-Type': 'multipart/form-data'
              }
            })
            
            setTranscript(response.data.text)
          } catch (error) {
            console.error('语音识别失败:', error)
            alert('语音识别失败，请重试')
          } finally {
            stream.getTracks().forEach(track => track.stop())
          }
        }

        setMediaRecorder(recorder)
        setIsListening(true)
        recorder.start()
      })
      .catch(error => {
        console.error('无法访问麦克风:', error)
        alert('无法访问麦克风，请检查权限设置')
      })
  }, [])

  const stopListening = useCallback(() => {
    if (mediaRecorder) {
      mediaRecorder.stop()
      setIsListening(false)
    }
  }, [mediaRecorder])

  return {
    transcript,
    isListening,
    startListening,
    stopListening
  }
}