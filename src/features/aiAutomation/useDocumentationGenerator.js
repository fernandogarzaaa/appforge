import { useCallback, useState } from 'react';

export function useDocumentationGenerator() {
  const [documents, setDocuments] = useState([]);

  const generateDocs = useCallback((projectName, sections) => {
    const content = `# ${projectName}\n\n${sections.map((section) => `## ${section}\n\nDetails pending...`).join('\n\n')}`;
    const doc = {
      id: `doc_${Date.now()}`,
      projectName,
      content,
      createdAt: new Date().toISOString(),
    };
    setDocuments((prev) => [doc, ...prev]);
    return doc;
  }, []);

  return { documents, generateDocs };
}
