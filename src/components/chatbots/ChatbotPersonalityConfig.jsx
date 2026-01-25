import React from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

export default function ChatbotPersonalityConfig({ personality, onUpdate }) {
  return (
    <div className="space-y-4 mt-4">
      <div className="space-y-2">
        <Label>Tone</Label>
        <Select value={personality.tone} onValueChange={(tone) => onUpdate({ ...personality, tone })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="professional">Professional</SelectItem>
            <SelectItem value="friendly">Friendly</SelectItem>
            <SelectItem value="formal">Formal</SelectItem>
            <SelectItem value="casual">Casual</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Language</Label>
        <Select value={personality.language} onValueChange={(language) => onUpdate({ ...personality, language })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="English">English</SelectItem>
            <SelectItem value="Spanish">Spanish</SelectItem>
            <SelectItem value="French">French</SelectItem>
            <SelectItem value="German">German</SelectItem>
            <SelectItem value="Chinese">Chinese</SelectItem>
            <SelectItem value="Japanese">Japanese</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Personality Description</Label>
        <Textarea
          value={personality.style}
          onChange={(e) => onUpdate({ ...personality, style: e.target.value })}
          placeholder="e.g., 'Helpful, patient, and knowledgeable about products'"
          rows={2}
        />
      </div>

      <div className="space-y-2">
        <Label>System Prompt</Label>
        <Textarea
          value={personality.system_prompt}
          onChange={(e) => onUpdate({ ...personality, system_prompt: e.target.value })}
          placeholder="Custom instructions for the chatbot (optional)"
          rows={4}
        />
      </div>
    </div>
  );
}