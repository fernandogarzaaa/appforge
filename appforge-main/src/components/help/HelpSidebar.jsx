import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { HelpCircle, Book, MessageSquare, ChevronRight } from 'lucide-react';
import KnowledgeBaseSearch from './KnowledgeBaseSearch';
import TutorialModal from '@/components/onboarding/TutorialModal';

export default function HelpSidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('kb');
  const [showTutorial, setShowTutorial] = useState(false);

  return (
    <>
      <div className={`fixed right-0 top-0 h-full bg-white border-l border-slate-200 z-40 transition-all duration-300 ${
        isOpen ? 'w-96 shadow-lg' : 'w-0'
      }`}>
        <div className="h-full flex flex-col">
          <div className="p-4 border-b border-slate-200 flex justify-between items-center">
            <h2 className="font-semibold">Help & Support</h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="h-8 w-8"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex gap-2 p-4 border-b border-slate-200">
            <Button
              variant={activeTab === 'kb' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('kb')}
              className="flex-1 gap-2"
            >
              <Book className="w-4 h-4" />
              Knowledge Base
            </Button>
            <Button
              variant={activeTab === 'tutorial' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setShowTutorial(true)}
              className="flex-1 gap-2"
            >
              <MessageSquare className="w-4 h-4" />
              Tutorial
            </Button>
          </div>

          <div className="flex-1 overflow-auto p-4">
            {activeTab === 'kb' && <KnowledgeBaseSearch />}
          </div>
        </div>
      </div>

      <Button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed right-4 bottom-4 rounded-full w-12 h-12 shadow-lg z-30"
        size="icon"
      >
        <HelpCircle className="w-6 h-6" />
      </Button>

      <TutorialModal isOpen={showTutorial} onClose={() => setShowTutorial(false)} />
    </>
  );
}