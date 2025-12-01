"""
Video Processor Module
Wraps video summarization functionality for backend use
"""

import cv2
import torch
from transformers import (
    BlipProcessor, 
    BlipForConditionalGeneration,
    WhisperProcessor, 
    WhisperForConditionalGeneration
)
import tempfile
import os
import numpy as np
import librosa
import easyocr
from PIL import Image
from moviepy.editor import VideoFileClip
from typing import List, Optional, Dict
import warnings
warnings.filterwarnings('ignore')

# LLM imports
try:
    from groq import Groq
    GROQ_AVAILABLE = True
except ImportError:
    GROQ_AVAILABLE = False

try:
    import google.generativeai as genai
    GEMINI_AVAILABLE = True
except ImportError:
    GEMINI_AVAILABLE = False

class VideoProcessor:
    def __init__(self):
        """Initialize video processor with all models"""
        print("🔄 Initializing Video Processor...")
        
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        print(f"Using device: {self.device}")
        
        # Load models
        print("Loading BLIP model...")
        self.blip_processor = BlipProcessor.from_pretrained("Salesforce/blip-image-captioning-base")
        self.blip_model = BlipForConditionalGeneration.from_pretrained("Salesforce/blip-image-captioning-base")
        self.blip_model = self.blip_model.to(self.device)
        self.blip_model.eval()
        
        print("Loading Whisper model...")
        self.whisper_processor = WhisperProcessor.from_pretrained("openai/whisper-base")
        self.whisper_model = WhisperForConditionalGeneration.from_pretrained("openai/whisper-base")
        self.whisper_model = self.whisper_model.to(self.device)
        self.whisper_model.eval()
        
        print("Initializing EasyOCR...")
        self.ocr_reader = easyocr.Reader(['en'], gpu=torch.cuda.is_available())
        
        # Initialize LLM clients
        self.groq_client = None
        self.gemini_model = None
        
        # Load API keys from environment
        groq_key = os.getenv('GROQ_API_KEY', '')
        gemini_key = os.getenv('GEMINI_API_KEY', '')
        
        if groq_key and GROQ_AVAILABLE:
            try:
                self.groq_client = Groq(api_key=groq_key)
                print("✅ Groq client initialized")
            except:
                pass
        
        if gemini_key and GEMINI_AVAILABLE:
            try:
                genai.configure(api_key=gemini_key)
                self.gemini_model = genai.GenerativeModel('gemini-pro')
                print("✅ Gemini client initialized")
            except:
                pass
        
        # Summary styles
        self.SUMMARY_STYLES = {
            "default": "Standard comprehensive summary",
            "professional": "Formal, business-oriented summary",
            "commercial": "Marketing-focused advertisement summary",
            "educational": "Academic-style summary for learning",
            "casual": "Relaxed, conversational summary",
            "technical": "Detailed technical summary"
        }
        
        print("✅ Video Processor initialized")
    
    def extract_keyframes(self, video_path: str, num_frames: int = 10) -> List[np.ndarray]:
        """Extract evenly spaced keyframes from video"""
        cap = cv2.VideoCapture(video_path)
        
        if not cap.isOpened():
            raise ValueError(f"Could not open video: {video_path}")
        
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        fps = cap.get(cv2.CAP_PROP_FPS)
        duration = total_frames / fps if fps > 0 else 0
        
        if total_frames < num_frames:
            frame_indices = list(range(total_frames))
        else:
            frame_indices = [int(i * total_frames / num_frames) for i in range(num_frames)]
        
        frames = []
        for idx in frame_indices:
            cap.set(cv2.CAP_PROP_POS_FRAMES, idx)
            ret, frame = cap.read()
            if ret:
                frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                frames.append(frame)
        
        cap.release()
        return frames
    
    def extract_audio(self, video_path: str):
        """Extract audio from video"""
        try:
            video_clip = VideoFileClip(video_path)
            
            if video_clip.audio is None:
                video_clip.close()
                return None, None
            
            with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as tmp_audio:
                audio_path = tmp_audio.name
                video_clip.audio.write_audiofile(audio_path, verbose=False, logger=None)
            
            audio_data, sample_rate = librosa.load(audio_path, sr=16000)
            
            video_clip.close()
            os.remove(audio_path)
            
            return audio_data, sample_rate
            
        except Exception as e:
            print(f"⚠️ Error extracting audio: {e}")
            return None, None
    
    def transcribe_audio(self, audio_data: np.ndarray, sample_rate: int) -> str:
        """Transcribe audio using Whisper"""
        if audio_data is None or len(audio_data) == 0:
            return "No audio content detected."
        
        try:
            inputs = self.whisper_processor(audio_data, sampling_rate=sample_rate, return_tensors="pt")
            inputs = {k: v.to(self.device) for k, v in inputs.items()}
            
            with torch.no_grad():
                predicted_ids = self.whisper_model.generate(
                    inputs["input_features"],
                    max_length=448,
                    num_beams=5,
                    language="en"
                )
            
            transcription = self.whisper_processor.batch_decode(predicted_ids, skip_special_tokens=True)[0]
            return transcription.strip() if transcription.strip() else "No speech detected in audio."
            
        except Exception as e:
            print(f"⚠️ Error in transcription: {e}")
            return "Audio transcription failed."
    
    def caption_frame(self, frame: np.ndarray) -> str:
        """Generate caption for a single frame"""
        try:
            image = Image.fromarray(frame)
            inputs = self.blip_processor(image, return_tensors="pt").to(self.device)
            
            with torch.no_grad():
                out = self.blip_model.generate(
                    **inputs,
                    max_length=50,
                    num_beams=3,
                    do_sample=False
                )
            
            caption = self.blip_processor.decode(out[0], skip_special_tokens=True)
            return caption
            
        except Exception as e:
            print(f"⚠️ Error captioning frame: {e}")
            return "Unable to describe this frame."
    
    def extract_text_from_frame(self, frame: np.ndarray) -> List[str]:
        """Extract text from frame using OCR"""
        try:
            results = self.ocr_reader.readtext(frame)
            texts = [text[1] for text in results if text[2] > 0.5]
            return texts
        except Exception as e:
            print(f"⚠️ Error in OCR: {e}")
            return []
    
    def analyze_visual_content(self, frames: List[np.ndarray]) -> Dict:
        """Analyze all frames to extract visual information"""
        frame_captions = []
        all_ocr_texts = []
        
        for i, frame in enumerate(frames):
            caption = self.caption_frame(frame)
            frame_captions.append(f"Frame {i+1}: {caption}")
            
            ocr_texts = self.extract_text_from_frame(frame)
            if ocr_texts:
                all_ocr_texts.extend(ocr_texts)
                frame_captions[-1] += f" | On-screen text: {', '.join(ocr_texts)}"
        
        return {
            "frame_captions": frame_captions,
            "ocr_texts": all_ocr_texts,
            "visual_summary": "\n".join(frame_captions)
        }
    
    def get_summary_prompt(self, style: str, format_type: str, full_context: str, summary_length_words: Optional[int] = None) -> str:
        """Get style and format-specific prompt with length constraint"""
        length_instruction = ""
        if summary_length_words:
            length_instruction = f" The summary must be approximately {summary_length_words} words. "
        
        # Format instructions
        format_instructions = {
            "paragraph": "Write a flowing narrative summary in paragraph form.",
            "bullet": "Write the summary as a bulleted list with clear, concise points.",
            "timeline": "Write the summary in chronological order, organized by time segments.",
            "chapters": "Divide the summary into clear chapters or sections with headings.",
            "highlights": "Write only the key highlights and most important moments, be very concise."
        }
        format_instruction = format_instructions.get(format_type, format_instructions["paragraph"])
        
        base_prompts = {
            "default": f"""You are an expert video summarizer. Based on the following information extracted from a video, write a comprehensive, human-readable summary.{length_instruction}

{format_instruction}

The summary should:
1. Be written like a professional article or essay summary
2. Flow naturally and be easy to read
3. Combine information from audio, visual content, and on-screen text seamlessly
4. Highlight the main topics, themes, and key information
5. Be informative and engaging
6. If there's no audio, focus on the visual content and on-screen text
7. Write in complete sentences with proper grammar

VIDEO INFORMATION:
{full_context}

Write a comprehensive summary:""",
            
            "professional": f"""You are a professional business analyst. Based on the following video information, write a formal, professional summary suitable for business reports or presentations.{length_instruction}

{format_instruction}

The summary should:
1. Use formal, professional language
2. Focus on key business insights, objectives, and outcomes
3. Be concise and structured
4. Highlight actionable items or important decisions
5. Maintain a professional tone throughout

VIDEO INFORMATION:
{full_context}

Write a professional business summary:""",
            
            "commercial": f"""You are a marketing copywriter. Based on the following video information, write an engaging commercial/advertisement summary that highlights key selling points.{length_instruction}

{format_instruction}

The summary should:
1. Be persuasive and engaging
2. Highlight benefits, features, and value propositions
3. Use compelling language that captures attention
4. Focus on what makes the content/product/service appealing

VIDEO INFORMATION:
{full_context}

Write a commercial advertisement summary:""",
            
            "educational": f"""You are an educational content specialist. Based on the following video information, write an academic-style summary focusing on learning outcomes.{length_instruction}

{format_instruction}

The summary should:
1. Focus on key concepts, learning objectives, and educational value
2. Use clear, instructional language
3. Highlight important facts, theories, or information presented
4. Be suitable for study notes or educational materials

VIDEO INFORMATION:
{full_context}

Write an educational summary:""",
            
            "casual": f"""You are a friendly content creator. Based on the following video information, write a casual, conversational summary in everyday language.{length_instruction}

{format_instruction}

The summary should:
1. Use relaxed, conversational tone
2. Be easy to read and understand
3. Feel like a friend explaining the video to you
4. Use natural, everyday language

VIDEO INFORMATION:
{full_context}

Write a casual, friendly summary:""",
            
            "technical": f"""You are a technical documentation specialist. Based on the following video information, write a detailed technical summary with specific terminology.{length_instruction}

{format_instruction}

The summary should:
1. Use precise technical language and terminology
2. Include specific details, specifications, and technical information
3. Be comprehensive and detailed
4. Focus on technical aspects, processes, and methodologies

VIDEO INFORMATION:
{full_context}

Write a technical summary:"""
        }
        
        return base_prompts.get(style, base_prompts["default"])
    
    def generate_summary(self, audio_transcription: str, visual_analysis: Dict, 
                        ocr_texts: List[str], summary_style: str = "default",
                        summary_format: str = "paragraph",
                        summary_length_words: Optional[int] = None,
                        user_profile: Optional[Dict] = None) -> str:
        """Generate human-readable summary using LLM"""
        
        # Build context
        context_parts = []
        
        if audio_transcription and "No audio" not in audio_transcription:
            context_parts.append(f"AUDIO TRANSCRIPTION:\n{audio_transcription}")
        
        visual_scenes = []
        for caption in visual_analysis.get("frame_captions", []):
            if ": " in caption:
                scene_desc = caption.split(": ", 1)[-1]
                if " | On-screen text:" in scene_desc:
                    scene_desc = scene_desc.split(" | On-screen text:")[0]
                visual_scenes.append(scene_desc.strip())
        
        if visual_scenes:
            context_parts.append(f"VISUAL CONTENT (Key Scenes):\n" + "\n".join(visual_scenes[:10]))
        
        if ocr_texts:
            unique_texts = list(set(ocr_texts))[:10]
            context_parts.append(f"ON-SCREEN TEXT:\n" + ", ".join(unique_texts))
        
        # Add user profile context if available
        if user_profile:
            profile_context = f"USER PROFILE:\n"
            if user_profile.get('expertise'):
                profile_context += f"Expertise: {', '.join(user_profile['expertise'])}\n"
            if user_profile.get('summaryPreferences'):
                prefs = user_profile['summaryPreferences']
                profile_context += f"Preferences: Length={prefs.get('length', 'medium')}, Focus={', '.join(prefs.get('focus', []))}\n"
            context_parts.append(profile_context)
        
        full_context = "\n\n".join(context_parts)
        
        # Get prompt
        prompt = self.get_summary_prompt(summary_style, summary_format, full_context, summary_length_words)
        
        summary = None
        
        # Try Groq
        if self.groq_client:
            try:
                response = self.groq_client.chat.completions.create(
                    model="llama-3.3-70b-versatile",
                    messages=[
                        {"role": "system", "content": f"You are an expert video summarizer. Write clear, comprehensive summaries in paragraph form according to the {self.SUMMARY_STYLES.get(summary_style, 'default')} style."},
                        {"role": "user", "content": prompt}
                    ],
                    temperature=0.7,
                    max_tokens=2000 if summary_length_words else 1000
                )
                summary = response.choices[0].message.content.strip()
                print("✅ Summary generated using Groq")
            except Exception as e:
                print(f"⚠️ Groq error: {e}")
        
        # Try Gemini if Groq failed
        if not summary and self.gemini_model:
            try:
                response = self.gemini_model.generate_content(prompt)
                summary = response.text.strip()
                print("✅ Summary generated using Gemini")
            except Exception as e:
                print(f"⚠️ Gemini error: {e}")
        
        # Fallback
        if not summary:
            print("⚠️ Using fallback summary (no LLM available)")
            summary = f"This video contains: {audio_transcription[:200] if audio_transcription else 'visual content'}. "
            if visual_scenes:
                summary += f"Key scenes include: {', '.join(visual_scenes[:3])}."
        
        # Trim to approximate word count if specified
        if summary_length_words and summary:
            words = summary.split()
            if len(words) > summary_length_words:
                # Trim to approximate length
                summary = ' '.join(words[:summary_length_words]) + "..."
        
        return summary
    
    def process_video(self, video_path: str, num_frames: int = 10, 
                     use_llm: bool = True, summary_style: str = "default",
                     summary_format: str = "paragraph",
                     summary_length_words: Optional[int] = None,
                     user_profile: Optional[Dict] = None) -> Dict:
        """Main function to process video and generate summary"""
        
        results = {
            "audio_transcription": "",
            "visual_analysis": {},
            "final_summary": "",
            "status": "processing"
        }
        
        # Extract keyframes
        frames = self.extract_keyframes(video_path, num_frames)
        if not frames:
            return {"error": "Could not extract frames from video", "status": "error"}
        
        # Extract and transcribe audio
        audio_data, sample_rate = self.extract_audio(video_path)
        if audio_data is not None:
            audio_transcription = self.transcribe_audio(audio_data, sample_rate)
            results["audio_transcription"] = audio_transcription
        else:
            results["audio_transcription"] = "No audio track found in video."
        
        # Analyze visual content
        visual_analysis = self.analyze_visual_content(frames)
        results["visual_analysis"] = visual_analysis
        
        # Generate summary
        if use_llm and (self.groq_client or self.gemini_model):
            final_summary = self.generate_summary(
                results["audio_transcription"],
                visual_analysis,
                visual_analysis.get("ocr_texts", []),
                summary_style=summary_style,
                summary_format=summary_format,
                summary_length_words=summary_length_words,
                user_profile=user_profile
            )
        else:
            # Fallback
            final_summary = f"This video presents content covering multiple aspects. "
            if results["audio_transcription"] and "No audio" not in results["audio_transcription"]:
                final_summary += f"Audio narration discusses: {results['audio_transcription'][:200]}... "
            if visual_analysis.get("frame_captions"):
                key_scenes = []
                for caption in visual_analysis["frame_captions"][:3]:
                    if ": " in caption:
                        scene = caption.split(": ", 1)[-1].split(" | ")[0]
                        key_scenes.append(scene.strip())
                if key_scenes:
                    final_summary += f"Visually shows: {', '.join(key_scenes)}."
        
        results["final_summary"] = final_summary
        results["status"] = "completed"
        
        return results
