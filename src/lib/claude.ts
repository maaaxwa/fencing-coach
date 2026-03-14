import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export interface ProfileContext {
  name: string
  experienceYears: number
  experienceMonths: number
  weapon: string
}

export interface NoteAnalysis {
  techniques: string[]
  drills: string[]
  corrections: string[]
  keyInsights: string[]
  areasToImprove: string[]
}

export interface VideoAnalysis {
  footwork: { assessment: string; issues: string[]; strengths: string[] }
  bladeWork: { assessment: string; issues: string[]; strengths: string[] }
  posture: { assessment: string; issues: string[]; strengths: string[] }
  speedAndTiming: { assessment: string; notes: string[] }
  tacticalDecisions: { assessment: string; notes: string[] }
  overallScore: number
  topSuggestions: string[]
}

export interface CoachingReportContent {
  executiveSummary: string
  strengths: string[]
  weaknesses: string[]
  patterns: string[]
  priorityDrills: { drill: string; targetIssue: string; frequency: string }[]
  shortTermGoals: string[]
  longTermGoals: string[]
  overallAssessment: string
}

function experienceLabel(years: number, months: number): string {
  if (years === 0 && months === 0) return 'a beginner'
  const parts = []
  if (years > 0) parts.push(`${years} year${years !== 1 ? 's' : ''}`)
  if (months > 0) parts.push(`${months} month${months !== 1 ? 's' : ''}`)
  return parts.join(' and ')
}

export async function analyzeClassNote(
  profile: ProfileContext,
  noteContent: string
): Promise<NoteAnalysis> {
  const exp = experienceLabel(profile.experienceYears, profile.experienceMonths)

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: `You are an expert épée fencing coach. Analyze these training notes from ${profile.name}, a fencer with ${exp} of experience in épée.

Training notes:
${noteContent}

Return ONLY valid JSON (no markdown, no explanation) with exactly this structure:
{
  "techniques": ["string array of techniques/concepts taught"],
  "drills": ["string array of drills practiced"],
  "corrections": ["string array of corrections given"],
  "keyInsights": ["string array of most important takeaways"],
  "areasToImprove": ["string array of weaknesses identified"]
}`,
      },
    ],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''
  return JSON.parse(text) as NoteAnalysis
}

export async function analyzeVideoFrames(
  profile: ProfileContext,
  base64Frames: string[]
): Promise<VideoAnalysis> {
  const exp = experienceLabel(profile.experienceYears, profile.experienceMonths)

  // Limit to max 20 frames to stay within token limits
  const frames = base64Frames.slice(0, 20)

  const imageContent: Anthropic.ImageBlockParam[] = frames.map((frame) => ({
    type: 'image',
    source: {
      type: 'base64',
      media_type: 'image/jpeg',
      data: frame,
    },
  }))

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    messages: [
      {
        role: 'user',
        content: [
          ...imageContent,
          {
            type: 'text',
            text: `You are an expert épée fencing coach. These are sequential frames from a single fencing point (bout moment). The fencer is ${profile.name} with ${exp} of épée experience.

Épée context: whole body is a valid target, no right-of-way rules apply, simultaneous touches score both fencers.

Analyze the frames for technique and performance. Return ONLY valid JSON (no markdown, no explanation) with exactly this structure:
{
  "footwork": {
    "assessment": "overall assessment string",
    "issues": ["list of issues observed"],
    "strengths": ["list of strengths observed"]
  },
  "bladeWork": {
    "assessment": "overall assessment string",
    "issues": ["list of issues observed"],
    "strengths": ["list of strengths observed"]
  },
  "posture": {
    "assessment": "overall assessment string",
    "issues": ["list of issues observed"],
    "strengths": ["list of strengths observed"]
  },
  "speedAndTiming": {
    "assessment": "overall assessment string",
    "notes": ["list of observations"]
  },
  "tacticalDecisions": {
    "assessment": "overall assessment string",
    "notes": ["list of observations"]
  },
  "overallScore": 7,
  "topSuggestions": ["3 most impactful improvement suggestions"]
}`,
          },
        ],
      },
    ],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''
  return JSON.parse(text) as VideoAnalysis
}

export async function generateCoachingReport(
  profile: ProfileContext,
  noteAnalyses: NoteAnalysis[],
  videoAnalyses: VideoAnalysis[]
): Promise<CoachingReportContent> {
  const exp = experienceLabel(profile.experienceYears, profile.experienceMonths)

  const notesSummary = noteAnalyses
    .map(
      (n, i) =>
        `Note ${i + 1}: Techniques: ${n.techniques.join(', ')}. Corrections: ${n.corrections.join(', ')}. Areas to improve: ${n.areasToImprove.join(', ')}.`
    )
    .join('\n')

  const videosSummary = videoAnalyses
    .map(
      (v, i) =>
        `Video ${i + 1} (score ${v.overallScore}/10): Footwork: ${v.footwork.assessment}. Blade work: ${v.bladeWork.assessment}. Posture: ${v.posture.assessment}. Top issues: ${[...v.footwork.issues, ...v.bladeWork.issues, ...v.posture.issues].slice(0, 3).join(', ')}.`
    )
    .join('\n')

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 3000,
    messages: [
      {
        role: 'user',
        content: `You are an expert épée fencing coach. Generate a comprehensive coaching report for ${profile.name}, a fencer with ${exp} of épée experience.

Training Notes Analysis (${noteAnalyses.length} sessions):
${notesSummary || 'No notes analyzed yet.'}

Video Analysis (${videoAnalyses.length} bout videos):
${videosSummary || 'No videos analyzed yet.'}

Cross-reference the training notes and video analyses to identify patterns, recurring issues, and provide holistic coaching advice. Return ONLY valid JSON (no markdown, no explanation) with exactly this structure:
{
  "executiveSummary": "2-3 sentence overview of the fencer's current state",
  "strengths": ["consistent strong points observed across notes and videos"],
  "weaknesses": ["recurring issues that need attention"],
  "patterns": ["tactical or technical patterns observed"],
  "priorityDrills": [
    { "drill": "drill name and description", "targetIssue": "what it addresses", "frequency": "how often to practice" }
  ],
  "shortTermGoals": ["goals for the next 1-4 weeks"],
  "longTermGoals": ["goals for the next 3-6 months"],
  "overallAssessment": "detailed overall assessment paragraph"
}`,
      },
    ],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''
  return JSON.parse(text) as CoachingReportContent
}
